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
        document.getElementById('totalValue').innerText = '$' + (stats.totalValue || 0);
        document.getElementById('lowStock').innerText = stats.lowStockCount || 0;
        
        let html = '<table class="products-table"><thead><tr>';
        html += '<th>ID</th><th>Producto</th><th>SKU</th><th>Stock</th><th>Precio</th><th>Ultima Actualizacion</th>';
        html += '</tr></thead><tbody>';
        
        products.forEach(product => {
            const stock = product.stock || 0;
            const stockClass = stock < 10 ? 'product-low-stock' : 'product-normal-stock';
            const stockDisplay = stock < 10 ? '<span class="' + stockClass + '">' + stock + ' (Stock bajo)</span>' : '<span class="' + stockClass + '">' + stock + '</span>';
            
            html += '<tr>';
            html += '<td><code>' + product.productId + '</code></td>';
            html += '<td><strong>' + product.productName + '</strong></td>';
            html += '<td>' + (product.sku || '-') + '</td>';
            html += '<td>' + stockDisplay + '</td>';
            html += '<td>$' + (product.unitPrice || 0).toFixed(2) + '</td>';
            html += '<td>' + (product.last_updated ? new Date(product.last_updated).toLocaleString('es-MX') : '-') + '</td>';
            html += '</tr>';
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
            movement.products.forEach(p => {
                html += '<li>' + p.productName + ' x' + p.quantity + '</li>';
            });
            html += '</ul>';
            html += '</div>';
            html += '</div>';
        });
        
        movementsList.innerHTML = html;
    } catch (error) {
        console.error('Error:', error);
        movementsList.innerHTML = '<div class="loading">Error al cargar movimientos</div>';
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