const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3200;

// Middleware to parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Serve static files from public directory
app.use(express.static('public'));

// PDF conversion endpoint
app.post('/convert', async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] PDF conversion request received`);

  try {
    const { html, options = {} } = req.body;

    if (!html) {
      console.log(`[${timestamp}] PDF conversion failed: HTML content is required`);
      return res.status(400).json({ error: 'HTML content is required' });
    }

    // Launch browser (增加稳定参数，不影响原有逻辑)
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // 避免 Docker 共享内存不足
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Set content and ensure rendering stability
    await page.setContent(html, { waitUntil: ['networkidle0', 'domcontentloaded'] });
    await page.evaluateHandle('document.fonts.ready').catch(() => { });
    await new Promise(r => setTimeout(r, 100)); // ✅ 替代旧版 waitForTimeout

    // Default PDF options (mimics browser print)
    const pdfOptions = {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      },
      ...options
    };

    // Generate PDF
    const pdfBuffer = await page.pdf(pdfOptions);

    // Close browser
    await browser.close();

    console.log(`[${timestamp}] PDF conversion successful, size: ${pdfBuffer.length} bytes`);

    // ✅ 修复 PDF 文件损坏问题（改为明确的二进制输出）
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="converted.pdf"',
      'Content-Length': pdfBuffer.length
    });
    res.end(pdfBuffer);

  } catch (error) {
    console.error(`[${timestamp}] PDF conversion error:`, error);
    res.status(500).json({ error: 'Failed to convert HTML to PDF' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Health check request`);
  res.json({ status: 'OK', message: 'HTML to PDF 服务正在运行' });
});

app.listen(PORT, () => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] HTML to PDF service running on port ${PORT}`);
});

module.exports = app;
