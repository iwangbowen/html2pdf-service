# 使用 Puppeteer 官方镜像（Node 20 + Chromium）
FROM ghcr.io/puppeteer/puppeteer:24.26.1

# 切换到 root，才能安装依赖
USER root

# 更换 apt 源为国内镜像
RUN sed -i 's/deb.debian.org/mirrors.ustc.edu.cn/g' /etc/apt/sources.list.d/debian.sources

# 安装中文字体包，包括微软雅黑等中文字体
RUN apt-get update && apt-get install -y \
    fonts-wqy-zenhei \
    fonts-wqy-microhei \
    fonts-noto-cjk \
    fonts-noto-cjk-extra \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 设置国内镜像源，替换 puppeteer 的 Chromium 下载地址
ENV PUPPETEER_DOWNLOAD_BASE_URL="https://npmmirror.com/mirrors/chromium/"
ENV NPM_CONFIG_REGISTRY=https://registry.npmmirror.com
ENV PUPPETEER_SKIP_DOWNLOAD=true

# 拷贝依赖文件
COPY package*.json ./

# 安装依赖
RUN npm install --omit=dev && npm cache clean --force

# 拷贝全部代码
COPY . .

# 修改文件权限，确保后续运行用户有权限访问
RUN chown -R pptruser:pptruser /app

# 切回 Puppeteer 默认用户，安全执行
USER pptruser

# 暴露端口
EXPOSE 3200

# 健康检查（可选）
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3200/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# 启动服务
CMD ["node", "server.js"]
