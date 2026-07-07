# 🎨 我的作品集网站

一个支持展示视频、图片和文章的个人作品集网站，带有后台管理系统。

## 功能

- 📱 **作品展示** — 响应式网格布局，支持按类型筛选
- 🎬 **视频** — 在线播放视频作品
- 🖼️ **图片** — 图片画廊展示
- 📝 **文章** — Markdown 风格的文章阅读
- 🔐 **后台管理** — 登录后可上传、编辑、删除作品
- 🏷️ **标签系统** — 为作品添加标签分类

## 技术栈

| 前端 | 后端 |
|------|------|
| React 18 | Express.js |
| Vite | JWT 认证 |
| Tailwind CSS | multer 文件上传 |
| React Router v6 | JSON 文件存储 |

## 快速开始

### 1. 安装依赖

```bash
# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../client
npm install
```

### 2. 启动服务

```bash
# 终端 1 — 启动后端 (端口 3001)
cd server
npm start

# 终端 2 — 启动前端 (端口 5173)
cd client
npm run dev
```

### 3. 访问网站

- 作品展示: http://localhost:5173
- 后台管理: http://localhost:5173/admin

### 默认管理员账户

- 用户名: `admin`
- 密码: `admin123`

⚠️ 首次使用请修改默认密码！

## 项目结构

```
portfolio/
├── client/                 # React 前端
│   └── src/
│       ├── api/            # API 请求
│       ├── context/        # React Context
│       ├── components/     # 通用组件
│       └── pages/          # 页面
│           └── admin/      # 后台管理页
├── server/                 # Express 后端
│   ├── db/                 # 数据存储 (JSON)
│   ├── middleware/         # 中间件
│   ├── routes/             # API 路由
│   ├── uploads/            # 上传文件
│   └── data/               # 数据文件
└── README.md
```

## 数据存储

作品数据存储在 `server/data/works.json`，用户数据存储在 `server/data/users.json`。上传的文件存储在 `server/uploads/` 目录下。
