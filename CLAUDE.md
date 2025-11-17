# HTML to PDF 服务 - Claude AI 协作指南

## 📋 项目概述

这是一个基于 **Node.js + Puppeteer + Chromium** 的 HTML 到 PDF 转换微服务。

**技术栈**：
- Express.js - Web 服务器框架
- Puppeteer - 无头浏览器控制
- Chromium - PDF 渲染引擎
- Docker - 容器化部署

**核心文件**：
- `server.js` - 主服务器和 PDF 转换逻辑
- `public/index.html` - Web 演示界面
- `docker-compose.yml` - 开发环境配置
- `Dockerfile` - 生产镜像构建

**API 端点**：
- `POST /convert` - HTML 转 PDF
- `GET /health` - 健康检查

---

## 🚨 强制性开发规则

### Docker 优先原则

**所有开发和测试必须在 Docker 容器内进行**，禁止本地直接运行 Node.js。

#### 为什么？
- Chromium 依赖复杂，不同平台安装方式不同
- 确保开发环境与生产环境完全一致
- 避免"在我机器上能跑"的问题

#### 正确的开发流程

```bash
# ✅ 启动开发环境
docker compose up -d

# ✅ 代码修改后重新构建
docker compose build --no-cache && docker compose up -d

# ✅ 查看实时日志
docker compose logs -f html2pdf-service

# ✅ 进入容器调试
docker compose exec html2pdf-service sh

# ✅ 停止服务
docker compose down
```

#### 禁止的操作

```bash
# ❌ 不要本地运行
npm start
node server.js
npm install  # 除非在容器内执行
```

### 测试工作流

```bash
# 1. 健康检查
curl http://localhost:3200/health

# 2. 测试 PDF 转换
curl -X POST http://localhost:3200/convert \
  -H "Content-Type: application/json" \
  -d '{"html": "<h1>Test</h1>"}' \
  --output test.pdf

# 3. 访问 Web 界面
open http://localhost:3200
```

---

## 💻 代码编写规范

### 1. Puppeteer 浏览器启动

**位置**：`server.js` 中的 `/convert` 端点

```javascript
const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',              // Docker 环境必需
    '--disable-setuid-sandbox',  // 安全沙箱禁用
    '--disable-dev-shm-usage',   // 避免共享内存不足
    '--disable-gpu'              // 无需 GPU 加速
  ]
});
```

**注意**：这些参数是 Docker 环境的必需配置，不要删除。

### 2. HTML 内容设置

```javascript
// ✅ 正确：等待网络空闲和 DOM 加载
await page.setContent(html, {
  waitUntil: ['networkidle0', 'domcontentloaded']
});

// ✅ 等待字体加载完成
await page.evaluateHandle('document.fonts.ready').catch(() => {});

// ✅ 额外稳定性延迟（替代已废弃的 waitForTimeout）
await new Promise(r => setTimeout(r, 100));
```

### 3. PDF 生成选项

```javascript
const pdfOptions = {
  format: 'A4',                // 默认纸张大小
  printBackground: true,       // 包含背景色和图片
  margin: {
    top: '1cm',
    right: '1cm',
    bottom: '1cm',
    left: '1cm'
  },
  ...options  // 允许用户覆盖
};

const pdfBuffer = await page.pdf(pdfOptions);
```

### 4. 二进制响应（关键：避免 PDF 损坏）

```javascript
// ✅ 正确：明确的二进制输出
res.writeHead(200, {
  'Content-Type': 'application/pdf',
  'Content-Disposition': 'attachment; filename="converted.pdf"',
  'Content-Length': pdfBuffer.length
});
res.end(pdfBuffer);

// ❌ 错误：可能导致编码问题
res.send(pdfBuffer);
```

### 5. 错误处理

```javascript
// 输入验证
if (!html) {
  console.log(`[${timestamp}] PDF conversion failed: HTML content is required`);
  return res.status(400).json({ error: 'HTML content is required' });
}

// 异常捕获
try {
  // PDF 生成逻辑
} catch (error) {
  console.error(`[${timestamp}] PDF conversion error:`, error);
  res.status(500).json({ error: 'Failed to convert HTML to PDF' });
} finally {
  // 确保浏览器关闭
  await browser.close();
}
```

### 6. 日志规范

使用 ISO 8601 时间戳：

```javascript
const timestamp = new Date().toISOString();
console.log(`[${timestamp}] PDF conversion request received`);
console.log(`[${timestamp}] PDF conversion successful, size: ${pdfBuffer.length} bytes`);
```

### 7. 注释规范

- 关键实现逻辑使用**中文注释**
- 修复 bug 时注释原因和解决方案

```javascript
// ✅ 替代旧版 waitForTimeout
await new Promise(r => setTimeout(r, 100));

// ✅ 修复 PDF 文件损坏问题（改为明确的二进制输出）
res.writeHead(200, { ... });
```

---

## 🔌 API 规范

### POST /convert

**请求**：
```json
{
  "html": "<!DOCTYPE html><html>...</html>",  // 必需
  "options": {                                 // 可选
    "format": "A4",                            // A4, A3, Letter, 等
    "printBackground": true,                   // 包含背景
    "margin": {
      "top": "1cm",
      "right": "1cm",
      "bottom": "1cm",
      "left": "1cm"
    },
    "orientation": "portrait"                  // portrait 或 landscape
  }
}
```

**响应**：PDF 二进制流（`application/pdf`）

**错误码**：
- `400` - HTML 内容缺失
- `500` - PDF 生成失败

### GET /health

**响应**：
```json
{
  "status": "OK",
  "message": "HTML to PDF 服务正在运行"
}
```

---

## 🎨 Web 界面规范

**位置**：`public/index.html`

### 客户端 PDF 生成

```javascript
const response = await fetch('/convert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ html, options })
});

if (response.ok) {
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  // 在 iframe 中预览或触发下载
}
```

### 示例模板要求

- 简单文本示例
- 样式内容示例（CSS、颜色、字体）
- 表格示例
- 图片示例
- 复杂布局示例（包括 `@media print` 样式）

---

## ⚡ 性能和安全

### 内存管理

- 每次请求启动新的浏览器实例（避免状态污染）
- 及时关闭浏览器实例（防止内存泄漏）
- 限制请求体大小（当前 10MB）

```javascript
// 中间件配置
app.use(express.json({ limit: '10mb' }));
```

### 资源限制

在 `docker-compose.yml` 中配置：

```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 1G
    reservations:
      cpus: '0.5'
      memory: 512M
```

### 安全措施

- 容器使用非 root 用户运行
- 浏览器使用必要的沙箱禁用标志（Docker 环境）
- 外部资源加载依赖网络可达性

---

## 🐛 常见问题和解决方案

### 问题 1：PDF 生成失败

**症状**：500 错误或 Puppeteer 超时

**排查**：
```bash
# 查看日志
docker compose logs -f html2pdf-service

# 检查容器资源
docker stats

# 进入容器检查 Chromium
docker compose exec html2pdf-service sh
chromium-browser --version
```

### 问题 2：外部资源无法加载

**症状**：PDF 中图片、字体缺失

**解决**：
- 确保资源 URL 可访问（优先使用 HTTPS）
- 使用 base64 编码嵌入图片
- 等待 `networkidle0` 确保资源加载完成

### 问题 3：PDF 文件损坏

**症状**：下载的 PDF 无法打开

**解决**：
- 使用 `res.writeHead()` + `res.end()` 而非 `res.send()`
- 设置正确的 `Content-Type` 和 `Content-Length`
- 确保 buffer 没有经过编码转换

### 问题 4：容器内存不足

**症状**：Docker 容器 OOM（Out of Memory）

**解决**：
- 增加 Docker 内存限制
- 优化 HTML 内容大小
- 检查是否有浏览器实例泄漏

---

## 🚀 部署指南

### Docker 镜像构建

```bash
# 本地构建
docker build -t html2pdf-service .

# 标记版本
docker tag html2pdf-service:latest username/html2pdf-service:v1.0.0

# 推送到 Docker Hub
docker push username/html2pdf-service:v1.0.0
```

### 环境变量

- `PORT` - 服务器端口（默认：3200）
- `NODE_ENV` - 运行环境（development/production）
- `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` - 跳过 Chromium 下载
- `PUPPETEER_EXECUTABLE_PATH` - Chromium 路径

### 健康检查配置

```yaml
healthcheck:
  test: ["CMD", "node", "-e", "require('http').get('http://localhost:3200/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

---

## ✅ 提交前测试清单

在提交代码前，确保：

- [ ] Docker 容器能正常构建和启动
- [ ] `/health` 端点返回 200
- [ ] 简单 HTML 能转换为 PDF
- [ ] 复杂 HTML（CSS、图片、表格）能正确渲染
- [ ] 错误处理正常（缺少 HTML、无效选项）
- [ ] Web 界面各示例模板正常工作
- [ ] 日志输出清晰（包含时间戳）
- [ ] 没有浏览器实例泄漏（多次请求后检查内存）

---

## 📝 提交规范

遵循约定式提交（Conventional Commits）：

```text
feat(scope): 添加新功能
fix(scope): 修复 bug
docs(scope): 文档更新
style(scope): 代码格式调整
refactor(scope): 重构
test(scope): 测试相关
chore(scope): 构建/工具配置
```

**示例**：
```text
feat(api): 添加自定义页眉页脚支持
fix(puppeteer): 修复 Chromium 启动超时问题
docs(readme): 更新 Docker 部署指南
```

---

## 🎯 新功能开发指南

### 添加新的 PDF 选项

1. 在 `server.js` 的 `pdfOptions` 对象中添加选项
2. 更新 `README.md` 的 API 文档
3. 在 Web 界面添加对应的表单控件
4. 测试各种配置组合

### 添加新的 API 端点

1. 在 `server.js` 中定义路由
2. 添加输入验证和错误处理
3. 更新 `README.md` 的 API 文档
4. 提供 curl 测试示例

### 性能优化建议

- 考虑浏览器实例池（复用实例）
- 实现请求队列（限制并发）
- 添加缓存机制（相同 HTML 复用结果）
- 集成监控和日志（Prometheus、ELK）

---

## 📚 参考资源

- **Puppeteer 文档**：https://pptr.dev/
- **Express.js 文档**：https://expressjs.com/
- **Docker Compose 文档**：https://docs.docker.com/compose/
- **Chromium 启动参数**：https://peter.sh/experiments/chromium-command-line-switches/

---

## 🤝 协作提示

与 Claude AI 协作时：

1. **明确需求**：描述要添加/修改的功能
2. **提供上下文**：说明相关的文件和代码位置
3. **遵守规则**：始终使用 Docker 开发流程
4. **测试验证**：修改后运行完整的测试清单
5. **保持文档同步**：代码改动后更新 README.md

---

**最后更新**：2025-01-17
