const { db } = require('../config/firebase');

const InventoryModel = {
    async restoreStock(orderId, trackingNumber, action, products) {
        const results = [];
        const timestamp = new Date().toISOString();

        for (const product of products) {
            const productRef = db.ref(`inventory/${product.productId}`);
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

        const movementRef = db.ref('stock_movements').push();
        await movementRef.set({
            orderId,
            trackingNumber,
            action,
            products: products,
            timestamp,
            results
        });

        return results;
    },

    async getAllProducts() {
        const snapshot = await db.ref('inventory').once('value');
        const products = [];
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            for (const [id, product] of Object.entries(data)) {
                products.push({ id, ...product });
            }
        }
        
        return products.sort((a, b) => (a.productName || '').localeCompare(b.productName || ''));
    },

    async getProduct(productId) {
        const snapshot = await db.ref(`inventory/${productId}`).once('value');
        if (!snapshot.exists()) return null;
        return { id: productId, ...snapshot.val() };
    },

    async createProduct(productData) {
        const { productId, productName, initialStock, sku, unitPrice } = productData;
        const timestamp = new Date().toISOString();
        
        await db.ref(`inventory/${productId}`).set({
            productId,
            productName,
            stock: initialStock || 0,
            sku: sku || '',
            unitPrice: unitPrice || 0,
            created_at: timestamp,
            last_updated: timestamp
        });

        return { productId, productName, stock: initialStock || 0 };
    },

    async getMovements(limit = 50) {
        const snapshot = await db.ref('stock_movements').once('value');
        const movements = [];
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            for (const [id, movement] of Object.entries(data)) {
                movements.push({ id, ...movement });
            }
        }
        
        return movements.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
    },

    async getInventoryStats() {
        const snapshot = await db.ref('inventory').once('value');
        
        let totalProducts = 0;
        let totalStock = 0;
        let totalValue = 0;
        let lowStockCount = 0;
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            for (const product of Object.values(data)) {
                totalProducts++;
                totalStock += product.stock || 0;
                totalValue += (product.stock || 0) * (product.unitPrice || 0);
                if ((product.stock || 0) < 10) lowStockCount++;
            }
        }
        
        return {
            totalProducts,
            totalStock,
            totalValue: totalValue.toFixed(2),
            lowStockCount
        };
    }
};

module.exports = InventoryModel;