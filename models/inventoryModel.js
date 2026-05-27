const { db } = require('../config/firebase');

const InventoryModel = {
    db: db,

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