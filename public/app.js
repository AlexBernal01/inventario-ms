const API_URL = window.location.origin;

async function loadProducts() {
    const productsList = document.getElementById('productsList');
    productsList.innerHTML = '<div class="loading">Cargando productos...</div>';
    
    try {
        const response = await fetch(`${API_URL}/api/products`);
        const result = await response.json();
        
        if (!result.success || !result.data || result.data.length === 0) {
            productsList.innerHTML = '<div class="loading">No hay productos registrados</div>';
            document.getElementById('totalProducts').innerText = '0';
            document.getElementById('totalStock').innerText = '0';
            document.getElementById('totalValue').innerText = '$0';
            document.getElementById('lowStock').innerText = '0';
            return;
        }
        
        const products = result.data;
        const stats = result.stats;
        
        document.getElementById('totalProducts').innerText = stats.totalProducts || products.length;
        document.getElementById('totalStock').innerText = stats.totalStock || 0;
        document.getElementById('totalValue').innerText = `$${stats.totalValue || 0}`;
        document.getElementById('lowStock').innerText = stats.lowStockCount || 0;
        
        let html = '<table class="products-table"><thead><tr>';
        html += '<th>ID</th><th>Producto</th><th>SKU</th><th>Stock</th><th>Precio</th>';
        html += '</tr></thead><tbody>';
        
        products.forEach(product => {
            const stockClass = (product.stock || 0) < 10 ? 'product-low-stock' : '';
            html += `<tr>
                <td>${product.productId}</td>
                <td><strong>${product.productName}</strong></td>
                <td>${product.sku || '-'}</td>
                <td class="${stockClass}">${product.stock || 0}</td>
                <td>$${(product.unitPrice || 0).toFixed(2)}</td>
            </tr>`;
        });
        
        html += '</tbody></table>';
        productsList.innerHTML = html;
        
    } catch (error) {
        console.error('Error:', error);
        productsList.innerHTML = '<div class="loading">Error al cargar productos</div>';
    }
}

async function loadMovements() {
    const movementsList = document.getElementById('movementsList');
    movementsList.innerHTML = '<div class="loading">Cargando movimientos...</div>';
    
    try {
        const response = await fetch(`${API_URL}/api/movements`);
        const movements = await response.json();
        
        if (!movements || movements.length === 0) {
            movementsList.innerHTML = '<div class="loading">No hay movimientos registrados</div>';
            return;
        }
        
        let html = '';
        movements.forEach(movement => {
            const actionClass = movement.action === 'CANCELACION' ? 'movement-action-cancelacion' : 'movement-action-devolucion';
            html += `
                <div class="movement-item">
                    <div class="movement-date">${new Date(movement.timestamp).toLocaleString('es-MX')}</div>
                    <div><strong>Orden:</strong> ${movement.orderId}</div>
                    <div><strong>Guía:</strong> ${movement.trackingNumber}</div>
                    <div><strong>Acción:</strong> <span class="${actionClass}">${movement.action}</span></div>
                    <div class="movement-products">
                        <strong>Productos:</strong>
                        <ul>
                            ${movement.products.map(p => `<li>${p.productName} x${p.quantity}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `;
        });
        
        movementsList.innerHTML = html;
    } catch (error) {
        console.error('Error:', error);
        movementsList.innerHTML = '<div class="loading">Error al cargar movimientos</div>';
    }
}

loadProducts();
loadMovements();