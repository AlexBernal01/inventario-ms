const InventoryController = require('../controllers/inventoryController');

const inventoryRoutes = (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Company-Name', 'Urban Market');
    res.setHeader('X-Company-Email', 'inventario@urbanmarket.com');

    const { method, url } = req;
    console.log(`${method} ${url}`);

    if (url === '/api/stock/restore' && method === 'POST') {
        InventoryController.restoreStock(req, res);
    }

    else if (url === '/api/stock/subtract' && method === 'POST') {
        InventoryController.subtractStock(req, res);
    }

    else if (url === '/api/products' && method === 'GET') {
        InventoryController.getAllProducts(req, res);
    }

    else if (url === '/api/products' && method === 'POST') {
        let body = [];
        req.on('data', chunk => body.push(chunk));
        req.on('end', () => {
            const bodyText = Buffer.concat(body).toString();
            InventoryController.createProduct(req, res, bodyText);
        });
        
    }


    else if (url.startsWith('/api/products/') && method === 'PUT') {
    const productId = url.split('/')[3];
    let body = [];
    req.on('data', chunk => body.push(chunk));
    req.on('end', () => {
        const bodyText = Buffer.concat(body).toString();
        InventoryController.updateProductStock(req, res, productId, bodyText);
    });
}

    else if (url.startsWith('/api/products/') && method === 'GET') {
        const productId = url.split('/')[3];
        InventoryController.getProduct(req, res, productId);
    }

    else if (url === '/api/movements' && method === 'GET') {
        InventoryController.getMovements(req, res);
    }

    else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: "Ruta no soportada" }));
    }
};

module.exports = inventoryRoutes;