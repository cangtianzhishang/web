# Minimal Fresh Blog (Node.js + MySQL + Docker)

这是一个面向个人内容创作的全栈博客系统，满足以下需求：
- 内容类型：技术文章 / 随笔 / 作品集
- 文章状态：草稿、发布、定时发布
- 分类、标签、归档
- 评论 + 回复
- 后台管理（可视化编辑器）
- 访问统计（内置；可扩展 GA/Plausible）
- MySQL 持久化 + Docker 部署
- 完整 GitHub 工作流（CI + Docker 镜像构建）

## 技术栈
- 前端：EJS 模板 + 原生 CSS（极简粉白蓝）
- 后端：Node.js + Express
- 数据库：MySQL 8 + Sequelize
- 部署：Docker Compose

## 快速开始

### 1) 环境变量
```bash
cp .env.example .env
```

### 2) 本地运行（非 Docker）
```bash
npm install
npm run db:init
npm run dev
```

### 3) Docker 一键启动
```bash
docker compose up --build
```
访问：<http://localhost:3000>

后台：<http://localhost:3000/admin>
默认管理员账号密码见 `.env.example`。

## 目录结构
```text
.
├── src
│   ├── config        # 数据库配置
│   ├── middleware    # 中间件
│   ├── models        # Sequelize 模型
│   ├── routes        # public/admin 路由
│   ├── services      # 业务服务
│   ├── views         # EJS 页面
│   └── public        # 静态资源
├── scripts           # DB 初始化
├── .github/workflows # CI/CD
├── docker-compose.yml
└── Dockerfile
```

## 安全与扩展建议
- 生产环境请修改 `SESSION_SECRET` 和管理员密码。
- 可在 Nginx 增加限流与 HTTPS。
- 评论模块可加敏感词过滤与验证码。

## GitHub 工作流
- CI：`npm run check` + `docker compose config`
- 主分支自动构建并推送 `ghcr.io/<repo>:latest`
- 分支策略与提交规范见 `CONTRIBUTING.md`
