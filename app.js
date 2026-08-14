// ===== CONFIG & STATE =====
const DEFAULT_CONFIG = {
  name: 'Toko Bekas Premium',
  tagline: 'Barang bekas berkualitas, harga bersahabat',
  logo: '',
  gradient: 'linear-gradient(135deg,#6c5ce7,#a29bfe)',
  whatsapp: '',
  password: 'admin123'
};

let products = JSON.parse(localStorage.getItem('tokoBekasData')) || [];
let headerConfig = JSON.parse(localStorage.getItem('tokoBekasHeader')) || { ...DEFAULT_CONFIG };
let currentMode = '';
let tempProductPhoto = '';
let selectedGradient = headerConfig.gradient;

// ===== IMAGE COMPRESSION =====
function compressImage(file, maxSize, quality, cb) {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > maxSize || h > maxSize) {
        if (w > h) { h = (h / w) * maxSize; w = maxSize; }
        else { w = (w / h) * maxSize; h = maxSize; }
      }
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      cb(c.toDataURL('image/jpeg', quality));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ===== TOAST =====
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ===== AUTH =====
window.enterAsViewer = () => {
  currentMode = 'viewer';
  document.getElementById('loginScreen').classList.remove('active');
  document.body.className = 'is-viewer';
  applyHeader();
  renderProducts();
};

window.enterAsAdmin = () => {
  const pass = document.getElementById('adminPass').value;
  if (pass === headerConfig.password) {
    currentMode = 'admin';
    document.getElementById('loginScreen').classList.remove('active');
    document.body.className = 'is-admin';
    applyHeader();
    renderProducts();
    showToast('✅ Login admin berhasil');
  } else {
    document.getElementById('loginError').style.display = 'block';
  }
};

window.logout = () => {
  currentMode = '';
  document.body.className = '';
  document.getElementById('adminPass').value = '';
  document.getElementById('loginError').style.display = 'none';
  document.getElementById('loginScreen').classList.add('active');
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
});

function setupEventListeners() {
  // Photo upload barang
  document.getElementById('photoInput').addEventListener('change', function () {
    if (this.files?.[0]) {
      compressImage(this.files[0], 800, 0.7, base64 => {
        tempProductPhoto = base64;
        document.getElementById('photoPreview').src = base64;
        document.getElementById('photoPreview').style.display = 'block';
        document.getElementById('photoPlaceholder').style.display = 'none';
      });
    }
  });

  // Logo upload
  document.getElementById('logoInput').addEventListener('change', function () {
    if (this.files?.[0]) {
      compressImage(this.files[0], 200, 0.8, base64 => {
        headerConfig.logo = base64;
        saveHeaderConfig();
        applyHeader();
        showToast('✅ Logo diperbarui');
      });
    }
  });

  // Form submit
  document.getElementById('productForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const nama = document.getElementById('namaBarang').value.trim();
    const harga = document.getElementById('harga').value;
    const kondisi = document.getElementById('kondisi').value;
    const kategori = document.getElementById('kategori').value;
    const deskripsi = document.getElementById('deskripsi').value.trim();
    const editId = document.getElementById('editId').value;

    if (!nama || !harga) { showToast('⚠️ Nama dan harga wajib diisi!'); return; }

    const data = { nama, harga: parseInt(harga), kondisi, kategori, deskripsi, foto: tempProductPhoto, tanggal: new Date().toISOString() };

    if (editId !== '') {
      if (!tempProductPhoto && products[parseInt(editId)]) data.foto = products[parseInt(editId)].foto;
      products[parseInt(editId)] = data;
      showToast('✅ Barang diperbarui');
    } else {
      products.unshift(data);
      showToast('✅ Barang ditambahkan');
    }

    saveProducts();
    resetForm();
    renderProducts();
  });

  // Color buttons
  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');
      selectedGradient = this.dataset.color;
    });
  });

  // Close modal on overlay click
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', function (e) {
      if (e.target === this && this.id !== 'loginScreen') this.classList.remove('active');
    });
  });
}

// ===== RENDER =====
function renderProducts() {
  const container = document.getElementById('daftarBarang');
  const search = (document.getElementById('searchInput').value || '').toLowerCase();
  const filtered = products.filter(p =>
    p.nama.toLowerCase().includes(search) ||
    (p.kategori || '').toLowerCase().includes(search)
  );

  // Stats
  document.getElementById('totalItems').textContent = products.length;
  document.getElementById('totalValue').textContent = 'Rp ' + products.reduce((s, p) => s + p.harga, 0).toLocaleString('id-ID');

  if (!filtered.length) {
    container.innerHTML = `<div class="empty-state"><span>📦</span><p>${search ? 'Tidak ditemukan "' + search + '"' : 'Belum ada barang.'}</p></div>`;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const ri = products.indexOf(item);
    return `
    <div class="product-card" onclick="openDetail(${ri})">
      <div class="card-img">${item.foto ? `<img src="${item.foto}" alt="${item.nama}">` : '<span class="no-img">📷</span>'}</div>
      <div class="card-body">
        <h3>${item.nama}</h3>
        <div class="card-price">Rp ${item.harga.toLocaleString('id-ID')}</div>
        <span class="badge badge-kondisi">${item.kondisi}</span>
        ${item.kategori ? `<span class="badge badge-kategori">${item.kategori}</span>` : ''}
        <div class="card-actions admin-only" onclick="event.stopPropagation()">
          <button class="btn-edit-card" onclick="editProduct(${ri})">✏️ Edit</button>
          <button class="btn-delete-card" onclick="deleteProduct(${ri})">🗑️</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ===== CRUD =====
window.editProduct = i => {
  const item = products[i];
  document.getElementById('editId').value = i;
  document.getElementById('namaBarang').value = item.nama;
  document.getElementById('harga').value = item.harga;
  document.getElementById('kondisi').value = item.kondisi;
  document.getElementById('kategori').value = item.kategori || 'Lainnya';
  document.getElementById('deskripsi').value = item.deskripsi || '';
  tempProductPhoto = item.foto || '';
  const prev = document.getElementById('photoPreview');
  if (item.foto) { prev.src = item.foto; prev.style.display = 'block'; document.getElementById('photoPlaceholder').style.display = 'none'; }
  document.getElementById('formTitle').textContent = '✏️ Edit Barang';
  document.getElementById('btnSimpan').textContent = '💾 Simpan Perubahan';
  document.getElementById('btnBatal').style.display = 'block';
  document.getElementById('productForm').classList.remove('hidden');
  document.getElementById('btnToggleForm').classList.remove('collapsed');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteProduct = i => {
  if (confirm('Hapus "' + products[i].nama + '"?')) {
    products.splice(i, 1);
    saveProducts();
    renderProducts();
    showToast('🗑️ Barang dihapus');
  }
};

// ===== DETAIL + WA SHARE =====
window.openDetail = i => {
  const item = products[i];
  const waNum = headerConfig.whatsapp || '';
  const waText = encodeURIComponent(`Halo, saya tertarik dengan *${item.nama}* seharga Rp ${item.harga.toLocaleString('id-ID')} di ${headerConfig.name}. Apakah masih tersedia?`);
  const waLink = waNum ? `https://wa.me/${waNum}?text=${waText}` : '#';
  const waBtn = waNum
    ? `<a href="${waLink}" target="_blank" class="btn-wa">💬 Chat via WhatsApp</a>`
    : `<p style="text-align:center;color:var(--text-dim);margin-top:16px;font-size:13px;">Nomor WA belum diatur oleh penjual</p>`;

  document.getElementById('detailContent').innerHTML = `
    ${item.foto ? `<img class="detail-img" src="${item.foto}" alt="${item.nama}">` : ''}
    <div class="detail-info">
      <h2>${item.nama}</h2>
      <div class="detail-price">Rp ${item.harga.toLocaleString('id-ID')}</div>
      <span class="badge badge-kondisi">${item.kondisi}</span>
      ${item.kategori ? `<span class="badge badge-kategori">${item.kategori}</span>` : ''}
      <p class="detail-desc">${item.deskripsi || 'Tidak ada deskripsi.'}</p>
      ${waBtn}
    </div>`;
  document.getElementById('detailModal').classList.add('active');
};

// ===== HEADER =====
function applyHeader() {
  document.getElementById('storeHeader').style.background = headerConfig.gradient;
  document.getElementById('storeName').textContent = headerConfig.name;
  document.getElementById('storeTagline').textContent = headerConfig.tagline;

  // Admin logo
  const aImg = document.getElementById('storeLogo'), aPh = document.getElementById('logoPlaceholder');
  if (headerConfig.logo) { aImg.src = headerConfig.logo; aImg.style.display = 'block'; aPh.style.display = 'none'; document.getElementById('logoWrap').style.border = 'none'; }
  else { aImg.style.display = 'none'; aPh.style.display = 'block'; document.getElementById('logoWrap').style.border = '2px dashed rgba(255,255,255,0.3)'; }

  // Viewer logo
  const vImg = document.getElementById('viewerLogo'), vPh = document.getElementById('viewerLogoPlaceholder');
  if (headerConfig.logo) { vImg.src = headerConfig.logo; vImg.style.display = 'block'; vPh.style.display = 'none'; document.getElementById('viewerLogoWrap').style.border = 'none'; }
  else { vImg.style.display = 'none'; vPh.style.display = 'block'; }
}

window.openHeaderModal = () => {
  document.getElementById('inputStoreName').value = headerConfig.name;
  document.getElementById('inputTagline').value = headerConfig.tagline;
  document.getElementById('inputWA').value = headerConfig.whatsapp || '';
  document.getElementById('inputNewPass').value = '';
  document.querySelectorAll('.color-btn').forEach(b => b.classList.toggle('selected', b.dataset.color === headerConfig.gradient));
  selectedGradient = headerConfig.gradient;
  document.getElementById('headerModal').classList.add('active');
};

window.saveHeader = () => {
  headerConfig.name = document.getElementById('inputStoreName').value || 'Toko Saya';
  headerConfig.tagline = document.getElementById('inputTagline').value || '';
  headerConfig.whatsapp = document.getElementById('inputWA').value.replace(/[^0-9]/g, '');
  headerConfig.gradient = selectedGradient;
  const np = document.getElementById('inputNewPass').value;
  if (np) headerConfig.password = np;
  saveHeaderConfig();
  applyHeader();
  closeModal('headerModal');
  showToast('✅ Header diperbarui');
};

window.removeLogo = () => {
  headerConfig.logo = '';
  saveHeaderConfig();
  applyHeader();
  showToast('🗑️ Logo dihapus');
};

function saveHeaderConfig() {
  try { localStorage.setItem('tokoBekasHeader', JSON.stringify(headerConfig)); }
  catch (e) { showToast('⚠️ Storage penuh!'); }
}

// ===== EXPORT / IMPORT =====
window.exportData = () => {
  const data = { products, headerConfig, exportDate: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-toko-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📤 Data berhasil di-export');
};

window.importData = input => {
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.products) products = data.products;
      if (data.headerConfig) headerConfig = { ...DEFAULT_CONFIG, ...data.headerConfig };
      saveProducts();
      saveHeaderConfig();
      applyHeader();
      renderProducts();
      showToast('📥 Data berhasil di-import');
    } catch (err) {
      showToast('❌ File tidak valid!');
    }
  };
  reader.readAsText(file);
  input.value = '';
};

// ===== STORAGE =====
function saveProducts() {
  try { localStorage.setItem('tokoBekasData', JSON.stringify(products)); }
  catch (e) { showToast('⚠️ Storage penuh! Hapus beberapa barang.'); }
}

// ===== FORM HELPERS =====
window.resetForm = () => {
  document.getElementById('productForm').reset();
  document.getElementById('editId').value = '';
  tempProductPhoto = '';
  document.getElementById('photoPreview').style.display = 'none';
  document.getElementById('photoPlaceholder').style.display = 'block';
  document.getElementById('formTitle').textContent = '➕ Tambah Barang';
  document.getElementById('btnSimpan').textContent = '💾 Simpan Barang';
  document.getElementById('btnBatal').style.display = 'none';
};

window.toggleForm = () => {
  document.getElementById('productForm').classList.toggle('hidden');
  document.getElementById('btnToggleForm').classList.toggle('collapsed');
};

window.closeModal = id => document.getElementById(id).classList.remove('active');
