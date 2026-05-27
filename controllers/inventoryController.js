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

                    console.log(`📦 SUMANDO stock para orden ${orderId}`);
                    console.log(`   Productos: ${products.map(p => `${p.productName} x${p.quantity}`).join(', ')}`);

                    const results = [];

                    for (const product of products) {
                        const productRef = InventoryModel.db.ref(`inventory/${product.productId}`);
                        const snapshot = await productRef.once('value');
                        
                        let currentStock = 0;
                        let productData = {};
                        
                        if (snapshot.exists()) {
                            currentStock = snapshot.val().stock || 0;
                            productData = snapshot.val();
                        }
                        
                        const newStock = currentStock + product.quantity;
                        
                        await productRef.set({
                            productId: product.productId,
                            productName: product.productName,
                            stock: newStock,
                            sku: product.sku || productData.sku || '',
                            unitPrice: product.unitPrice || productData.unitPrice || 0,
                            last_updated: timestamp,
                            last_action: action,
                            last_order_id: orderId,
                            last_tracking: trackingNumber
                        });

                        results.push({
                            productId: product.productId,
                            productName: product.productName,
                            oldStock: currentStock,
                            newStock: newStock,
                            added: product.quantity
                        });
                    }

                    const movementRef = InventoryModel.db.ref('stock_movements').push();
                    await movementRef.set({
                        orderId,
                        trackingNumber,
                        action: `STOCK_SUMADO_${action}`,
                        products: products,
                        timestamp,
                        results
                    });

                    res.statusCode = 200;
                    res.end(JSON.stringify({
                        message: "Stock sumado correctamente",
                        data: results
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

    async subtractStock(req, res) {
        try {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const { orderId, action, products, timestamp } = JSON.parse(body);

                    if (!orderId || !products || products.length === 0) {
                        res.statusCode = 400;
                        return res.end(JSON.stringify({ error: "Campos obligatorios incompletos" }));
                    }

                    console.log(`📦 RESTANDO stock para orden ${orderId}`);
                    console.log(`   Productos: ${products.map(p => `${p.productName} x${p.quantity}`).join(', ')}`);

                    const results = [];

                    for (const product of products) {
                        const productRef = InventoryModel.db.ref(`inventory/${product.productId}`);
                        const snapshot = await productRef.once('value');
                        
                        if (!snapshot.exists()) {
                            results.push({
                                productId: product.productId,
                                productName: product.productName,
                                error: "Producto no encontrado en inventario"
                            });
                            continue;
                        }
                        
                        const currentStock = snapshot.val().stock || 0;
                        const newStock = currentStock - product.quantity;
                        
                        if (newStock < 0) {
                            results.push({
                                productId: product.productId,
                                productName: product.productName,
                                error: "Stock insuficiente",
                                currentStock,
                                requested: product.quantity
                            });
                            continue;
                        }
                        
                        await productRef.update({
                            stock: newStock,
                            last_updated: timestamp,
                            last_action: action,
                            last_order_id: orderId
                        });

                        results.push({
                            productId: product.productId,
                            productName: product.productName,
                            oldStock: currentStock,
                            newStock: newStock,
                            subtracted: product.quantity
                        });
                    }

                    const movementRef = InventoryModel.db.ref('stock_movements').push();
                    await movementRef.set({
                        orderId,
                        action: 'STOCK_RESTADO',
                        products: products,
                        timestamp,
                        results
                    });

                    res.statusCode = 200;
                    res.end(JSON.stringify({
                        message: "Stock restado correctamente",
                        data: results
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