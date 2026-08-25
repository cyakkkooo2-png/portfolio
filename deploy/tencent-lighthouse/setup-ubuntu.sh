#!/usr/bin/env bash
set -euo pipefail

# CCY SPACE Tencent Cloud Lighthouse deployment helper.
# Run on a fresh Ubuntu 22.04/24.04 server.
#
# Required:
#   DOMAIN=ccyspace.icu
# Optional:
#   REPO_URL=https://github.com/cyakkkooo2-png/portfolio.git
#   APP_DIR=/var/www/ccyspace
#   DATA_DIR=/var/www/ccyspace-data/data
#   UPLOADS_DIR=/var/www/ccyspace-data/uploads
#   PORT=3001

DOMAIN="${DOMAIN:-ccyspace.icu}"
REPO_URL="${REPO_URL:-https://github.com/cyakkkooo2-png/portfolio.git}"
APP_DIR="${APP_DIR:-/var/www/ccyspace}"
DATA_DIR="${DATA_DIR:-/var/www/ccyspace-data/data}"
UPLOADS_DIR="${UPLOADS_DIR:-/var/www/ccyspace-data/uploads}"
PORT="${PORT:-3001}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Please run as root: sudo DOMAIN=${DOMAIN} bash $0"
  exit 1
fi

echo "==> Installing system packages"
apt-get update
apt-get install -y curl git nginx ufw ca-certificates

if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | sed 's/^v//' | cut -d. -f1)" -lt 20 ]]; then
  echo "==> Installing Node.js 20"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "==> Installing PM2"
npm install -g pm2

echo "==> Preparing directories"
mkdir -p "$APP_DIR" "$DATA_DIR" "$UPLOADS_DIR"

if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "==> Cloning project"
  git clone "$REPO_URL" "$APP_DIR"
else
  echo "==> Updating project"
  git -C "$APP_DIR" fetch origin
  git -C "$APP_DIR" reset --hard origin/master
fi

echo "==> Installing app dependencies and building frontend"
cd "$APP_DIR"
npm run build

echo "==> Writing runtime environment"
JWT_SECRET_VALUE="$(openssl rand -hex 32)"
cat > "$APP_DIR/server/.env.production" <<ENVEOF
NODE_ENV=production
PORT=${PORT}
DATA_DIR=${DATA_DIR}
UPLOADS_DIR=${UPLOADS_DIR}
ALLOW_LOCAL_VIDEO_STORAGE=true
JWT_SECRET=${JWT_SECRET_VALUE}
ENVEOF

cat > "$APP_DIR/ecosystem.config.cjs" <<PM2EOF
module.exports = {
  apps: [{
    name: 'ccyspace',
    script: '${APP_DIR}/server/index.js',
    cwd: '${APP_DIR}/server',
    env: {
      NODE_ENV: 'production',
      PORT: '${PORT}',
      DATA_DIR: '${DATA_DIR}',
      UPLOADS_DIR: '${UPLOADS_DIR}',
      ALLOW_LOCAL_VIDEO_STORAGE: 'true',
      JWT_SECRET: '${JWT_SECRET_VALUE}'
    }
  }]
};
PM2EOF

echo "==> Starting app with PM2"
pm2 delete ccyspace >/dev/null 2>&1 || true
pm2 start "$APP_DIR/ecosystem.config.cjs" --time --update-env
pm2 save
pm2 startup systemd -u root --hp /root || true

echo "==> Configuring Nginx"
cat > "/etc/nginx/sites-available/ccyspace" <<NGINXEOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    client_max_body_size 2048m;

    location ^~ /uploads/videos/ {
        alias ${UPLOADS_DIR}/videos/;
        sendfile on;
        expires 1h;
        add_header X-Robots-Tag "noindex, nofollow, noarchive" always;
        access_log off;
    }

    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/ccyspace /etc/nginx/sites-enabled/ccyspace
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "==> Opening firewall"
ufw allow OpenSSH || true
ufw allow 'Nginx Full' || true
ufw --force enable || true

echo "==> Done. Point ${DOMAIN} A record to this server IP, then run SSL:"
echo "    apt-get install -y certbot python3-certbot-nginx"
echo "    certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
