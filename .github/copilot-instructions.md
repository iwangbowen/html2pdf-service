# html2pdf-service 的 AI 编码代理指令

## 项目概述
这是一个使用 Node.js 微服务，通过 Puppeteer 和无头 Chrome 将 HTML 内容转换为 PDF。该服务提供 REST API（`/convert` POST 端点），并包含基于 Web 的演示界面。**所有开发必须在 Docker 容器中进行** - 不支持本地 Node.js 执行。

## 架构
- **后端**：Express.js 服务器（`server.js`）处理 API 请求
- **PDF 生成**：Puppeteer 启动无头 Chrome 来渲染 HTML 并生成 PDF
- **前端**：静态 HTML 演示界面（`public/index.html`），带有实时预览和示例模板
- **部署**：使用 docker-compose 进行 Docker 容器化，以确保环境一致性

## 关键开发工作流

### 环境设置（必需）
```bash
# 启动开发环境
docker-compose up -d

# 代码变更后重新构建
docker-compose build --no-cache && docker-compose up -d

# 在容器内调试
docker-compose exec html2pdf-service sh
```

**切勿在本地运行 `npm start` 或 `node server.js`** - 此项目需要 Docker 来处理 Chromium 依赖和环境一致性。

### 测试 API
```bash
# 健康检查
curl http://localhost:3200/health

# 将 HTML 转换为 PDF
curl -X POST http://localhost:3200/convert \
  -H "Content-Type: application/json" \
  -d '{"html": "<h1>Test</h1>"}' \
  --output test.pdf
```

## 代码模式和约定

### PDF 生成（`server.js`）
- 使用 `puppeteer.launch()` 并指定参数：`['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']`
- 使用 `page.setContent(html, { waitUntil: ['networkidle0', 'domcontentloaded'] })` 设置内容
- 等待字体：`await page.evaluateHandle('document.fonts.ready')`
- 默认 PDF 选项：`{format: 'A4', printBackground: true, margin: {top: '1cm', right: '1cm', bottom: '1cm', left: '1cm'}}`
- 以二进制缓冲区返回 PDF，并使用适当的头部：`Content-Type: application/pdf`

### 错误处理
- 在处理前验证 HTML 输入
- 优雅地捕获 Puppeteer/浏览器错误
- 使用 ISO 格式记录时间戳：`new Date().toISOString()`

### Web 界面（`public/index.html`）
- 通过 fetch 到 `/convert` 进行客户端 PDF 生成
- 使用 blob URL 和 iframe 进行实时预览
- 示例模板演示 CSS 样式、表格、图片
- 对必需的 HTML 内容进行表单验证

## 关键文件参考
- `server.js`：主要的 Express 服务器和 PDF 转换逻辑
- `public/index.html`：演示界面，包含示例模板
- `docker-compose.yml`：开发环境配置
- `Dockerfile`：多阶段构建，使用 Alpine Linux + 手动 Chromium 安装

## 集成点
- **API 端点**：`/convert` (POST), `/health` (GET)
- **外部依赖**：Puppeteer, Express, Docker 运行时
- **浏览器渲染**：无头 Chrome，使用特定的稳定性标志
- **静态资源**：从 `/public` 目录提供

## 常见陷阱
- 避免本地 Node.js 执行 - 始终使用 Docker
- 确保在 PDF 生成期间外部资源（图片、字体）可访问
- 使用适当的内存限制处理大型 HTML 负载
- 使用各种 CSS（包括 @media print）和复杂布局进行测试

## 部署说明
- 生产构建使用 `node:18-alpine` 并手动安装 Chromium
- 在 docker-compose 中配置健康检查和资源限制
- 支持 Kubernetes、云服务和传统的 Node.js 部署
