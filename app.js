const API_BASE = 'https://las-valkyrie-backend-a48adkgxw-lastvalkyrieimes-projects.vercel.app';

let products = [];
let cart = [];
let isAdminLoggedIn = false;
let editingProductId = null;

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    updateCartDisplay();
});

// Section Navigation
function showSection(section) {
    document.getElementById('products-section').classList.add('d-none');
    document.getElementById('admin-section').classList.add('d-none');
    
    if (section === 'products') {
        document.getElementById('products-section').classList.remove('d-none');
    } else if (section === 'admin') {
        document.getElementById('admin-section').classList.remove('d-none');
        if (!isAdminLoggedIn) {
            document.getElementById('admin-login').classList.remove('d-none');
            document.getElementById('admin-dashboard').classList.add('d-none');
        }
    }
}

// Product Management
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE}/api/products`);
        const result = await response.json();
        
        if (result.success) {
            products = result.data;
            displayProducts(products);
        } else {
            showAlert('Error loading products', 'danger');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showAlert('Failed to load products', 'danger');
    }
}

function displayProducts(productsToDisplay) {
    const container = document.getElementById('products-container');
    
    if (productsToDisplay.length === 0) {
        container.innerHTML = '<div class="col-12"><p class="text-muted text-center">Tidak ada produk ditemukan</p></div>';
        return;
    }
    
    container.innerHTML = productsToDisplay.map(product => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card product-card">
                <div class="card-body">
                    <h5 class="card-title">${product.name}</h5>
                    <span class="badge bg-primary category-badge">${product.category}</span>
                    <p class="card-text text-muted small">${product.description || 'No description'}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong class="text-success">$${product.price}</strong>
                            <small class="text-muted d-block">Stok: ${product.stock}</small>
                        </div>
                        <div>
                            <input type="number" 
                                   id="qty-${product._id}" 
                                   class="form-control form-control-sm" 
                                   value="1" 
                                   min="1" 
                                   max="${product.stock}"
                                   style="width: 80px; display: inline-block; margin-right: 10px;">
                            <button class="btn btn-sm btn-primary" onclick="addToCart('${product._id}')">
                                <i class="fas fa-cart-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function filterProducts() {
    const category = document.getElementById('categoryFilter').value;
    const search = document.getElementById('searchProduct').value.toLowerCase();
    
    let filtered = products;
    
    if (category) {
        filtered = filtered.filter(p => p.category === category);
    }
    
    if (search) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(search) || 
            p.description.toLowerCase().includes(search)
        );
    }
    
    displayProducts(filtered);
}

// Cart Management
function addToCart(productId) {
    const product = products.find(p => p._id === productId);
    const quantityInput = document.getElementById(`qty-${productId}`);
    const quantity = parseInt(quantityInput.value) || 1;
    
    if (quantity < 1 || quantity > product.stock) {
        showAlert('Quantity tidak valid', 'warning');
        return;
    }
    
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            productId: product._id,
            name: product.name,
            price: product.price,
            quantity: quantity,
            category: product.category
        });
    }
    
    updateCartDisplay();
    showAlert('Produk ditambahkan ke keranjang', 'success');
    quantityInput.value = 1;
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.productId !== productId);
    updateCartDisplay();
}

function updateCartQuantity(productId, change) {
    const item = cart.find(item => item.productId === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity < 1) {
            removeFromCart(productId);
        } else {
            updateCartDisplay();
        }
    }
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const totalPriceElement = document.getElementById('total-price');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="text-muted">Keranjang kosong</p>';
        cartTotal.classList.add('d-none');
        return;
    }
    
    let total = 0;
    cartItems.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        return `
            <div class="cart-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${item.name}</strong>
                        <br>
                        <small class="text-muted">$${item.price} x ${item.quantity}</small>
                    </div>
                    <div class="d-flex align-items-center">
                        <span class="me-2 text-success">$${itemTotal}</span>
                        <button class="btn btn-sm btn-outline-secondary me-1" onclick="updateCartQuantity('${item.productId}', -1)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="removeFromCart('${item.productId}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    totalPriceElement.textContent = total;
    cartTotal.classList.remove('d-none');
}

// Checkout Process
function showCheckoutModal() {
    if (cart.length === 0) {
        showAlert('Keranjang belanja kosong', 'warning');
        return;
    }
    
    const checkoutSummary = document.getElementById('checkout-summary');
    const checkoutTotal = document.getElementById('checkout-total');
    
    let total = 0;
    checkoutSummary.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        return `<div>${item.name} - ${item.quantity} x $${item.price} = $${itemTotal}</div>`;
    }).join('');
    
    checkoutTotal.textContent = total;
    
    // Clear previous inputs
    document.getElementById('customer-name').value = '';
    document.getElementById('discord-id').value = '';
    document.getElementById('additional-info').value = '';
    
    const modal = new bootstrap.Modal(document.getElementById('checkoutModal'));
    modal.show();
}

async function processCheckout() {
    const customerName = document.getElementById('customer-name').value.trim();
    const discordId = document.getElementById('discord-id').value.trim();
    const additionalInfo = document.getElementById('additional-info').value.trim();
    
    if (!customerName || !discordId) {
        showAlert('Harap isi nama dan Discord ID', 'warning');
        return;
    }
    
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const orderData = {
        customerName,
        discordId,
        additionalInfo,
        items: cart,
        totalPrice
    };
    
    try {
        const response = await fetch(`${API_BASE}/api/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('Pesanan berhasil dibuat! Notifikasi telah dikirim ke Discord.', 'success');
            cart = [];
            updateCartDisplay();
            document.getElementById('checkoutModal').querySelector('.btn-close').click();
        } else {
            showAlert('Gagal membuat pesanan: ' + result.error, 'danger');
        }
    } catch (error) {
        console.error('Checkout error:', error);
        showAlert('Terjadi kesalahan saat proses checkout', 'danger');
    }
}

// Admin Functions
async function adminLogin() {
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;
    
    try {
        const response = await fetch(`${API_BASE}/api/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            isAdminLoggedIn = true;
            document.getElementById('admin-login').classList.add('d-none');
            document.getElementById('admin-dashboard').classList.remove('d-none');
            loadAdminProducts();
            loadAdminOrders();
            showAlert('Login admin berhasil', 'success');
        } else {
            showAlert('Login gagal: ' + result.error, 'danger');
        }
    } catch (error) {
        console.error('Admin login error:', error);
        showAlert('Terjadi kesalahan saat login', 'danger');
    }
}

async function loadAdminProducts() {
    try {
        const response = await fetch(`${API_BASE}/api/products`);
        const result = await response.json();
        
        if (result.success) {
            displayAdminProducts(result.data);
        }
    } catch (error) {
        console.error('Error loading admin products:', error);
    }
}

function displayAdminProducts(productsList) {
    const container = document.getElementById('admin-products-list');
    
    container.innerHTML = productsList.map(product => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-8">
                        <h6>${product.name}</h6>
                        <span class="badge bg-primary">${product.category}</span>
                        <p class="mb-1 text-muted">${product.description || 'No description'}</p>
                        <div class="text-success fw-bold">$${product.price}</div>
                        <small class="text-muted">Stok: ${product.stock}</small>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-sm btn-warning me-1" onclick="editProduct('${product._id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProduct('${product._id}')">
                            <i class="fas fa-trash"></i> Hapus
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function showAddProductModal() {
    editingProductId = null;
    document.getElementById('productModalTitle').textContent = 'Tambah Produk Baru';
    document.getElementById('productModalButton').textContent = 'Simpan';
    
    // Clear form
    document.getElementById('product-name').value = '';
    document.getElementById('product-category').value = '';
    document.getElementById('product-price').value = '';
    document.getElementById('product-stock').value = '';
    document.getElementById('product-description').value = '';
    
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
}

function editProduct(productId) {
    const product = products.find(p => p._id === productId);
    if (!product) return;
    
    editingProductId = productId;
    document.getElementById('productModalTitle').textContent = 'Edit Produk';
    document.getElementById('productModalButton').textContent = 'Update';
    
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-stock').value = product.stock;
    document.getElementById('product-description').value = product.description || '';
    
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
}

async function saveProduct() {
    const name = document.getElementById('product-name').value.trim();
    const category = document.getElementById('product-category').value;
    const price = parseFloat(document.getElementById('product-price').value);
    const stock = parseInt(document.getElementById('product-stock').value);
    const description = document.getElementById('product-description').value.trim();
    
    if (!name || !category || isNaN(price) || isNaN(stock)) {
        showAlert('Harap isi semua field yang wajib', 'warning');
        return;
    }
    
    const productData = { name, category, price, stock, description };
    
    try {
        const url = editingProductId ? 
            `${API_BASE}/api/products/${editingProductId}` : 
            `${API_BASE}/api/products`;
            
        const method = editingProductId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(productData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert(editingProductId ? 'Produk berhasil diupdate' : 'Produk berhasil ditambahkan', 'success');
            document.getElementById('productModal').querySelector('.btn-close').click();
            loadProducts();
            loadAdminProducts();
        } else {
            showAlert('Gagal menyimpan produk: ' + result.error, 'danger');
        }
    } catch (error) {
        console.error('Save product error:', error);
        showAlert('Terjadi kesalahan saat menyimpan produk', 'danger');
    }
}

async function deleteProduct(productId) {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/products/${productId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('Produk berhasil dihapus', 'success');
            loadProducts();
            loadAdminProducts();
        } else {
            showAlert('Gagal menghapus produk: ' + result.error, 'danger');
        }
    } catch (error) {
        console.error('Delete product error:', error);
        showAlert('Terjadi kesalahan saat menghapus produk', 'danger');
    }
}

async function loadAdminOrders() {
    try {
        const response = await fetch(`${API_BASE}/api/orders`);
        const result = await response.json();
        
        if (result.success) {
            displayAdminOrders(result.data);
        }
    } catch (error) {
        console.error('Error loading admin orders:', error);
    }
}

function displayAdminOrders(orders) {
    const container = document.getElementById('admin-orders-list');
    
    if (orders.length === 0) {
        container.innerHTML = '<p class="text-muted">Belum ada pesanan</p>';
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-8">
                        <h6>Order #${order._id}</h6>
                        <p class="mb-1"><strong>Customer:</strong> ${order.customerName}</p>
                        <p class="mb-1"><strong>Discord:</strong> ${order.discordId}</p>
                        <p class="mb-1"><strong>Total:</strong> $${order.totalPrice}</p>
                        <p class="mb-1"><strong>Tanggal:</strong> ${new Date(order.createdAt).toLocaleString('id-ID')}</p>
                        ${order.additionalInfo ? `<p class="mb-1"><strong>Info:</strong> ${order.additionalInfo}</p>` : ''}
                        
                        <div class="mt-2">
                            <strong>Items:</strong>
                            <ul class="mb-0">
                                ${order.items.map(item => `
                                    <li>${item.name} - ${item.quantity} x $${item.price}</li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                    <div class="col-md-4 text-end">
                        <select class="form-select mb-2" onchange="updateOrderStatus('${order._id}', this.value)">
                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                        <span class="badge ${getStatusBadgeClass(order.status)}">${order.status}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'pending': return 'bg-warning';
        case 'processing': return 'bg-info';
        case 'completed': return 'bg-success';
        case 'cancelled': return 'bg-danger';
        default: return 'bg-secondary';
    }
}

async function updateOrderStatus(orderId, status) {
    try {
        const response = await fetch(`${API_BASE}/api/orders/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('Status pesanan berhasil diupdate', 'success');
            loadAdminOrders();
        } else {
            showAlert('Gagal update status: ' + result.error, 'danger');
        }
    } catch (error) {
        console.error('Update order status error:', error);
        showAlert('Terjadi kesalahan saat update status', 'danger');
    }
}

// Utility Functions
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.querySelector('.container').insertBefore(alertDiv, document.querySelector('.container').firstChild);
    
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
}
