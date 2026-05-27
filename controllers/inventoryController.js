const InventoryModel = require('../models/inventoryModel');

const InventoryController = {
    async restoreStock(req, res) {
        try {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const { orderId, trackingNumber, action, products, timestamp } = JSON.parse(body);

                    if (!orderId || !trackingNumber || !action || !products || products.length === 0) {
                        res.statusCode = 400;
                        return res.end(JSON.stringify({ error: "Campos obligatorios incompletos" }));
                    }

                    console.log(`📦 Recibido: ${action} para orden ${orderId}`);
                    console.log(`   Productos: ${products.map(p => `${p.productName} x${p.quantity}`).join(', ')}`);

                    const result = await InventoryModel.restoreStock(orderId, trackingNumber, action, products);

                    res.statusCode = 200;
                    res.end(JSON.stringify({
                        message: "Stock actualizado correctamente",
                        data: result,
                        received: { orderId, trackingNumber, action, timestamp }
                    }));
                } catch (error) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ error: "JSON invalido", detalles: error.message }));
                }
            });
        } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
        }
    },

    async getAllProducts(req, res) {
        try {
            const products = await InventoryModel.getAllProducts();
            const stats = await InventoryModel.getInventoryStats();
            
            res.statusCode = 200;
            res.end(JSON.stringify({
                success: true,
                count: products.length,
                stats: stats,
                data: products
            }));
        } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
        }
    },

    async getProduct(req, res, productId) {
        try {
            const product = await InventoryModel.getProduct(productId);
            if (!product) {
                res.statusCode = 404;
                return res.end(JSON.stringify({ error: "Producto no encontrado" }));
            }
            res.statusCode = 200;
            res.end(JSON.stringify(product));
        } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
        }
    },

    async createProduct(req, res, bodyText) {
        try {
            const body = JSON.parse(bodyText);
            const { productId, productName, initialStock, sku, unitPrice } = body;

            if (!productId || !productName) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: "productId y productName son obligatorios" }));
            }

            const existing = await InventoryModel.getProduct(productId);
            if (existing) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: "El producto ya existe" }));
            }

            const result = await InventoryModel.createProduct({
                productId,
                productName,
                initialStock: initialStock || 0,
                sku: sku || '',
                unitPrice: unitPrice || 0
            });

            res.statusCode = 201;
            res.end(JSON.stringify(result));
        } catch (error) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: error.message }));
        }
    },

    async getMovements(req, res) {
        try {
            const movements = await InventoryModel.getMovements();
            res.statusCode = 200;
            res.end(JSON.stringify(movements));
        } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
        }
    }
};

module.exports = InventoryController;