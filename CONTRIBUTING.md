# 贡献指南

感谢您对 HTML to PDF 服务的贡献！为了确保代码质量和一致的开发体验，请遵循以下指南。

## 开发环境要求

**重要：** 本项目强制要求所有开发工作在 Docker 容器化环境中进行，不支持本地 Node.js 环境开发。

### 为什么强制使用 Docker？

- **环境一致性**：确保所有贡献者使用相同的运行时环境
- **跨平台兼容**：Windows、macOS、Linux 开发体验完全一致
- **依赖隔离**：避免本地环境污染和版本冲突
- **CI/CD 对齐**：开发环境与生产部署环境完全相同
- **简化协作**：新贡献者无需复杂的环境配置

## 快速开始

### 前置要求

- Docker >= 20.0
- Docker Compose >= 2.0
- Git

### 设置开发环境

1. **克隆仓库**：
```bash
git clone <repository-url>
cd html2pdf-service
```

2. **启动开发环境**：
```bash
docker-compose up -d
```

3. **验证环境**：
```bash
# 检查服务状态
curl http://localhost:3200/health

# 查看日志
docker-compose logs -f html2pdf-service
```

## 开发工作流

### 代码修改和测试

1. **修改代码**：直接编辑项目文件

2. **重新构建和重启**：
```bash
# 重新构建镜像并重启服务
docker-compose build --no-cache && docker-compose up -d
```

3. **测试更改**：
```bash
# 测试 API
curl -X POST http://localhost:3200/convert \
  -H "Content-Type: application/json" \
  -d '{"html": "<h1>Test</h1>"}' \
  --output test.pdf

# 访问 Web 界面
open http://localhost:3200
```

### 调试技巧

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

### 性能优化开发

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

2. 重启服务：
```bash
docker-compose up -d
```

**警告**：卷挂载仅用于开发调试，最终测试和提交前必须使用完整 Docker 构建。

## 代码规范

### JavaScript/Node.js 规范

- 使用 ES6+ 语法
- 使用 `async/await` 处理异步操作
- 添加 JSDoc 注释给公共函数
- 使用有意义的变量和函数名

### 提交规范

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
```
feat: add custom PDF margin support
fix: resolve Chromium startup timeout issue
docs: update Docker development setup guide
```

## 测试

### 运行测试

```bash
# 在容器内运行测试
docker-compose exec html2pdf-service npm test
```

### 测试覆盖

- 确保新功能有相应的测试
- 保持测试覆盖率 > 80%
- 测试包括单元测试和集成测试

### 手动测试

1. 使用 Web 界面测试基本功能
2. 测试不同的 HTML 内容和 PDF 选项
3. 验证错误处理

## 代码审查

### 审查清单

- [ ] 代码符合项目规范
- [ ] 添加了必要的测试
- [ ] 更新了相关文档
- [ ] 没有破坏现有功能
- [ ] 性能没有明显下降

### 审查流程

1. 创建 Pull Request
2. 等待 CI 检查通过
3. 至少一个维护者审查
4. 解决审查意见
5. 合并到主分支

## 文档更新

### 何时更新文档

- 添加新功能时
- 修改 API 时
- 改变部署方式时
- 修复重要 bug 时

### 文档文件

- `README.md`: 项目概述和快速开始
- `DEPLOYMENT.md`: 部署和开发环境指南
- `CONTRIBUTING.md`: 本文件
- 内联代码注释

## 故障排除

### 常见问题

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

### 获取帮助

- 查看项目 Issues
- 查阅 Docker 官方文档
- 联系项目维护者

## 许可证

通过贡献代码，您同意您的贡献遵循项目的 MIT 许可证。

## 致谢

感谢所有贡献者的时间和努力！您的贡献让这个项目变得更好。
