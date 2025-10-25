# 部署指南

本文档介绍如何部署 HTML to PDF 服务。

## Docker 部署（推荐）

### 前置要求

- Docker >= 20.0
- Docker Compose >= 2.0

### 镜像选择

项目使用预构建的基础镜像，无需手动安装 Chrome/Chromium：

#### 推荐镜像选项

1. **zenika/alpine-chrome** (当前使用)
   - 基于 Alpine Linux，轻量级
   - 预装最新稳定版 Chrome
   - 专门为容器化优化

2. **buildkite/puppeteer**
   - 包含 Node.js 和 Puppeteer
   - Ubuntu 基础，功能完整
   - 定期更新

3. **chromedp/headless-shell**
   - Chrome 官方 headless shell
   - 最小化镜像大小
   - 最新的 Chrome 功能

#### 切换镜像

如需使用其他镜像，修改 `Dockerfile` 的第一行：

```dockerfile
# 使用 buildkite/puppeteer
FROM buildkite/puppeteer:latest

# 或使用 chromedp/headless-shell
FROM chromedp/headless-shell:latest
RUN apk add --no-cache nodejs npm
```

### 快速部署

1. **克隆项目**：
```bash
git clone <repository-url>
cd html2pdf-service
```

2. **启动服务**：
```bash
docker-compose up -d
```

3. **验证部署**：
```bash
# 检查容器状态
docker-compose ps

# 查看服务日志
docker-compose logs -f html2pdf-service

# 测试健康检查
curl http://localhost:3100/health
```

### 生产环境配置

#### 使用环境变量

创建 `.env` 文件：
```bash
# 服务器配置
PORT=3100
NODE_ENV=production

# Puppeteer 配置
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

#### 自定义 Docker Compose 配置

```yaml
services:
  html2pdf-service:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3100:3100"
    environment:
      - NODE_ENV=production
      - PORT=3100
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3100/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - html2pdf-network
    # 添加资源限制
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

networks:
  html2pdf-network:
    driver: bridge
```

#### 使用 Nginx 反向代理

添加 Nginx 服务到 docker-compose.yml：

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - html2pdf-service
    networks:
      - html2pdf-network
    restart: unless-stopped
```

Nginx 配置示例 (nginx.conf)：
```nginx
events {
    worker_connections 1024;
}

http {
    upstream html2pdf_backend {
        server html2pdf-service:3100;
    }

    server {
        listen 80;
        server_name your-domain.com;

        location / {
            proxy_pass http://html2pdf_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # 增加超时时间，因为PDF生成可能需要时间
            proxy_connect_timeout 300s;
            proxy_send_timeout 300s;
            proxy_read_timeout 300s;
        }

        # 静态文件缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            proxy_pass http://html2pdf_backend;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

## 本地部署

### 使用 Node.js

1. **安装依赖**：
```bash
npm install
```

2. **安装 Puppeteer 浏览器**：
```bash
npx puppeteer browsers install chrome
```

3. **启动服务**：
```bash
npm start
```

### 使用 PM2（生产环境）

1. **全局安装 PM2**：
```bash
npm install -g pm2
```

2. **创建生态系统文件** (ecosystem.config.js)：
```javascript
module.exports = {
  apps: [{
    name: 'html2pdf-service',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3100
    }
  }]
};
```

3. **启动服务**：
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 监控和维护

### 健康检查

服务提供健康检查端点：
```bash
curl http://localhost:3100/health
```

### 日志查看

```bash
# Docker 日志
docker-compose logs -f html2pdf-service

# PM2 日志
pm2 logs html2pdf-service
```

### 性能监控

- 使用 `docker stats` 监控容器资源使用
- 使用 PM2 的 `pm2 monit` 命令监控进程
- 设置适当的资源限制避免内存泄漏

## 故障排除

### 常见问题

1. **Chromium 启动失败**：
   - 确保容器有足够的内存（至少 512MB）
   - 检查 PUPPETEER_EXECUTABLE_PATH 环境变量

2. **PDF 生成失败**：
   - 检查 HTML 内容是否有效
   - 验证外部资源（如图片、字体）是否可访问

3. **内存不足**：
   - 增加容器内存限制
   - 使用 `max_memory_restart` 配置自动重启

4. **端口冲突**：
   - 修改 docker-compose.yml 中的端口映射
   - 检查系统端口占用情况

### 调试模式

启用调试日志：
```bash
DEBUG=puppeteer:* npm start
```

## 安全注意事项

1. **使用非 root 用户**：Dockerfile 已配置非 root 用户
2. **限制资源使用**：设置 CPU 和内存限制
3. **网络安全**：使用防火墙限制访问
4. **HTTPS**：生产环境使用 HTTPS
5. **定期更新**：保持基础镜像和依赖更新

## 扩展部署

### 使用 Kubernetes

创建 Kubernetes 部署文件：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: html2pdf-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: html2pdf-service
  template:
    metadata:
      labels:
        app: html2pdf-service
    spec:
      containers:
      - name: html2pdf-service
        image: your-registry/html2pdf-service:latest
        ports:
        - containerPort: 3100
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          limits:
            cpu: "1"
            memory: "1Gi"
          requests:
            cpu: "500m"
            memory: "512Mi"
        livenessProbe:
          httpGet:
            path: /health
            port: 3100
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3100
          initialDelaySeconds: 5
          periodSeconds: 5
```

### 使用云服务

- **AWS ECS/Fargate**：使用 docker-compose.yml 直接部署
- **Google Cloud Run**：支持容器化部署
- **Azure Container Instances**：快速容器部署
- **Heroku**：支持 Docker 部署

## 备份和恢复

### 数据备份

由于服务是无状态的，主要备份：
- 配置文件
- Docker 镜像
- 部署脚本

### 灾难恢复

1. 备份 Docker 镜像：
```bash
docker save html2pdf-service > html2pdf-service.tar
```

2. 恢复镜像：
```bash
docker load < html2pdf-service.tar
```

3. 重新部署：
```bash
docker-compose up -d
