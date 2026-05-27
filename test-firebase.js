const { db } = require('./config/firebase');

async function testFirebase() {
    try {
        await db.ref('inventory/PROD-001').set({
            productId: 'PROD-001',
            productName: 'Camiseta Deportiva Blanca',
            stock: 50,
            sku: 'CAM-M-BLANCA',
            unitPrice: 299.99,
            created_at: new Date().toISOString()
        });
        console.log('✅ Producto creado');

        const snapshot = await db.ref('inventory').once('value');
        console.log('📦 Productos en inventario:');
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            for (const [id, product] of Object.entries(data)) {
                console.log(`   - ${id}: ${product.productName} (Stock: ${product.stock})`);
            }
        } else {
            console.log('   No hay productos');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testFirebase();