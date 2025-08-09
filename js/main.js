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
const storesView = document.getElementById('stores-view');
const keywordsView = document.getElementById('keywords-view');
const loadingSkeleton = document.getElementById('loading-skeleton');

const storeTableBody = document.getElementById('store-table-body');
const storeNoData = document.getElementById('stores-no-data');
const keywordTableBody = document.getElementById('keyword-table-body');
const keywordNoData = document.getElementById('keywords-no-data');
const storeCountSpan = document.getElementById('store-count');
const keywordCountSpan = document.getElementById('keyword-count');
const storePaginationDiv = document.getElementById('store-pagination');
const keywordPaginationDiv = document.getElementById('keyword-pagination');
const ratingHeader = document.getElementById('rating-header');
const keywordDateHeader = document.getElementById('keyword-date-header');
const storeFiltersDiv = document.getElementById('store-filters');
const keywordFiltersDiv = document.getElementById('keyword-filters');


// 分页、排序和筛选状态
let storeData = [];
let keywordData = [];
let filteredStoreData = [];
let filteredKeywordData = [];

let storeCurrentPage = 1;
let keywordCurrentPage = 1;
const itemsPerPage = 20;

let storeSortKey = 'rating';
let storeSortDir = 'desc';
let keywordSortKey = 'date';
let keywordSortDir = 'desc';

let activeStoreSiteFilter = 'all';
let activeKeywordSiteFilter = 'all';

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

// --- 数据清洗函数 ---
function cleanFeedback(feedback) {
    if (!feedback) return 'N/A';
    const match = String(feedback).match(/(\d{1,3})\s*[％%]/);
    return match ? `${match[1]}%` : 'N/A';
}
function cleanFeaturedCount(text) {
    if (!text) return 'N/A';
    let match = String(text).match(/(\d+[,]?\d*)\s*以上結果.*$/);
    if (match) return match[1].replace(/,/g, '');
    match = String(text).match(/mehr als ([\d\.]+)(?: Ergebnissen)?/i);
    if (match) return match[1].replace(/\./g, '');
    match = String(text).match(/(?:共|over|超過|of over)\s*([\d,\.]+)\s*(?:個|results)?/i);
    if (match) return match[1].replace(/[\.,]/g, '');
    match = String(text).match(/of\s*([\d,\.]+)\s*results/i);
    if (match) return match[1].replace(/[\.,]/g, '');
    match = String(text).match(/([\d,\.]+)(?=\D*$)/);
    if (match) return match[1].replace(/[\.,]/g, '');
    return 'N/A';
}
function cleanNumberWithDot(text) {
    if (!text) return 'N/A';
    return String(text).replace(/(\d),(\d)/g, '$1.$2');
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
        fetchStoreData();
        fetchKeywordData();
    } else {
        authContainer.classList.remove('hidden');
        mainContainer.classList.add('hidden');
    }
});

function showLoading() {
    loadingSkeleton.classList.remove('hidden');
    storesView.classList.add('hidden');
    keywordsView.classList.add('hidden');
}

function hideLoading() {
    loadingSkeleton.classList.add('hidden');
    if (storesTab.classList.contains('active')) {
        storesView.classList.remove('hidden');
    } else {
        keywordsView.classList.remove('hidden');
    }
}

// --- 数据获取功能 ---
async function fetchStoreData() {
    try {
        const snapshot = await db.collection('amazonStores').get();
        storeData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        processStoreData();
    } catch (error) {
        console.error("获取店铺数据失败: ", error);
        alert("获取店铺数据失败，请检查控制台");
    } finally {
        hideLoading();
    }
}

async function fetchKeywordData() {
    try {
        const snapshot = await db.collection('amazonKeywords').get();
        keywordData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        processKeywordData();
    } catch (error) {
        console.error("获取关键词数据失败: ", error);
        alert("获取关键词数据失败，请检查控制台");
    } finally {
        hideLoading();
    }
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

// --- 筛选和排序功能 ---
function filterAndSortStoreData() {
    filteredStoreData = storeData.filter(item => {
        if (activeStoreSiteFilter === 'all') return true;
        return getSiteAbbreviation(item.site) === activeStoreSiteFilter;
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
    filteredKeywordData = keywordData.filter(item => {
        if (activeKeywordSiteFilter === 'all') return true;
        return getSiteAbbreviation(item.site) === activeKeywordSiteFilter;
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

// 渲染站点筛选按钮
function renderSiteFilters(container, data, type) {
    container.innerHTML = '';
    const sites = new Set(data.map(item => getSiteAbbreviation(item.site)).filter(site => site !== 'N/A'));
    const sortedSites = Array.from(sites).sort();

    const allBtn = document.createElement('button');
    allBtn.textContent = '全部站点';
    allBtn.classList.add('btn', 'filter-btn');
    if ((type === 'store' && activeStoreSiteFilter === 'all') || (type === 'keyword' && activeKeywordSiteFilter === 'all')) {
        allBtn.classList.add('active');
    }
    allBtn.addEventListener('click', () => {
        if (type === 'store') {
            activeStoreSiteFilter = 'all';
            storeCurrentPage = 1;
            filterAndSortStoreData();
            renderStoreTable();
        } else {
            activeKeywordSiteFilter = 'all';
            keywordCurrentPage = 1;
            filterAndSortKeywordData();
            renderKeywordTable();
        }
        updateFilterButtonState(container, 'all');
    });
    container.appendChild(allBtn);

    sortedSites.forEach(site => {
        const btn = document.createElement('button');
        btn.textContent = site;
        btn.classList.add('btn', 'filter-btn');
        if ((type === 'store' && activeStoreSiteFilter === site) || (type === 'keyword' && activeKeywordSiteFilter === site)) {
            btn.classList.add('active');
        }
        btn.addEventListener('click', () => {
            if (type === 'store') {
                activeStoreSiteFilter = site;
                storeCurrentPage = 1;
                filterAndSortStoreData();
                renderStoreTable();
            } else {
                activeKeywordSiteFilter = site;
                keywordCurrentPage = 1;
                filterAndSortKeywordData();
                renderKeywordTable();
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
        // 使用精确的文本匹配来确保找到"全部站点"按钮
        container.querySelector('button').classList.add('active');
    } else {
        container.querySelector(`button`).classList.add('active');
        const activeBtn = Array.from(container.querySelectorAll('button')).find(btn => btn.textContent === activeSite);
        if (activeBtn) activeBtn.classList.add('active');
    }
}

// 更新排序图标
function updateSortIcon(headerElement, sortDir) {
    const sortIcon = headerElement.querySelector('.sort-icon');
    if (sortIcon) {
        sortIcon.textContent = sortDir === 'asc' ? '▲' : '▼';
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

// --- 渲染表格功能 ---
function renderStoreTable() {
    storeTableBody.innerHTML = '';
    storeNoData.classList.add('hidden');
    storeCountSpan.textContent = filteredStoreData.length;

    if (filteredStoreData.length === 0) {
        storeNoData.classList.remove('hidden');
        return;
    }

    const totalPages = Math.ceil(filteredStoreData.length / itemsPerPage);
    const startIndex = (storeCurrentPage - 1) * itemsPerPage;
    const paginatedData = filteredStoreData.slice(startIndex, startIndex + itemsPerPage);

    paginatedData.forEach((item, index) => {
        const tr = document.createElement('tr');
        
        let storeUrl = '#';
        let sellerNameLink = item.sellerName || 'N/A';
        
        if (item.sellerId && item.site) {
            const domain = item.site;
            storeUrl = `https://www.${domain}/sp?ie=UTF8&seller=${item.sellerId}`;
            sellerNameLink = `<a href="${storeUrl}" target="_blank">${item.sellerName || 'N/A'}</a>`;
        }

        tr.innerHTML = `
            <td>${startIndex + index + 1}</td>
            <td data-tooltip="${item.site || 'N/A'}">${getSiteAbbreviation(item.site) || 'N/A'}</td>
            <td data-tooltip="${item.sellerName || 'N/A'}">${sellerNameLink}</td>
            <td data-tooltip="${item.feedback || 'N/A'}">${cleanFeedback(item.feedback)}</td>
            <td data-tooltip="${item.rating || 'N/A'}">${cleanNumberWithDot(item.rating)}</td>
            <td data-tooltip="${item.reviews || 'N/A'}">${cleanNumberWithDot(item.reviews)}</td>
            <td data-tooltip="${item.featuredCount || 'N/A'}">${cleanFeaturedCount(item.featuredCount)}</td>
            <td>
                <button class="btn secondary-btn" onclick="deleteStore('${item.id}')">删除</button>
            </td>
        `;
        storeTableBody.appendChild(tr);
    });

    renderPagination(storePaginationDiv, totalPages, storeCurrentPage, (page) => {
        storeCurrentPage = page;
        renderStoreTable();
    });
}

function renderKeywordTable() {
    keywordTableBody.innerHTML = '';
    keywordNoData.classList.add('hidden');
    keywordCountSpan.textContent = filteredKeywordData.length;

    if (filteredKeywordData.length === 0) {
        keywordNoData.classList.remove('hidden');
        return;
    }

    const totalPages = Math.ceil(filteredKeywordData.length / itemsPerPage);
    const startIndex = (keywordCurrentPage - 1) * itemsPerPage;
    const paginatedData = filteredKeywordData.slice(startIndex, startIndex + itemsPerPage);

    paginatedData.forEach((item, index) => {
        const tr = document.createElement('tr');
        const keywordUrl = item.url || '#';
        const date = item.date || 'N/A';
        
        let keywordLink = item.keyword || 'N/A';
        if (keywordUrl !== '#') {
            keywordLink = `<a href="${keywordUrl}" target="_blank">${item.keyword}</a>`;
        }

        tr.innerHTML = `
            <td>${startIndex + index + 1}</td>
            <td data-tooltip="${item.site || 'N/A'}">${getSiteAbbreviation(item.site) || 'N/A'}</td>
            <td data-tooltip="${item.keyword || 'N/A'}">${keywordLink}</td>
            <td data-tooltip="${item.keywordZh || 'N/A'}">${item.keywordZh || 'N/A'}</td>
            <td data-tooltip="${item.count || 'N/A'}">${cleanFeaturedCount(item.count)}</td>
            <td data-tooltip="${date}">${date}</td>
            <td>
                <button class="btn secondary-btn" onclick="deleteKeyword('${item.id}')">删除</button>
            </td>
        `;
        keywordTableBody.appendChild(tr);
    });

    renderPagination(keywordPaginationDiv, totalPages, keywordCurrentPage, (page) => {
        keywordCurrentPage = page;
        renderKeywordTable();
    });
}

function renderPagination(container, totalPages, currentPage, onClick) {
    container.innerHTML = '';
    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '上一页';
    prevBtn.classList.add('btn');
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => onClick(currentPage - 1));
    container.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.classList.add('btn');
        if (i === currentPage) {
            pageBtn.classList.add('active');
        }
        pageBtn.addEventListener('click', () => onClick(i));
        container.appendChild(pageBtn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.textContent = '下一页';
    nextBtn.classList.add('btn');
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => onClick(currentPage + 1));
    container.appendChild(nextBtn);
}

// --- 操作功能 ---
window.deleteStore = async (id) => {
    if (confirm('确定要删除这条店铺数据吗？')) {
        try {
            await db.collection('amazonStores').doc(id).delete();
            fetchStoreData();
            alert('删除成功！');
        } catch (error) {
            console.error("删除失败: ", error);
            alert('删除失败，请检查控制台。');
        }
    }
}

window.deleteKeyword = async (id) => {
    if (confirm('确定要删除这条关键词数据吗？')) {
        try {
            await db.collection('amazonKeywords').doc(id).delete();
            fetchKeywordData();
            alert('删除成功！');
        } catch (error) {
            console.error("删除失败: ", error);
            alert('删除失败，请检查控制台。');
        }
    }
}

// --- 页面切换功能 ---
storesTab.addEventListener('click', () => {
    storesTab.classList.add('active');
    keywordsTab.classList.remove('active');
    storesView.classList.remove('hidden');
    keywordsView.classList.add('hidden');
    storeCurrentPage = 1;
    if (storeData.length === 0) fetchStoreData();
    else processStoreData();
    updateSortIcon(ratingHeader, storeSortDir);
});

keywordsTab.addEventListener('click', () => {
    keywordsTab.classList.add('active');
    storesTab.classList.remove('active');
    keywordsView.classList.remove('hidden');
    storesView.classList.add('hidden');
    keywordCurrentPage = 1;
    if (keywordData.length === 0) fetchKeywordData();
    else processKeywordData();
    updateSortIcon(keywordDateHeader, keywordSortDir);
});

// 初始化时自动加载数据
auth.onAuthStateChanged((user) => {
    if (user) {
        storesTab.click();
    }
});