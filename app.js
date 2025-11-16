const API_BASE = 'https://las-valkyrie-backend.vercel.app';

let products = [];
let cart = [];
let isAdminLoggedIn = false;
let editingProductId = null;

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Las Valkyrie Frontend Started');
    console.log('📍 API Base:', API_BASE);
    
    updateConnectionStatus('connecting');
    
    // Test connection pertama kali
    testConnection().then(success => {
        if (success) {
            loadProducts();
            updateCartDisplay();
            updateConnectionStatus('connected');
        } else {
            updateConnectionStatus('disconnected');
        }
    });

    // Initialize logout button
    initLogoutButton();
});

// Initialize logout button
function initLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    const adminLogoutBtn = document.getElementById('admin-logout-btn');
    
    if (logoutBtn) {
        logoutBtn.classList.add('d-none');
    }
    if (adminLogoutBtn) {
        adminLogoutBtn.classList.add('d-none');
    }
}

// Update logout button visibility
function updateLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    const adminLogoutBtn = document.getElementById('admin-logout-btn');
    
    if (logoutBtn) {
        if (isAdminLoggedIn) {
            logoutBtn.classList.remove('d-none');
        } else {
            logoutBtn.classList.add('d-none');
        }
    }
    
    if (adminLogoutBtn) {
        if (isAdminLoggedIn) {
            adminLogoutBtn.classList.remove('d-none');
        } else {
            adminLogoutBtn.classList.add('d-none');
        }
    }
}

// Update connection status indicator
function updateConnectionStatus(status) {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
        switch(status) {
            case 'connected':
                statusElement.innerHTML = '<i class="fas fa-wifi"></i> Connected';
                statusElement.className = 'connection-status text-success';
                break;
            case 'connecting':
                statusElement.innerHTML = '<i class="fas fa-sync fa-spin"></i> Connecting';
                statusElement.className = 'connection-status text-warning';
                break;
            case 'disconnected':
                statusElement.innerHTML = '<i class="fas fa-unlink"></i> Disconnected';
                statusElement.className = 'connection-status text-danger';
                break;
        }
    }
}

// Test connection
async function testConnection() {
    console.log('🔌 Testing connection to:', API_BASE);
    
    try {
        const response = await fetch(API_BASE + '/');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Backend connection successful:', result);
        showAlert('✅ Terhubung ke server Las Valkyrie', 'success', 3000);
        return true;
        
    } catch (error) {
        console.error('❌ Connection failed:', error);
        showAlert('❌ Tidak dapat terhubung ke server. Mode offline diaktifkan.', 'warning', 5000);
        return false;
    }
}

// Generic fetch function
async function apiFetch(endpoint, options = {}) {
    const url = API_BASE + endpoint;
    
    console.log(`🌐 API Call: ${options.method || 'GET'} ${url}`, options.body ? JSON.parse(options.body) : '');
    
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log(`✅ API Success (${endpoint}):`, result);
        return result;
        
    } catch (error) {
        console.error(`❌ API Fetch Error (${endpoint}):`, error);
        throw new Error(`Gagal terhubung: ${error.message}`);
    }
}

// Section Navigation
function showSection(section) {
    document.getElementById('products-section').classList.add('d-none');
    document.getElementById('admin-section').classList.add('d-none');
    
    if (section === 'products') {
        document.getElementById('products-section').classList.remove('d-none');
        loadProducts();
    } else if (section === 'admin') {
        document.getElementById('admin-section').classList.remove('d-none');
        if (!isAdminLoggedIn) {
            document.getElementById('admin-login').classList.remove('d-none');
            document.getElementById('admin-dashboard').classList.add('d-none');
        } else {
            document.getElementById('admin-login').classList.add('d-none');
            document.getElementById('admin-dashboard').classList.remove('d-none');
            loadAdminProducts();
            loadAdminOrders();
            loadStats();
        }
    }
    updateLogoutButton();
}

// Product Management
async function loadProducts() {
    try {
        console.log('🔄 Loading products from:', API_BASE);
        
        const result = await apiFetch('/api/products');
        
        if (result.success) {
            products = result.data || [];
            displayProducts(products);
            
            if (products.length === 0) {
                showAlert('Tidak ada produk tersedia', 'info', 3000);
            } else {
                console.log(`✅ Loaded ${products.length} products`);
            }
        } else {
            throw new Error(result.error || 'Gagal memuat produk');
        }
    } catch (error) {
        console.error('❌ Error loading products:', error);
        showAlert('Gagal memuat produk: ' + error.message, 'danger');
        
        // Fallback data
        products = getFallbackProducts();
        displayProducts(products);
    }
}

// Fallback products data
function getFallbackProducts() {
    return [
        {
            _id: 'fallback_1',
            name: 'AK-47',
            category: 'senjata',
            price: 15000,
            stock: 10,
            description: 'Senjata assault rifle - OFFLINE MODE'
        },
        {
            _id: 'fallback_2',
            name: 'Body Armor',
            category: 'armor', 
            price: 8000,
            stock: 15,
            description: 'Pelindung tubuh level 3 - OFFLINE MODE'
        },
        {
            _id: 'fallback_3',
            name: 'Ganja Premium',
            category: 'ganja',
            price: 5000,
            stock: 20,
            description: 'Ganja kualitas tinggi - OFFLINE MODE'
        }
    ];
}

function displayProducts(productsToDisplay) {
    const container = document.getElementById('products-container');
    
    if (!productsToDisplay || productsToDisplay.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="text-center py-4">
                    <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
                    <p class="text-muted">Tidak ada produk tersedia</p>
                    <button class="btn btn-primary" onclick="loadProducts()">
                        <i class="fas fa-redo"></i> Muat Ulang
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = productsToDisplay.map(product => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card product-card h-100">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title">${escapeHtml(product.name)}</h5>
                        <span class="badge bg-primary category-badge">${escapeHtml(product.category)}</span>
                    </div>
                    <p class="card-text text-muted small flex-grow-1">${escapeHtml(product.description || 'Tidak ada deskripsi')}</p>
                    <div class="mt-auto">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <div>
                                <strong class="text-success">$${product.price}</strong>
                                <small class="text-muted d-block">Stok: ${product.stock}</small>
                            </div>
                            <div class="d-flex align-items-center">
                                <input type="number" 
                                       id="qty-${product._id}" 
                                       class="form-control form-control-sm me-2" 
                                       value="1" 
                                       min="1" 
                                       max="${product.stock}"
                                       style="width: 70px;"
                                       onchange="validateQuantity('${product._id}')">
                                <button class="btn btn-sm btn-primary" onclick="addToCart('${product._id}')" 
                                        ${product.stock === 0 ? 'disabled' : ''}>
                                    <i class="fas fa-cart-plus"></i>
                                </button>
                            </div>
                        </div>
                        ${product.stock === 0 ? '<small class="text-danger">Stok habis</small>' : ''}
                        ${product._id && product._id.includes('fallback') ? '<small class="text-warning"><i class="fas fa-wifi-slash"></i> Offline Mode</small>' : ''}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function validateQuantity(productId) {
    const product = products.find(p => p._id === productId);
    const quantityInput = document.getElementById(`qty-${productId}`);
    let quantity = parseInt(quantityInput.value) || 1;
    
    if (quantity < 1) quantity = 1;
    if (quantity > product.stock) quantity = product.stock;
    
    quantityInput.value = quantity;
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
            (p.description && p.description.toLowerCase().includes(search))
        );
    }
    
    displayProducts(filtered);
}

// Cart Management
function addToCart(productId) {
    const product = products.find(p => p._id === productId);
    if (!product) {
        showAlert('Produk tidak ditemukan', 'danger');
        return;
    }
    
    const quantityInput = document.getElementById(`qty-${productId}`);
    const quantity = parseInt(quantityInput.value) || 1;
    
    if (quantity < 1) {
        showAlert('Quantity harus minimal 1', 'warning');
        return;
    }
    
    if (quantity > product.stock) {
        showAlert(`Stok tidak mencukupi. Stok tersedia: ${product.stock}`, 'warning');
        return;
    }
    
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
            showAlert(`Total quantity melebihi stok. Stok tersedia: ${product.stock}`, 'warning');
            return;
        }
        existingItem.quantity = newQuantity;
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
    showAlert(`"${product.name}" ditambahkan ke keranjang`, 'success');
    quantityInput.value = 1;
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.productId !== productId);
    updateCartDisplay();
    showAlert('Produk dihapus dari keranjang', 'info');
}

function updateCartQuantity(productId, change) {
    const item = cart.find(item => item.productId === productId);
    if (item) {
        const newQuantity = item.quantity + change;
        if (newQuantity < 1) {
            removeFromCart(productId);
        } else {
            const product = products.find(p => p._id === productId);
            if (product && newQuantity > product.stock) {
                showAlert(`Quantity melebihi stok. Stok tersedia: ${product.stock}`, 'warning');
                return;
            }
            item.quantity = newQuantity;
            updateCartDisplay();
        }
    }
}

function clearCart() {
    if (cart.length === 0) {
        showAlert('Keranjang sudah kosong', 'info');
        return;
    }
    
    if (confirm('Apakah Anda yakin ingin mengosongkan keranjang?')) {
        cart = [];
        updateCartDisplay();
        showAlert('Keranjang berhasil dikosongkan', 'success');
    }
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const totalPriceElement = document.getElementById('total-price');
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="text-center py-3">
                <i class="fas fa-shopping-cart fa-2x text-muted mb-2"></i>
                <p class="text-muted mb-0">Keranjang kosong</p>
            </div>
        `;
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
                    <div class="flex-grow-1">
                        <strong class="d-block">${escapeHtml(item.name)}</strong>
                        <small class="text-muted">${escapeHtml(item.category)}</small>
                        <div class="mt-1">
                            <small>$${item.price} x ${item.quantity}</small>
                        </div>
                    </div>
                    <div class="d-flex align-items-center">
                        <span class="text-success fw-bold me-3">$${itemTotal}</span>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-secondary" onclick="updateCartQuantity('${item.productId}', -1)">
                                <i class="fas fa-minus"></i>
                            </button>
                            <button class="btn btn-outline-secondary" onclick="updateCartQuantity('${item.productId}', 1)">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="removeFromCart('${item.productId}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    totalPriceElement.textContent = total.toFixed(2);
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
        return `
            <div class="d-flex justify-content-between border-bottom pb-2 mb-2">
                <div>
                    <strong>${escapeHtml(item.name)}</strong><br>
                    <small class="text-muted">${item.quantity} x $${item.price}</small>
                </div>
                <strong class="text-success">$${itemTotal.toFixed(2)}</strong>
            </div>
        `;
    }).join('');
    
    checkoutTotal.textContent = total.toFixed(2);
    
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
    
    if (!customerName) {
        showAlert('Harap isi nama customer', 'warning');
        return;
    }
    
    // Discord ID is optional, no validation needed
    
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const orderData = {
        customerName: escapeHtml(customerName),
        discordId: escapeHtml(discordId),
        additionalInfo: escapeHtml(additionalInfo),
        items: cart,
        totalPrice: totalPrice
    };
    
    console.log('🛒 Processing checkout:', orderData);
    
    try {
        showAlert('Memproses pesanan...', 'info');
        
        const result = await apiFetch('/api/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
        
        console.log('✅ Checkout response:', result);
        
        if (result.success) {
            showAlert('✅ Pesanan berhasil dibuat! Notifikasi telah dikirim ke Discord.', 'success', 8000);
            cart = [];
            updateCartDisplay();
            const modal = bootstrap.Modal.getInstance(document.getElementById('checkoutModal'));
            modal.hide();
            
            // Refresh orders if in admin mode
            if (isAdminLoggedIn) {
                loadAdminOrders();
                loadStats();
            }
        } else {
            throw new Error(result.error || 'Gagal membuat pesanan');
        }
    } catch (error) {
        console.error('❌ Checkout error:', error);
        showAlert('❌ Gagal membuat pesanan: ' + error.message, 'danger');
    }
}

// Admin Functions
async function adminLogin() {
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;
    
    if (!username || !password) {
        showAlert('Harap isi username dan password', 'warning');
        return;
    }
    
    console.log('🔐 Attempting admin login:', { username, password });
    
    try {
        showAlert('Sedang login...', 'info');
        
        const result = await apiFetch('/api/admin/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        console.log('📨 Login response:', result);
        
        if (result.success) {
            isAdminLoggedIn = true;
            document.getElementById('admin-login').classList.add('d-none');
            document.getElementById('admin-dashboard').classList.remove('d-none');
            loadAdminProducts();
            loadAdminOrders();
            loadStats();
            updateLogoutButton();
            showAlert('✅ Login admin berhasil!', 'success');
        } else {
            throw new Error(result.error || 'Login gagal');
        }
    } catch (error) {
        console.error('❌ Admin login error:', error);
        showAlert('❌ Login gagal: ' + error.message, 'danger');
    }
}

function adminLogout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        isAdminLoggedIn = false;
        document.getElementById('admin-login').classList.remove('d-none');
        document.getElementById('admin-dashboard').classList.add('d-none');
        updateLogoutButton();
        showAlert('Anda telah logout', 'info');
    }
}

async function loadAdminProducts() {
    try {
        console.log('🔄 Loading admin products...');
        const result = await apiFetch('/api/products');
        
        if (result.success) {
            displayAdminProducts(result.data);
        } else {
            throw new Error(result.error || 'Gagal memuat produk');
        }
    } catch (error) {
        console.error('❌ Error loading admin products:', error);
        showAlert('Gagal memuat data produk: ' + error.message, 'danger');
    }
}

function displayAdminProducts(productsList) {
    const container = document.getElementById('admin-products-list');
    
    if (!productsList || productsList.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-boxes fa-3x text-muted mb-3"></i>
                <p class="text-muted">Belum ada produk</p>
                <button class="btn btn-primary" onclick="showAddProductModal()">
                    <i class="fas fa-plus"></i> Tambah Produk Pertama
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = productsList.map(product => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <h6 class="mb-1">${escapeHtml(product.name)}</h6>
                        <span class="badge bg-primary">${escapeHtml(product.category)}</span>
                        <p class="mb-1 text-muted small">${escapeHtml(product.description || 'Tidak ada deskripsi')}</p>
                        <div class="d-flex gap-3">
                            <span class="text-success fw-bold">$${product.price}</span>
                            <span class="text-muted">Stok: ${product.stock}</span>
                        </div>
                    </div>
                    <div class="col-md-4 text-end">
                        <div class="btn-group">
                            <button class="btn btn-sm btn-warning" onclick="editProduct('${product._id}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteProduct('${product._id}')">
                                <i class="fas fa-trash"></i> Hapus
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function showAddProductModal() {
    editingProductId = null;
    document.getElementById('productModalTitle').innerHTML = '<i class="fas fa-plus"></i> Tambah Produk Baru';
    document.getElementById('productModalButton').innerHTML = '<i class="fas fa-save"></i> Simpan';
    document.getElementById('productModalButton').onclick = saveProduct;
    
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
    if (!product) {
        showAlert('Produk tidak ditemukan', 'danger');
        return;
    }
    
    editingProductId = productId;
    document.getElementById('productModalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Produk';
    document.getElementById('productModalButton').innerHTML = '<i class="fas fa-save"></i> Update';
    document.getElementById('productModalButton').onclick = saveProduct;
    
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
    
    if (!name) {
        showAlert('Harap isi nama produk', 'warning');
        return;
    }
    
    if (!category) {
        showAlert('Harap pilih kategori', 'warning');
        return;
    }
    
    if (isNaN(price) || price < 0) {
        showAlert('Harap isi harga yang valid', 'warning');
        return;
    }
    
    if (isNaN(stock) || stock < 0) {
        showAlert('Harap isi stok yang valid', 'warning');
        return;
    }
    
    const productData = { 
        name: escapeHtml(name), 
        category, 
        price, 
        stock, 
        description: escapeHtml(description) 
    };
    
    console.log('💾 Saving product:', productData);
    
    try {
        const url = editingProductId ? 
            `/api/products/${editingProductId}` : 
            '/api/products';
            
        const method = editingProductId ? 'PUT' : 'POST';
        
        const result = await apiFetch(url, {
            method: method,
            body: JSON.stringify(productData)
        });
        
        console.log('✅ Save product response:', result);
        
        if (result.success) {
            showAlert(editingProductId ? '✅ Produk berhasil diupdate!' : '✅ Produk berhasil ditambahkan!', 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
            modal.hide();
            
            // Refresh data
            loadProducts();
            loadAdminProducts();
            loadStats();
        } else {
            throw new Error(result.error || 'Gagal menyimpan produk');
        }
    } catch (error) {
        console.error('❌ Save product error:', error);
        showAlert('❌ Gagal menyimpan produk: ' + error.message, 'danger');
    }
}

async function deleteProduct(productId) {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
        return;
    }
    
    try {
        const result = await apiFetch(`/api/products/${productId}`, {
            method: 'DELETE'
        });
        
        if (result.success) {
            showAlert('✅ Produk berhasil dihapus!', 'success');
            loadProducts();
            loadAdminProducts();
            loadStats();
        } else {
            throw new Error(result.error || 'Gagal menghapus produk');
        }
    } catch (error) {
        console.error('❌ Delete product error:', error);
        showAlert('❌ Gagal menghapus produk: ' + error.message, 'danger');
    }
}

async function loadAdminOrders() {
    try {
        console.log('🔄 Loading admin orders...');
        const result = await apiFetch('/api/orders');
        
        if (result.success) {
            displayAdminOrders(result.data);
        } else {
            throw new Error(result.error || 'Gagal memuat pesanan');
        }
    } catch (error) {
        console.error('❌ Error loading admin orders:', error);
        showAlert('Gagal memuat data pesanan: ' + error.message, 'danger');
    }
}

function displayAdminOrders(orders) {
    const container = document.getElementById('admin-orders-list');
    
    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-receipt fa-3x text-muted mb-3"></i>
                <p class="text-muted">Belum ada pesanan</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-8">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="mb-0">Order #${order._id ? order._id.slice(-8) : 'N/A'}</h6>
                            <span class="badge ${getStatusBadgeClass(order.status)}">${order.status}</span>
                        </div>
                        <p class="mb-1"><strong>Customer:</strong> ${escapeHtml(order.customerName)}</p>
                        <p class="mb-1"><strong>Discord:</strong> ${order.discordId ? escapeHtml(order.discordId) : 'Tidak ada'}</p>
                        <p class="mb-1"><strong>Total:</strong> $${order.totalPrice}</p>
                        <p class="mb-2"><strong>Tanggal:</strong> ${new Date(order.createdAt).toLocaleString('id-ID')}</p>
                        
                        ${order.additionalInfo ? `
                            <p class="mb-2"><strong>Info Tambahan:</strong> ${escapeHtml(order.additionalInfo)}</p>
                        ` : ''}
                        
                        <div class="mt-2">
                            <strong>Items:</strong>
                            <ul class="mb-0">
                                ${order.items.map(item => `
                                    <li>${escapeHtml(item.name)} - ${item.quantity} x $${item.price}</li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label"><strong>Update Status:</strong></label>
                        <select class="form-select" onchange="updateOrderStatus('${order._id}', this.value)">
                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
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
        console.log('📝 Updating order status:', { orderId, status });
        
        const result = await apiFetch(`/api/orders/${orderId}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        
        if (result.success) {
            showAlert('✅ Status pesanan berhasil diupdate!', 'success');
            loadAdminOrders();
            loadStats();
        } else {
            throw new Error(result.error || 'Gagal update status');
        }
    } catch (error) {
        console.error('❌ Update order status error:', error);
        showAlert('❌ Gagal update status: ' + error.message, 'danger');
    }
}

// Statistics
async function loadStats() {
    try {
        console.log('📊 Loading statistics...');
        
        // Load products count
        const productsResult = await apiFetch('/api/products');
        const totalProducts = productsResult.success ? productsResult.data.length : 0;
        document.getElementById('stats-total-products').textContent = totalProducts;
        
        // Load orders count
        const ordersResult = await apiFetch('/api/orders');
        if (ordersResult.success) {
            const totalOrders = ordersResult.data.length;
            const pendingOrders = ordersResult.data.filter(order => order.status === 'pending').length;
            
            document.getElementById('stats-total-orders').textContent = totalOrders;
            document.getElementById('stats-pending-orders').textContent = pendingOrders;
        } else {
            document.getElementById('stats-total-orders').textContent = '0';
            document.getElementById('stats-pending-orders').textContent = '0';
        }
        
    } catch (error) {
        console.error('❌ Error loading statistics:', error);
        document.getElementById('stats-total-products').textContent = '0';
        document.getElementById('stats-total-orders').textContent = '0';
        document.getElementById('stats-pending-orders').textContent = '0';
    }
}

// Utility Functions
function showAlert(message, type, duration = 5000) {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
    
    // Auto remove after duration
    if (duration > 0) {
        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.remove();
            }
        }, duration);
    }
}

function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
