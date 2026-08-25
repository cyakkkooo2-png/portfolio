# 腾讯云轻量服务器迁移说明

适用：Ubuntu 22.04 / 24.04，腾讯云轻量应用服务器，中国香港 / 首尔 / 新加坡等无需备案地域。

## 迁移顺序

1. 买好服务器，记录公网 IP。
2. 在腾讯云防火墙/安全组放行：
   - `22` SSH
   - `80` HTTP
   - `443` HTTPS
3. 登录服务器执行部署脚本。
4. 把域名 `ccyspace.icu` 的 A 记录指向新服务器 IP。
5. 申请 HTTPS 证书。
6. 从旧环境备份并恢复 `works.json`、`theme.json`、`users.json` 和必要上传文件到 `/var/www/ccyspace-data/`。

## 一键部署命令

在服务器上执行：

```bash
sudo -i
DOMAIN=ccyspace.icu bash deploy/tencent-lighthouse/setup-ubuntu.sh
```

如果你是从 GitHub 直接拉代码，命令类似：

```bash
sudo -i
git clone https://github.com/cyakkkooo2-png/portfolio.git /tmp/portfolio
cd /tmp/portfolio
DOMAIN=ccyspace.icu bash deploy/tencent-lighthouse/setup-ubuntu.sh
```

## 重要环境变量

部署脚本会自动创建：

- `DATA_DIR=/var/www/ccyspace-data/data`
- `UPLOADS_DIR=/var/www/ccyspace-data/uploads`
- `ALLOW_LOCAL_VIDEO_STORAGE=true`
- `JWT_SECRET=自动生成`

腾讯云持久化磁盘可直接保存视频，不要求配置 GitHub Token。若希望把视频额外保存到 GitHub，可在 `/var/www/ccyspace/server/.env.production` 里加入：

```env
GITHUB_TOKEN=你的 GitHub Token
```

请定期检查服务器磁盘容量，并备份 `/var/www/ccyspace-data/`。

## 常用维护命令

```bash
pm2 status
pm2 logs ccyspace
pm2 restart ccyspace
nginx -t
systemctl reload nginx
systemctl status ccyspace-auto-deploy.timer
```

生产环境只使用 root 用户的 PM2。不要再用 ubuntu 用户启动同名 `ccyspace` 进程，以免旧进程占用 3001 端口。
