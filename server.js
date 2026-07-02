const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
    // Decode URI to support Thai file names if any
    let safeUrl = decodeURIComponent(req.url);
    
    // Default to bootcamp.html if root is requested
    if (safeUrl === '/') {
        safeUrl = '/bootcamp.html';
    }

    const filePath = path.join(__dirname, safeUrl);
    
    // Security check to prevent directory traversal
    if (!filePath.startsWith(__dirname)) {
        res.statusCode = 403;
        res.end('403 Forbidden');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end('404 Not Found (ไม่พบไฟล์ที่คุณเรียกหา)');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.statusCode = 200;
        res.setHeader('Content-Type', contentType);

        const readStream = fs.createReadStream(filePath);
        readStream.on('error', (streamErr) => {
            res.statusCode = 500;
            res.end('500 Internal Server Error');
        });
        readStream.pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(` Local Server is running! (เซิร์ฟเวอร์จำลองเริ่มทำงานแล้ว)`);
    console.log(`--------------------------------------------------`);
    console.log(` >> User Portal: http://localhost:${PORT}/bootcamp.html`);
    console.log(` >> Admin Portal: http://localhost:${PORT}/admin-action.html`);
    console.log(`==================================================`);
    console.log(`(กด Ctrl + C เพื่อปิดการทำงานของ Server)`);
});
