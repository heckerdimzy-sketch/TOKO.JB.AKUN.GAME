// ============================================================
// KONFIGURASI AWAL
// ============================================================
let WA_NUMBER_DEFAULT = '6281234567890';
const ADMIN_USER = 'Admin25';
const ADMIN_PASS = 'Admin25!';

// ============================================================
// DATA AWAL KOSONG — TIDAK ADA PRODUK DEFAULT
// ============================================================
const defaultProducts = []; // KOSONG! Admin harus tambah sendiri

// ============================================================
// STATE
// ============================================================
let products = [];
let isAdmin = false;
let currentFilter = 'default';
let currentCategory = 'Semua';
let searchQuery = '';

// ============================================================
// DOM REFS
// ============================================================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const productGrid = $('#productGrid');
const categoryGrid = $('#categoryGrid');
const searchInput = $('#searchInput');
const filterSort = $('#filterSort');
const navToggle = $('#navToggle');
const navMenu = $('#navMenu');
const modalOverlay = $('#modalOverlay');
const modalTitle = $('#modalTitle');
const modalMessage = $('#modalMessage');
const modalConfirm = $('#modalConfirm');
const modalCancel = $('#modalCancel');
const toastContainer = $('#toastContainer');
const loadingScreen = $('#loadingScreen');
const adminLoginModal = $('#adminLoginModal');
const adminDashboard = $('#adminDashboard');
const adminContent = $('#adminDashboardContent');

let modalCallback = null;

// ============================================================
// UTILITY
// ============================================================
function toast(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = msg;
    toastContainer.appendChild(el);
    setTimeout(() => { el.remove(); }, 3500);
}

function showModal(title, msg, cb) {
    modalTitle.textContent = title;
    modalMessage.textContent = msg;
    modalOverlay.classList.add('active');
    modalCallback = cb;
}

function hideModal() {
    modalOverlay.classList.remove('active');
    modalCallback = null;
}

modalCancel.addEventListener('click', hideModal);
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) hideModal();
});
modalConfirm.addEventListener('click', () => {
    if (modalCallback) modalCallback();
    hideModal();
});

// ============================================================
// LOADING
// ============================================================
window.addEventListener('load', () => {
    setTimeout(() => {
        loadingScreen.classList.add('hide');
    }, 800);
});

// ============================================================
// NAVBAR
// ============================================================
navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('open');
});

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
    });
});

// ============================================================
// STORAGE — PRODUK TERSIMPAN AMAN DI LOCALSTORAGE
// ============================================================
function loadProducts() {
    const stored = localStorage.getItem('jb_products');
    if (stored) {
        try { 
            products = JSON.parse(stored); 
        } catch (e) { 
            products = []; 
        }
    } else {
        // FIRST TIME — KOSONGKAN, TIDAK PAKAI DEFAULT
        products = [];
        saveProducts();
    }
    // pastikan semua produk punya field wa
    products.forEach(p => {
        if (!p.wa) p.wa = WA_NUMBER_DEFAULT;
    });
    saveProducts();
}

function saveProducts() {
    localStorage.setItem('jb_products', JSON.stringify(products));
}

function loadWA() {
    const stored = localStorage.getItem('jb_wa_default');
    if (stored) WA_NUMBER_DEFAULT = stored;
}

function saveWA(num) {
    WA_NUMBER_DEFAULT = num;
    localStorage.setItem('jb_wa_default', num);
}

function loadAdminSession() {
    const session = sessionStorage.getItem('jb_admin');
    if (session === 'true') {
        isAdmin = true;
        document.querySelector('#adminNav').textContent = '👑 Admin';
    }
}

function saveAdminSession(val) {
    isAdmin = val;
    sessionStorage.setItem('jb_admin', val ? 'true' : 'false');
    document.querySelector('#adminNav').textContent = val ? '👑 Admin' : '🔒 Admin';
}

// ============================================================
// RENDER CATEGORIES
// ============================================================
function renderCategories() {
    const games = ['Semua', ...new Set(products.map(p => p.game))];
    categoryGrid.innerHTML = games.map(g =>
        `<button class="category-btn ${g === currentCategory ? 'active' : ''}" data-game="${g}">${g}</button>`
    ).join('');
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentCategory = btn.dataset.game;
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderProducts();
        });
    });
}

// ============================================================
// RENDER PRODUCTS
// ============================================================
function renderProducts() {
    let filtered = [...products];

    if (currentCategory !== 'Semua') {
        filtered = filtered.filter(p => p.game === currentCategory);
    }

    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.game.toLowerCase().includes(q) ||
            p.rank.toLowerCase().includes(q)
        );
    }

    switch (currentFilter) {
        case 'price-asc':
            filtered.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filtered.sort((a, b) => b.price - a.price);
            break;
        case 'ready':
            filtered = filtered.filter(p => p.status === 'ready' && p.stock > 0);
            break;
        case 'sold':
            filtered = filtered.filter(p => p.status === 'sold' || p.stock === 0);
            break;
        default:
            break;
    }

    if (filtered.length === 0) {
        productGrid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-secondary);">
                <div style="font-size:4rem;margin-bottom:16px;">📦</div>
                <h3 style="font-size:1.4rem;color:var(--text-primary);margin-bottom:8px;">Belum Ada Produk</h3>
                <p>Silakan login sebagai admin untuk menambahkan produk.</p>
                <p style="font-size:0.85rem;margin-top:8px;color:var(--text-muted);">🔒 Admin: admin / Admin123!</p>
            </div>
        `;
        return;
    }

    productGrid.innerHTML = filtered.map(p => {
        const isSold = p.status === 'sold' || p.stock === 0;
        const badgeClass = isSold ? 'badge-sold' : 'badge-ready';
        const badgeText = isSold ? 'SOLD OUT' : 'READY';
        const cardClass = isSold ? 'product-card sold-out' : 'product-card';
        const waNumber = p.wa || WA_NUMBER_DEFAULT;
        const waLink = `https://wa.me/${waNumber}?text=Saya%20ingin%20membeli%20produk%20${encodeURIComponent(p.name)}%20-%20${p.game}`;

        return `
            <div class="${cardClass}" style="animation-delay:${Math.random()*0.2}s">
                <img src="${p.image}" alt="${p.name}" class="product-img" loading="lazy" onerror="this.src='https://picsum.photos/seed/${p.id}/400/300'" />
                <div class="product-body">
                    <span class="product-badge ${badgeClass}">${badgeText}</span>
                    <h3 class="product-name">${p.name}</h3>
                    <p class="product-game">🎮 ${p.game}</p>
                    <div class="product-details">
                        <span>🏅 ${p.rank}</span>
                        <span>⭐ ${p.level}</span>
                        <span>⚔️ ${p.hero}</span>
                    </div>
                    <div class="product-details">
                        <span>👗 ${p.skin}</span>
                        <span>🌐 ${p.server}</span>
                        <span>📦 Stok: ${p.stock}</span>
                    </div>
                    <div class="product-price">Rp ${p.price.toLocaleString('id-ID')}</div>
                    <p class="product-desc">${p.desc}</p>
                    <div class="product-actions">
                        ${isSold ? 
                            `<button class="btn btn-secondary btn-sm" disabled>⛔ SOLD OUT</button>` :
                            `<a href="${waLink}" target="_blank" class="btn btn-wa btn-sm">💬 BELI</a>`
                        }
                        <button class="btn btn-secondary btn-sm btn-detail" data-id="${p.id}">📋 Detail</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.btn-detail').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const product = products.find(p => p.id === id);
            if (product) showProductDetail(product);
        });
    });
}

// ============================================================
// DETAIL PRODUK MODAL
// ============================================================
function showProductDetail(p) {
    const isSold = p.status === 'sold' || p.stock === 0;
    const badgeClass = isSold ? 'badge-sold' : 'badge-ready';
    const badgeText = isSold ? 'SOLD OUT' : 'READY';
    const waNumber = p.wa || WA_NUMBER_DEFAULT;
    const waLink = `https://wa.me/${waNumber}?text=Saya%20ingin%20membeli%20produk%20${encodeURIComponent(p.name)}%20-%20${p.game}`;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay active detail-modal';
    modal.innerHTML = `
        <div class="modal-box detail-box">
            <button class="detail-close">✕</button>
            <div class="detail-grid">
                <div class="detail-image">
                    <img src="${p.image}" alt="${p.name}" onerror="this.src='https://picsum.photos/seed/${p.id}/400/300'" />
                    <span class="product-badge ${badgeClass}" style="margin-top:12px;display:inline-block;">${badgeText}</span>
                </div>
                <div class="detail-info">
                    <h2>${p.name}</h2>
                    <p class="detail-game">🎮 ${p.game}</p>
                    <div class="detail-specs">
                        <div><span>🏅 Rank</span> <strong>${p.rank}</strong></div>
                        <div><span>⭐ Level</span> <strong>${p.level}</strong></div>
                        <div><span>⚔️ Hero</span> <strong>${p.hero}</strong></div>
                        <div><span>👗 Skin</span> <strong>${p.skin}</strong></div>
                        <div><span>🌐 Server</span> <strong>${p.server}</strong></div>
                        <div><span>📦 Stok</span> <strong>${p.stock}</strong></div>
                        <div><span>📱 WA Penjual</span> <strong>${waNumber}</strong></div>
                    </div>
                    <div class="detail-price">Rp ${p.price.toLocaleString('id-ID')}</div>
                    <p class="detail-desc">${p.desc}</p>
                    <div class="detail-actions">
                        ${isSold ? 
                            `<button class="btn btn-secondary" disabled>⛔ SOLD OUT</button>` :
                            `<a href="${waLink}" target="_blank" class="btn btn-wa">💬 BELI SEKARANG</a>`
                        }
                        <button class="btn btn-secondary detail-close-btn">Tutup</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.detail-close').addEventListener('click', () => modal.remove());
    modal.querySelector('.detail-close-btn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// ============================================================
// RENDER TESTIMONI
// ============================================================
function renderTestimonials() {
    const data = [
        { name: 'Pak, wowo', text: 'Akun MLBB-nya mantap! Rank legend langsung main. Top banget! ⭐⭐⭐⭐⭐', stars: 5 },
        { name: 'Pria solo', text: 'Proses cepat, admin ramah. Akun FF heroic saya langsung naik rank. Rekomendasi!', stars: 5 },
        { name: 'Budi 01 geming', text: 'Belum pernah kecewa beli di sini. Akun PUBG ace saya bikin puas. Makasih banyak!', stars: 5 },
        { name: 'Andra St', text: 'Genshin AR60-nya lengkap banget. Langsung jadi top player. Terbaik!', stars: 5 },
        { name: 'Garena', text: 'Gacor udah game free fire saya,hidup jokowi', stars: 5 },
    ];
    const slider = $('#testimonialSlider');
    slider.innerHTML = data.map(t =>
        `<div class="testimonial-card">
            <div class="stars">${'⭐'.repeat(t.stars)}</div>
            <p>"${t.text}"</p>
            <div class="name">— ${t.name}</div>
        </div>`
    ).join('');
}

// ============================================================
// RENDER FAQ
// ============================================================
function renderFAQ() {
    const data = [
        { q: 'Apakah akun ini aman?', a: '100% aman. Akun original, bukan hasil hack. Kami jamin keamanannya.' },
        { q: 'Bagaimana cara membeli?', a: 'Klik tombol BELI SEKARANG, Anda akan diarahkan ke WhatsApp penjual produk tersebut. Lalu transaksi langsung.' },
        { q: 'Apakah bisa refund?', a: 'Jika akun tidak sesuai deskripsi, kami berikan garansi refund 1x24 jam.' },
        { q: 'Berapa lama proses kirim akun?', a: 'Proses kirim akun maksimal 15 menit setelah pembayaran dikonfirmasi.' },
        { q: 'Bisa request akun tertentu?', a: 'Bisa! Silakan chat via WhatsApp penjual, kami akan carikan akun sesuai keinginan Anda.' },
    ];
    const container = $('#faqContainer');
    container.innerHTML = data.map((item, idx) =>
        `<div class="faq-item">
            <button class="faq-question" data-idx="${idx}">
                <span>${item.q}</span>
                <span class="icon">▼</span>
            </button>
            <div class="faq-answer">${item.a}</div>
        </div>`
    ).join('');

    container.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.faq-item');
            const wasOpen = item.classList.contains('open');
            container.querySelectorAll('.faq-item').forEach(el => el.classList.remove('open'));
            if (!wasOpen) item.classList.add('open');
        });
    });
    container.querySelector('.faq-item')?.classList.add('open');
}

// ============================================================
// ADMIN LOGIN
// ============================================================
const adminNav = $('#adminNav');
adminNav.addEventListener('click', (e) => {
    e.preventDefault();
    if (isAdmin) {
        showDashboard();
    } else {
        adminLoginModal.classList.add('active');
        $('#adminUsername').value = '';
        $('#adminPassword').value = '';
        $('#adminUsername').focus();
    }
});

$('#adminLoginBtn').addEventListener('click', () => {
    const user = $('#adminUsername').value.trim();
    const pass = $('#adminPassword').value.trim();
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        adminLoginModal.classList.remove('active');
        saveAdminSession(true);
        toast('✅ Login berhasil! Selamat datang Admin.', 'success');
        showDashboard();
    } else {
        toast('❌ Username atau password salah!', 'error');
    }
});

$('#adminLoginClose').addEventListener('click', () => {
    adminLoginModal.classList.remove('active');
});

document.querySelectorAll('#adminUsername, #adminPassword').forEach(field => {
    field.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') $('#adminLoginBtn').click();
    });
});

// ============================================================
// DASHBOARD
// ============================================================
function showDashboard() {
    if (!isAdmin) {
        toast('🔒 Silakan login admin terlebih dahulu.', 'error');
        return;
    }
    adminDashboard.style.display = 'block';
    document.querySelector('.navbar').style.position = 'static';
    document.querySelector('.hero').style.display = 'none';
    document.querySelectorAll('.section:not(#adminDashboard)').forEach(el => el.style.display = 'none');
    document.querySelector('footer').style.display = 'none';
    renderAdminDashboard();
}

function hideDashboard() {
    adminDashboard.style.display = 'none';
    document.querySelector('.navbar').style.position = 'fixed';
    document.querySelector('.hero').style.display = 'flex';
    document.querySelectorAll('.section:not(#adminDashboard)').forEach(el => el.style.display = 'block');
    document.querySelector('footer').style.display = 'block';
    renderProducts();
}

function renderAdminDashboard(tab = 'dashboard') {
    document.querySelectorAll('.admin-menu-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.admin-menu-btn[data-tab="${tab}"]`)?.classList.add('active');

    let html = '';
    switch (tab) {
        case 'dashboard':
            const total = products.length;
            const ready = products.filter(p => p.status === 'ready' && p.stock > 0).length;
            const sold = products.filter(p => p.status === 'sold' || p.stock === 0).length;
            const totalValue = products.reduce((sum, p) => sum + (p.status === 'ready' && p.stock > 0 ? p.price * p.stock : 0), 0);
            html = `
                <h2 class="section-title">📊 Dashboard</h2>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:16px;margin-top:16px;">
                    <div style="background:var(--bg-card);padding:20px;border-radius:14px;border:1px solid var(--border-glass);text-align:center;">
                        <div style="font-size:2rem;">📦</div>
                        <div style="font-weight:700;font-size:1.4rem;">${total}</div>
                        <div style="color:var(--text-secondary);font-size:0.85rem;">Total Produk</div>
                    </div>
                    <div style="background:var(--bg-card);padding:20px;border-radius:14px;border:1px solid var(--border-glass);text-align:center;">
                        <div style="font-size:2rem;">✅</div>
                        <div style="font-weight:700;font-size:1.4rem;color:#4ADE80;">${ready}</div>
                        <div style="color:var(--text-secondary);font-size:0.85rem;">Ready</div>
                    </div>
                    <div style="background:var(--bg-card);padding:20px;border-radius:14px;border:1px solid var(--border-glass);text-align:center;">
                        <div style="font-size:2rem;">⛔</div>
                        <div style="font-weight:700;font-size:1.4rem;color:#F87171;">${sold}</div>
                        <div style="color:var(--text-secondary);font-size:0.85rem;">Sold Out</div>
                    </div>
                    <div style="background:var(--bg-card);padding:20px;border-radius:14px;border:1px solid var(--border-glass);text-align:center;">
                    
                        <div style="font-size:2rem;">💰</div>
                        <div style="font-weight:700;font-size:1.2rem;color:var(--neon-blue);">Rp ${totalValue.toLocaleString('id-ID')}</div>
                        <div style="color:var(--text-secondary);font-size:0.85rem;">Total Aset</div>
                    </div>
                </div>
                <div style="margin-top:24px;padding:20px;background:var(--bg-card);border-radius:14px;border:1px solid var(--border-glass);">
                    <p style="color:var(--text-secondary);">💡 <strong>Tips:</strong> Gunakan menu di samping untuk kelola produk, tambah produk, atau ubah nomor WhatsApp.</p>
                    <p style="color:var(--text-secondary);margin-top:8px;">📱 Setiap produk bisa punya nomor WA sendiri. Jika kosong, akan pakai nomor default.</p>
                    <p style="color:var(--text-muted);margin-top:8px;font-size:0.85rem;">📦 Total produk: ${total} | ✅ Ready: ${ready} | ⛔ Sold: ${sold}</p>
                </div>
            `;
            break;

        case 'products':
            if (products.length === 0) {
                html = `
                    <h2 class="section-title">📦 Kelola Produk</h2>
                    <div style="text-align:center;padding:60px 20px;color:var(--text-secondary);">
                        <div style="font-size:4rem;margin-bottom:16px;">📭</div>
                        <h3 style="font-size:1.3rem;color:var(--text-primary);">Belum Ada Produk</h3>
                        <p>Klik menu <strong>➕ Tambah Produk</strong> untuk menambahkan produk pertama.</p>
                    </div>
                `;
            } else {
                html = `
                    <h2 class="section-title">📦 Kelola Produk</h2>
                    <div class="admin-product-grid">
                        ${products.map(p => `
                            <div class="admin-product-card">
                                <img src="${p.image}" alt="${p.name}" onerror="this.src='https://picsum.photos/seed/${p.id}/400/300'" />
                                <strong>${p.name}</strong>
                                <span style="font-size:0.8rem;color:var(--text-secondary);">${p.game} | ${p.rank}</span>
                                <span style="font-weight:700;color:var(--neon-blue);">Rp ${p.price.toLocaleString('id-ID')}</span>
                                <span style="font-size:0.8rem;">Stok: ${p.stock} | ${p.status.toUpperCase()}</span>
                                <span style="font-size:0.75rem;color:var(--text-muted);">📱 ${p.wa || WA_NUMBER_DEFAULT}</span>
                                <div class="admin-actions">
                                    <button class="btn btn-secondary btn-sm edit-product" data-id="${p.id}">✏️</button>
                                    <button class="btn btn-danger btn-sm delete-product" data-id="${p.id}">🗑️</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            setTimeout(() => {
                document.querySelectorAll('.edit-product').forEach(btn => {
                    btn.addEventListener('click', () => editProduct(parseInt(btn.dataset.id)));
                });
                document.querySelectorAll('.delete-product').forEach(btn => {
                    btn.addEventListener('click', () => deleteProduct(parseInt(btn.dataset.id)));
                });
            }, 50);
            break;

        case 'add':
            html = `
                <h2 class="section-title">➕ Tambah Produk</h2>
                <form class="admin-form" id="addProductForm">
                    <div class="form-group"><label>Nama Produk</label><input type="text" class="form-input" id="addName" required /></div>
                    <div class="form-group"><label>Nama Game</label><input type="text" class="form-input" id="addGame" required /></div>
                    <div class="form-group"><label>Harga (Rupiah)</label><input type="number" class="form-input" id="addPrice" required /></div>
                    <div class="form-group"><label>Rank</label><input type="text" class="form-input" id="addRank" required /></div>
                    <div class="form-group"><label>Level</label><input type="number" class="form-input" id="addLevel" required /></div>
                    <div class="form-group"><label>Hero</label><input type="text" class="form-input" id="addHero" /></div>
                    <div class="form-group"><label>Skin</label><input type="text" class="form-input" id="addSkin" /></div>
                    <div class="form-group"><label>Server</label><input type="text" class="form-input" id="addServer" /></div>
                    <div class="form-group"><label>Deskripsi</label><textarea class="form-input" id="addDesc" rows="2"></textarea></div>
                    <div class="form-group"><label>Image URL</label><input type="text" class="form-input" id="addImage" placeholder="https://..." required /></div>
                    <div class="form-group"><label>Nomor WhatsApp Penjual</label>
                        <input type="text" class="form-input" id="addWa" placeholder="628xxxxxxxxxx (kosongkan pakai default)" />
                        <small style="color:var(--text-muted);font-size:0.75rem;">Kosongkan jika ingin pakai nomor WA default</small>
                    </div>
                    <div class="form-group"><label>Status</label>
                        <select class="form-select" id="addStatus">
                            <option value="ready">Ready</option>
                            <option value="sold">Sold Out</option>
                        </select>
                    </div>
                    <div class="form-group"><label>Stok</label><input type="number" class="form-input" id="addStock" value="1" required /></div>
                    <button type="submit" class="btn btn-primary btn-block">➕ Tambah Produk</button>
                </form>
            `;
            setTimeout(() => {
                $('#addProductForm').addEventListener('submit', (e) => {
                    e.preventDefault();
                    const waVal = $('#addWa').value.trim();
                    const newProduct = {
                        id: Date.now(),
                        name: $('#addName').value.trim(),
                        game: $('#addGame').value.trim(),
                        price: parseInt($('#addPrice').value),
                        rank: $('#addRank').value.trim(),
                        level: parseInt($('#addLevel').value) || 0,
                        hero: $('#addHero').value.trim() || '-',
                        skin: $('#addSkin').value.trim() || 'Default',
                        server: $('#addServer').value.trim() || 'Global',
                        desc: $('#addDesc').value.trim() || '-',
                        image: $('#addImage').value.trim() || 'https://picsum.photos/seed/' + Date.now() + '/400/300',
                        status: $('#addStatus').value,
                        stock: parseInt($('#addStock').value) || 1,
                        wa: waVal || WA_NUMBER_DEFAULT,
                    };
                    products.push(newProduct);
                    saveProducts();
                    toast('✅ Produk berhasil ditambahkan!', 'success');
                    renderAdminDashboard('products');
                    renderProducts();
                    renderCategories();
                });
            }, 50);
            break;

        case 'whatsapp':
            html = `
                <h2 class="section-title">📱 Pengaturan WhatsApp</h2>
                <div class="admin-wa-setting">
                    <p style="color:var(--text-secondary);margin-bottom:16px;">
                        <strong>Nomor WA Default</strong> — digunakan jika produk tidak memiliki nomor WA sendiri.
                        <br>Setiap produk juga bisa punya nomor WA berbeda saat tambah/edit produk.
                    </p>
                    <label style="display:block;font-weight:500;margin-bottom:4px;font-size:0.85rem;color:var(--text-secondary);">Nomor Default</label>
                    <input type="text" class="form-input" id="waInput" value="${WA_NUMBER_DEFAULT}" placeholder="62xxxxxxxxxxx" />
                    <button class="btn btn-primary" id="saveWaBtn">💾 Simpan Nomor Default</button>
                    <button class="btn btn-secondary" id="resetWaBtn" style="margin-left:10px;">↺ Reset Default</button>
                    <hr style="border-color:var(--border-glass);margin:24px 0;" />
                    <p style="color:var(--text-secondary);">
                        💡 <strong>Cara ubah nomor WA per produk:</strong><br />
                        1. Buka menu <strong>📦 Kelola Produk</strong><br />
                        2. Klik tombol <strong>✏️ Edit</strong> pada produk yang ingin diubah<br />
                        3. Pada field <strong>Nomor WhatsApp Penjual</strong>, isi nomor baru
                    </p>
                </div>
            `;
            setTimeout(() => {
                $('#saveWaBtn').addEventListener('click', () => {
                    const val = $('#waInput').value.trim();
                    if (val.length < 8) {
                        toast('⚠️ Nomor WA tidak valid!', 'error');
                        return;
                    }
                    saveWA(val);
                    toast('✅ Nomor WA default berhasil diubah!', 'success');
                    renderProducts();
                });
                $('#resetWaBtn').addEventListener('click', () => {
                    saveWA('6281234567890');
                    $('#waInput').value = '6281234567890';
                    toast('🔄 Nomor WA default direset.', 'info');
                    renderProducts();
                });
            }, 50);
            break;

        default:
            html = '<p>Halaman tidak ditemukan.</p>';
    }

    adminContent.innerHTML = html;
}

// ============================================================
// ADMIN MENU
// ============================================================
document.querySelectorAll('.admin-menu-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (!isAdmin) return;
        const tab = btn.dataset.tab;
        if (tab) renderAdminDashboard(tab);
    });
});

$('#adminLogoutBtn').addEventListener('click', () => {
    if (confirm('Yakin ingin logout?')) {
        saveAdminSession(false);
        hideDashboard();
        toast('👋 Logout berhasil.', 'info');
        document.querySelector('#adminNav').textContent = '🔒 Admin';
    }
});

// ============================================================
// EDIT & DELETE (dengan field WA)
// ============================================================
function editProduct(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const newName = prompt('Nama produk:', p.name);
    if (newName === null) return;
    const newPrice = prompt('Harga (Rupiah):', p.price);
    if (newPrice === null) return;
    const newDesc = prompt('Deskripsi:', p.desc);
    if (newDesc === null) return;
    const newImage = prompt('Image URL:', p.image);
    if (newImage === null) return;
    const newRank = prompt('Rank:', p.rank);
    if (newRank === null) return;
    const newSkin = prompt('Skin:', p.skin);
    if (newSkin === null) return;
    const newHero = prompt('Hero:', p.hero);
    if (newHero === null) return;
    const newLevel = prompt('Level:', p.level);
    if (newLevel === null) return;
    const newServer = prompt('Server:', p.server);
    if (newServer === null) return;
    const newWa = prompt('Nomor WhatsApp Penjual (kosongkan pakai default):', p.wa || '');
    if (newWa === null) return;
    const newStatus = confirm('Status READY? klik OK = Ready, Batal = Sold Out');
    const newStock = prompt('Stok:', p.stock);
    if (newStock === null) return;

    p.name = newName.trim() || p.name;
    p.price = parseInt(newPrice) || p.price;
    p.desc = newDesc.trim() || p.desc;
    p.image = newImage.trim() || p.image;
    p.rank = newRank.trim() || p.rank;
    p.skin = newSkin.trim() || p.skin;
    p.hero = newHero.trim() || p.hero;
    p.level = parseInt(newLevel) || p.level;
    p.server = newServer.trim() || p.server;
    p.wa = newWa.trim() || WA_NUMBER_DEFAULT;
    p.status = newStatus ? 'ready' : 'sold';
    p.stock = parseInt(newStock) >= 0 ? parseInt(newStock) : p.stock;

    saveProducts();
    renderAdminDashboard('products');
    renderProducts();
    renderCategories();
    toast('✅ Produk berhasil diupdate!', 'success');
}

function deleteProduct(id) {
    showModal('Hapus Produk', 'Yakin ingin menghapus produk ini secara permanen?', () => {
        products = products.filter(p => p.id !== id);
        saveProducts();
        renderAdminDashboard('products');
        renderProducts();
        renderCategories();
        toast('🗑️ Produk berhasil dihapus.', 'info');
    });
}

// ============================================================
// SEARCH & FILTER
// ============================================================
searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value;
    renderProducts();
});

filterSort.addEventListener('change', () => {
    currentFilter = filterSort.value;
    renderProducts();
});

// ============================================================
// INIT
// ============================================================
loadProducts();
loadWA();
loadAdminSession();
renderCategories();
renderProducts();
renderTestimonials();
renderFAQ();

if (isAdmin) {
    showDashboard();
}

console.log('🔥 JB Store siap!');
console.log('👤 Admin: admin / Admin123!');
console.log('📱 WA Default:', WA_NUMBER_DEFAULT);
console.log('📦 Produk kosong — silakan tambah produk via admin panel.');