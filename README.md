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

- Docker (>= 20.0)
- Docker Compose (>= 2.0)

### 开发环境设置

1. 克隆仓库：
```bash
git clone <repository-url>
cd html2pdf-service
```

2. 使用 Docker Compose 启动开发环境：
```bash
docker-compose up -d
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

#### 代码开发

- 修改代码后，重新构建镜像以应用更改：
```bash
docker-compose build --no-cache && docker-compose up -d
```

- 对于频繁的代码迭代，可以使用卷挂载（如果需要热重载，请参考 CONTRIBUTING.md）

### 为什么使用 Docker？

- **环境一致性**：确保所有开发者和 CI/CD 环境完全一致
- **依赖隔离**：避免系统级依赖冲突
- **简化部署**：开发环境与生产环境完全相同
- **跨平台兼容**：Windows、macOS、Linux 行为一致

## 部署

详细的部署指南请参考 [DEPLOYMENT.md](DEPLOYMENT.md)，其中包含：

- Docker 容器化部署（使用预构建镜像）
- 生产环境配置
- Kubernetes 部署
- 云服务部署选项
- 监控和维护指南

### Docker 镜像说明

项目使用轻量级基础镜像，通过 Dockerfile 手动安装 Chromium，无需预构建镜像：

- **node:18-alpine with manual Chromium installation**：当前使用的轻量级镜像，基于 Alpine Linux
  - Node.js 18 + 手动安装 Chromium 和系统依赖
  - 最小化镜像大小，精确控制版本
  - 适合生产环境部署
- **buildkite/puppeteer**：完整镜像，包含 Node.js、Puppeteer 和 Chrome
- **zenika/alpine-chrome**：轻量级 Alpine Linux + Chrome 镜像
- **chromedp/headless-shell**：Chrome 官方 headless shell 镜像

当前配置通过 `RUN apk add` 命令安装 Chromium 和必要依赖，无需在构建过程中下载浏览器，大大加快构建速度。

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

## 健康检查

**端点：** `GET /health`

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

### 项目结构

```
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

1. **浏览器启动失败**：确保 Puppeteer 有适当的权限
2. **大型 PDF 失败**：增加 Node.js 内存限制：`node --max-old-space-size=4096 server.js`
3. **图片无法加载**：确保图片 URL 可访问并尽可能使用 HTTPS
4. **CSS 未应用**：检查样式是否正确嵌入或链接

### 日志

服务器日志输出到控制台。生产环境建议使用日志框架。

## 许可证

MIT 许可证 - 详见 LICENSE 文件。

## 贡献

详细的贡献指南请参考 [CONTRIBUTING.md](CONTRIBUTING.md)。

**重要提醒：** 所有开发工作必须在 Docker 环境中进行，确保跨平台一致性。

快速贡献步骤：
1. Fork 此仓库
2. 按照 [CONTRIBUTING.md](CONTRIBUTING.md) 设置 Docker 开发环境
3. 创建功能分支
4. 进行修改并使用 Docker 环境测试
5. 添加测试（如适用）
6. 提交拉取请求

## 支持

如有问题和疑问，请在仓库中创建 issue。
