// main.js - 支持 FBM 和 FBA 两种店铺类型

// Firebase 配置
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDqPJFaBp0x4ZBxXA46cAQ83iKx2NP6_Q4",
    authDomain: "seller-data-hgy.firebaseapp.com",
    projectId: "seller-data-hgy",
    storageBucket: "seller-data-hgy.firebasestorage.app",
    messagingSenderId: "663736276108",
    appId: "1:663736276108:web:f7dc897d49b342fbc217a9"
};

// 初始化 Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
}
const auth = firebase.auth();
const db = firebase.firestore();

// === DOM 元素 ===
const authContainer = document.getElementById('auth-container');
const mainContainer = document.getElementById('main-container');
const loginForm = document.getElementById('login-form');
const authError = document.getElementById('auth-error');
const logoutBtn = document.getElementById('logout-btn');

// 标签页
const fbmStoresTab = document.getElementById('fbm-stores-tab');
const fbaStoresTab = document.getElementById('fba-stores-tab');
const keywordsTab = document.getElementById('keywords-tab');
const productsTab = document.getElementById('products-tab');
const bestsellersTab = document.getElementById('bestsellers-tab');

// 视图
const fbmStoresView = document.getElementById('fbm-stores-view');
const fbaStoresView = document.getElementById('fba-stores-view');
const keywordsView = document.getElementById('keywords-view');
const productsView = document.getElementById('products-view');
const bestsellersView = document.getElementById('bestsellers-view');
const loadingSkeleton = document.getElementById('loading-skeleton');

// FBM 店铺表格元素
const fbmStoreTableBody = document.getElementById('fbm-store-table-body');
const fbmStoreNoData = document.getElementById('fbm-stores-no-data');
const fbmStoreCountSpan = document.getElementById('fbm-store-count');
const fbmRatingHeader = document.getElementById('fbm-rating-header');
const fbmStoreFiltersDiv = document.getElementById('fbm-store-filters');
const fbmStoreSearchInput = document.getElementById('fbm-store-search-input');
const fbmStoreImportBtn = document.getElementById('fbm-store-import-btn');
const fbmStoreImportFile = document.getElementById('fbm-store-import-file');
const fbmStoreExportBtn = document.getElementById('fbm-store-export-btn');
const fbmStoreSelectAll = document.getElementById('fbm-store-select-all');
const fbmStoreDeleteSelectedBtn = document.getElementById('fbm-store-delete-selected-btn');
const fbmStoreDownloadTemplateBtn = document.getElementById('fbm-store-download-template-btn');

// FBA 店铺表格元素
const fbaStoreTableBody = document.getElementById('fba-store-table-body');
const fbaStoreNoData = document.getElementById('fba-stores-no-data');
const fbaStoreCountSpan = document.getElementById('fba-store-count');
const fbaRatingHeader = document.getElementById('fba-rating-header');
const fbaStoreFiltersDiv = document.getElementById('fba-store-filters');
const fbaStoreSearchInput = document.getElementById('fba-store-search-input');
const fbaStoreImportBtn = document.getElementById('fba-store-import-btn');
const fbaStoreImportFile = document.getElementById('fba-store-import-file');
const fbaStoreExportBtn = document.getElementById('fba-store-export-btn');
const fbaStoreSelectAll = document.getElementById('fba-store-select-all');
const fbaStoreDeleteSelectedBtn = document.getElementById('fba-store-delete-selected-btn');
const fbaStoreDownloadTemplateBtn = document.getElementById('fba-store-download-template-btn');

// 关键词表格元素
const keywordTableBody = document.getElementById('keyword-table-body');
const keywordNoData = document.getElementById('keywords-no-data');
const keywordCountSpan = document.getElementById('keyword-count');
const keywordDateHeader = document.getElementById('keyword-date-header');
const keywordFiltersDiv = document.getElementById('keyword-filters');
const keywordSearchInput = document.getElementById('keyword-search-input');
const keywordImportBtn = document.getElementById('keyword-import-btn');
const keywordImportFile = document.getElementById('keyword-import-file');
const keywordExportBtn = document.getElementById('keyword-export-btn');
const keywordSelectAll = document.getElementById('keyword-select-all');
const keywordDeleteSelectedBtn = document.getElementById('keyword-delete-selected-btn');
const keywordDownloadTemplateBtn = document.getElementById('keyword-download-template-btn');

// 产品表格元素
const productTableBody = document.getElementById('product-table-body');
const productNoData = document.getElementById('products-no-data');
const productCountSpan = document.getElementById('product-count');
const productDateHeader = document.getElementById('product-date-header');
const productFiltersDiv = document.getElementById('product-filters');
const productSearchInput = document.getElementById('product-search-input');
const productImportBtn = document.getElementById('product-import-btn');
const productImportFile = document.getElementById('product-import-file');
const productExportBtn = document.getElementById('product-export-btn');
const productSelectAll = document.getElementById('product-select-all');
const productDeleteSelectedBtn = document.getElementById('product-delete-selected-btn');
const productDownloadTemplateBtn = document.getElementById('product-download-template-btn');

// Best Sellers 表格元素
const bestsellerTableBody = document.getElementById('bestseller-table-body');
const bestsellerNoData = document.getElementById('bestsellers-no-data');
const bestsellerCountSpan = document.getElementById('bestseller-count');
const bestsellerDateHeader = document.getElementById('bestseller-date-header');
const bestsellerFiltersDiv = document.getElementById('bestseller-filters');
const bestsellerSearchInput = document.getElementById('bestseller-search-input');
const bestsellerExportBtn = document.getElementById('bestseller-export-btn');
const bestsellerSelectAll = document.getElementById('bestseller-select-all');
const bestsellerDeleteSelectedBtn = document.getElementById('bestseller-delete-selected-btn');

const notificationContainer = document.getElementById('notification-container');

// === 数据存储 (Map) ===
const fbmStoreData = new Map();
const fbaStoreData = new Map();
const keywordData = new Map();
const productData = new Map();
const bestsellerData = new Map();

// === 选中集合 ===
const selectedFbmStoreIds = new Set();
const selectedFbaStoreIds = new Set();
const selectedKeywordIds = new Set();
const selectedProductIds = new Set();
const selectedBestsellerIds = new Set();

// === 排序/筛选状态 ===
let fbmStoreSortKey = 'rating';
let fbmStoreSortDir = 'desc';
let fbaStoreSortKey = 'rating';
let fbaStoreSortDir = 'desc';
let keywordSortKey = 'date';
let keywordSortDir = 'desc';
let productSortKey = 'createdAt';
let productSortDir = 'desc';
let bestsellerSortKey = 'createdAt';
let bestsellerSortDir = 'desc';

let activeFbmStoreSiteFilter = 'all';
let activeFbaStoreSiteFilter = 'all';
let activeKeywordSiteFilter = 'all';
let activeProductSiteFilter = 'all';
let activeBestsellerSiteFilter = 'all';

// === 防抖计时器 ===
let fbmStoreSearchTimer = null;
let fbaStoreSearchTimer = null;
let keywordSearchTimer = null;
let productSearchTimer = null;
let bestsellerSearchTimer = null;
let snapshotDebounceTimer = null;

// === 取消订阅函数 ===
let unsubscribers = {
    fbmSellers: null,
    fbaSellers: null,
    keywords: null,
    products: null,
    bestsellers: null
};

// === 站点映射 ===
const SITE_MAP = {
    "amazon.com": "US",
    "amazon.co.uk": "UK",
    "amazon.de": "DE",
    "amazon.fr": "FR",
    "amazon.es": "ES",
    "amazon.it": "IT",
    "amazon.co.jp": "JP",
    "amazon.ca": "CA",
    "amazon.com.au": "AU",
    "amazon.com.br": "BR",
    "amazon.com.mx": "MX",
    "amazon.in": "IN",
    "amazon.cn": "CN",
    "amazon.nl": "NL",
    "amazon.sg": "SG",
    "amazon.sa": "SA",
    "amazon.ae": "AE",
    "amazon.com.tr": "TR",
    "amazon.se": "SE",
    "amazon.pl": "PL",
    "amazon.com.eg": "EG",
    "amazon.com.be": "BE",
    "amazon.co.za": "ZA"
};

function getSiteAbbreviation(domain) {
    return SITE_MAP[domain] || domain;
}

// === HTML 转义 ===
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// === Best Sellers 链接解析 ===
function resolveBestsellerUrl(item, col) {
    const lookup = {
        category1: ['category1Url', 'categoryUrl', 'url', 'link'],
        category1Zh: ['category1ZhUrl', 'category1Url', 'categoryUrl', 'url', 'link'],
        subcategory: ['subcategoryUrl', 'subCategoryUrl', 'url', 'link'],
        subcategoryZh: ['subcategoryZhUrl', 'subcategoryUrl', 'url', 'link']
    };
    const candidates = lookup[col] || ['url', 'link'];
    for (const c of candidates) {
        if (item[c]) return item[c];
    }
    if (item.url) return item.url;
    const text = item[col] || item.subcategory || item.category1 || '';
    if (item.site && text) {
        try {
            return `https://www.${item.site}/s?k=${encodeURIComponent(text)}`;
        } catch (err) { }
    }
    return '#';
}

// === 通知 ===
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notificationContainer.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// === 认证 ===
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        await auth.signInWithEmailAndPassword(email, password);
        authError.textContent = '';
    } catch (error) {
        authError.textContent = '登录失败: ' + error.message;
    }
});

logoutBtn.addEventListener('click', () => auth.signOut());

auth.onAuthStateChanged((user) => {
    if (user) {
        authContainer.classList.add('hidden');
        mainContainer.classList.remove('hidden');
        showLoading();
        startRealtimeListeners();
    } else {
        authContainer.classList.remove('hidden');
        mainContainer.classList.add('hidden');
        fbmStoreData.clear();
        fbaStoreData.clear();
        keywordData.clear();
        productData.clear();
        bestsellerData.clear();
        stopRealtimeListeners();
    }
});

function showLoading() {
    loadingSkeleton.classList.remove('hidden');
    fbmStoresView.classList.add('hidden');
    fbaStoresView.classList.add('hidden');
    keywordsView.classList.add('hidden');
    productsView.classList.add('hidden');
    bestsellersView.classList.add('hidden');
}

function hideLoading() {
    loadingSkeleton.classList.add('hidden');
    if (fbmStoresTab.classList.contains('active')) fbmStoresView.classList.remove('hidden');
    else if (fbaStoresTab.classList.contains('active')) fbaStoresView.classList.remove('hidden');
    else if (keywordsTab.classList.contains('active')) keywordsView.classList.remove('hidden');
    else if (productsTab.classList.contains('active')) productsView.classList.remove('hidden');
    else if (bestsellersTab.classList.contains('active')) bestsellersView.classList.remove('hidden');
}

// === 实时监听 ===
function startRealtimeListeners() {
    if (unsubscribers.fbmSellers || unsubscribers.fbaSellers || unsubscribers.keywords || unsubscribers.products || unsubscribers.bestsellers) return;

    const applyChangesToMap = (docChanges, mapRef) => {
        docChanges.forEach(change => {
            if (change.type === 'added' || change.type === 'modified') {
                mapRef.set(change.doc.id, { id: change.doc.id, ...change.doc.data() });
            } else if (change.type === 'removed') {
                mapRef.delete(change.doc.id);
            }
        });
    };

    const debouncedProcess = () => {
        if (snapshotDebounceTimer) clearTimeout(snapshotDebounceTimer);
        snapshotDebounceTimer = setTimeout(() => {
            processFbmStoreData();
            processFbaStoreData();
            processKeywordData();
            processProductData();
            processBestsellerData();
            hideLoading();
        }, 120);
    };

    // FBM Sellers
    unsubscribers.fbmSellers = db.collection('amazonFBMSeller').onSnapshot(snapshot => {
        applyChangesToMap(snapshot.docChanges(), fbmStoreData);
        debouncedProcess();
    }, error => {
        console.error("获取 FBM 店铺数据失败: ", error);
        showNotification("获取 FBM 店铺数据失败，请检查控制台", 'error');
        hideLoading();
    });

    // FBA Sellers
    unsubscribers.fbaSellers = db.collection('amazonFBASeller').onSnapshot(snapshot => {
        applyChangesToMap(snapshot.docChanges(), fbaStoreData);
        debouncedProcess();
    }, error => {
        console.error("获取 FBA 店铺数据失败: ", error);
        showNotification("获取 FBA 店铺数据失败，请检查控制台", 'error');
        hideLoading();
    });

    // Keywords
    unsubscribers.keywords = db.collection('amazonKeywords').onSnapshot(snapshot => {
        applyChangesToMap(snapshot.docChanges(), keywordData);
        debouncedProcess();
    }, error => {
        console.error("获取关键词数据失败: ", error);
        showNotification("获取关键词数据���败，请检查控制台", 'error');
        hideLoading();
    });

    // Products
    unsubscribers.products = db.collection('amazonProducts').onSnapshot(snapshot => {
        applyChangesToMap(snapshot.docChanges(), productData);
        debouncedProcess();
    }, error => {
        console.error("获取产品数据失败: ", error);
        showNotification("获取产品数据失败，请检查控制台", 'error');
        hideLoading();
    });

    // Best Sellers
    unsubscribers.bestsellers = db.collection('amazonBestsellers').onSnapshot(snapshot => {
        applyChangesToMap(snapshot.docChanges(), bestsellerData);
        debouncedProcess();
    }, error => {
        console.error("获取 Best Sellers 数据失败: ", error);
        showNotification("获取 Best Sellers 数据失败，请检查控制台", 'error');
        hideLoading();
    });
}

function stopRealtimeListeners() {
    if (unsubscribers.fbmSellers) { unsubscribers.fbmSellers(); unsubscribers.fbmSellers = null; }
    if (unsubscribers.fbaSellers) { unsubscribers.fbaSellers(); unsubscribers.fbaSellers = null; }
    if (unsubscribers.keywords) { unsubscribers.keywords(); unsubscribers.keywords = null; }
    if (unsubscribers.products) { unsubscribers.products(); unsubscribers.products = null; }
    if (unsubscribers.bestsellers) { unsubscribers.bestsellers(); unsubscribers.bestsellers = null; }
}

// === 筛选和排序 ===
function getFilteredSortedFbmStores() {
    const searchTerm = (fbmStoreSearchInput.value || '').toLowerCase();
    const arr = Array.from(fbmStoreData.values()).filter(item => {
        const siteMatch = activeFbmStoreSiteFilter === 'all' || getSiteAbbreviation(item.site) === activeFbmStoreSiteFilter;
        const searchMatch = !searchTerm || (item.sellerName && item.sellerName.toLowerCase().includes(searchTerm));
        return siteMatch && searchMatch;
    });
    arr.sort((a, b) => {
        let valA = a[fbmStoreSortKey], valB = b[fbmStoreSortKey];
        if (fbmStoreSortKey === 'rating') { valA = parseFloat(valA) || 0; valB = parseFloat(valB) || 0; }
        if (valA < valB) return fbmStoreSortDir === 'asc' ? -1 : 1;
        if (valA > valB) return fbmStoreSortDir === 'asc' ? 1 : -1;
        return 0;
    });
    return arr;
}

function getFilteredSortedFbaStores() {
    const searchTerm = (fbaStoreSearchInput.value || '').toLowerCase();
    const arr = Array.from(fbaStoreData.values()).filter(item => {
        const siteMatch = activeFbaStoreSiteFilter === 'all' || getSiteAbbreviation(item.site) === activeFbaStoreSiteFilter;
        const searchMatch = !searchTerm || (item.sellerName && item.sellerName.toLowerCase().includes(searchTerm));
        return siteMatch && searchMatch;
    });
    arr.sort((a, b) => {
        let valA = a[fbaStoreSortKey], valB = b[fbaStoreSortKey];
        if (fbaStoreSortKey === 'rating') { valA = parseFloat(valA) || 0; valB = parseFloat(valB) || 0; }
        if (valA < valB) return fbaStoreSortDir === 'asc' ? -1 : 1;
        if (valA > valB) return fbaStoreSortDir === 'asc' ? 1 : -1;
        return 0;
    });
    return arr;
}

function getFilteredSortedKeywords() {
    const searchTerm = (keywordSearchInput.value || '').toLowerCase();
    const arr = Array.from(keywordData.values()).filter(item => {
        const siteMatch = activeKeywordSiteFilter === 'all' || getSiteAbbreviation(item.site) === activeKeywordSiteFilter;
        const searchMatch = !searchTerm || (item.keyword && item.keyword.toLowerCase().includes(searchTerm)) || (item.keywordZh && item.keywordZh.toLowerCase().includes(searchTerm));
        return siteMatch && searchMatch;
    });
    arr.sort((a, b) => {
        let valA = a[keywordSortKey], valB = b[keywordSortKey];
        if (keywordSortKey === 'date') { valA = a.date ? new Date(a.date) : 0; valB = b.date ? new Date(b.date) : 0; }
        if (valA < valB) return keywordSortDir === 'asc' ? -1 : 1;
        if (valA > valB) return keywordSortDir === 'asc' ? 1 : -1;
        return 0;
    });
    return arr;
}

function getFilteredSortedProducts() {
    const searchTerm = (productSearchInput.value || '').toLowerCase();
    const arr = Array.from(productData.values()).filter(item => {
        const siteMatch = activeProductSiteFilter === 'all' || getSiteAbbreviation(item.site) === activeProductSiteFilter;
        const searchMatch = !searchTerm ||
            (item.productName && item.productName.toLowerCase().includes(searchTerm)) ||
            (item.productNameZh && item.productNameZh.toLowerCase().includes(searchTerm)) ||
            (item.asin && item.asin.toLowerCase().includes(searchTerm));
        return siteMatch && searchMatch;
    });
    arr.sort((a, b) => {
        let valA = a[productSortKey], valB = b[productSortKey];
        if (productSortKey === 'createdAt') { valA = a.createdAt ? new Date(a.createdAt) : 0; valB = b.createdAt ? new Date(b.createdAt) : 0; }
        if (valA < valB) return productSortDir === 'asc' ? -1 : 1;
        if (valA > valB) return productSortDir === 'asc' ? 1 : -1;
        return 0;
    });
    return arr;
}

function getFilteredSortedBestsellers() {
    const searchTerm = (bestsellerSearchInput.value || '').toLowerCase();
    const arr = Array.from(bestsellerData.values()).filter(item => {
        const siteMatch = activeBestsellerSiteFilter === 'all' || getSiteAbbreviation(item.site) === activeBestsellerSiteFilter;
        const searchMatch = !searchTerm ||
            (item.category1 && item.category1.toLowerCase().includes(searchTerm)) ||
            (item.category1Zh && item.category1Zh.toLowerCase().includes(searchTerm)) ||
            (item.subcategory && item.subcategory.toLowerCase().includes(searchTerm)) ||
            (item.subcategoryZh && item.subcategoryZh.toLowerCase().includes(searchTerm));
        return siteMatch && searchMatch;
    });
    arr.sort((a, b) => {
        let valA = a[bestsellerSortKey], valB = b[bestsellerSortKey];
        if (bestsellerSortKey === 'createdAt') { valA = a.createdAt ? new Date(a.createdAt) : 0; valB = b.createdAt ? new Date(b.createdAt) : 0; }
        if (valA < valB) return bestsellerSortDir === 'asc' ? -1 : 1;
        if (valA > valB) return bestsellerSortDir === 'asc' ? 1 : -1;
        return 0;
    });
    return arr;
}

// === 搜索防抖 ===
fbmStoreSearchInput.addEventListener('input', () => {
    clearTimeout(fbmStoreSearchTimer);
    fbmStoreSearchTimer = setTimeout(() => renderFbmStoreTable(), 200);
});

fbaStoreSearchInput.addEventListener('input', () => {
    clearTimeout(fbaStoreSearchTimer);
    fbaStoreSearchTimer = setTimeout(() => renderFbaStoreTable(), 200);
});

keywordSearchInput.addEventListener('input', () => {
    clearTimeout(keywordSearchTimer);
    keywordSearchTimer = setTimeout(() => renderKeywordTable(), 200);
});

productSearchInput.addEventListener('input', () => {
    clearTimeout(productSearchTimer);
    productSearchTimer = setTimeout(() => renderProductTable(), 200);
});

bestsellerSearchInput.addEventListener('input', () => {
    clearTimeout(bestsellerSearchTimer);
    bestsellerSearchTimer = setTimeout(() => renderBestsellerTable(), 200);
});

// === 站点筛选渲染 ===
function renderSiteFilters(container, dataArray, type) {
    container.innerHTML = '';
    const sites = new Set(dataArray.map(item => getSiteAbbreviation(item.site)).filter(site => site && site !== 'N/A'));
    const sortedSites = Array.from(sites).sort();
    
    const allBtn = document.createElement('button');
    allBtn.textContent = '全部站点';
    allBtn.classList.add('btn', 'filter-btn');
    
    const activeFilter = 
        type === 'fbm-store' ? activeFbmStoreSiteFilter :
        type === 'fba-store' ? activeFbaStoreSiteFilter :
        type === 'keyword' ? activeKeywordSiteFilter :
        type === 'product' ? activeProductSiteFilter :
        type === 'bestseller' ? activeBestsellerSiteFilter : 'all';
    
    if (activeFilter === 'all') allBtn.classList.add('active');
    
    allBtn.addEventListener('click', () => {
        if (type === 'fbm-store') activeFbmStoreSiteFilter = 'all';
        else if (type === 'fba-store') activeFbaStoreSiteFilter = 'all';
        else if (type === 'keyword') activeKeywordSiteFilter = 'all';
        else if (type === 'product') activeProductSiteFilter = 'all';
        else if (type === 'bestseller') activeBestsellerSiteFilter = 'all';
        renderXView(type);
        updateFilterButtonState(container, 'all');
    });
    
    container.appendChild(allBtn);
    
    sortedSites.forEach(site => {
        const btn = document.createElement('button');
        btn.textContent = site;
        btn.classList.add('btn', 'filter-btn');
        if (activeFilter === site) btn.classList.add('active');
        
        btn.addEventListener('click', () => {
            if (type === 'fbm-store') activeFbmStoreSiteFilter = site;
            else if (type === 'fba-store') activeFbaStoreSiteFilter = site;
            else if (type === 'keyword') activeKeywordSiteFilter = site;
            else if (type === 'product') activeProductSiteFilter = site;
            else if (type === 'bestseller') activeBestsellerSiteFilter = site;
            renderXView(type);
            updateFilterButtonState(container, site);
        });
        
        container.appendChild(btn);
    });
}

function updateFilterButtonState(container, activeSite) {
    container.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if (activeSite === 'all') container.querySelector('button')?.classList.add('active');
    else {
        const activeBtn = Array.from(container.querySelectorAll('button')).find(btn => btn.textContent === activeSite);
        if (activeBtn) activeBtn.classList.add('active');
    }
}

function renderXView(type) {
    if (type === 'fbm-store') renderFbmStoreTable();
    else if (type === 'fba-store') renderFbaStoreTable();
    else if (type === 'keyword') renderKeywordTable();
    else if (type === 'product') renderProductTable();
    else if (type === 'bestseller') renderBestsellerTable();
}

// === 排序 ===
function updateSortIcon(headerElement, sortDir) {
    const sortIcon = headerElement.querySelector('.sort-icon');
    if (sortIcon) {
        headerElement.closest('thead').querySelectorAll('.sort-icon').forEach(icon => {
            icon.textContent = '';
            icon.dataset.sortDir = '';
        });
        sortIcon.textContent = sortDir === 'asc' ? '▲' : '▼';
        sortIcon.dataset.sortDir = sortDir;
    }
}

fbmRatingHeader.addEventListener('click', () => {
    fbmStoreSortDir = fbmStoreSortDir === 'desc' ? 'asc' : 'desc';
    fbmStoreSortKey = 'rating';
    updateSortIcon(fbmRatingHeader, fbmStoreSortDir);
    renderFbmStoreTable();
});

fbaRatingHeader.addEventListener('click', () => {
    fbaStoreSortDir = fbaStoreSortDir === 'desc' ? 'asc' : 'desc';
    fbaStoreSortKey = 'rating';
    updateSortIcon(fbaRatingHeader, fbaStoreSortDir);
    renderFbaStoreTable();
});

keywordDateHeader.addEventListener('click', () => {
    keywordSortDir = keywordSortDir === 'desc' ? 'asc' : 'desc';
    keywordSortKey = 'date';
    updateSortIcon(keywordDateHeader, keywordSortDir);
    renderKeywordTable();
});

productDateHeader.addEventListener('click', () => {
    productSortDir = productSortDir === 'desc' ? 'asc' : 'desc';
    productSortKey = 'createdAt';
    updateSortIcon(productDateHeader, productSortDir);
    renderProductTable();
});

bestsellerDateHeader.addEventListener('click', () => {
    bestsellerSortDir = bestsellerSortDir === 'desc' ? 'asc' : 'desc';
    bestsellerSortKey = 'createdAt';
    updateSortIcon(bestsellerDateHeader, bestsellerSortDir);
    renderBestsellerTable();
});

// === 虚拟滚动表格 ===
class VirtualTable {
    constructor(containerEl, tbodyEl, rowHeight = 48, buffer = 8) {
        this.container = containerEl;
        this.tbody = tbodyEl;
        this.rowHeight = rowHeight;
        this.buffer = buffer;
        this.onScroll = this.onScroll.bind(this);
        this.currentData = [];
        this.renderedRange = [0, -1];
        this.rafId = null;
        this.container.addEventListener('scroll', this.onScroll, { passive: true });
        this.container.style.willChange = 'transform';
    }

    updateData(newData, renderRow) {
        this.currentData = newData;
        this.totalHeight = newData.length * this.rowHeight;
        this.scheduleRender(renderRow);
    }

    onScroll() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.rafId = requestAnimationFrame(() => this.scheduleRender(this.lastRenderRowFn));
    }

    scheduleRender(renderRow) {
        if (!renderRow) return;
        this.lastRenderRowFn = renderRow;
        const scrollTop = this.container.scrollTop;
        const height = this.container.clientHeight || this.container.offsetHeight;
        const startIdx = Math.max(0, Math.floor(scrollTop / this.rowHeight) - this.buffer);
        const visibleCount = Math.ceil(height / this.rowHeight) + this.buffer * 2;
        const endIdx = Math.min(this.currentData.length - 1, startIdx + visibleCount - 1);

        if (this.renderedRange[0] === startIdx && this.renderedRange[1] === endIdx) return;
        this.renderedRange = [startIdx, endIdx];

        const frag = document.createDocumentFragment();
        for (let i = startIdx; i <= endIdx; i++) {
            const item = this.currentData[i];
            const tr = renderRow(item, i);
            frag.appendChild(tr);
        }

        const topPad = startIdx * this.rowHeight;
        const bottomPad = Math.max(0, this.totalHeight - ((endIdx + 1) * this.rowHeight));

        this.tbody.innerHTML = '';
        if (topPad > 0) {
            const topTr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 20;
            td.style.height = topPad + 'px';
            td.style.padding = 0;
            td.style.border = 'none';
            topTr.appendChild(td);
            this.tbody.appendChild(topTr);
        }
        this.tbody.appendChild(frag);
        if (bottomPad > 0) {
            const bottomTr = document.createElement('tr');
            const td2 = document.createElement('td');
            td2.colSpan = 20;
            td2.style.height = bottomPad + 'px';
            td2.style.padding = 0;
            td2.style.border = 'none';
            bottomTr.appendChild(td2);
            this.tbody.appendChild(bottomTr);
        }
    }

    destroy() {
        this.container.removeEventListener('scroll', this.onScroll);
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.tbody.innerHTML = '';
    }
}

// 创建虚拟滚动器
const fbmStoreVirtualizer = new VirtualTable(document.querySelector('#fbm-stores-view .table-wrapper'), fbmStoreTableBody, 48, 6);
const fbaStoreVirtualizer = new VirtualTable(document.querySelector('#fba-stores-view .table-wrapper'), fbaStoreTableBody, 48, 6);
const keywordVirtualizer = new VirtualTable(document.querySelector('#keywords-view .table-wrapper'), keywordTableBody, 48, 6);
const productVirtualizer = new VirtualTable(document.querySelector('#products-view .table-wrapper'), productTableBody, 72, 6);
const bestsellerVirtualizer = new VirtualTable(document.querySelector('#bestsellers-view .table-wrapper'), bestsellerTableBody, 48, 6);

// 图片懒加载观察器
const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const img = entry.target;
        if (entry.isIntersecting) {
            const src = img.dataset.src || img.dataset.large || img.getAttribute('data-large');
            if (src && img.src !== src) img.src = src;
        }
    });
}, { root: document, rootMargin: '200px', threshold: 0.01 });

// === 行渲染函数 ===
function renderStoreRow(item, index, isFba = false) {
    const tr = document.createElement('tr');
    tr.dataset.id = item.id;
    const selectedIds = isFba ? selectedFbaStoreIds : selectedFbmStoreIds;
    if (selectedIds.has(item.id)) tr.classList.add('selected');

    const sellerNameText = escapeHtml(item.sellerName || 'N/A');
    let sellerHtml = sellerNameText;
    if (item.sellerId && item.site) {
        const sellerUrl = `https://www.${item.site}/sp?ie=UTF8&seller=${encodeURIComponent(item.sellerId)}`;
        sellerHtml = `<a href="${sellerUrl}" target="_blank" rel="noreferrer noopener">${sellerNameText}</a>`;
    } else if (item.url) {
        sellerHtml = `<a href="${item.url}" target="_blank" rel="noreferrer noopener">${sellerNameText}</a>`;
    }

    const checkboxClass = isFba ? 'fba-store-checkbox' : 'fbm-store-checkbox';
    const deleteClass = isFba ? 'delete-fba-store-btn' : 'delete-fbm-store-btn';

    tr.innerHTML = `
        <td><input type="checkbox" class="${checkboxClass}" data-id="${item.id}" ${selectedIds.has(item.id) ? 'checked' : ''}></td>
        <td>${index + 1}</td>
        <td data-tooltip="${item.site || 'N/A'}">${getSiteAbbreviation(item.site) || 'N/A'}</td>
        <td data-tooltip="${item.sellerName || 'N/A'}">${sellerHtml}</td>
        <td data-tooltip="${item.feedback || 'N/A'}">${item.feedback || 'N/A'}</td>
        <td data-tooltip="${item.rating || 'N/A'}">${item.rating || 'N/A'}</td>
        <td data-tooltip="${item.reviews || 'N/A'}">${item.reviews || 'N/A'}</td>
        <td data-tooltip="${item.BestSellers || 'N/A'}">${item.BestSellers || 'N/A'}</td>
        <td data-tooltip="${item.NewestArrivals || 'N/A'}">${item.NewestArrivals || 'N/A'}</td>
        <td><button class="btn secondary-btn ${deleteClass}" data-id="${item.id}">删除</button></td>
    `;
    return tr;
}

function renderKeywordRow(item, index) {
    const tr = document.createElement('tr');
    tr.dataset.id = item.id;
    if (selectedKeywordIds.has(item.id)) tr.classList.add('selected');

    const keywordUrl = item.url || '#';
    const date = item.date || 'N/A';
    const hasUrl = keywordUrl !== '#';
    const keywordLink = hasUrl ? `<a href="${keywordUrl}" target="_blank" rel="noreferrer noopener">${item.keyword || 'N/A'}</a>` : (item.keyword || 'N/A');
    const keywordZhLink = hasUrl ? `<a href="${keywordUrl}" target="_blank" rel="noreferrer noopener">${item.keywordZh || 'N/A'}</a>` : (item.keywordZh || 'N/A');
    const countLink = hasUrl ? `<a href="${keywordUrl}" target="_blank" rel="noreferrer noopener">${item.count || 'N/A'}</a>` : (item.count || 'N/A');

    tr.innerHTML = `
        <td><input type="checkbox" class="keyword-checkbox" data-id="${item.id}" ${selectedKeywordIds.has(item.id) ? 'checked' : ''}></td>
        <td>${index + 1}</td>
        <td data-tooltip="${item.site || 'N/A'}">${getSiteAbbreviation(item.site) || 'N/A'}</td>
        <td data-tooltip="${item.keyword || 'N/A'}">${keywordLink}</td>
        <td data-tooltip="${item.keywordZh || 'N/A'}">${keywordZhLink}</td>
        <td data-tooltip="${item.count || 'N/A'}">${countLink}</td>
        <td data-tooltip="${date}">${date}</td>
        <td><button class="btn secondary-btn delete-keyword-btn" data-id="${item.id}">删除</button></td>
    `;
    return tr;
}

function renderProductRow(item, index) {
    const tr = document.createElement('tr');
    tr.dataset.id = item.id;
    if (selectedProductIds.has(item.id)) tr.classList.add('selected');

    const productUrl = item.url || '#';
    const hasUrl = productUrl !== '#';
    const asinLink = hasUrl ? `<a href="${productUrl}" target="_blank" rel="noreferrer noopener">${item.asin || 'N/A'}</a>` : (item.asin || 'N/A');
    const productNameLink = hasUrl ? `<a href="${productUrl}" target="_blank" rel="noreferrer noopener">${item.productName || 'N/A'}</a>` : (item.productName || 'N/A');
    const productNameZhLink = hasUrl ? `<a href="${productUrl}" target="_blank" rel="noreferrer noopener">${item.productNameZh || 'N/A'}</a>` : (item.productNameZh || 'N/A');
    const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A';
    const imageHtml = item.mainImageURL ? `
        <div class="product-image-container">
            <img data-src="${item.mainImageURL}" alt="Product Image" class="product-image-thumb" loading="lazy">
        </div>` : 'N/A';

    tr.innerHTML = `
        <td><input type="checkbox" class="product-checkbox" data-id="${item.id}" ${selectedProductIds.has(item.id) ? 'checked' : ''}></td>
        <td>${index + 1}</td>
        <td data-tooltip="${item.site || 'N/A'}">${getSiteAbbreviation(item.site) || 'N/A'}</td>
        <td data-tooltip="${item.asin || 'N/A'}">${asinLink}</td>
        <td>${imageHtml}</td>
        <td data-tooltip="${item.price || 'N/A'}">${item.price || 'N/A'}</td>
        <td data-tooltip="${item.productName || 'N/A'}">${productNameLink}</td>
        <td data-tooltip="${item.productNameZh || 'N/A'}">${productNameZhLink}</td>
        <td data-tooltip="${date}">${date}</td>
        <td><button class="btn secondary-btn delete-product-btn" data-id="${item.id}">删除</button></td>
    `;
    return tr;
}

function renderBestsellerRow(item, index) {
    const tr = document.createElement('tr');
    tr.dataset.id = item.id;
    if (selectedBestsellerIds.has(item.id)) tr.classList.add('selected');

    const date = item.createdAt ? (new Date(item.createdAt)).toLocaleDateString() : 'N/A';

    const urlCategory1 = resolveBestsellerUrl(item, 'category1');
    const urlCategory1Zh = resolveBestsellerUrl(item, 'category1Zh');
    const urlSubcategory = resolveBestsellerUrl(item, 'subcategory');
    const urlSubcategoryZh = resolveBestsellerUrl(item, 'subcategoryZh');

    const cat1Text = escapeHtml(item.category1 || 'N/A');
    const cat1ZhText = escapeHtml(item.category1Zh || 'N/A');
    const subText = escapeHtml(item.subcategory || 'N/A');
    const subZhText = escapeHtml(item.subcategoryZh || 'N/A');

    const cat1Link = urlCategory1 && urlCategory1 !== '#' ? `<a href="${urlCategory1}" target="_blank" rel="noreferrer noopener">${cat1Text}</a>` : cat1Text;
    const cat1ZhLink = urlCategory1Zh && urlCategory1Zh !== '#' ? `<a href="${urlCategory1Zh}" target="_blank" rel="noreferrer noopener">${cat1ZhText}</a>` : cat1ZhText;
    const subLink = urlSubcategory && urlSubcategory !== '#' ? `<a href="${urlSubcategory}" target="_blank" rel="noreferrer noopener">${subText}</a>` : subText;
    const subZhLink = urlSubcategoryZh && urlSubcategoryZh !== '#' ? `<a href="${urlSubcategoryZh}" target="_blank" rel="noreferrer noopener">${subZhText}</a>` : subZhText;

    tr.innerHTML = `
        <td><input type="checkbox" class="bestseller-checkbox" data-id="${item.id}" ${selectedBestsellerIds.has(item.id) ? 'checked' : ''}></td>
        <td>${index + 1}</td>
        <td data-tooltip="${item.site || 'N/A'}">${getSiteAbbreviation(item.site) || 'N/A'}</td>
        <td data-tooltip="${item.category1 || 'N/A'}">${cat1Link}</td>
        <td data-tooltip="${item.category1Zh || 'N/A'}">${cat1ZhLink}</td>
        <td data-tooltip="${item.subcategory || 'N/A'}">${subLink}</td>
        <td data-tooltip="${item.subcategoryZh || 'N/A'}">${subZhLink}</td>
        <td data-tooltip="${date}">${date}</td>
        <td><button class="btn secondary-btn delete-bestseller-btn" data-id="${item.id}">删除</button></td>
    `;
    return tr;
}

// === 表格渲染函数 ===
function renderFbmStoreTable() {
    const rows = getFilteredSortedFbmStores();
    fbmStoreNoData.classList.add('hidden');
    fbmStoreCountSpan.textContent = rows.length;
    fbmStoreDeleteSelectedBtn.disabled = selectedFbmStoreIds.size === 0;

    if (rows.length === 0) {
        fbmStoreNoData.classList.remove('hidden');
        fbmStoreSelectAll.disabled = true;
        fbmStoreSelectAll.checked = false;
        fbmStoreVirtualizer.updateData([], () => {});
        return;
    }
    fbmStoreSelectAll.disabled = false;

    fbmStoreVirtualizer.updateData(rows, (item, idx) => renderStoreRow(item, idx, false));

    const filteredIds = rows.map(r => r.id);
    fbmStoreSelectAll.checked = filteredIds.length > 0 && filteredIds.every(id => selectedFbmStoreIds.has(id));
}

function renderFbaStoreTable() {
    const rows = getFilteredSortedFbaStores();
    fbaStoreNoData.classList.add('hidden');
    fbaStoreCountSpan.textContent = rows.length;
    fbaStoreDeleteSelectedBtn.disabled = selectedFbaStoreIds.size === 0;

    if (rows.length === 0) {
        fbaStoreNoData.classList.remove('hidden');
        fbaStoreSelectAll.disabled = true;
        fbaStoreSelectAll.checked = false;
        fbaStoreVirtualizer.updateData([], () => {});
        return;
    }
    fbaStoreSelectAll.disabled = false;

    fbaStoreVirtualizer.updateData(rows, (item, idx) => renderStoreRow(item, idx, true));

    const filteredIds = rows.map(r => r.id);
    fbaStoreSelectAll.checked = filteredIds.length > 0 && filteredIds.every(id => selectedFbaStoreIds.has(id));
}

function renderKeywordTable() {
    const rows = getFilteredSortedKeywords();
    keywordNoData.classList.add('hidden');
    keywordCountSpan.textContent = rows.length;
    keywordDeleteSelectedBtn.disabled = selectedKeywordIds.size === 0;

    if (rows.length === 0) {
        keywordNoData.classList.remove('hidden');
        keywordSelectAll.disabled = true;
        keywordSelectAll.checked = false;
        keywordVirtualizer.updateData([], () => {});
        return;
    }
    keywordSelectAll.disabled = false;

    keywordVirtualizer.updateData(rows, (item, idx) => renderKeywordRow(item, idx));

    const filteredIds = rows.map(r => r.id);
    keywordSelectAll.checked = filteredIds.length > 0 && filteredIds.every(id => selectedKeywordIds.has(id));
}

function renderProductTable() {
    const rows = getFilteredSortedProducts();
    productNoData.classList.add('hidden');
    productCountSpan.textContent = rows.length;
    productDeleteSelectedBtn.disabled = selectedProductIds.size === 0;

    if (rows.length === 0) {
        productNoData.classList.remove('hidden');
        productSelectAll.disabled = true;
        productSelectAll.checked = false;
        productVirtualizer.updateData([], () => {});
        return;
    }
    productSelectAll.disabled = false;

    productVirtualizer.updateData(rows, (item, idx) => {
        const tr = renderProductRow(item, idx);
        const thumb = tr.querySelector('.product-image-thumb');
        if (thumb) imageObserver.observe(thumb);
        return tr;
    });

    const filteredIds = rows.map(r => r.id);
    productSelectAll.checked = filteredIds.length > 0 && filteredIds.every(id => selectedProductIds.has(id));
}

function renderBestsellerTable() {
    const rows = getFilteredSortedBestsellers();
    bestsellerNoData.classList.add('hidden');
    bestsellerCountSpan.textContent = rows.length;
    bestsellerDeleteSelectedBtn.disabled = selectedBestsellerIds.size === 0;

    if (rows.length === 0) {
        bestsellerNoData.classList.remove('hidden');
        bestsellerSelectAll.disabled = true;
        bestsellerSelectAll.checked = false;
        bestsellerVirtualizer.updateData([], () => {});
        return;
    }
    bestsellerSelectAll.disabled = false;

    bestsellerVirtualizer.updateData(rows, (item, idx) => renderBestsellerRow(item, idx));

    const filteredIds = rows.map(r => r.id);
    bestsellerSelectAll.checked = filteredIds.length > 0 && filteredIds.every(id => selectedBestsellerIds.has(id));
}

// === 事件委托 ===
// FBM Store
fbmStoreTableBody.addEventListener('click', (e) => {
    const row = e.target.closest('tr');
    if (!row) return;
    const id = row.dataset.id;
    if (e.target.classList.contains('delete-fbm-store-btn')) { deleteFbmStore(id); return; }
    if (e.target.closest('a')) return;
    if (e.target.tagName.toLowerCase() === 'input' && e.target.classList.contains('fbm-store-checkbox')) return;
    const checkbox = row.querySelector('.fbm-store-checkbox');
    if (checkbox) { checkbox.checked = !checkbox.checked; checkbox.dispatchEvent(new Event('change', { bubbles: true })); }
});

fbmStoreTableBody.addEventListener('change', (e) => {
    if (!e.target.classList.contains('fbm-store-checkbox')) return;
    const id = e.target.dataset.id;
    const row = e.target.closest('tr');
    if (e.target.checked) { selectedFbmStoreIds.add(id); row?.classList.add('selected'); }
    else { selectedFbmStoreIds.delete(id); row?.classList.remove('selected'); }
    fbmStoreDeleteSelectedBtn.disabled = selectedFbmStoreIds.size === 0;
    const currentFiltered = getFilteredSortedFbmStores().map(i => i.id);
    fbmStoreSelectAll.checked = currentFiltered.length > 0 && currentFiltered.every(fid => selectedFbmStoreIds.has(fid));
});

// FBA Store
fbaStoreTableBody.addEventListener('click', (e) => {
    const row = e.target.closest('tr');
    if (!row) return;
    const id = row.dataset.id;
    if (e.target.classList.contains('delete-fba-store-btn')) { deleteFbaStore(id); return; }
    if (e.target.closest('a')) return;
    if (e.target.tagName.toLowerCase() === 'input' && e.target.classList.contains('fba-store-checkbox')) return;
    const checkbox = row.querySelector('.fba-store-checkbox');
    if (checkbox) { checkbox.checked = !checkbox.checked; checkbox.dispatchEvent(new Event('change', { bubbles: true })); }
});

fbaStoreTableBody.addEventListener('change', (e) => {
    if (!e.target.classList.contains('fba-store-checkbox')) return;
    const id = e.target.dataset.id;
    const row = e.target.closest('tr');
    if (e.target.checked) { selectedFbaStoreIds.add(id); row?.classList.add('selected'); }
    else { selectedFbaStoreIds.delete(id); row?.classList.remove('selected'); }
    fbaStoreDeleteSelectedBtn.disabled = selectedFbaStoreIds.size === 0;
    const currentFiltered = getFilteredSortedFbaStores().map(i => i.id);
    fbaStoreSelectAll.checked = currentFiltered.length > 0 && currentFiltered.every(fid => selectedFbaStoreIds.has(fid));
});

// Keywords
keywordTableBody.addEventListener('click', (e) => {
    const row = e.target.closest('tr');
    if (!row) return;
    const id = row.dataset.id;
    if (e.target.classList.contains('delete-keyword-btn')) { deleteKeyword(id); return; }
    if (e.target.tagName.toLowerCase() === 'input' && e.target.classList.contains('keyword-checkbox')) return;
    const checkbox = row.querySelector('.keyword-checkbox');
    if (checkbox) { checkbox.checked = !checkbox.checked; checkbox.dispatchEvent(new Event('change', { bubbles: true })); }
});

keywordTableBody.addEventListener('change', (e) => {
    if (!e.target.classList.contains('keyword-checkbox')) return;
    const id = e.target.dataset.id;
    const row = e.target.closest('tr');
    if (e.target.checked) { selectedKeywordIds.add(id); row?.classList.add('selected'); }
    else { selectedKeywordIds.delete(id); row?.classList.remove('selected'); }
    keywordDeleteSelectedBtn.disabled = selectedKeywordIds.size === 0;
    const currentFiltered = getFilteredSortedKeywords().map(i => i.id);
    keywordSelectAll.checked = currentFiltered.length > 0 && currentFiltered.every(fid => selectedKeywordIds.has(fid));
});

// Products
productTableBody.addEventListener('click', (e) => {
    const row = e.target.closest('tr');
    if (!row) return;
    const id = row.dataset.id;
    if (e.target.classList.contains('delete-product-btn')) { deleteProduct(id); return; }
    if (e.target.tagName.toLowerCase() === 'input' && e.target.classList.contains('product-checkbox')) return;
    const thumb = e.target.closest('.product-image-thumb');
    if (thumb) {
        const url = thumb.dataset.src || thumb.getAttribute('data-src');
        if (url) showLargeImage(url);
        return;
    }
    const checkbox = row.querySelector('.product-checkbox');
    if (checkbox) { checkbox.checked = !checkbox.checked; checkbox.dispatchEvent(new Event('change', { bubbles: true })); }
});

productTableBody.addEventListener('change', (e) => {
    if (!e.target.classList.contains('product-checkbox')) return;
    const id = e.target.dataset.id;
    const row = e.target.closest('tr');
    if (e.target.checked) { selectedProductIds.add(id); row?.classList.add('selected'); }
    else { selectedProductIds.delete(id); row?.classList.remove('selected'); }
    productDeleteSelectedBtn.disabled = selectedProductIds.size === 0;
    const currentFiltered = getFilteredSortedProducts().map(i => i.id);
    productSelectAll.checked = currentFiltered.length > 0 && currentFiltered.every(fid => selectedProductIds.has(fid));
});

// Best Sellers
bestsellerTableBody.addEventListener('click', (e) => {
    const row = e.target.closest('tr');
    if (!row) return;
    const id = row.dataset.id;
    if (e.target.classList.contains('delete-bestseller-btn')) { deleteBestseller(id); return; }
    if (e.target.closest('a')) return;
    if (e.target.tagName.toLowerCase() === 'input' && e.target.classList.contains('bestseller-checkbox')) return;
    const checkbox = row.querySelector('.bestseller-checkbox');
    if (checkbox) { checkbox.checked = !checkbox.checked; checkbox.dispatchEvent(new Event('change', { bubbles: true })); }
});

bestsellerTableBody.addEventListener('change', (e) => {
    if (!e.target.classList.contains('bestseller-checkbox')) return;
    const id = e.target.dataset.id;
    const row = e.target.closest('tr');
    if (e.target.checked) { selectedBestsellerIds.add(id); row?.classList.add('selected'); }
    else { selectedBestsellerIds.delete(id); row?.classList.remove('selected'); }
    bestsellerDeleteSelectedBtn.disabled = selectedBestsellerIds.size === 0;
    const currentFiltered = getFilteredSortedBestsellers().map(i => i.id);
    bestsellerSelectAll.checked = currentFiltered.length > 0 && currentFiltered.every(fid => selectedBestsellerIds.has(fid));
});

// === 图片预览 ===
let largeImageOverlay = null;

function showLargeImage(url) {
    removeLargeImage();
    largeImageOverlay = document.createElement('div');
    largeImageOverlay.className = 'product-image-overlay';
    const img = document.createElement('img');
    img.className = 'product-image-large';
    img.src = url;
    img.alt = 'Product Image Large';
    document.body.appendChild(largeImageOverlay);
    document.body.appendChild(img);
    requestAnimationFrame(() => {
        largeImageOverlay.style.opacity = '1';
        img.style.transform = 'translate(-50%, -50%) scale(1)';
        img.style.opacity = '1';
        img.style.pointerEvents = 'auto';
    });
    const remover = () => removeLargeImage();
    largeImageOverlay.addEventListener('click', remover);
    img.addEventListener('click', remover);
}

function removeLargeImage() {
    const big = document.querySelector('.product-image-large');
    const overlay = document.querySelector('.product-image-overlay');
    if (big && big.parentNode) big.parentNode.removeChild(big);
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    largeImageOverlay = null;
}

// === CSV 解析 ===
function parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (!lines.length) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length !== headers.length) { console.warn(`跳过格式不正确的行: ${lines[i]}`); continue; }
        const obj = {};
        for (let j = 0; j < headers.length; j++) obj[headers[j]] = values[j];
        data.push(obj);
    }
    return data;
}

// === 文件导入 ===
async function handleFileImport(event, collectionName, requiredKeys, successMessage) {
    const file = event.target.files[0];
    if (!file) return;
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const reader = new FileReader();
    reader.onload = async (e) => {
        const content = e.target.result;
        try {
            let data = null;
            if (fileExtension === 'json') {
                const trimmedContent = content.trim();
                if (!trimmedContent) throw new Error('JSON 文件内容为空。');
                data = JSON.parse(trimmedContent);
            } else if (fileExtension === 'csv') {
                data = parseCSV(content);
            } else throw new Error('不支持的文件类型。请上传 JSON 或 CSV 文件。');

            if (!data || !Array.isArray(data)) throw new Error('导入的数据格式不正确，期望一个数组。');
            if (data.length > 0) {
                const firstItem = data[0];
                const missingKeys = requiredKeys.filter(k => !(k in firstItem));
                if (missingKeys.length > 0) throw new Error(`数据中缺少必要的字段: ${missingKeys.join(', ')}。`);
            }
            await importDataToFirestore(db.collection(collectionName), data);
            showNotification(successMessage, 'success');
        } catch (err) {
            console.error('文件解析失败:', err);
            showNotification(`文件解析失败：${err.message}`, 'error');
        }
    };
    reader.readAsText(file);
}

// === Firestore 导入 ===
async function importDataToFirestore(collectionRef, data) {
    if (!data.length) { showNotification('导入数据为空，操作取消。', 'info'); return; }
    const now = new Date().toISOString();
    const uniqueRecords = new Map();
    let importKeys = [];

    if (collectionRef.id === 'amazonFBMSeller' || collectionRef.id === 'amazonFBASeller') {
        importKeys = ['site', 'sellerId'];
    } else if (collectionRef.id === 'amazonKeywords') {
        importKeys = ['site', 'keyword'];
    } else {
        importKeys = ['asin'];
    }

    for (const record of data) {
        const key = importKeys.map(k => record[k]).join('|');
        if (key) uniqueRecords.set(key, record);
    }

    if (!uniqueRecords.size) { showNotification('导入的数据中没有有效记录，操作取消。', 'info'); return; }

    const existingDocsMap = new Map();
    const CHUNK_SIZE = 30;

    if (collectionRef.id === 'amazonProducts') {
        const uniqueAsins = Array.from(new Set(Array.from(uniqueRecords.values()).map(r => r.asin)));
        for (let i = 0; i < uniqueAsins.length; i += CHUNK_SIZE) {
            const chunk = uniqueAsins.slice(i, i + CHUNK_SIZE);
            const snap = await collectionRef.where('asin', 'in', chunk).get();
            snap.forEach(doc => existingDocsMap.set(doc.data().asin, { id: doc.id, data: doc.data() }));
        }
    } else {
        const uniqueSites = Array.from(new Set(Array.from(uniqueRecords.values()).map(r => r.site)));
        const uniqueKeys = Array.from(new Set(Array.from(uniqueRecords.values()).map(r => r[importKeys[1]])));
        for (let i = 0; i < uniqueSites.length; i++) {
            const site = uniqueSites[i];
            for (let j = 0; j < uniqueKeys.length; j += CHUNK_SIZE) {
                const chunk = uniqueKeys.slice(j, j + CHUNK_SIZE);
                const snap = await collectionRef.where('site', '==', site).where(importKeys[1], 'in', chunk).get();
                snap.forEach(doc => {
                    const uid = `${doc.data().site}|${doc.data()[importKeys[1]]}`;
                    existingDocsMap.set(uid, { id: doc.id, data: doc.data() });
                });
            }
        }
    }

    const allRecords = Array.from(uniqueRecords.values());
    const BATCH_SIZE = 400;
    for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
        const chunk = allRecords.slice(i, i + BATCH_SIZE);
        const batch = db.batch();
        for (const record of chunk) {
            let uniqueId = collectionRef.id === 'amazonProducts' ? record.asin : importKeys.map(k => record[k]).join('|');
            const existingDoc = existingDocsMap.get(uniqueId);
            if (existingDoc) {
                const updatedItem = { ...existingDoc.data, ...record, updatedAt: now };
                batch.update(collectionRef.doc(existingDoc.id), updatedItem);
            } else {
                const newItem = { ...record, createdAt: now, updatedAt: now };
                batch.set(collectionRef.doc(), newItem);
            }
        }
        await batch.commit();
    }
    console.log("所有数据已成功导入。");
}

// === 导入/导出/模板按钮 ===
fbmStoreImportBtn.addEventListener('click', () => fbmStoreImportFile.click());
fbmStoreImportFile.addEventListener('change', (e) => handleFileImport(e, 'amazonFBMSeller', ['site', 'sellerId'], 'FBM店铺数据导入成功！'));

fbaStoreImportBtn.addEventListener('click', () => fbaStoreImportFile.click());
fbaStoreImportFile.addEventListener('change', (e) => handleFileImport(e, 'amazonFBASeller', ['site', 'sellerId'], 'FBA店铺数据导入成功！'));

keywordImportBtn.addEventListener('click', () => keywordImportFile.click());
keywordImportFile.addEventListener('change', (e) => handleFileImport(e, 'amazonKeywords', ['site', 'keyword'], '关键词数据导入成功！'));

productImportBtn.addEventListener('click', () => productImportFile.click());
productImportFile.addEventListener('change', (e) => handleFileImport(e, 'amazonProducts', ['asin'], '产品数据导入成功！'));

// === 导出 ===
function exportData(data, type, filename) {
    if (!data.length) { showNotification('无数据可导出。', 'error'); return; }
    let content = '', mimeType = '';
    if (type === 'json') { content = JSON.stringify(data, null, 2); mimeType = 'application/json'; }
    else if (type === 'csv') {
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(item => Object.values(item).map(v => (`${v || ''}`).replace(/"/g, '""')).map(v => `"${v}"`).join(','));
        content = [headers, ...rows].join('\n');
        mimeType = 'text/csv';
    } else { showNotification('不支持的导出格式。', 'error'); return; }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('数据导出成功！', 'success');
}

fbmStoreExportBtn.addEventListener('click', () => exportData(getFilteredSortedFbmStores(), 'csv', 'amazon_fbm_seller.csv'));
fbaStoreExportBtn.addEventListener('click', () => exportData(getFilteredSortedFbaStores(), 'csv', 'amazon_fba_seller.csv'));
keywordExportBtn.addEventListener('click', () => exportData(getFilteredSortedKeywords(), 'csv', 'amazon_keywords.csv'));
productExportBtn.addEventListener('click', () => exportData(getFilteredSortedProducts(), 'csv', 'amazon_products.csv'));
bestsellerExportBtn?.addEventListener('click', () => exportData(getFilteredSortedBestsellers(), 'csv', 'amazon_bestsellers.csv'));

// === 下载模板 ===
function downloadTemplate(keys, filename) {
    const templateData = [{ ...keys.reduce((acc, key) => (acc[key] = '', acc), {}) }];
    exportData(templateData, 'csv', filename);
}

fbmStoreDownloadTemplateBtn.addEventListener('click', () => downloadTemplate(['sellerId', 'site', 'sellerName', 'feedback', 'rating', 'reviews', 'BestSellers', 'NewestArrivals'], 'fbm_stores_template.csv'));
fbaStoreDownloadTemplateBtn.addEventListener('click', () => downloadTemplate(['sellerId', 'site', 'sellerName', 'feedback', 'rating', 'reviews', 'BestSellers', 'NewestArrivals'], 'fba_stores_template.csv'));
keywordDownloadTemplateBtn.addEventListener('click', () => downloadTemplate(['keyword', 'site', 'keywordZh', 'url', 'count', 'date'], 'keywords_template.csv'));
productDownloadTemplateBtn.addEventListener('click', () => downloadTemplate(['asin', 'site', 'productName', 'productNameZh', 'price', 'mainImageURL'], 'products_template.csv'));

// === 删除 ===
async function deleteData(collectionName, ids) {
    if (!ids || ids.length === 0) { showNotification('未选择任何项。', 'info'); return; }
    const confirmMessage = `您确定要删除选中的 ${ids.length} 条数据吗？此操作无法撤销。`;
    if (!confirm(confirmMessage)) return;
    try {
        const batch = db.batch();
        ids.forEach(id => batch.delete(db.collection(collectionName).doc(id)));
        await batch.commit();
        showNotification('数据删除成功！', 'success');
    } catch (err) {
        console.error("删除失败: ", err);
        showNotification('删除失败，请检查控制台。', 'error');
    }
}

async function deleteFbmStore(id) {
    if (!confirm("您确定要删除这条 FBM 店铺数据吗？此操作无法撤销。")) return;
    try {
        await db.collection('amazonFBMSeller').doc(id).delete();
        showNotification('FBM 店铺数据删除成功！', 'success');
        selectedFbmStoreIds.delete(id);
    } catch (err) {
        console.error("删除失败: ", err);
        showNotification('删除失败，请检查控制台。', 'error');
    }
}

async function deleteFbaStore(id) {
    if (!confirm("您确定要删除这条 FBA 店铺数据吗？此操作无法撤销。")) return;
    try {
        await db.collection('amazonFBASeller').doc(id).delete();
        showNotification('FBA 店铺数据删除成功！', 'success');
        selectedFbaStoreIds.delete(id);
    } catch (err) {
        console.error("删除失败: ", err);
        showNotification('删除失败，请检查控制台。', 'error');
    }
}

async function deleteKeyword(id) {
    if (!confirm("您确定要删除这条关键词数据吗？此操作无法撤销。")) return;
    try {
        await db.collection('amazonKeywords').doc(id).delete();
        showNotification('关键词数据删除成功！', 'success');
        selectedKeywordIds.delete(id);
    } catch (err) {
        console.error("删除失败: ", err);
        showNotification('删除失败，请检查控制台。', 'error');
    }
}

async function deleteProduct(id) {
    if (!confirm("您确定要删除这条产品数据吗？此操作无法撤销。")) return;
    try {
        await db.collection('amazonProducts').doc(id).delete();
        showNotification('产品数据删除成功！', 'success');
        selectedProductIds.delete(id);
    } catch (err) {
        console.error("删除失败: ", err);
        showNotification('删除失败，请检查控制台。', 'error');
    }
}

async function deleteBestseller(id) {
    if (!confirm("您确定要删除这条 Best Sellers 数据吗？此操作无法撤销。")) return;
    try {
        await db.collection('amazonBestsellers').doc(id).delete();
        showNotification('Best Sellers 数据删除成功！', 'success');
        selectedBestsellerIds.delete(id);
    } catch (err) {
        console.error("删除失败: ", err);
        showNotification('删除失败，请检查控制台。', 'error');
    }
}

// 批量删除按钮
fbmStoreDeleteSelectedBtn.addEventListener('click', () => deleteData('amazonFBMSeller', Array.from(selectedFbmStoreIds)));
fbaStoreDeleteSelectedBtn.addEventListener('click', () => deleteData('amazonFBASeller', Array.from(selectedFbaStoreIds)));
keywordDeleteSelectedBtn.addEventListener('click', () => deleteData('amazonKeywords', Array.from(selectedKeywordIds)));
productDeleteSelectedBtn.addEventListener('click', () => deleteData('amazonProducts', Array.from(selectedProductIds)));
bestsellerDeleteSelectedBtn?.addEventListener('click', () => deleteData('amazonBestsellers', Array.from(selectedBestsellerIds)));

// === 全选行为 ===
fbmStoreSelectAll.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    const current = getFilteredSortedFbmStores().map(i => i.id);
    if (isChecked) current.forEach(id => selectedFbmStoreIds.add(id));
    else current.forEach(id => selectedFbmStoreIds.delete(id));
    renderFbmStoreTable();
});

fbaStoreSelectAll.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    const current = getFilteredSortedFbaStores().map(i => i.id);
    if (isChecked) current.forEach(id => selectedFbaStoreIds.add(id));
    else current.forEach(id => selectedFbaStoreIds.delete(id));
    renderFbaStoreTable();
});

keywordSelectAll.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    const current = getFilteredSortedKeywords().map(i => i.id);
    if (isChecked) current.forEach(id => selectedKeywordIds.add(id));
    else current.forEach(id => selectedKeywordIds.delete(id));
    renderKeywordTable();
});

productSelectAll.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    const current = getFilteredSortedProducts().map(i => i.id);
    if (isChecked) current.forEach(id => selectedProductIds.add(id));
    else current.forEach(id => selectedProductIds.delete(id));
    renderProductTable();
});

bestsellerSelectAll?.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    const current = getFilteredSortedBestsellers().map(i => i.id);
    if (isChecked) current.forEach(id => selectedBestsellerIds.add(id));
    else current.forEach(id => selectedBestsellerIds.delete(id));
    renderBestsellerTable();
});

// === 标签页切换 ===
fbmStoresTab.addEventListener('click', () => {
    if (fbmStoresTab.classList.contains('active')) return;
    fbmStoresTab.classList.add('active');
    fbaStoresTab.classList.remove('active');
    keywordsTab.classList.remove('active');
    productsTab.classList.remove('active');
    bestsellersTab.classList.remove('active');

    fbmStoresView.classList.remove('hidden');
    fbaStoresView.classList.add('hidden');
    keywordsView.classList.add('hidden');
    productsView.classList.add('hidden');
    bestsellersView.classList.add('hidden');

    processFbmStoreData();
    updateSortIcon(fbmRatingHeader, fbmStoreSortDir);
});

fbaStoresTab.addEventListener('click', () => {
    if (fbaStoresTab.classList.contains('active')) return;
    fbaStoresTab.classList.add('active');
    fbmStoresTab.classList.remove('active');
    keywordsTab.classList.remove('active');
    productsTab.classList.remove('active');
    bestsellersTab.classList.remove('active');

    fbaStoresView.classList.remove('hidden');
    fbmStoresView.classList.add('hidden');
    keywordsView.classList.add('hidden');
    productsView.classList.add('hidden');
    bestsellersView.classList.add('hidden');

    processFbaStoreData();
    updateSortIcon(fbaRatingHeader, fbaStoreSortDir);
});

keywordsTab.addEventListener('click', () => {
    if (keywordsTab.classList.contains('active')) return;
    keywordsTab.classList.add('active');
    fbmStoresTab.classList.remove('active');
    fbaStoresTab.classList.remove('active');
    productsTab.classList.remove('active');
    bestsellersTab.classList.remove('active');

    keywordsView.classList.remove('hidden');
    fbmStoresView.classList.add('hidden');
    fbaStoresView.classList.add('hidden');
    productsView.classList.add('hidden');
    bestsellersView.classList.add('hidden');

    processKeywordData();
    updateSortIcon(keywordDateHeader, keywordSortDir);
});

productsTab.addEventListener('click', () => {
    if (productsTab.classList.contains('active')) return;
    productsTab.classList.add('active');
    fbmStoresTab.classList.remove('active');
    fbaStoresTab.classList.remove('active');
    keywordsTab.classList.remove('active');
    bestsellersTab.classList.remove('active');

    productsView.classList.remove('hidden');
    fbmStoresView.classList.add('hidden');
    fbaStoresView.classList.add('hidden');
    keywordsView.classList.add('hidden');
    bestsellersView.classList.add('hidden');

    processProductData();
    updateSortIcon(productDateHeader, productSortDir);
});

bestsellersTab?.addEventListener('click', () => {
    if (bestsellersTab.classList.contains('active')) return;
    bestsellersTab.classList.add('active');
    fbmStoresTab.classList.remove('active');
    fbaStoresTab.classList.remove('active');
    keywordsTab.classList.remove('active');
    productsTab.classList.remove('active');

    bestsellersView.classList.remove('hidden');
    fbmStoresView.classList.add('hidden');
    fbaStoresView.classList.add('hidden');
    keywordsView.classList.add('hidden');
    productsView.classList.add('hidden');

    processBestsellerData();
    updateSortIcon(bestsellerDateHeader, bestsellerSortDir);
});

// === 处理函数 ===
function processFbmStoreData() {
    renderSiteFilters(fbmStoreFiltersDiv, Array.from(fbmStoreData.values()), 'fbm-store');
    renderFbmStoreTable();
}

function processFbaStoreData() {
    renderSiteFilters(fbaStoreFiltersDiv, Array.from(fbaStoreData.values()), 'fba-store');
    renderFbaStoreTable();
}

function processKeywordData() {
    renderSiteFilters(keywordFiltersDiv, Array.from(keywordData.values()), 'keyword');
    renderKeywordTable();
}

function processProductData() {
    renderSiteFilters(productFiltersDiv, Array.from(productData.values()), 'product');
    renderProductTable();
}

function processBestsellerData() {
    renderSiteFilters(bestsellerFiltersDiv, Array.from(bestsellerData.values()), 'bestseller');
    renderBestsellerTable();
}

// === 初始化完成 ===
console.log('Amazon Tools 应用已加载');