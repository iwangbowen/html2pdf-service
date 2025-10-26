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

    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set content
    await page.setContent(html, { waitUntil: 'networkidle0' });

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

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="converted.pdf"');

    // Send PDF
    res.send(pdfBuffer);

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
