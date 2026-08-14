// ===== ADI STORE - TOKO BEKAS PREMIUM =====
// All-in-one PWA JavaScript

(function() {
    'use strict';

    // ===== DEFAULT CONFIG =====
    const DEFAULT_CONFIG = {
        storeName: 'Adi Store',
        tagline: 'Barang bekas berkualitas',
        waNumber: '',
        password: 'admin123',
        logo: ''
    };

    const CATEGORY_EMOJIS = {
        elektronik: '📱',
        fashion: '👕',
        furniture: '🪑',
        buku: '📚',
        olahraga: '⚽',
        lainnya: '📦'
    };

    const CONDITION_COLORS = {
        'seperti baru': '#00b894',
        'sangat baik': '#0984e3',
        'baik': '#6c5ce7',
        'cukup': '#fdcb6e'
    };

    // ===== STATE =====
    let state = {
        config: {},
        products: [],
        cart: [],
        isAdmin: false,
        currentFilter: 'semua',
        currentSort: 'terbaru',
        searchQuery: '',
        currentProduct: null
    };

    // ===== STORAGE =====
    function loadData() {
        try {
            const config = JSON.parse(localStorage.getItem('adi_config'));
            const products = JSON.parse(localStorage.getItem('adi_products'));
            const cart = JSON.parse(localStorage.getItem('adi_cart'));
            state.config = config || { ...DEFAULT_CONFIG };
            state.products = products || [];
            state.cart = cart || [];
        } catch (e) {
            state.config = { ...DEFAULT_CONFIG };
            state.products = [];
            state.cart = [];
        }
    }

    function saveConfig() {
        localStorage.setItem('adi_config', JSON.stringify(state.config));
    }

    function saveProducts() {
        localStorage.setItem('adi_products', JSON.stringify(state.products));
    }

    function saveCart() {
        localStorage.setItem('adi_cart', JSON.stringify(state.cart));
    }

    // ===== UTILITY =====
    function formatPrice(num) {
        return 'Rp ' + Number(num).toLocaleString('id-ID');
    }

    function formatDate(ts) {
        const d = new Date(ts);
        const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
        return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    function showToast(msg) {
        const toast = document.getElementById('toast');
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    }

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // ===== RENDER HEADER =====
    function renderHeader() {
        const c = state.config;
        document.getElementById('storeName').textContent = c.storeName || DEFAULT_CONFIG.storeName;
        document.getElementById('storeTagline').textContent = c.tagline || DEFAULT_CONFIG.tagline;
        document.title = (c.storeName || DEFAULT_CONFIG.storeName) + ' - Toko Bekas Premium';

        const logoImg = document.getElementById('logoImg');
        const logoEmoji = document.getElementById('logoEmoji');
        if (c.logo) {
            logoImg.src = c.logo;
            logoImg.style.display = 'block';
            logoEmoji.style.display = 'none';
        } else {
            logoImg.style.display = 'none';
            logoEmoji.style.display = 'inline';
        }
    }

    // ===== RENDER STATS =====
    function renderStats() {
        const products = getFilteredProducts();
        document.getElementById('totalItems').textContent = state.products.length;

        const cats = [...new Set(state.products.map(p => p.category))];
        document.getElementById('totalCategories').textContent = cats.length;

        if (state.products.length > 0) {
            const minPrice = Math.min(...state.products.map(p => p.price));
            document.getElementById('priceRange').textContent = formatPrice(minPrice);
        } else {
            document.getElementById('priceRange').textContent = '-';
        }
    }

    // ===== FILTER & SORT =====
    function getFilteredProducts() {
        let filtered = [...state.products];

        // Category filter
        if (state.currentFilter !== 'semua') {
            filtered = filtered.filter(p => p.category === state.currentFilter);
        }

        // Search
        if (state.searchQuery) {
            const q = state.searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q)
            );
        }

        // Sort
        switch (state.currentSort) {
            case 'termurah':
                filtered.sort((a, b) => a.price - b.price);
                break;
            case 'termahal':
                filtered.sort((a, b) => b.price - a.price);
                break;
            case 'nama':
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'terbaru':
            default:
                filtered.sort((a, b) => b.createdAt - a.createdAt);
                break;
        }

        return filtered;
    }

    // ===== RENDER PRODUCTS =====
    function renderProducts() {
        const grid = document.getElementById('productGrid');
        const empty = document.getElementById('emptyState');
        const filtered = getFilteredProducts();

        if (filtered.length === 0) {
            grid.innerHTML = '';
            empty.style.display = 'block';
            if (state.products.length > 0 && (state.currentFilter !== 'semua' || state.searchQuery)) {
                empty.querySelector('h3').textContent = 'Tidak ditemukan';
                empty.querySelector('p').textContent = 'Coba kategori lain atau kata kunci berbeda';
            } else {
                empty.querySelector('h3').textContent = 'Belum ada barang';
                empty.querySelector('p').textContent = 'Klik ⚙️ untuk login admin dan tambah barang pertama Anda!';
            }
            return;
        }

        empty.style.display = 'none';
        grid.innerHTML = filtered.map((p, i) => `
            <div class="product-card" data-id="${p.id}" style="animation-delay: ${i * 0.05}s">
                <div class="product-image">
                    ${p.image ? `<img src="${p.image}" alt="${p.name}">` : CATEGORY_EMOJIS[p.category] || '📦'}
                    <span class="product-badge">${p.condition}</span>
                </div>
                <div class="product-info">
                    <div class="product-name">${escapeHtml(p.name)}</div>
                    <div class="product-price">${formatPrice(p.price)}</div>
                    <div class="product-meta">
                        <span class="product-condition" style="background:${CONDITION_COLORS[p.condition]}22; color:${CONDITION_COLORS[p.condition]}">${p.condition}</span>
                        <span class="product-category-tag">${CATEGORY_EMOJIS[p.category] || ''} ${p.category}</span>
                    </div>
                </div>
            </div>
        `).join('');

        // Click handlers
        grid.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.id;
                const product = state.products.find(p => p.id === id);
                if (product) openProductDetail(product);
            });
        });
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ===== PRODUCT DETAIL MODAL =====
    function openProductDetail(product) {
        state.currentProduct = product;
        const modal = document.getElementById('modalDetail');
        const overlay = document.getElementById('modalOverlay');

        document.getElementById('modalImage').innerHTML = product.image
            ? `<img src="${product.image}" alt="${product.name}">`
            : (CATEGORY_EMOJIS[product.category] || '📦');

        document.getElementById('modalName').textContent = product.name;
        document.getElementById('modalPrice').textContent = formatPrice(product.price);
        document.getElementById('modalCondition').textContent = product.condition;
        document.getElementById('modalCategory').textContent = (CATEGORY_EMOJIS[product.category] || '') + ' ' + product.category;
        document.getElementById('modalDesc').textContent = product.description || 'Tidak ada deskripsi';
        document.getElementById('modalDate').textContent = '📅 Ditambahkan: ' + formatDate(product.createdAt);

        overlay.style.display = 'block';
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    function closeProductDetail() {
        document.getElementById('modalDetail').style.display = 'none';
        document.getElementById('modalOverlay').style.display = 'none';
        document.body.style.overflow = '';
        state.currentProduct = null;
    }

    // ===== CART =====
    function renderCartBadge() {
        const total = state.cart.reduce((sum, item) => sum + item.qty, 0);
        document.getElementById('cartBadge').textContent = total;
    }

    function addToCart(product) {
        const existing = state.cart.find(item => item.id === product.id);
        if (existing) {
            existing.qty++;
        } else {
            state.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                category: product.category,
                qty: 1
            });
        }
        saveCart();
        renderCartBadge();
        showToast('✅ Ditambah ke keranjang!');
    }

    function renderCart() {
        const container = document.getElementById('cartItems');
        if (state.cart.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#b2bec3;"><span style="font-size:48px;display:block;margin-bottom:12px;">🛒</span>Keranjang kosong</div>';
            document.getElementById('cartTotal').textContent = 'Rp 0';
            return;
        }

        container.innerHTML = state.cart.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-img">
                    ${item.image ? `<img src="${item.image}" alt="">` : (CATEGORY_EMOJIS[item.category] || '📦')}
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${escapeHtml(item.name)}</div>
                    <div class="cart-item-price">${formatPrice(item.price)}</div>
                </div>
                <div class="cart-item-qty">
                    <button class="qty-btn" data-action="minus" data-id="${item.id}">−</button>
                    <span class="qty-num">${item.qty}</span>
                    <button class="qty-btn" data-action="plus" data-id="${item.id}">+</button>
                </div>
                <button class="btn-remove-item" data-id="${item.id}">🗑️</button>
            </div>
        `).join('');

        const total = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        document.getElementById('cartTotal').textContent = formatPrice(total);

        // Qty handlers
        container.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const action = btn.dataset.action;
                const item = state.cart.find(i => i.id === id);
                if (!item) return;
                if (action === 'plus') item.qty++;
                else if (action === 'minus' && item.qty > 1) item.qty--;
                else if (action === 'minus' && item.qty <= 1) {
                    state.cart = state.cart.filter(i => i.id !== id);
                }
                saveCart();
                renderCart();
                renderCartBadge();
            });
        });

        // Remove handlers
        container.querySelectorAll('.btn-remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                state.cart = state.cart.filter(i => i.id !== btn.dataset.id);
                saveCart();
                renderCart();
                renderCartBadge();
                showToast('🗑️ Dihapus dari keranjang');
            });
        });
    }

    function openCart() {
        renderCart();
        document.getElementById('cartOverlay').style.display = 'block';
        document.getElementById('cartSidebar').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeCart() {
        document.getElementById('cartOverlay').style.display = 'none';
        document.getElementById('cartSidebar').style.display = 'none';
        document.body.style.overflow = '';
    }

    function checkoutWA() {
        if (state.cart.length === 0) {
            showToast('🛒 Keranjang masih kosong!');
            return;
        }

        const wa = state.config.waNumber;
        if (!wa) {
            showToast('⚠️ Nomor WA belum diatur! Klik ⚙️ → Pengaturan');
            return;
        }

        let msg = `🛒 *PESANAN BARU - ${state.config.storeName || 'Adi Store'}*\n`;
        msg += `━━━━━━━━━━━━━━━━━━\n\n`;

        state.cart.forEach((item, i) => {
            msg += `${i + 1}. *${item.name}*\n`;
            msg += `   ${item.qty}x @ ${formatPrice(item.price)} = ${formatPrice(item.price * item.qty)}\n\n`;
        });

        const total = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        msg += `━━━━━━━━━━━━━━━━━━\n`;
        msg += `💰 *TOTAL: ${formatPrice(total)}*\n\n`;
        msg += `Mohon konfirmasi ketersediaan. Terima kasih! 🙏`;

        const url = `https://wa.me/${wa}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    }

    function clearCart() {
        if (state.cart.length === 0) return;
        if (confirm('Kosongkan semua keranjang?')) {
            state.cart = [];
            saveCart();
            renderCart();
            renderCartBadge();
            showToast('🗑️ Keranjang dikosongkan');
        }
    }

    // ===== ADMIN =====
    function openAdmin() {
        document.getElementById('adminOverlay').style.display = 'block';
        document.getElementById('adminPanel').style.display = 'block';
        document.body.style.overflow = 'hidden';

        if (state.isAdmin) {
            document.getElementById('adminLogin').style.display = 'none';
            document.getElementById('adminContent').style.display = 'block';
            loadAdminSettings();
            renderAdminProducts();
        } else {
            document.getElementById('adminLogin').style.display = 'block';
            document.getElementById('adminContent').style.display = 'none';
        }
    }

    function closeAdmin() {
        document.getElementById('adminOverlay').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'none';
        document.body.style.overflow = '';
    }

    function adminLogin() {
        const pw = document.getElementById('adminPassword').value;
        if (pw === state.config.password) {
            state.isAdmin = true;
            document.getElementById('adminLogin').style.display = 'none';
            document.getElementById('adminContent').style.display = 'block';
            loadAdminSettings();
            renderAdminProducts();
            showToast('✅ Login berhasil!');
        } else {
            showToast('❌ Password salah!');
            document.getElementById('adminPassword').value = '';
        }
    }

    function adminLogout() {
        state.isAdmin = false;
        document.getElementById('adminLogin').style.display = 'block';
        document.getElementById('adminContent').style.display = 'none';
        document.getElementById('adminPassword').value = '';
        showToast('🚪 Logout berhasil');
    }

    function loadAdminSettings() {
        document.getElementById('settingName').value = state.config.storeName || '';
        document.getElementById('settingTagline').value = state.config.tagline || '';
        document.getElementById('settingWA').value = state.config.waNumber || '';
        document.getElementById('settingPassword').value = '';

        const preview = document.getElementById('logoPreview');
        if (state.config.logo) {
            preview.src = state.config.logo;
            preview.style.display = 'block';
        } else {
            preview.style.display = 'none';
        }
    }

    async function saveSettings() {
        const name = document.getElementById('settingName').value.trim();
        const tagline = document.getElementById('settingTagline').value.trim();
        const wa = document.getElementById('settingWA').value.trim();
        const pw = document.getElementById('settingPassword').value.trim();
        const logoFile = document.getElementById('settingLogo').files[0];

        if (name) state.config.storeName = name;
        if (tagline) state.config.tagline = tagline;
        if (wa) state.config.waNumber = wa.replace(/[^0-9]/g, '');
        if (pw) state.config.password = pw;

        if (logoFile) {
            try {
                const base64 = await fileToBase64(logoFile);
                state.config.logo = base64;
            } catch (e) {
                showToast('❌ Gagal upload logo');
                return;
            }
        }

        saveConfig();
        renderHeader();
        loadAdminSettings();
        showToast('✅ Pengaturan tersimpan!');
    }

    async function addProduct() {
        const name = document.getElementById('prodName').value.trim();
        const price = parseInt(document.getElementById('prodPrice').value);
        const category = document.getElementById('prodCategory').value;
        const condition = document.getElementById('prodCondition').value;
        const desc = document.getElementById('prodDesc').value.trim();
        const imageFile = document.getElementById('prodImage').files[0];

        if (!name) { showToast('⚠️ Nama barang harus diisi!'); return; }
        if (!price || price <= 0) { showToast('⚠️ Harga harus diisi!'); return; }

        let image = '';
        if (imageFile) {
            try {
                image = await fileToBase64(imageFile);
            } catch (e) {
                showToast('❌ Gagal upload foto');
                return;
            }
        }

        const product = {
            id: generateId(),
            name,
            price,
            category,
            condition,
            description: desc,
            image,
            createdAt: Date.now()
        };

        state.products.unshift(product);
        saveProducts();

        // Reset form
        document.getElementById('prodName').value = '';
        document.getElementById('prodPrice').value = '';
        document.getElementById('prodDesc').value = '';
        document.getElementById('prodImage').value = '';
        document.getElementById('imagePreview').style.display = 'none';

        renderProducts();
        renderStats();
        renderAdminProducts();
        showToast('✅ Barang berhasil ditambahkan!');
    }

    function renderAdminProducts() {
        const container = document.getElementById('adminProductList');
        document.getElementById('adminItemCount').textContent = state.products.length;

        if (state.products.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#b2bec3;padding:20px;">Belum ada barang</p>';
            return;
        }

        container.innerHTML = state.products.map(p => `
            <div class="admin-product-item" data-id="${p.id}">
                <div class="admin-prod-img">
                    ${p.image ? `<img src="${p.image}" alt="">` : (CATEGORY_EMOJIS[p.category] || '📦')}
                </div>
                <div class="admin-prod-info">
                    <div class="admin-prod-name">${escapeHtml(p.name)}</div>
                    <div class="admin-prod-price">${formatPrice(p.price)} · ${p.condition}</div>
                </div>
                <button class="btn-delete-prod" data-id="${p.id}">🗑️</button>
            </div>
        `).join('');

        container.querySelectorAll('.btn-delete-prod').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Hapus barang ini?')) {
                    state.products = state.products.filter(p => p.id !== btn.dataset.id);
                    state.cart = state.cart.filter(i => i.id !== btn.dataset.id);
                    saveProducts();
                    saveCart();
                    renderProducts();
                    renderStats();
                    renderAdminProducts();
                    renderCartBadge();
                    showToast('🗑️ Barang dihapus');
                }
            });
        });
    }

    function resetAllData() {
        if (confirm('⚠️ PERINGATAN!\n\nSemua data akan dihapus permanen:\n- Semua barang\n- Keranjang\n- Pengaturan toko\n\nLanjutkan?')) {
            if (confirm('Yakin 100%? Ini tidak bisa dibatalkan!')) {
                localStorage.removeItem('adi_config');
                localStorage.removeItem('adi_products');
                localStorage.removeItem('adi_cart');
                state.config = { ...DEFAULT_CONFIG };
                state.products = [];
                state.cart = [];
                state.isAdmin = false;
                renderAll();
                closeAdmin();
                showToast('🗑️ Semua data dihapus');
            }
        }
    }

    // ===== PROMO BANNER ROTATION =====
    function startPromoRotation() {
        const slides = document.querySelectorAll('.promo-slide');
        if (slides.length === 0) return;
        let current = 0;
        setInterval(() => {
            slides[current].classList.remove('active');
            current = (current + 1) % slides.length;
            slides[current].classList.add('active');
        }, 3000);
    }

    // ===== SEARCH =====
    function toggleSearch() {
        const bar = document.getElementById('searchBar');
        if (bar.style.display === 'none') {
            bar.style.display = 'flex';
            document.getElementById('searchInput').focus();
        } else {
            bar.style.display = 'none';
            document.getElementById('searchInput').value = '';
            state.searchQuery = '';
            renderProducts();
        }
    }

    // ===== IMAGE PREVIEW =====
    function setupImagePreview(inputId, previewId) {
        document.getElementById(inputId).addEventListener('change', async (e) => {
            const file = e.target.files[0];
            const preview = document.getElementById(previewId);
            if (file) {
                const base64 = await fileToBase64(file);
                preview.src = base64;
                preview.style.display = 'block';
            } else {
                preview.style.display = 'none';
            }
        });
    }

    // ===== RENDER ALL =====
    function renderAll() {
        renderHeader();
        renderStats();
        renderProducts();
        renderCartBadge();
    }

    // ===== EVENT LISTENERS =====
    function initEvents() {
        // Header buttons
        document.getElementById('btnSearch').addEventListener('click', toggleSearch);
        document.getElementById('btnCart').addEventListener('click', openCart);
        document.getElementById('btnAdmin').addEventListener('click', openAdmin);

        // Search
        document.getElementById('btnCloseSearch').addEventListener('click', toggleSearch);
        document.getElementById('searchInput').addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            renderProducts();
        });

        // Category filter
        document.querySelectorAll('.cat-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.currentFilter = btn.dataset.cat;
                renderProducts();
            });
        });

        // Sort
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            state.currentSort = e.target.value;
            renderProducts();
        });

        // Cart
        document.getElementById('btnCloseCart').addEventListener('click', closeCart);
        document.getElementById('cartOverlay').addEventListener('click', closeCart);
        document.getElementById('btnCheckout').addEventListener('click', checkoutWA);
        document.getElementById('btnClearCart').addEventListener('click', clearCart);

        // Admin
        document.getElementById('btnCloseAdmin').addEventListener('click', closeAdmin);
        document.getElementById('adminOverlay').addEventListener('click', closeAdmin);
        document.getElementById('btnLogin').addEventListener('click', adminLogin);
        document.getElementById('adminPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') adminLogin();
        });
        document.getElementById('btnSaveSettings').addEventListener('click', saveSettings);
        document.getElementById('btnAddProduct').addEventListener('click', addProduct);
        document.getElementById('btnResetAll').addEventListener('click', resetAllData);
        document.getElementById('btnLogout').addEventListener('click', adminLogout);

        // Modal
        document.getElementById('btnCloseModal').addEventListener('click', closeProductDetail);
        document.getElementById('modalOverlay').addEventListener('click', closeProductDetail);
        document.getElementById('btnAddCart').addEventListener('click', () => {
            if (state.currentProduct) {
                addToCart(state.currentProduct);
                closeProductDetail();
            }
        });
        document.getElementById('btnWADirect').addEventListener('click', () => {
            if (!state.currentProduct) return;
            const wa = state.config.waNumber;
            if (!wa) {
                showToast('⚠️ Nomor WA belum diatur!');
                return;
            }
            const p = state.currentProduct;
            const msg = `Halo, saya tertarik dengan:\n\n*${p.name}*\nHarga: ${formatPrice(p.price)}\nKondisi: ${p.condition}\n\nApakah masih tersedia?`;
            window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`, '_blank');
        });

        // Image previews
        setupImagePreview('prodImage', 'imagePreview');
        setupImagePreview('settingLogo', 'logoPreview');
    }

    // ===== SERVICE WORKER (PWA) =====
    function registerSW() {
        if ('serviceWorker' in navigator) {
            // Create SW blob
            const swCode = `
                const CACHE_NAME = 'adi-store-v2';
                const ASSETS = ['/toko-bekas/', '/toko-bekas/index.html', '/toko-bekas/style.css', '/toko-bekas/app.js'];
                self.addEventListener('install', e => {
                    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
                });
                self.addEventListener('activate', e => {
                    e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
                });
                self.addEventListener('fetch', e => {
                    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('/toko-bekas/'))));
                });
            `;
            const blob = new Blob([swCode], { type: 'application/javascript' });
            const swUrl = URL.createObjectURL(blob);

            // Note: Blob SW won't work in production, but the manifest still enables "Add to Home Screen"
            // For full offline, host sw.js separately on GitHub
        }
    }

    // ===== CREATE MANIFEST =====
    function createManifest() {
        const manifest = {
            name: state.config.storeName || 'Adi Store',
            short_name: state.config.storeName || 'Adi Store',
            description: 'Toko barang bekas berkualitas',
            start_url: './',
            display: 'standalone',
            background_color: '#f8f9fa',
            theme_color: '#6c5ce7',
            icons: [
                { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
                { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
            ]
        };
        const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.querySelector('link[rel="manifest"]');
        if (link) link.href = url;
    }

    // ===== INIT =====
    function init() {
        loadData();
        renderAll();
        initEvents();
        startPromoRotation();
        createManifest();
        registerSW();
        console.log('🏪 Adi Store initialized!');
    }

    // Start when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
