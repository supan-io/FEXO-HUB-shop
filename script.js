// FEXO HUB - Main Script
// State Management
let state = {
    topics: [],
    products: [],
    cart: [],
    user: null,
    isAdmin: false,
    currentCategory: null,
    music: [],
    currentTrack: 0,
    isPlaying: false,
    selectedSponsor: null
};

// ============ STORAGE ============
const Storage = {
    get: (key) => {
        try { return JSON.parse(localStorage.getItem(key)); }
        catch { return null; }
    },
    set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
    remove: (key) => localStorage.removeItem(key)
};

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    loadData();
    renderAll();
    setupAuth();
    loadMusic();
    
    setTimeout(() => {
        document.getElementById('loader').classList.add('hidden');
    }, 1200);

    // Check for admin session
    const adminSession = sessionStorage.getItem('fexo_admin_session');
    if (adminSession === 'true') {
        state.isAdmin = true;
        document.getElementById('adminBtn').style.display = 'inline-block';
    }
});

function initParticles() {
    const container = document.getElementById('particles');
    const count = window.innerWidth < 600 ? 15 : 30;
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDuration = (Math.random() * 10 + 8) + 's';
        p.style.animationDelay = Math.random() * 5 + 's';
        p.style.background = Math.random() > 0.5 ? '#00f0ff' : '#ff00e5';
        container.appendChild(p);
    }
}

function loadData() {
    state.topics = Storage.get(CONFIG.STORAGE_KEYS.TOPICS) || DEFAULT_TOPICS;
    state.products = Storage.get(CONFIG.STORAGE_KEYS.PRODUCTS) || [];
    state.cart = Storage.get(CONFIG.STORAGE_KEYS.CART) || [];
    state.music = Storage.get(CONFIG.STORAGE_KEYS.MUSIC) || [];
    state.user = Storage.get(CONFIG.STORAGE_KEYS.USER);
    
    if (!Storage.get(CONFIG.STORAGE_KEYS.TOPICS)) {
        Storage.set(CONFIG.STORAGE_KEYS.TOPICS, state.topics);
    }
}

function saveTopics() { Storage.set(CONFIG.STORAGE_KEYS.TOPICS, state.topics); }
function saveProducts() { Storage.set(CONFIG.STORAGE_KEYS.PRODUCTS, state.products); }
function saveCart() { Storage.set(CONFIG.STORAGE_KEYS.CART, state.cart); }
function saveMusic() { Storage.set(CONFIG.STORAGE_KEYS.MUSIC, state.music); }

// ============ AUTH ============
function setupAuth() {
    if (state.user) {
        showUser(state.user);
    }
    
    // Initialize Google Sign-In if client ID is set
    if (CONFIG.GOOGLE_CLIENT_ID && !CONFIG.GOOGLE_CLIENT_ID.includes('YOUR_')) {
        if (window.google) {
            google.accounts.id.initialize({
                client_id: CONFIG.GOOGLE_CLIENT_ID,
                callback: handleGoogleResponse
            });
            google.accounts.id.renderButton(
                document.getElementById('googleButton'),
                { theme: 'filled_black', size: 'large', width: 300 }
            );
        }
    } else {
        document.getElementById('googleButton').innerHTML = 
            '<p style="color:#ff00e5;padding:15px;border:1px solid #ff00e5;border-radius:10px;text-align:center;">⚙️ Google Client ID not configured.<br><small>Add your Client ID in config.js</small></p>';
    }
}

function handleAuth() {
    if (state.user) return;
    openModal('googleModal');
}

function handleGoogleResponse(response) {
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    state.user = {
        name: payload.name,
        email: payload.email,
        picture: payload.picture
    };
    Storage.set(CONFIG.STORAGE_KEYS.USER, state.user);
    showUser(state.user);
    closeModal('googleModal');
    showToast('Welcome, ' + payload.name + '!');
}

function showUser(user) {
    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('userInfo').style.display = 'flex';
    document.getElementById('userAvatar').src = user.picture;
    document.getElementById('userName').textContent = user.name.split(' ')[0];
}

function logout() {
    state.user = null;
    Storage.remove(CONFIG.STORAGE_KEYS.USER);
    document.getElementById('loginBtn').style.display = 'inline-block';
    document.getElementById('userInfo').style.display = 'none';
    if (window.google) google.accounts.id.disableAutoSelect();
    showToast('Logged out');
}

function requireAuth() {
    if (!state.user) {
        openModal('googleModal');
        return false;
    }
    return true;
}

// ============ ADMIN ============
function openAdminPanel() {
    if (!state.isAdmin) {
        const pass = prompt('Enter admin password:');
        const storedPass = Storage.get(CONFIG.STORAGE_KEYS.ADMIN_PASS) || CONFIG.DEFAULT_ADMIN_PASSWORD;
        if (pass === storedPass) {
            state.isAdmin = true;
            sessionStorage.setItem('fexo_admin_session', 'true');
            document.getElementById('adminBtn').style.display = 'inline-block';
        } else {
            showToast('Wrong password!');
            return;
        }
    }
    document.getElementById('adminPanel').classList.add('active');
    renderAdmin();
}

function closeAdminPanel() {
    document.getElementById('adminPanel').classList.remove('active');
}

function switchAdminTab(tab, e) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
    e.target.classList.add('active');
    document.getElementById('tab-' + tab).classList.add('active');
}

function saveAdminPassword() {
    const pass = document.getElementById('adminPassword').value;
    if (!pass) return showToast('Password required');
    Storage.set(CONFIG.STORAGE_KEYS.ADMIN_PASS, pass);
    showToast('Password updated!');
}

// ============ RENDER ============
function renderAll() {
    renderCategories();
    renderCart();
    renderAdmin();
    updateCartCount();
}

function renderCategories() {
    const tabs = document.getElementById('categoryTabs');
    const pages = document.getElementById('categoryPages');
    
    if (state.topics.length === 0) {
        tabs.innerHTML = '<p style="color:#a0a0c0;">No topics yet. Admin can add topics.</p>';
        pages.innerHTML = '';
        return;
    }

    if (!state.currentCategory) state.currentCategory = state.topics[0].id;

    tabs.innerHTML = state.topics.map(t => `
        <button class="cat-tab ${state.currentCategory === t.id ? 'active' : ''}" onclick="selectCategory('${t.id}')">
            ${t.emoji || ''} ${t.name}
        </button>
    `).join('');

    pages.innerHTML = state.topics.map(t => {
        const prods = state.products.filter(p => p.topicId === t.id);
        return `
            <div class="category-page ${state.currentCategory === t.id ? 'active' : ''}" id="page-${t.id}">
                <h3 class="page-title">${t.emoji || ''} ${t.name} (${prods.length})</h3>
                <div class="products-grid">
                    ${prods.length === 0 ? '<p style="color:#a0a0c0;">No products yet.</p>' : prods.map(p => renderProductCard(p)).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function renderProductCard(p) {
    const img = p.images && p.images[0] ? p.images[0] : 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="280" height="220" fill="#0a0a20"><rect width="280" height="220" fill="#0a0a20"/><text x="50%" y="50%" fill="#00f0ff" text-anchor="middle" font-family="sans-serif" font-size="14">No Image</text></svg>');
    
    return `
        <div class="product-card" onclick="viewProduct('${p.id}')">
            <div class="product-img-wrap">
                <img class="product-img" src="${img}" alt="${p.name}" loading="lazy">
                ${p.discount ? `<div class="discount-badge">${p.discount}</div>` : ''}
            </div>
            <div class="product-info">
                <div class="product-name">${p.name}</div>
                <div class="product-price">${CONFIG.CURRENCY_SYMBOL}${parseFloat(p.price).toFixed(2)}</div>
            </div>
        </div>
    `;
}

function selectCategory(id) {
    state.currentCategory = id;
    renderCategories();
}

// ============ PRODUCTS ============
function viewProduct(id) {
    const p = state.products.find(x => x.id === id);
    if (!p) return;
    
    const images = p.images || [];
    document.getElementById('productDetail').innerHTML = `
        <div class="product-detail-grid">
            <div class="detail-gallery">
                <img id="mainDetailImg" src="${images[0] || ''}" alt="${p.name}">
                ${images.length > 1 ? `<div class="detail-thumbs">
                    ${images.map((img, i) => `<img src="${img}" class="${i===0?'active':''}" onclick="setDetailImg('${img}', this)">`).join('')}
                </div>` : ''}
            </div>
            <div class="detail-info">
                <h2>${p.name}</h2>
                ${p.discount ? `<span class="discount-badge" style="position:static;display:inline-block;margin-bottom:10px;">${p.discount}</span>` : ''}
                <div class="detail-price">${CONFIG.CURRENCY_SYMBOL}${parseFloat(p.price).toFixed(2)}</div>
                <p class="detail-desc">${p.description || 'No description available.'}</p>
                <button class="btn-primary full" onclick="addToCart('${p.id}')">🛒 Add to Cart</button>
            </div>
        </div>
    `;
    openModal('productModal');
}

function setDetailImg(src, el) {
    document.getElementById('mainDetailImg').src = src;
    document.querySelectorAll('.detail-thumbs img').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
}

function searchProducts(query) {
    if (!query.trim()) {
        renderCategories();
        return;
    }
    const q = query.toLowerCase();
    const results = state.products.filter(p => p.name.toLowerCase().includes(q));
    
    const tabs = document.getElementById('categoryTabs');
    const pages = document.getElementById('categoryPages');
    tabs.innerHTML = '';
    pages.innerHTML = `
        <div class="category-page active">
            <h3 class="page-title">🔍 Search Results (${results.length})</h3>
            <div class="products-grid">
                ${results.length === 0 ? '<p style="color:#a0a0c0;">No products found.</p>' : results.map(p => renderProductCard(p)).join('')}
            </div>
        </div>
    `;
}

// ============ CART ============
function addToCart(id) {
    if (!requireAuth()) return;
    const existing = state.cart.find(c => c.id === id);
    if (existing) {
        existing.qty++;
    } else {
        const p = state.products.find(x => x.id === id);
        state.cart.push({ ...p, qty: 1 });
    }
    saveCart();
    renderCart();
    updateCartCount();
    showToast('Added to cart!');
    closeModal('productModal');
}

function renderCart() {
    const el = document.getElementById('cartItems');
    if (state.cart.length === 0) {
        el.innerHTML = '<p style="color:#a0a0c0;text-align:center;padding:30px;">Your cart is empty.</p>';
        document.getElementById('cartTotal').textContent = '';
        return;
    }
    let total = 0;
    el.innerHTML = state.cart.map((c, i) => {
        total += c.price * c.qty;
        return `
            <div class="cart-item">
                <img src="${c.images && c.images[0] ? c.images[0] : ''}" alt="${c.name}">
                <div class="cart-item-info">
                    <h4>${c.name}</h4>
                    <p>${CONFIG.CURRENCY_SYMBOL}${parseFloat(c.price).toFixed(2)} × ${c.qty}</p>
                </div>
                <button onclick="removeFromCart(${i})">Remove</button>
            </div>
        `;
    }).join('');
    document.getElementById('cartTotal').textContent = `Total: ${CONFIG.CURRENCY_SYMBOL}${total.toFixed(2)}`;
}

function removeFromCart(i) {
    state.cart.splice(i, 1);
    saveCart();
    renderCart();
    updateCartCount();
}

function updateCartCount() {
    document.getElementById('cartCount').textContent = state.cart.reduce((s, c) => s + c.qty, 0);
}

function openCart() { openModal('cartModal'); }

function checkout() {
    if (!state.user) {
        closeModal('cartModal');
        openModal('googleModal');
        return;
    }
    if (state.cart.length === 0) return showToast('Cart is empty');
    showToast('Order placed! (Demo)');
    state.cart = [];
    saveCart();
    renderCart();
    updateCartCount();
    closeModal('cartModal');
}

// ============ SPONSOR ============
function openSponsor() { openModal('sponsorModal'); }

function selectTier(name, price) {
    state.selectedSponsor = { name, price };
    showToast(`Selected ${name} tier - $${price}/mo`);
}

function submitSponsor() {
    if (!state.selectedSponsor) return showToast('Please select a tier');
    if (!requireAuth()) return;
    showToast(`Sponsor request sent! We'll contact you soon.`);
    state.selectedSponsor = null;
    closeModal('sponsorModal');
}

// ============ ADMIN ACTIONS ============
function addTopic() {
    const name = document.getElementById('newTopicName').value.trim();
    const emoji = document.getElementById('newTopicEmoji').value.trim();
    if (!name) return showToast('Enter topic name');
    const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    state.topics.push({ id, name, emoji: emoji || '📦' });
    saveTopics();
    document.getElementById('newTopicName').value = '';
    document.getElementById('newTopicEmoji').value = '';
    renderCategories();
    renderAdmin();
    showToast('Topic added!');
}

function deleteTopic(id) {
    if (!confirm('Delete this topic and all its products?')) return;
    state.topics = state.topics.filter(t => t.id !== id);
    state.products = state.products.filter(p => p.topicId !== id);
    saveTopics();
    saveProducts();
    renderCategories();
    renderAdmin();
    showToast('Topic deleted');
}

function addProduct() {
    const topicId = document.getElementById('productTopicSelect').value;
    const name = document.getElementById('newProductName').value.trim();
    const price = document.getElementById('newProductPrice').value;
    const desc = document.getElementById('newProductDesc').value.trim();
    const discount = document.getElementById('newProductDiscount').value.trim();
    const files = document.getElementById('newProductImages').files;
    
    if (!topicId || !name || !price) return showToast('Fill topic, name, price');
    
    const images = [];
    let processed = 0;
    
    const finish = () => {
        const product = {
            id: 'p-' + Date.now(),
            topicId, name,
            price: parseFloat(price),
            description: desc,
            discount,
            images,
            createdAt: Date.now()
        };
        state.products.push(product);
        saveProducts();
        renderCategories();
        renderAdmin();
        document.getElementById('newProductName').value = '';
        document.getElementById('newProductPrice').value = '';
        document.getElementById('newProductDesc').value = '';
        document.getElementById('newProductDiscount').value = '';
        document.getElementById('newProductImages').value = '';
        showToast('Product added!');
    };

    if (files.length === 0) return finish();
    
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            images.push(e.target.result);
            processed++;
            if (processed === files.length) finish();
        };
        reader.readAsDataURL(file);
    });
}

function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    state.products = state.products.filter(p => p.id !== id);
    saveProducts();
    renderCategories();
    renderAdmin();
    showToast('Product deleted');
}

function renderAdmin() {
    // Topics
    const tList = document.getElementById('adminTopicsList');
    if (tList) {
        tList.innerHTML = state.topics.map(t => `
            <div class="admin-item">
                <div class="admin-item-info">
                    <h4>${t.emoji || ''} ${t.name}</h4>
                    <p>ID: ${t.id}</p>
                </div>
                <div class="admin-item-actions">
                    <button onclick="deleteTopic('${t.id}')">Delete</button>
                </div>
            </div>
        `).join('') || '<p style="color:#a0a0c0;">No topics yet.</p>';
    }
    
    // Topic select
    const sel = document.getElementById('productTopicSelect');
    if (sel) {
        sel.innerHTML = state.topics.map(t => `<option value="${t.id}">${t.emoji || ''} ${t.name}</option>`).join('');
    }
    
    // Products
    const pList = document.getElementById('adminProductsList');
    if (pList) {
        pList.innerHTML = state.products.map(p => `
            <div class="admin-item">
                ${p.images && p.images[0] ? `<img src="${p.images[0]}">` : ''}
                <div class="admin-item-info">
                    <h4>${p.name}</h4>
                    <p>${CONFIG.CURRENCY_SYMBOL}${p.price} • ${p.discount || 'No discount'} • ${p.images ? p.images.length : 0} img</p>
                </div>
                <div class="admin-item-actions">
                    <button onclick="deleteProduct('${p.id}')">Delete</button>
                </div>
            </div>
        `).join('') || '<p style="color:#a0a0c0;">No products yet.</p>';
    }
    
    // Music
    const mList = document.getElementById('adminMusicList');
    if (mList) {
        mList.innerHTML = state.music.map((m, i) => `
            <div class="admin-item">
                <div class="admin-item-info">
                    <h4>🎵 ${m.name}</h4>
                    <p>${m.url.substring(0, 40)}...</p>
                </div>
                <div class="admin-item-actions">
                    <button onclick="deleteMusic(${i})">Delete</button>
                </div>
            </div>
        `).join('') || '<p style="color:#a0a0c0;">No music tracks.</p>';
    }
}

// ============ MUSIC ============
function addMusic() {
    const name = document.getElementById('musicName').value.trim();
    const url = document.getElementById('musicUrl').value.trim();
    if (!name || !url) return showToast('Enter name and URL');
    state.music.push({ name, url });
    saveMusic();
    document.getElementById('musicName').value = '';
    document.getElementById('musicUrl').value = '';
    renderAdmin();
    renderMusicPlayer();
    showToast('Music added!');
}

function deleteMusic(i) {
    state.music.splice(i, 1);
    saveMusic();
    renderAdmin();
    renderMusicPlayer();
}

function loadMusic() {
    renderMusicPlayer();
    if (state.music.length > 0) {
        document.getElementById('musicPlayer').style.display = 'flex';
    }
}

function renderMusicPlayer() {
    if (state.music.length === 0) {
        document.getElementById('musicPlayer').style.display = 'none';
        return;
    }
    document.getElementById('musicPlayer').style.display = 'flex';
    document.getElementById('musicTitle').textContent = state.music[state.currentTrack].name;
}

function toggleMusic() {
    const audio = document.getElementById('audioPlayer');
    if (state.isPlaying) {
        audio.pause();
        state.isPlaying = false;
        document.querySelector('.music-toggle').textContent = '🎵';
    } else {
        if (state.music.length === 0) return;
        audio.src = state.music[state.currentTrack].url;
        audio.play().catch(() => showToast('Cannot play audio'));
        state.isPlaying = true;
        document.querySelector('.music-toggle').textContent = '⏸';
    }
}

function nextTrack() {
    if (state.music.length === 0) return;
    state.currentTrack = (state.currentTrack + 1) % state.music.length;
    documen
