# Minimal Fresh Blog (Node.js + MySQL + Docker)

这是一个面向个人内容创作的全栈博客系统，覆盖你提出的核心需求：

- 内容类型：技术文章 / 随笔 / 作品集
- 文章状态：草稿、发布、定时发布
- 分类、标签、归档
- 评论 + 回复
- 后台管理（可视化编辑器）
- 访问统计（内置；可扩展 GA/Plausible）
- MySQL 持久化 + Docker 部署
- 完整 GitHub 工作流（CI + Docker 镜像构建）

---

## 1. 技术栈

- 前端：EJS 模板 + 原生 CSS（极简粉白蓝）
- 后端：Node.js + Express
- 数据库：MySQL 8 + Sequelize
- 部署：Docker / Docker Compose

---

## 2. 项目结构

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
├── scripts           # DB 初始化脚本
├── .github/workflows # CI/CD
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 3. 本地开发运行

### 3.1 准备环境变量

```bash
cp .env.example .env
```

请修改 `.env` 中的敏感信息（至少改 `SESSION_SECRET`、管理员账号密码）。

### 3.2 启动方式 A：本地 Node 运行（非 Docker）

```bash
npm install
npm run db:init
npm run dev
```

访问：
- 前台：<http://localhost:3000>
- 后台：<http://localhost:3000/admin>

### 3.3 启动方式 B：Docker Compose 一键运行

```bash
docker compose up --build -d
```

查看日志：

```bash
docker compose logs -f app
```

停止：

```bash
docker compose down
```

---

## 4. 你要的重点：本地打包镜像 -> 上传服务器 -> 直接跑起来

下面是推荐的“离线交付”流程：

1) 在你本地机器构建镜像。  
2) 导出成 tar 包。  
3) 上传到服务器。  
4) 在服务器加载镜像并用 compose 启动。  
5) 通过 Nginx + 域名 + HTTPS 对外访问。

### 4.1 本地机器构建镜像

在项目根目录执行：

```bash
docker build -t myblog-app:1.0.0 .
```

检查镜像：

```bash
docker images | grep myblog-app
```

### 4.2 导出镜像为文件

```bash
docker save -o myblog-app-1.0.0.tar myblog-app:1.0.0
```

可选压缩：

```bash
gzip myblog-app-1.0.0.tar
```

### 4.3 上传到服务器

假设服务器用户是 `root`，IP 是 `1.2.3.4`：

```bash
scp myblog-app-1.0.0.tar.gz root@1.2.3.4:/opt/myblog/
```

如果你不压缩 tar，就上传 `.tar` 文件。

### 4.4 服务器准备目录

登录服务器后：

```bash
mkdir -p /opt/myblog
cd /opt/myblog
```

把这些文件放到服务器 `/opt/myblog` 下：

- `docker-compose.yml`
- `.env`（生产环境版本）
- `myblog-app-1.0.0.tar.gz`（或 `.tar`）

> 注意：`docker-compose.yml` 中 `app` 服务默认是 `build: .`。  
> 如果你要直接使用导入镜像，建议改成 `image: myblog-app:1.0.0`。

示例（推荐用于服务器）：

```yaml
services:
  app:
    image: myblog-app:1.0.0
    restart: always
    ports:
      - "3000:3000"
    env_file:
      - .env
    depends_on:
      mysql:
        condition: service_healthy

  mysql:
    image: mysql:8.4
    restart: always
    environment:
      MYSQL_DATABASE: blogdb
      MYSQL_USER: blog
      MYSQL_PASSWORD: blogpass
      MYSQL_ROOT_PASSWORD: rootpass
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-uroot", "-prootpass"]
      interval: 5s
      timeout: 5s
      retries: 20

volumes:
  mysql_data:
```

### 4.5 服务器导入镜像并启动

如果上传的是 `.tar.gz`：

```bash
gunzip myblog-app-1.0.0.tar.gz
docker load -i myblog-app-1.0.0.tar
```

如果上传的是 `.tar`：

```bash
docker load -i myblog-app-1.0.0.tar
```

启动服务：

```bash
docker compose up -d
```

验证容器：

```bash
docker compose ps
docker compose logs -f app
```

此时你已经可以通过 `http://服务器IP:3000` 访问博客。

---

## 5. 域名直接访问（服务器环境配置完整步骤）

你希望“访问服务器域名直接打开网页”，推荐标准做法：

- 博客容器监听在 `127.0.0.1:3000`（或服务器 3000 端口）
- Nginx 监听 80/443，对外暴露域名
- Nginx 反向代理到 `app:3000` 或 `127.0.0.1:3000`
- 使用 Let’s Encrypt 申请 HTTPS 证书

### 5.1 域名解析

在域名 DNS 控制台新增 A 记录：

- 主机记录：`@`
- 记录值：你的服务器公网 IP

如需 `www` 也可加：

- 主机记录：`www`
- 记录值：你的服务器公网 IP

等待解析生效（通常几分钟到几十分钟）。

### 5.2 服务器安装 Nginx

以 Ubuntu 为例：

```bash
apt update
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

### 5.3 配置 Nginx 反向代理

创建配置文件 `/etc/nginx/sites-available/myblog.conf`：

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用站点并重载：

```bash
ln -s /etc/nginx/sites-available/myblog.conf /etc/nginx/sites-enabled/myblog.conf
nginx -t
systemctl reload nginx
```

现在访问 `http://your-domain.com` 应可打开博客。

### 5.4 申请 HTTPS 证书（推荐）

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com -d www.your-domain.com
```

自动续期检查：

```bash
certbot renew --dry-run
```

完成后即可通过 `https://your-domain.com` 访问。

---

## 6. 生产环境建议

- 必改项：
  - `SESSION_SECRET`
  - `ADMIN_USERNAME` / `ADMIN_PASSWORD`
  - MySQL 密码（`DB_PASSWORD`、`MYSQL_ROOT_PASSWORD`）
- 防火墙只开放：`22`、`80`、`443`
- 不建议公网直接暴露 `3306`
- 建议开启日志轮转与自动重启策略（compose 已给 `restart: always`）

---

## 7. 常见问题排查

### 7.1 域名打不开

1. `ping your-domain.com` 是否解析到正确 IP
2. `nginx -t` 是否配置正确
3. `docker compose ps` 看 app 是否正常运行
4. `docker compose logs -f app` 看 Node 是否报错

### 7.2 访问 502 Bad Gateway

通常是 Nginx 连不到 `127.0.0.1:3000`：

- 检查 app 容器是否启动
- 检查端口映射是否存在（`3000:3000`）
- 检查 Nginx `proxy_pass` 地址是否正确

### 7.3 登录失败

- 检查 `.env` 中管理员账号密码
- 重新初始化数据库：`docker compose exec app node scripts/init-db.js`

---

## 8. GitHub 工作流

- CI：`npm ci` + `npm run check` + `docker compose config`
- 主分支自动构建并推送 `ghcr.io/<repo>:latest`
- 分支策略与提交规范见 `CONTRIBUTING.md`

