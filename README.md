# HTML to PDF 服务

一个使用 Node.js 和无头浏览器渲染将 HTML 内容转换为 PDF 的服务，提供类似浏览器的打印质量输出。

## 功能特性

- **高质量渲染**：使用 Puppeteer 和无头 Chrome/Chromium 进行精确的 HTML 到 PDF 转换
- **浏览器级输出**：模拟浏览器打印功能，具有完整的 CSS 支持，包括背景、字体和布局
- **RESTful API**：简单的 HTTP API，便于集成
- **可自定义选项**：支持各种 PDF 选项，如格式、边距和方向
- **演示界面**：内置 Web 界面用于测试和演示
- **快速处理**：高效的无头浏览器管理，实现快速转换

## 快速开始

**重要：** 为确保不同平台和环境的一致开发体验，所有开发和测试必须使用 Docker 容器化环境。本项目不支持本地直接运行 Node.js 环境。

### 前置要求

- Docker >= 20.0
- Docker Compose >= 2.0
- Git

### 开发环境设置

1. **克隆仓库**：

```bash
git clone <repository-url>
cd html2pdf-service
```

1. **启动开发环境**：

```bash
docker-compose up -d
```

1. **验证环境**：

```bash
# 检查服务状态
curl http://localhost:3200/health

# 查看日志
docker-compose logs -f html2pdf-service
```

服务将在 `http://localhost:3200` 上可用

### 开发工作流

#### 常用 Docker 命令

```bash
# 查看服务状态
docker-compose ps

# 查看实时日志
docker-compose logs -f html2pdf-service

# 停止服务
docker-compose down

# 重新构建镜像（代码变更后）
docker-compose build --no-cache

# 进入容器进行调试
docker-compose exec html2pdf-service sh
```

#### 代码修改和测试

1. **修改代码**：直接编辑项目文件

1. **重新构建和重启**：

```bash
# 重新构建镜像并重启服务
docker-compose build --no-cache && docker-compose up -d
```

1. **测试更改**：

```bash
# 测试 API
curl -X POST http://localhost:3200/convert \
  -H "Content-Type: application/json" \
  -d '{"html": "<h1>Test</h1>"}' \
  --output test.pdf

# 访问 Web 界面
open http://localhost:3200
```

#### 调试技巧

- **查看实时日志**：

```bash
docker-compose logs -f html2pdf-service
```

- **进入容器调试**：

```bash
docker-compose exec html2pdf-service sh
```

- **检查容器状态**：

```bash
docker-compose ps
```

#### 性能优化开发

对于频繁的代码迭代，可以临时启用卷挂载（注意：这可能影响性能）：

1. 修改 `docker-compose.yml`：

```yaml
services:
  html2pdf-service:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3200:3200"
    volumes:
      - .:/app
      - /app/node_modules  # 排除 node_modules 以避免挂载问题
    environment:
      - NODE_ENV=development
```

1. 重启服务：

```bash
docker-compose up -d
```

**警告**：卷挂载仅用于开发调试，最终测试和提交前必须使用完整 Docker 构建。

### 为什么使用 Docker？

- **环境一致性**：确保所有贡献者使用相同的运行时环境
- **跨平台兼容**：Windows、macOS、Linux 开发体验完全一致
- **依赖隔离**：避免本地环境污染和版本冲突
- **CI/CD 对齐**：开发环境与生产部署环境完全相同
- **简化协作**：新贡献者无需复杂的环境配置

## 部署

### Docker 部署（推荐）

#### Docker 部署前置要求

- Docker >= 20.0
- Docker Compose >= 2.0

#### 镜像选择

项目使用预构建的基础镜像，无需手动安装 Chrome/Chromium：

##### 推荐镜像选项

1. **node:18-alpine with manual Chromium installation** (当前使用)
   - 基于 Alpine Linux，轻量级
   - Node.js 18 + 手动安装 Chromium 和依赖
   - 最小化镜像大小，精确控制版本
   - 适合生产环境部署

2. **buildkite/puppeteer**
   - 包含 Node.js、Puppeteer 和 Chrome
   - Ubuntu 基础，功能完整
   - 定期更新，稳定可靠

3. **zenika/alpine-chrome**
   - 基于 Alpine Linux，轻量级
   - 预装最新稳定版 Chrome
   - 专门为容器化优化

4. **chromedp/headless-shell**
   - Chrome 官方 headless shell
   - 最小化镜像大小
   - 最新的 Chrome 功能

##### 切换镜像

如需使用其他镜像，修改 `Dockerfile` 的第一行：

```dockerfile
# 当前配置：使用 node:18-alpine 并手动安装 Chromium
FROM node:18-alpine

# 安装 Chromium 和依赖
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# 或使用 buildkite/puppeteer（预构建镜像）
FROM buildkite/puppeteer:latest

# 或使用 chromedp/headless-shell
FROM chromedp/headless-shell:latest
RUN apk add --no-cache nodejs npm
```

#### 构建和发布镜像到 Docker Hub

##### 构建镜像

1. **克隆项目并进入目录**：

```bash
git clone <repository-url>
cd html2pdf-service
```

1. **构建 Docker 镜像**：

```bash
# 使用默认标签构建
docker build -t html2pdf-service .

# 或指定版本标签
docker build -t html2pdf-service:v1.0.0 .
```

##### 发布到 Docker Hub

1. **登录 Docker Hub**：

```bash
docker login
# 输入您的 Docker Hub 用户名和密码
```

1. **标记镜像**：

```bash
# 将镜像标记为您的 Docker Hub 仓库
docker tag html2pdf-service:latest your-dockerhub-username/html2pdf-service:latest

# 或使用版本标签
docker tag html2pdf-service:v1.0.0 your-dockerhub-username/html2pdf-service:v1.0.0
```

1. **推送镜像**：

```bash
# 推送最新版本
docker push your-dockerhub-username/html2pdf-service:latest

# 推送指定版本
docker push your-dockerhub-username/html2pdf-service:v1.0.0
```

1. **验证发布**：
访问 https://hub.docker.com 查看您的镜像是否已发布。

##### 使用已发布的镜像

更新 `docker-compose.yml` 使用您的镜像：

```yaml
services:
  html2pdf-service:
    image: your-dockerhub-username/html2pdf-service:latest
    ports:
      - "3200:3200"
```

或直接运行：

```bash
docker run -p 3200:3200 your-dockerhub-username/html2pdf-service:latest
```

#### 快速部署

1. **克隆项目**：

```bash
git clone <repository-url>
cd html2pdf-service
```

1. **启动服务**：

```bash
docker-compose up -d
```

1. **验证部署**：

```bash
# 检查容器状态
docker-compose ps

# 查看服务日志
docker-compose logs -f html2pdf-service

# 测试健康检查
curl http://localhost:3200/health
```

#### 生产环境配置

##### 使用环境变量

创建 `.env` 文件：

```bash
# 服务器配置
PORT=3200
NODE_ENV=production

# Puppeteer 配置
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

##### 自定义 Docker Compose 配置

```yaml
services:
  html2pdf-service:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3200:3200"
    environment:
      - NODE_ENV=production
      - PORT=3200
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3200/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"]
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

##### 使用 Nginx 反向代理

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
        server html2pdf-service:3200;
    }

    server {
        listen 80;
        server_name your-domain.com;

        location / {
            proxy_pass http://html2pdf_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Proto $scheme;

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

### 传统部署方式（生产环境）

**注意：** 以下部署方式仅适用于生产环境，不应用于开发。开发环境必须使用 Docker 容器化方式。

#### 使用 Node.js（生产环境）

1. **安装系统依赖**：

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils


```

1. **安装依赖**：

```bash
npm install --production
```

1. **安装 Puppeteer 浏览器**：

```bash
npx puppeteer browsers install chrome
```

1. **启动服务**：

```bash
npm start
```

#### 使用 PM2（生产环境）

1. **全局安装 PM2**：

```bash
npm install -g pm2
```

1. **创建生态系统文件** (ecosystem.config.js)：

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
      PORT: 3200
    }
  }]
};
```

1. **启动服务**：

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 监控和维护

#### 健康检查

服务提供健康检查端点：

```bash
curl http://localhost:3200/health
```

#### 日志查看

```bash
# Docker 日志
docker-compose logs -f html2pdf-service

# PM2 日志
pm2 logs html2pdf-service
```

#### 性能监控

- 使用 `docker stats` 监控容器资源使用
- 使用 PM2 的 `pm2 monit` 命令监控进程
- 设置适当的资源限制避免内存泄漏

### 扩展部署

#### 使用 Kubernetes

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
        - containerPort: 3200
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
            port: 3200
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3200
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### 使用云服务

- **AWS ECS/Fargate**：使用 docker-compose.yml 直接部署
- **Google Cloud Run**：支持容器化部署
- **Azure Container Instances**：快速容器部署
- **Heroku**：支持 Docker 部署

### 备份和恢复

#### 数据备份

由于服务是无状态的，主要备份：

- 配置文件

- Docker 镜像

- 部署脚本

#### 灾难恢复

1. 备份 Docker 镜像：

```bash
docker save html2pdf-service > html2pdf-service.tar
```

1. 恢复镜像：

```bash
docker load < html2pdf-service.tar
```

1. 重新部署：

```bash
docker-compose up -d
```

### 安全注意事项

1. **使用非 root 用户**：Dockerfile 已配置非 root 用户
2. **限制资源使用**：设置 CPU 和内存限制
3. **网络安全**：使用防火墙限制访问
4. **HTTPS**：生产环境使用 HTTPS
5. **定期更新**：保持基础镜像和依赖更新

## API 使用

### 将 HTML 转换为 PDF

**端点：** `POST /convert`

**Content-Type：** `application/json`

**请求体：**

```json
{
  "html": "<!DOCTYPE html><html><body><h1>Hello World</h1></body></html>",
  "options": {
    "format": "A4",
    "printBackground": true,
    "margin": {
      "top": "1cm",
      "right": "1cm",
      "bottom": "1cm",
      "left": "1cm"
    }
  }
}
```

**响应：** PDF 文件 (application/pdf)

### 参数说明

- `html` (必需)：要转换的 HTML 内容
- `options` (可选)：PDF 生成选项
  - `format`：页面格式 ('A4', 'A3', 'Letter', 等)
  - `printBackground`：包含背景颜色和图片 (默认: true)
  - `margin`：页面边距 (上、右、下、左)
  - `orientation`：页面方向 ('portrait' 或 'landscape')
  - `width` / `height`：自定义页面尺寸

### 使用 curl 示例

```bash
curl -X POST http://localhost:3200/convert \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<!DOCTYPE html><html><body><h1>My PDF</h1><p>This is content.</p></body></html>"
  }' \
  --output result.pdf
```

### 使用 JavaScript (Node.js) 示例

```javascript
const fetch = require('node-fetch');
const fs = require('fs');

async function convertToPDF(html) {
  const response = await fetch('http://localhost:3200/convert', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      html: html,
      options: {
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        }
      }
    })
  });

  if (response.ok) {
    const buffer = await response.buffer();
    fs.writeFileSync('output.pdf', buffer);
    console.log('PDF 保存成功');
  } else {
    console.error('转换失败');
  }
}

// 使用示例
const html = `
<!DOCTYPE html>
<html>
<head><title>我的文档</title></head>
<body>
  <h1>Hello PDF</h1>
  <p>这将被转换为 PDF。</p>
</body>
</html>
`;

convertToPDF(html);
```

### 使用 Python 示例

```python
import requests
import json

def convert_html_to_pdf(html_content, output_file='output.pdf'):
    url = 'http://localhost:3200/convert'
    payload = {
        'html': html_content,
        'options': {
            'format': 'A4',
            'printBackground': True,
            'margin': {
                'top': '1cm',
                'right': '1cm',
                'bottom': '1cm',
                'left': '1cm'
            }
        }
    }

    response = requests.post(url, json=payload)

    if response.status_code == 200:
        with open(output_file, 'wb') as f:
            f.write(response.content)
        print(f'PDF 已保存到 {output_file}')
    else:
        print(f'错误: {response.status_code}')

# 使用示例
html = '''
<!DOCTYPE html>
<html>
<head><title>我的文档</title></head>
<body>
  <h1>Hello PDF</h1>
  <p>这将被转换为 PDF。</p>
</body>
</html>
'''

convert_html_to_pdf(html)
```

## Web 界面

访问 `http://localhost:3200` 来使用内置演示界面，您可以：

- 测试 HTML 到 PDF 转换
- 尝试预构建的示例（简单文本、样式内容、表格、图片）
- 查看实时转换结果

## 健康检查 API

**端点：** `GET /health`

## 健康检查端点

返回服务状态信息。

```json
{
  "status": "OK",
  "message": "HTML to PDF 服务正在运行"
}
```

## 配置

### 环境变量

- `PORT`：服务器端口 (默认: 3200)

### Puppeteer 选项

服务使用以下 Puppeteer 启动选项以获得最佳性能：

```javascript
{
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
}
```

## 支持的 HTML 特性

- 完整的 CSS 支持（包括 @media print 样式）
- 图片（URL 和 base64 编码）
- 字体和排版
- 表格和复杂布局
- SVG 图形
- Canvas 元素
- Web 字体（Google Fonts 等）

## 限制

- 外部资源必须可访问（图片、字体等）
- JavaScript 执行仅限于初始页面加载
- 大型 HTML 内容可能需要增加内存限制

## 开发

### 代码规范

#### JavaScript/Node.js 规范

- 使用 ES6+ 语法
- 使用 `async/await` 处理异步操作
- 添加 JSDoc 注释给公共函数
- 使用有意义的变量和函数名

#### 提交规范

- 使用清晰的提交信息
- 英文提交信息优先
- 格式：`type(scope): description`

提交类型：

- `feat`: 新功能
- `fix`: 修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建过程或工具配置

示例：

```text
feat: add custom PDF margin support
fix: resolve Chromium startup timeout issue
docs: update Docker development setup guide
```

### 测试

#### 运行测试

```bash
# 在容器内运行测试
docker-compose exec html2pdf-service npm test
```

#### 测试覆盖

- 确保新功能有相应的测试
- 保持测试覆盖率 > 80%
- 测试包括单元测试和集成测试

#### 手动测试

1. 使用 Web 界面测试基本功能
2. 测试不同的 HTML 内容和 PDF 选项
3. 验证错误处理

### 代码审查

#### 审查清单

- [ ] 代码符合项目规范
- [ ] 添加了必要的测试
- [ ] 更新了相关文档
- [ ] 没有破坏现有功能
- [ ] 性能没有明显下降

#### 审查流程

1. 创建 Pull Request
2. 等待 CI 检查通过
3. 至少一个维护者审查
4. 解决审查意见
5. 合并到主分支

### 项目结构

```text
html2pdf-service/
├── server.js          # 主服务器文件
├── package.json       # 依赖和脚本
├── public/           # 静态 Web 文件
│   └── index.html    # 演示界面
└── README.md         # 此文件
```

### 添加自定义选项

您可以通过修改 `server.js` 中的 `pdfOptions` 对象来扩展 PDF 选项：

```javascript
const pdfOptions = {
  format: 'A4',
  printBackground: true,
  // 在此处添加自定义选项
  displayHeaderFooter: true,
  headerTemplate: '<div>页眉</div>',
  footerTemplate: '<div>页脚</div>',
  ...options
};
```

## 故障排除

### 常见问题

#### 开发环境问题

1. **容器启动失败**
   - 检查 Docker 版本和资源分配
   - 确保端口 3200 未被占用

2. **构建失败**
   - 清除 Docker 缓存：`docker system prune`
   - 检查网络连接（镜像下载）

3. **PDF 生成问题**
   - 验证 HTML 内容有效性
   - 检查 Chromium 内存使用

4. **性能问题**
   - 监控容器资源使用：`docker stats`
   - 调整 Docker Compose 配置

#### 部署问题

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

#### 一般问题

1. **浏览器启动失败**：确保 Puppeteer 有适当的权限
2. **大型 PDF 失败**：增加 Node.js 内存限制：`node --max-old-space-size=4096 server.js`
3. **图片无法加载**：确保图片 URL 可访问并尽可能使用 HTTPS
4. **CSS 未应用**：检查样式是否正确嵌入或链接

### 调试模式

启用调试日志：

```bash
DEBUG=puppeteer:* npm start
```

### 日志

服务器日志输出到控制台。生产环境建议使用日志框架。

## 许可证

MIT 许可证 - 详见 LICENSE 文件。

## 贡献

**重要提醒：** 所有开发工作必须在 Docker 环境中进行，确保跨平台一致性。

### 文档更新

#### 何时更新文档

- 添加新功能时
- 修改 API 时
- 改变部署方式时
- 修复重要 bug 时

#### 文档文件

- `README.md`: 项目概述和快速开始
- 内联代码注释

### 快速贡献步骤

1. Fork 此仓库
1. 按照上述设置 Docker 开发环境
1. 创建功能分支
1. 进行修改并使用 Docker 环境测试
1. 添加测试（如适用）
1. 提交拉取请求

### 许可证协议

通过贡献代码，您同意您的贡献遵循项目的 MIT 许可证。

### 致谢

感谢所有贡献者的时间和努力！您的贡献让这个项目变得更好。

## 支持

如有问题和疑问，请在仓库中创建 issue。
