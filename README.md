# HTML to PDF Service

A Node.js service that converts HTML content to PDF using headless browser rendering, providing browser-like print quality output.

## Features

- **High-Quality Rendering**: Uses Puppeteer with headless Chrome/Chromium for accurate HTML to PDF conversion
- **Browser-like Output**: Mimics browser print functionality with full CSS support, including backgrounds, fonts, and layouts
- **RESTful API**: Simple HTTP API for easy integration
- **Customizable Options**: Support for various PDF options like format, margins, and orientation
- **Demo Interface**: Built-in web interface for testing and demonstration
- **Fast Processing**: Efficient headless browser management for quick conversions

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd html2pdf-service
```

2. Install dependencies:
```bash
npm install
```

3. Start the service:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

The service will be available at `http://localhost:3000`

## API Usage

### Convert HTML to PDF

**Endpoint:** `POST /convert`

**Content-Type:** `application/json`

**Request Body:**
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

**Response:** PDF file (application/pdf)

### Parameters

- `html` (required): The HTML content to convert
- `options` (optional): PDF generation options
  - `format`: Page format ('A4', 'A3', 'Letter', etc.)
  - `printBackground`: Include background colors and images (default: true)
  - `margin`: Page margins (top, right, bottom, left)
  - `orientation`: Page orientation ('portrait' or 'landscape')
  - `width` / `height`: Custom page dimensions

### Example using curl

```bash
curl -X POST http://localhost:3000/convert \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<!DOCTYPE html><html><body><h1>My PDF</h1><p>This is content.</p></body></html>"
  }' \
  --output result.pdf
```

### Example using JavaScript (Node.js)

```javascript
const fetch = require('node-fetch');
const fs = require('fs');

async function convertToPDF(html) {
  const response = await fetch('http://localhost:3000/convert', {
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
    console.log('PDF saved successfully');
  } else {
    console.error('Conversion failed');
  }
}

// Usage
const html = `
<!DOCTYPE html>
<html>
<head><title>My Document</title></head>
<body>
  <h1>Hello PDF</h1>
  <p>This will be converted to PDF.</p>
</body>
</html>
`;

convertToPDF(html);
```

### Example using Python

```python
import requests
import json

def convert_html_to_pdf(html_content, output_file='output.pdf'):
    url = 'http://localhost:3000/convert'
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
        print(f'PDF saved to {output_file}')
    else:
        print(f'Error: {response.status_code}')

# Usage
html = '''
<!DOCTYPE html>
<html>
<head><title>My Document</title></head>
<body>
  <h1>Hello PDF</h1>
  <p>This will be converted to PDF.</p>
</body>
</html>
'''

convert_html_to_pdf(html)
```

## Web Interface

Visit `http://localhost:3000` to access the built-in demo interface where you can:

- Test HTML to PDF conversion
- Try pre-built examples (simple text, styled content, tables, images)
- See real-time conversion results

## Health Check

**Endpoint:** `GET /health`

Returns service status information.

```json
{
  "status": "OK",
  "message": "HTML to PDF service is running"
}
```

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3000)

### Puppeteer Options

The service uses the following Puppeteer launch options for optimal performance:

```javascript
{
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
}
```

## Supported HTML Features

- Full CSS support (including @media print styles)
- Images (URLs and base64 encoded)
- Fonts and typography
- Tables and complex layouts
- SVG graphics
- Canvas elements
- Web fonts (Google Fonts, etc.)

## Limitations

- External resources must be accessible (images, fonts, etc.)
- JavaScript execution is limited to initial page load
- Large HTML content may require increased memory limits

## Development

### Project Structure

```
html2pdf-service/
├── server.js          # Main server file
├── package.json       # Dependencies and scripts
├── public/           # Static web files
│   └── index.html    # Demo interface
└── README.md         # This file
```

### Adding Custom Options

You can extend the PDF options by modifying the `pdfOptions` object in `server.js`:

```javascript
const pdfOptions = {
  format: 'A4',
  printBackground: true,
  // Add custom options here
  displayHeaderFooter: true,
  headerTemplate: '<div>Header</div>',
  footerTemplate: '<div>Footer</div>',
  ...options
};
```

## Troubleshooting

### Common Issues

1. **Browser launch fails**: Ensure proper permissions for Puppeteer
2. **Large PDFs fail**: Increase Node.js memory limit: `node --max-old-space-size=4096 server.js`
3. **Images not loading**: Ensure image URLs are accessible and use HTTPS where possible
4. **CSS not applied**: Check that styles are properly embedded or linked

### Logs

Server logs are output to the console. For production, consider using a logging framework.

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions, please create an issue in the repository.
