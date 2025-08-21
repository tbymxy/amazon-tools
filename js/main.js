// main.js

// ⚠️ 请将您的 Firebase 配置对象粘贴到这里 ⚠️
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

// DOM 元素
const authContainer = document.getElementById('auth-container');
const mainContainer = document.getElementById('main-container');
const loginForm = document.getElementById('login-form');
const authError = document.getElementById('auth-error');
const logoutBtn = document.getElementById('logout-btn');
const storesTab = document.getElementById('stores-tab');
const keywordsTab = document.getElementById('keywords-tab');
const productsTab = document.getElementById('products-tab');
const storesView = document.getElementById('stores-view');
const keywordsView = document.getElementById('keywords-view');
const productsView = document.getElementById('products-view');
const loadingSkeleton = document.getElementById('loading-skeleton');

const storeTableBody = document.getElementById('store-table-body');
const storeNoData = document.getElementById('stores-no-data');
const keywordTableBody = document.getElementById('keyword-table-body');
const keywordNoData = document.getElementById('keywords-no-data');
const productTableBody = document.getElementById('product-table-body');
const productNoData = document.getElementById('products-no-data');

const storeCountSpan = document.getElementById('store-count');
const keywordCountSpan = document.getElementById('keyword-count');
const productCountSpan = document.getElementById('product-count');

const ratingHeader = document.getElementById('rating-header');
const keywordDateHeader = document.getElementById('keyword-date-header');
const productDateHeader = document.getElementById('product-date-header');

const storeFiltersDiv = document.getElementById('store-filters');
const keywordFiltersDiv = document.getElementById('keyword-filters');
const productFiltersDiv = document.getElementById('product-filters');

const storeSearchInput = document.getElementById('store-search-input');
const keywordSearchInput = document.getElementById('keyword-search-input');
const productSearchInput = document.getElementById('product-search-input');

const storeImportBtn = document.getElementById('store-import-btn');
const storeImportFile = document.getElementById('store-import-file');
const storeExportBtn = document.getElementById('store-export-btn');
const storeSelectAll = document.getElementById('store-select-all');
const storeDeleteSelectedBtn = document.getElementById('store-delete-selected-btn');
const storeDownloadTemplateBtn = document.getElementById('store-download-template-btn');

const keywordImportBtn = document.getElementById('keyword-import-btn');
const keywordImportFile = document.getElementById('keyword-import-file');
const keywordExportBtn = document.getElementById('keyword-export-btn');
const keywordSelectAll = document.getElementById('keyword-select-all');
const keywordDeleteSelectedBtn = document.getElementById('keyword-delete-selected-btn');
const keywordDownloadTemplateBtn = document.getElementById('keyword-download-template-btn');

const productImportBtn = document.getElementById('product-import-btn');
const productImportFile = document.getElementById('product-import-file');
const productExportBtn = document.getElementById('product-export-btn');
const productSelectAll = document.getElementById('product-select-all');
const productDeleteSelectedBtn = document.getElementById('product-delete-selected-btn');
const productDownloadTemplateBtn = document.getElementById('product-download-template-btn');

// 通知容器
const notificationContainer = document.getElementById('notification-container');


// 原始数据和过滤数据
let storeData = [];
let keywordData = [];
let productData = [];
let filteredStoreData = [];
let filteredKeywordData = [];
let filteredProductData = [];

// 排序和筛选状态
let storeSortKey = 'rating';
let storeSortDir = 'desc';
let keywordSortKey = 'date';
let keywordSortDir = 'desc';
let productSortKey = 'createdAt';
let productSortDir = 'desc';

let activeStoreSiteFilter = 'all';
let activeKeywordSiteFilter = 'all';
let activeProductSiteFilter = 'all';

// 多选状态
let selectedStoreIds = [];
let selectedKeywordIds = [];
let selectedProductIds = [];

// 亚马逊站点域名与缩写映射
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

// 根据域名获取站点缩写
function getSiteAbbreviation(domain) {
    return SITE_MAP[domain] || domain;
}

// --- 通用通知功能 ---
/**
 * 显示一个临时的通知
 * @param {string} message - 通知信息
 * @param {'success'|'error'} type - 通知类型
 */
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    notificationContainer.appendChild(notification);

    // 在 3 秒后自动移除通知
    setTimeout(() => {
        notification.remove();
    }, 3000);
}


// --- 认证功能 ---
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

logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

auth.onAuthStateChanged((user) => {
    if (user) {
        authContainer.classList.add('hidden');
        mainContainer.classList.remove('hidden');
        showLoading();
        // 自动启动实时监听
        startRealtimeListeners();
    } else {
        authContainer.classList.remove('hidden');
        mainContainer.classList.add('hidden');
    }
});

function showLoading() {
    loadingSkeleton.classList.remove('hidden');
    storesView.classList.add('hidden');
    keywordsView.classList.add('hidden');
    productsView.classList.add('hidden');
}

function hideLoading() {
    loadingSkeleton.classList.add('hidden');
    if (storesTab.classList.contains('active')) {
        storesView.classList.remove('hidden');
    } else if (keywordsTab.classList.contains('active')) {
        keywordsView.classList.remove('hidden');
    } else {
        productsView.classList.remove('hidden');
    }
}

// --- 实时监听器功能 ---
function startRealtimeListeners() {
    // 店铺数据监听
    db.collection('amazonSeller').onSnapshot(snapshot => {
        storeData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        processStoreData();
        hideLoading();
    }, error => {
        console.error("获取店铺数据失败: ", error);
        showNotification("获取店铺数据失败，请检查控制台", 'error');
        hideLoading();
    });

    // 关键词数据监听
    db.collection('amazonKeywords').onSnapshot(snapshot => {
        keywordData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        processKeywordData();
        hideLoading();
    }, error => {
        console.error("获取关键词数据失败: ", error);
        showNotification("获取关键词数据失败，请检查控制台", 'error');
        hideLoading();
    });
    
    // 新增产品数据监听
    db.collection('amazonProducts').onSnapshot(snapshot => {
        productData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        processProductData();
        hideLoading();
    }, error => {
        console.error("获取产品数据失败: ", error);
        showNotification("获取产品数据失败，请检查控制台", 'error');
        hideLoading();
    });
}

function processStoreData() {
    renderSiteFilters(storeFiltersDiv, storeData, 'store');
    filterAndSortStoreData();
    renderStoreTable();
}

function processKeywordData() {
    renderSiteFilters(keywordFiltersDiv, keywordData, 'keyword');
    filterAndSortKeywordData();
    renderKeywordTable();
}

function processProductData() {
    renderSiteFilters(productFiltersDiv, productData, 'product');
    filterAndSortProductData();
    renderProductTable();
}


// --- 筛选和排序功能 ---
function filterAndSortStoreData() {
    const searchTerm = storeSearchInput.value.toLowerCase();
    
    filteredStoreData = storeData.filter(item => {
        const siteMatch = activeStoreSiteFilter === 'all' || getSiteAbbreviation(item.site) === activeStoreSiteFilter;
        const searchMatch = !searchTerm || (item.sellerName && item.sellerName.toLowerCase().includes(searchTerm));
        return siteMatch && searchMatch;
    });

    filteredStoreData.sort((a, b) => {
        let valA = a[storeSortKey];
        let valB = b[storeSortKey];
        
        if (storeSortKey === 'rating') {
            valA = parseFloat(valA) || 0;
            valB = parseFloat(valB) || 0;
        } else if (storeSortKey === 'createdAt') {
            valA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            valB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        }
        
        if (valA < valB) return storeSortDir === 'asc' ? -1 : 1;
        if (valA > valB) return storeSortDir === 'asc' ? 1 : -1;
        return 0;
    });
}

function filterAndSortKeywordData() {
    const searchTerm = keywordSearchInput.value.toLowerCase();
    
    filteredKeywordData = keywordData.filter(item => {
        const siteMatch = activeKeywordSiteFilter === 'all' || getSiteAbbreviation(item.site) === activeKeywordSiteFilter;
        const searchMatch = !searchTerm || (item.keyword && item.keyword.toLowerCase().includes(searchTerm)) || (item.keywordZh && item.keywordZh.toLowerCase().includes(searchTerm));
        return siteMatch && searchMatch;
    });

    filteredKeywordData.sort((a, b) => {
        let valA = a[keywordSortKey];
        let valB = b[keywordSortKey];
        if (keywordSortKey === 'date') {
            valA = a.date ? new Date(a.date) : new Date(0);
            valB = b.date ? new Date(b.date) : new Date(0);
        }
        
        if (valA < valB) return keywordSortDir === 'asc' ? -1 : 1;
        if (valA > valB) return keywordSortDir === 'asc' ? 1 : -1;
        return 0;
    });
}

function filterAndSortProductData() {
    const searchTerm = productSearchInput.value.toLowerCase();
    filteredProductData = productData.filter(item => {
        const siteMatch = activeProductSiteFilter === 'all' || getSiteAbbreviation(item.site) === activeProductSiteFilter;
        const searchMatch = !searchTerm || (item.productName && item.productName.toLowerCase().includes(searchTerm)) || (item.productNameZh && item.productNameZh.toLowerCase().includes(searchTerm)) || (item.asin && item.asin.toLowerCase().includes(searchTerm));
        return siteMatch && searchMatch;
    });
    filteredProductData.sort((a, b) => {
        let valA = a[productSortKey];
        let valB = b[productSortKey];
        if (productSortKey === 'createdAt') {
            valA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            valB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        }
        if (valA < valB) return productSortDir === 'asc' ? -1 : 1;
        if (valA > valB) return productSortDir === 'asc' ? 1 : -1;
        return 0;
    });
}


// 绑定搜索事件
storeSearchInput.addEventListener('input', () => {
    filterAndSortStoreData();
    renderStoreTable();
});

keywordSearchInput.addEventListener('input', () => {
    filterAndSortKeywordData();
    renderKeywordTable();
});

productSearchInput.addEventListener('input', () => {
    filterAndSortProductData();
    renderProductTable();
});

// 渲染站点筛选按钮
function renderSiteFilters(container, data, type) {
    container.innerHTML = '';
    const sites = new Set(data.map(item => getSiteAbbreviation(item.site)).filter(site => site !== 'N/A'));
    const sortedSites = Array.from(sites).sort();

    const allBtn = document.createElement('button');
    allBtn.textContent = '全部站点';
    allBtn.classList.add('btn', 'filter-btn');
    const activeFilter = type === 'store' ? activeStoreSiteFilter : (type === 'keyword' ? activeKeywordSiteFilter : activeProductSiteFilter);
    if (activeFilter === 'all') {
        allBtn.classList.add('active');
    }
    allBtn.addEventListener('click', () => {
        if (type === 'store') {
            activeStoreSiteFilter = 'all';
            filterAndSortStoreData();
            renderStoreTable();
        } else if (type === 'keyword') {
            activeKeywordSiteFilter = 'all';
            filterAndSortKeywordData();
            renderKeywordTable();
        } else {
            activeProductSiteFilter = 'all';
            filterAndSortProductData();
            renderProductTable();
        }
        updateFilterButtonState(container, 'all');
    });
    container.appendChild(allBtn);

    sortedSites.forEach(site => {
        const btn = document.createElement('button');
        btn.textContent = site;
        btn.classList.add('btn', 'filter-btn');
        if (activeFilter === site) {
            btn.classList.add('active');
        }
        btn.addEventListener('click', () => {
            if (type === 'store') {
                activeStoreSiteFilter = site;
                filterAndSortStoreData();
                renderStoreTable();
            } else if (type === 'keyword') {
                activeKeywordSiteFilter = site;
                filterAndSortKeywordData();
                renderKeywordTable();
            } else {
                activeProductSiteFilter = site;
                filterAndSortProductData();
                renderProductTable();
            }
            updateFilterButtonState(container, site);
        });
        container.appendChild(btn);
    });
}

function updateFilterButtonState(container, activeSite) {
    container.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (activeSite === 'all') {
        container.querySelector('button').classList.add('active');
    } else {
        const activeBtn = Array.from(container.querySelectorAll('button')).find(btn => btn.textContent === activeSite);
        if (activeBtn) activeBtn.classList.add('active');
    }
}

// 更新排序图标
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

// 绑定排序事件
ratingHeader.addEventListener('click', () => {
    storeSortDir = storeSortDir === 'desc' ? 'asc' : 'desc';
    storeSortKey = 'rating';
    filterAndSortStoreData();
    updateSortIcon(ratingHeader, storeSortDir);
    renderStoreTable();
});

keywordDateHeader.addEventListener('click', () => {
    keywordSortDir = keywordSortDir === 'desc' ? 'asc' : 'desc';
    keywordSortKey = 'date';
    filterAndSortKeywordData();
    updateSortIcon(keywordDateHeader, keywordSortDir);
    renderKeywordTable();
});

productDateHeader.addEventListener('click', () => {
    productSortDir = productSortDir === 'desc' ? 'asc' : 'desc';
    productSortKey = 'createdAt';
    filterAndSortProductData();
    updateSortIcon(productDateHeader, productSortDir);
    renderProductTable();
});

// --- 渲染表格功能 ---
function renderStoreTable() {
    storeTableBody.innerHTML = '';
    storeNoData.classList.add('hidden');
    storeCountSpan.textContent = filteredStoreData.length;
    storeDeleteSelectedBtn.disabled = selectedStoreIds.length === 0;

    if (filteredStoreData.length === 0) {
        storeNoData.classList.remove('hidden');
        storeSelectAll.disabled = true;
        storeSelectAll.checked = false;
        return;
    } else {
        storeSelectAll.disabled = false;
    }
    
    filteredStoreData.forEach((item, index) => {
        const isSelected = selectedStoreIds.includes(item.id);
        const tr = document.createElement('tr');
        if (isSelected) {
            tr.classList.add('selected');
        }
        tr.dataset.id = item.id;
        
        let storeUrl = '#';
        let sellerNameLink = item.sellerName || 'N/A';
        
        if (item.sellerId && item.site) {
            const domain = item.site;
            storeUrl = `https://www.${domain}/sp?ie=UTF8&seller=${item.sellerId}`;
            sellerNameLink = `<a href="${storeUrl}" target="_blank">${item.sellerName || 'N/A'}</a>`;
        }


        tr.innerHTML = `
            <td><input type="checkbox" class="store-checkbox" data-id="${item.id}" ${isSelected ? 'checked' : ''}></td>
            <td>${index + 1}</td>
            <td data-tooltip="${item.site || 'N/A'}">${getSiteAbbreviation(item.site) || 'N/A'}</td>
            <td data-tooltip="${item.sellerName || 'N/A'}">${sellerNameLink}</td>
            <td data-tooltip="${item.feedback || 'N/A'}">${item.feedback || 'N/A'}</td>
            <td data-tooltip="${item.rating || 'N/A'}">${item.rating || 'N/A'}</td>
            <td data-tooltip="${item.reviews || 'N/A'}">${item.reviews || 'N/A'}</td>
            <td data-tooltip="${item.Featured || 'N/A'}">${item.Featured || 'N/A'}</td>
            <td data-tooltip="${item.NewestArrivals || 'N/A'}">${item.NewestArrivals || 'N/A'}</td>
            <td>
                <button class="btn secondary-btn" onclick="deleteStore('${item.id}')">删除</button>
            </td>
        `;
        storeTableBody.appendChild(tr);
    });

    storeTableBody.querySelectorAll('tr').forEach(row => {
        const checkbox = row.querySelector('.store-checkbox');
        row.addEventListener('click', (e) => {
            // 如果点击的是删除按钮，则不切换选中状态
            if (e.target.tagName.toLowerCase() === 'button') {
                return;
            }
            // 切换复选框状态
            checkbox.checked = !checkbox.checked;
            // 触发复选框的change事件
            checkbox.dispatchEvent(new Event('change'));
        });
    });

    storeTableBody.querySelectorAll('.store-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            const row = e.target.closest('tr');
            if (e.target.checked) {
                if (!selectedStoreIds.includes(id)) {
                    selectedStoreIds.push(id);
                }
                row.classList.add('selected');
            } else {
                selectedStoreIds = selectedStoreIds.filter(itemId => itemId !== id);
                row.classList.remove('selected');
            }
            storeDeleteSelectedBtn.disabled = selectedStoreIds.length === 0;
            storeSelectAll.checked = selectedStoreIds.length === filteredStoreData.length;
        });
    });
    
    storeSelectAll.checked = selectedStoreIds.length > 0 && selectedStoreIds.length === filteredStoreData.length;
}

function renderKeywordTable() {
    keywordTableBody.innerHTML = '';
    keywordNoData.classList.add('hidden');
    keywordCountSpan.textContent = filteredKeywordData.length;
    keywordDeleteSelectedBtn.disabled = selectedKeywordIds.length === 0;

    if (filteredKeywordData.length === 0) {
        keywordNoData.classList.remove('hidden');
        keywordSelectAll.disabled = true;
        keywordSelectAll.checked = false;
        return;
    } else {
        keywordSelectAll.disabled = false;
    }

    filteredKeywordData.forEach((item, index) => {
        const isSelected = selectedKeywordIds.includes(item.id);
        const tr = document.createElement('tr');
        if (isSelected) {
            tr.classList.add('selected');
        }
        tr.dataset.id = item.id;
        const keywordUrl = item.url || '#';
        const date = item.date || 'N/A';
        const hasUrl = keywordUrl !== '#';
        const keywordLink = hasUrl ? `<a href="${keywordUrl}" target="_blank">${item.keyword || 'N/A'}</a>` : (item.keyword || 'N/A');
        const keywordZhLink = hasUrl ? `<a href="${keywordUrl}" target="_blank">${item.keywordZh || 'N/A'}</a>` : (item.keywordZh || 'N/A');
        const countLink = hasUrl ? `<a href="${keywordUrl}" target="_blank">${item.count || 'N/A'}</a>` : (item.count || 'N/A');

        tr.innerHTML = `
            <td><input type="checkbox" class="keyword-checkbox" data-id="${item.id}" ${isSelected ? 'checked' : ''}></td>
            <td>${index + 1}</td>
            <td data-tooltip="${item.site || 'N/A'}">${getSiteAbbreviation(item.site) || 'N/A'}</td>
            <td data-tooltip="${item.keyword || 'N/A'}">${keywordLink}</td>
            <td data-tooltip="${item.keywordZh || 'N/A'}">${keywordZhLink}</td>
            <td data-tooltip="${item.count || 'N/A'}">${countLink}</td>
            <td data-tooltip="${date}">${date}</td>
            <td>
                <button class="btn secondary-btn" onclick="deleteKeyword('${item.id}')">删除</button>
            </td>
        `;
        keywordTableBody.appendChild(tr);
    });

    keywordTableBody.querySelectorAll('tr').forEach(row => {
        const checkbox = row.querySelector('.keyword-checkbox');
        row.addEventListener('click', (e) => {
            if (e.target.tagName.toLowerCase() === 'button') {
                return;
            }
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
        });
    });

    keywordTableBody.querySelectorAll('.keyword-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            const row = e.target.closest('tr');
            if (e.target.checked) {
                if (!selectedKeywordIds.includes(id)) {
                    selectedKeywordIds.push(id);
                }
                row.classList.add('selected');
            } else {
                selectedKeywordIds = selectedKeywordIds.filter(itemId => itemId !== id);
                row.classList.remove('selected');
            }
            keywordDeleteSelectedBtn.disabled = selectedKeywordIds.length === 0;
            keywordSelectAll.checked = selectedKeywordIds.length === filteredKeywordData.length;
        });
    });

    keywordSelectAll.checked = selectedKeywordIds.length > 0 && selectedKeywordIds.length === filteredKeywordData.length;
}

function renderProductTable() {
    productTableBody.innerHTML = '';
    productNoData.classList.add('hidden');
    productCountSpan.textContent = filteredProductData.length;
    productDeleteSelectedBtn.disabled = selectedProductIds.length === 0;

    if (filteredProductData.length === 0) {
        productNoData.classList.remove('hidden');
        productSelectAll.disabled = true;
        productSelectAll.checked = false;
        return;
    } else {
        productSelectAll.disabled = false;
    }

    filteredProductData.forEach((item, index) => {
        const isSelected = selectedProductIds.includes(item.id);
        const tr = document.createElement('tr');
        if (isSelected) {
            tr.classList.add('selected');
        }
        tr.dataset.id = item.id;
        const productUrl = item.url || '#';
        const hasUrl = productUrl !== '#';
        const asinLink = hasUrl ? `<a href="${productUrl}" target="_blank">${item.asin || 'N/A'}</a>` : (item.asin || 'N/A');
        const productNameLink = hasUrl ? `<a href="${productUrl}" target="_blank">${item.productName || 'N/A'}</a>` : (item.productName || 'N/A');
        const productNameZhLink = hasUrl ? `<a href="${productUrl}" target="_blank">${item.productNameZh || 'N/A'}</a>` : (item.productNameZh || 'N/A');
        const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A';
        const imageHtml = item.mainImageURL ? `
            <div class="product-image-container">
                <img src="${item.mainImageURL}" alt="Product Image" class="product-image-thumb">
                <img src="${item.mainImageURL}" alt="Product Image Large" class="product-image-large">
            </div>` : 'N/A';

        tr.innerHTML = `
            <td><input type="checkbox" class="product-checkbox" data-id="${item.id}" ${isSelected ? 'checked' : ''}></td>
            <td>${index + 1}</td>
            <td data-tooltip="${item.site || 'N/A'}">${getSiteAbbreviation(item.site) || 'N/A'}</td>
            <td data-tooltip="${item.asin || 'N/A'}">${asinLink}</td>
            <td>${imageHtml}</td>
            <td data-tooltip="${item.price || 'N/A'}">${item.price || 'N/A'}</td>
            <td data-tooltip="${item.productName || 'N/A'}">${productNameLink}</td>
            <td data-tooltip="${item.productNameZh || 'N/A'}">${productNameZhLink}</td>
            <td data-tooltip="${date}">${date}</td>
            <td>
                <button class="btn secondary-btn" onclick="deleteProduct('${item.id}')">删除</button>
            </td>
        `;
        productTableBody.appendChild(tr);
    });

    productTableBody.querySelectorAll('tr').forEach(row => {
        const checkbox = row.querySelector('.product-checkbox');
        row.addEventListener('click', (e) => {
            if (e.target.tagName.toLowerCase() === 'button' || e.target.tagName.toLowerCase() === 'input') {
                return;
            }
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
        });
    });

    productTableBody.querySelectorAll('.product-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            const row = e.target.closest('tr');
            if (e.target.checked) {
                if (!selectedProductIds.includes(id)) {
                    selectedProductIds.push(id);
                }
                row.classList.add('selected');
            } else {
                selectedProductIds = selectedProductIds.filter(itemId => itemId !== id);
                row.classList.remove('selected');
            }
            productDeleteSelectedBtn.disabled = selectedProductIds.length === 0;
            productSelectAll.checked = selectedProductIds.length === filteredProductData.length;
        });
    });
    
    productSelectAll.checked = selectedProductIds.length > 0 && selectedProductIds.length === filteredProductData.length;
}


// --- CSV 解析功能 ---
/**
 * 解析 CSV 字符串为对象数组
 * @param {string} text - CSV 字符串
 * @returns {Array<Object>} - 对象数组
 */
function parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) {
        return [];
    }
    const headers = lines[0].split(',').map(header => header.trim());
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(value => value.trim());
        if (values.length !== headers.length) {
            console.warn(`跳过格式不正确的行: ${lines[i]}`);
            continue;
        }
        const obj = {};
        for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = values[j];
        }
        data.push(obj);
    }
    return data;
}

// --- 通用文件导入功能 (修复版) ---
/**
 * 通用文件导入函数，支持 JSON 和 CSV
 * @param {Event} event - change 事件对象
 * @param {string} collectionName - Firestore 集合名
 * @param {string[]} requiredKeys - 导入数据必须包含的字段
 * @param {string} successMessage - 导入成功后的提示信息
 */
async function handleFileImport(event, collectionName, requiredKeys, successMessage) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const fileExtension = file.name.split('.').pop().toLowerCase();
    const reader = new FileReader();

    reader.onload = async (e) => {
        const content = e.target.result;
        try {
            let data = null;
            if (fileExtension === 'json') {
                const trimmedContent = content.trim();
                if (!trimmedContent) {
                    throw new Error('JSON 文件内容为空。');
                }
                data = JSON.parse(trimmedContent);
            } else if (fileExtension === 'csv') {
                data = parseCSV(content);
            } else {
                throw new Error('不支持的文件类型。请上传 JSON 或 CSV 文件。');
            }
            
            // 修复: 确保 data 变量有效且为数组
            if (!data || !Array.isArray(data)) {
                throw new Error('导入的数据格式不正确，期望一个数组。');
            }

            if (data.length > 0) {
                const firstItem = data[0];
                const missingKeys = requiredKeys.filter(key => !(key in firstItem));
                if (missingKeys.length > 0) {
                    throw new Error(`数据中缺少必要的字段: ${missingKeys.join(', ')}。`);
                }
            }
            
            await importDataToFirestore(db.collection(collectionName), data);
            
            showNotification(successMessage, 'success');
        } catch (error) {
            console.error('文件解析失败:', error);
            showNotification(`文件解析失败：${error.message}`, 'error');
        }
    };
    
    reader.readAsText(file);
}


// --- 导入到 Firestore 功能 (最终修复版) ---
/**
 * 批量导入数据到 Firestore，支持超过 30 条记录
 * @param {firebase.firestore.CollectionReference} collectionRef - 目标 Firestore 集合
 * @param {Array<Object>} data - 待导入的对象数组
 */
async function importDataToFirestore(collectionRef, data) {
    if (data.length === 0) {
        showNotification('导入数据为空，操作取消。', 'info');
        return;
    }

    const now = new Date().toISOString();
    const uniqueRecords = new Map();
    
    const uniqueKey = collectionRef.id === 'amazonSeller' ? 'sellerName' : (collectionRef.id === 'amazonKeywords' ? 'keyword' : 'asin');

    for (const record of data) {
        if (record[uniqueKey]) {
            uniqueRecords.set(record[uniqueKey], record);
        }
    }
    
    const uniqueKeysArray = Array.from(uniqueRecords.keys());
    if (uniqueKeysArray.length === 0) {
        showNotification('导入的数据中没有有效记录，操作取消。', 'info');
        return;
    }
    
    const existingDocsMap = new Map();
    const CHUNK_SIZE = 30; // Firestore 'in' 查询的限制
    
    for (let i = 0; i < uniqueKeysArray.length; i += CHUNK_SIZE) {
        const chunk = uniqueKeysArray.slice(i, i + CHUNK_SIZE);
        const existingDocs = await collectionRef.where(uniqueKey, 'in', chunk).get();
        
        existingDocs.forEach(doc => {
            existingDocsMap.set(doc.data()[uniqueKey], doc.id);
        });
    }

    const batch = db.batch();
    for (const record of Array.from(uniqueRecords.values())) {
        const existingDocId = existingDocsMap.get(record[uniqueKey]);
        const item = {
            ...record,
            createdAt: now,
            updatedAt: now
        };
        if (existingDocId) {
            batch.update(collectionRef.doc(existingDocId), item);
        } else {
            batch.set(collectionRef.doc(), item);
        }
    }
    
    await batch.commit();
    console.log("所有数据已成功导入。");
}

// --- 文件选择与导入按钮绑定（已修复） ---
storeImportBtn.addEventListener('click', () => storeImportFile.click());
storeImportFile.addEventListener('change', (e) => handleFileImport(e, 'amazonSeller', ['sellerName', 'site'], '店铺数据导入成功！'));

keywordImportBtn.addEventListener('click', () => keywordImportFile.click());
keywordImportFile.addEventListener('change', (e) => handleFileImport(e, 'amazonKeywords', ['keyword', 'site'], '关键词数据导入成功！'));

productImportBtn.addEventListener('click', () => productImportFile.click());
productImportFile.addEventListener('change', (e) => handleFileImport(e, 'amazonProducts', ['asin', 'site'], '产品数据导入成功！'));

// --- 导出功能 (修复版) ---
/**
 * 导出数据为 JSON 或 CSV
 * @param {Array<Object>} data - 待导出的数据
 * @param {string} type - 导出类型 ('json' 或 'csv')
 * @param {string} filename - 文件名
 */
function exportData(data, type, filename) {
    if (data.length === 0) {
        showNotification('无数据可导出。', 'error');
        return;
    }
    
    let content;
    let mimeType;
    if (type === 'json') {
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
    } else if (type === 'csv') {
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(item => Object.values(item).map(value => {
            const processedValue = ('' + value).replace(/"/g, '""');
            return `"${processedValue}"`;
        }).join(','));
        content = [headers, ...rows].join('\n');
        mimeType = 'text/csv';
    } else {
        showNotification('不支持的导出格式。', 'error');
        return;
    }

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


storeExportBtn.addEventListener('click', () => {
    exportData(filteredStoreData, 'csv', 'amazon_seller.csv');
});
keywordExportBtn.addEventListener('click', () => {
    exportData(filteredKeywordData, 'csv', 'amazon_keywords.csv');
});
productExportBtn.addEventListener('click', () => {
    exportData(filteredProductData, 'csv', 'amazon_products.csv');
});


// --- 下载模板功能 (修复版) ---
function downloadTemplate(keys, filename) {
    const templateData = [{
        ...keys.reduce((acc, key) => {
            acc[key] = '';
            return acc;
        }, {})
    }];
    exportData(templateData, 'csv', filename);
}

storeDownloadTemplateBtn.addEventListener('click', () => {
    downloadTemplate(['sellerName', 'site', 'sellerId', 'feedback', 'rating', 'reviews', 'Featured', 'NewestArrivals'], 'stores_template.csv');
});

keywordDownloadTemplateBtn.addEventListener('click', () => {
    downloadTemplate(['keyword', 'keywordZh', 'site', 'url', 'count', 'date'], 'keywords_template.csv');
});

productDownloadTemplateBtn.addEventListener('click', () => {
    downloadTemplate(['asin', 'site', 'productName', 'productNameZh', 'price', 'mainImageURL'], 'products_template.csv');
});


// --- 删除功能 ---
async function deleteData(collectionName, ids) {
    if (ids.length === 0) {
        showNotification('未选择任何项。', 'info');
        return;
    }

    const confirmMessage = `您确定要删除选中的 ${ids.length} 条数据吗？此操作无法撤销。`;
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        const batch = db.batch();
        ids.forEach(id => {
            batch.delete(db.collection(collectionName).doc(id));
        });
        await batch.commit();
        showNotification('数据删除成功！', 'success');
    } catch (error) {
        console.error("删除失败: ", error);
        showNotification('删除失败，请检查控制台。', 'error');
    }
}

async function deleteStore(id) {
    if (confirm("您确定要删除这条店铺数据吗？此操作无法撤销。")) {
        try {
            await db.collection('amazonSeller').doc(id).delete();
            showNotification('店铺数据删除成功！', 'success');
        } catch (error) {
            console.error("删除失败: ", error);
            showNotification('删除失败，请检查控制台。', 'error');
        }
    }
}

async function deleteKeyword(id) {
    if (confirm("您确定要删除这条关键词数据吗？此操作无法撤销。")) {
        try {
            await db.collection('amazonKeywords').doc(id).delete();
            showNotification('关键词数据删除成功！', 'success');
        } catch (error) {
            console.error("删除失败: ", error);
            showNotification('删除失败，请检查控制台。', 'error');
        }
    }
}

async function deleteProduct(id) {
    if (confirm("您确定要删除这条产品数据吗？此操作无法撤销。")) {
        try {
            await db.collection('amazonProducts').doc(id).delete();
            showNotification('产品数据删除成功！', 'success');
        } catch (error) {
            console.error("删除失败: ", error);
            showNotification('删除失败，请检查控制台。', 'error');
        }
    }
}

storeDeleteSelectedBtn.addEventListener('click', () => deleteData('amazonSeller', selectedStoreIds));
keywordDeleteSelectedBtn.addEventListener('click', () => deleteData('amazonKeywords', selectedKeywordIds));
productDeleteSelectedBtn.addEventListener('click', () => deleteData('amazonProducts', selectedProductIds));

// 全选/取消全选
storeSelectAll.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    selectedStoreIds = isChecked ? filteredStoreData.map(item => item.id) : [];
    renderStoreTable();
});

keywordSelectAll.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    selectedKeywordIds = isChecked ? filteredKeywordData.map(item => item.id) : [];
    renderKeywordTable();
});

productSelectAll.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    selectedProductIds = isChecked ? filteredProductData.map(item => item.id) : [];
    renderProductTable();
});


// --- 页面切换功能 ---
storesTab.addEventListener('click', () => {
    storesTab.classList.add('active');
    keywordsTab.classList.remove('active');
    productsTab.classList.remove('active');
    storesView.classList.remove('hidden');
    keywordsView.classList.add('hidden');
    productsView.classList.add('hidden');
    // 不需要再次获取数据，监听器会自动同步
    processStoreData();
    updateSortIcon(ratingHeader, storeSortDir);
});

keywordsTab.addEventListener('click', () => {
    keywordsTab.classList.add('active');
    storesTab.classList.remove('active');
    productsTab.classList.remove('active');
    keywordsView.classList.remove('hidden');
    storesView.classList.add('hidden');
    productsView.classList.add('hidden');
    // 不需要再次获取数据，监听器会自动同步
    processKeywordData();
    updateSortIcon(keywordDateHeader, keywordSortDir);
});

productsTab.addEventListener('click', () => {
    storesTab.classList.remove('active');
    keywordsTab.classList.remove('active');
    productsTab.classList.add('active');
    storesView.classList.add('hidden');
    keywordsView.classList.add('hidden');
    productsView.classList.remove('hidden');
    // 不需要再次获取数据，监听器会自动同步
    processProductData();
    updateSortIcon(productDateHeader, productSortDir);
});
