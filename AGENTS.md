# HTML to PDF 服务 - 代理准则

## 构建/开发命令
- **启动开发环境**: `docker compose up -d`
- **代码变更后重新构建**: `docker compose build --no-cache && docker compose up -d`
- **在容器内调试**: `docker compose exec html2pdf-service sh`
- **停止服务**: `docker compose down`
- **查看日志**: `docker compose logs -f html2pdf-service`

**⚠️ 所有开发必须使用 Docker - 不支持本地 `npm start` 或 `node server.js`**

## 架构
- **后端**: Express.js 服务器 (`server.js`) 提供 REST API
- **PDF 引擎**: Puppeteer + 无头 Chrome 进行 HTML→PDF 转换
- **前端**: 静态演示界面 (`public/index.html`)
- **部署**: Docker 容器化，使用 Alpine Linux + 手动 Chromium 安装
- **APIs**: `POST /convert` (HTML→PDF), `GET /health` (状态检查)

## 代码风格准则
- **Puppeteer 设置**: 使用 `['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']` 参数
- **内容加载**: `page.setContent(html, { waitUntil: ['networkidle0', 'domcontentloaded'] })`
- **字体等待**: `await page.evaluateHandle('document.fonts.ready')`
- **PDF 选项**: 默认 `{format: 'A4', printBackground: true, margin: {top: '1cm', right: '1cm', bottom: '1cm', left: '1cm'}}`
- **响应**: 二进制 PDF，使用 `Content-Type: application/pdf` 头部
- **日志**: ISO 时间戳 `new Date().toISOString()`
- **错误处理**: 验证 HTML 输入，优雅捕获 Puppeteer 错误
- **注释**: 实现说明使用中文注释

## 来自 .github/copilot-instructions.md 的规则
- 为确保环境一致性，仅使用 Docker 开发
- 浏览器渲染使用稳定性标志
- Web 界面使用 fetch API 和 blob 预览
- PDF 生成期间外部资源必须可访问
- 使用包含 @media print 的复杂 CSS 进行测试
