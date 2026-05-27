const API_URL = '';

async function loadProducts() {
    const productsList = document.getElementById('productsList');
    if (!productsList) {
        console.error('No se encontró el elemento productsList');
        return;
    }
    
    productsList.innerHTML = '<div class="loading">Cargando productos...</div>';
    
    try {
        const response = await fetch('/api/products');
        
        if (!response.ok) {
            throw new Error('Error en la respuesta: ' + response.status);
        }
        
        const result = await response.json();
        
        const totalProductsEl = document.getElementById('totalProducts');
        const totalStockEl = document.getElementById('totalStock');
        const totalValueEl = document.getElementById('totalValue');
        const lowStockCountEl = document.getElementById('lowStockCount');
        
        if (!result.success || !result.data || result.data.length === 0) {
            productsList.innerHTML = '<div class="loading">No hay productos registrados</div>';
            if (totalProductsEl) totalProductsEl.innerText = '0';
            if (totalStockEl) totalStockEl.innerText = '0';
            if (totalValueEl) totalValueEl.innerText = '$0';
            if (lowStockCountEl) lowStockCountEl.innerText = '0';
            return;
        }
        
        const products = result.data;
        const stats = result.stats;
        
        if (totalProductsEl) totalProductsEl.innerText = stats.totalProducts || products.length;
        if (totalStockEl) totalStockEl.innerText = stats.totalStock || 0;
        if (totalValueEl) totalValueEl.innerText = '$' + (stats.totalValue || 0);
        if (lowStockCountEl) lowStockCountEl.innerText = stats.lowStockCount || 0;
        
        let html = '<div class="table-responsive"><table class="products-table"><thead></tr>';
        html += '<th>ID</th><th>Producto</th><th>SKU</th><th>Stock</th><th>Precio</th><th>Ultima Actualizacion</th>';
        html += '</thead><tbody>';
        
        products.forEach(product => {
            const stock = product.stock || 0;
            const stockClass = stock < 10 ? 'product-low-stock' : 'product-normal-stock';
            const stockDisplay = stock < 10 ? '<span class="' + stockClass + '">' + stock + ' (Stock bajo)</span>' : '<span class="' + stockClass + '">' + stock + '</span>';
            
            html += '<tr>';
            html += '<td><code>' + (product.productId || product.id) + '</code></td>';
            html += '<td><strong>' + (product.productName || '-') + '</strong></td>';
            html += '<td>' + (product.sku || '-') + '</td>';
            html += '<td>' + stockDisplay + '</td>';
            html += '<td>$' + (product.unitPrice || 0).toFixed(2) + '</td>';
            html += '<td>' + (product.last_updated ? new Date(product.last_updated).toLocaleString('es-MX') : '-') + '</td>';
            html += '</tr>';
        });
        
        html += '</tbody></table></div>';
        productsList.innerHTML = html;
        
    } catch (error) {
        console.error('Error:', error);
        productsList.innerHTML = '<div class="loading">Error al cargar productos: ' + error.message + '</div>';
    }
}

async function loadMovements() {
    const movementsList = document.getElementById('movementsList');
    if (!movementsList) {
        console.error('No se encontró el elemento movementsList');
        return;
    }
    
    movementsList.innerHTML = '<div class="loading">Cargando movimientos...</div>';
    
    try {
        const response = await fetch('/api/movements');
        
        if (!response.ok) {
            throw new Error('Error en la respuesta: ' + response.status);
        }
        
        const movements = await response.json();
        
        if (!movements || movements.length === 0) {
            movementsList.innerHTML = '<div class="loading">No hay movimientos registrados</div>';
            return;
        }
        
        let html = '';
        movements.forEach(movement => {
            const actionClass = getActionClass(movement.action);
            const actionName = getActionName(movement.action);
            
            html += '<div class="movement-item">';
            html += '<div class="movement-header">';
            html += '<div class="movement-date">' + new Date(movement.timestamp).toLocaleString('es-MX') + '</div>';
            html += '<span class="movement-action ' + actionClass + '">' + actionName + '</span>';
            html += '</div>';
            html += '<div class="movement-details">';
            html += '<div><strong>Orden:</strong> ' + (movement.orderId || '-') + '</div>';
            if (movement.trackingNumber) {
                html += '<div><strong>Guia:</strong> ' + movement.trackingNumber + '</div>';
            }
            html += '</div>';
            html += '<div class="movement-products">';
            html += '<strong>Productos afectados:</strong>';
            html += '<ul>';
            if (movement.products && movement.products.length > 0) {
                movement.products.forEach(p => {
                    html += '<li>' + (p.productName || p.name) + ' x' + (p.quantity || 0) + '</li>';
                });
            } else {
                html += '<li>No hay detalles</li>';
            }
            html += '</ul>';
            html += '</div>';
            html += '</div>';
        });
        
        movementsList.innerHTML = html;
    } catch (error) {
        console.error('Error:', error);
        movementsList.innerHTML = '<div class="loading">Error al cargar movimientos: ' + error.message + '</div>';
    }
}

function getActionClass(action) {
    if (!action) return '';
    if (action.includes('CANCELACION')) return 'movement-action-cancelacion';
    if (action.includes('DEVOLUCION')) return 'movement-action-devolucion';
    if (action.includes('RESTADO')) return 'movement-action-stock_restado';
    if (action.includes('SUMADO')) return 'movement-action-stock_sumado';
    return '';
}

function getActionName(action) {
    if (!action) return action;
    if (action === 'STOCK_RESTADO') return 'Stock restado (Creacion de envio)';
    if (action === 'STOCK_SUMADO_CANCELACION') return 'Stock sumado (Cancelacion)';
    if (action === 'STOCK_SUMADO_DEVOLUCION') return 'Stock sumado (Devolucion)';
    return action;
}

setInterval(() => {
    loadProducts();
    loadMovements();
}, 30000);

loadProducts();
loadMovements();