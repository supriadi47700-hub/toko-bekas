        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const base64 = await fileToBase64(file);
                    preview.src = base64;
                    preview.style.display = 'block';
                } catch (err) {
                    preview.style.display = 'none';
                }
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
        const btnSearch = document.getElementById('btnSearch');
        const btnCart = document.getElementById('btnCart');
        const btnAdmin = document.getElementById('btnAdmin');
        if (btnSearch) btnSearch.addEventListener('click', toggleSearch);
        if (btnCart) btnCart.addEventListener('click', openCart);
        if (btnAdmin) btnAdmin.addEventListener('click', openAdmin);

        // Search
        const btnCloseSearch = document.getElementById('btnCloseSearch');
        const searchInput = document.getElementById('searchInput');
        if (btnCloseSearch) btnCloseSearch.addEventListener('click', toggleSearch);
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                state.searchQuery = e.target.value;
                renderProducts();
            });
        }

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
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                state.currentSort = e.target.value;
                renderProducts();
            });
        }

        // Cart
        const btnCloseCart = document.getElementById('btnCloseCart');
        const cartOverlay = document.getElementById('cartOverlay');
        const btnCheckout = document.getElementById('btnCheckout');
        const btnClearCart = document.getElementById('btnClearCart');
        if (btnCloseCart) btnCloseCart.addEventListener('click', closeCart);
        if (cartOverlay) cartOverlay.addEventListener('click', closeCart);
        if (btnCheckout) btnCheckout.addEventListener('click', checkoutWA);
        if (btnClearCart) btnClearCart.addEventListener('click', clearCart);

        // Admin
        const btnCloseAdmin = document.getElementById('btnCloseAdmin');
        const adminOverlay = document.getElementById('adminOverlay');
        const btnLogin = document.getElementById('btnLogin');
        const adminPassword = document.getElementById('adminPassword');
        const btnSaveSettings = document.getElementById('btnSaveSettings');
        const btnAddProduct = document.getElementById('btnAddProduct');
        const btnResetAll = document.getElementById('btnResetAll');
        const btnLogout = document.getElementById('btnLogout');

        if (btnCloseAdmin) btnCloseAdmin.addEventListener('click', closeAdmin);
        if (adminOverlay) adminOverlay.addEventListener('click', closeAdmin);
        if (btnLogin) btnLogin.addEventListener('click', adminLogin);
        if (adminPassword) {
            adminPassword.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') adminLogin();
            });
        }
        if (btnSaveSettings) btnSaveSettings.addEventListener('click', saveSettings);
        if (btnAddProduct) btnAddProduct.addEventListener('click', addProduct);
        if (btnResetAll) btnResetAll.addEventListener('click', resetAllData);
        if (btnLogout) btnLogout.addEventListener('click', adminLogout);

        // Backup & Restore
        const btnExportData = document.getElementById('btnExportData');
        const btnImportData = document.getElementById('btnImportData');
        if (btnExportData) btnExportData.addEventListener('click', exportData);
        if (btnImportData) btnImportData.addEventListener('click', importData);

        // Modal
        const btnCloseModal = document.getElementById('btnCloseModal');
        const modalOverlay = document.getElementById('modalOverlay');
        const btnAddCart = document.getElementById('btnAddCart');
        const btnWADirect = document.getElementById('btnWADirect');

        if (btnCloseModal) btnCloseModal.addEventListener('click', closeProductDetail);
        if (modalOverlay) modalOverlay.addEventListener('click', closeProductDetail);
        if (btnAddCart) {
            btnAddCart.addEventListener('click', () => {
                if (state.currentProduct) {
                    addToCart(state.currentProduct);
                    closeProductDetail();
                }
            });
        }
        if (btnWADirect) {
            btnWADirect.addEventListener('click', () => {
                if (!state.currentProduct) return;
                const wa = state.config.waNumber;
                if (!wa) {
                    showToast('⚠️ Nomor WA belum diatur! Klik ⚙️ → Pengaturan');
                    return;
                }
                const p = state.currentProduct;
                const msg = 'Halo, saya tertarik dengan:\n\n*' + p.name + '*\nHarga: ' + formatPrice(p.price) + '\nKondisi: ' + p.condition + '\n\nApakah masih tersedia?';
                window.open('https://wa.me/' + wa + '?text=' + encodeURIComponent(msg), '_blank');
            });
        }

        // Image previews
        setupImagePreview('prodImage', 'imagePreview');
        setupImagePreview('settingLogo', 'logoPreview');
    }

    // ===== INIT =====
    function init() {
        console.log('🏪 Adi Store v2.0 - Initializing...');
        loadData();
        renderAll();
        initEvents();
        startPromoRotation();
        console.log('✅ Adi Store ready! Products:', state.products.length);
    }

    // Start when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

