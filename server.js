const http = require('http');
const fs = require('fs');
const path = require('path');
const inventoryRoutes = require('./routes/inventoryRoutes');

const PORT = process.env.PORT || 3001;

function serveStaticFile(req, res, filePath, contentType) {
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end();
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
}

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

    if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'healthy', 
            service: 'inventory-service',
            timestamp: new Date().toISOString()
        }));
        return;
    }

    if (req.url === '/' || req.url === '/index.html') {
        serveStaticFile(req, res, './public/index.html', 'text/html');
        return;
    }

    if (req.url === '/styles.css') {
        serveStaticFile(req, res, './public/styles.css', 'text/css');
        return;
    }

    if (req.url === '/app.js') {
        serveStaticFile(req, res, './public/app.js', 'application/javascript');
        return;
    }

    if (req.url === '/UMA.png') {
        serveStaticFile(req, res, './public/UMA.png', 'image/png');
        return;
    }

    try {
        inventoryRoutes(req, res);
    } catch (error) {
        console.error('Error:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
});

server.listen(PORT, () => {
    console.log(`Inventario service corriendo en http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API base: http://localhost:${PORT}/api`);
});

server.on('error', (error) => {
    console.error('Server error:', error);
});