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
const loadingSpinner = document.getElementById('loading-spinner');

const storeTableBody = document.getElementById('store-table-body');
const storeNoData = document.getElementById('stores-no-data');
const keywordTableBody = document.getElementById('keyword-table-body');
const keywordNoData = document.getElementById('keywords-no-data');
const storeCountSpan = document.getElementById('store-count');
const keywordCountSpan = document.getElementById('keyword-count');
const storePaginationDiv = document.getElementById('store-pagination');
const keywordPaginationDiv = document.getElementById('keyword-pagination');

// 分页和排序状态
let storeData = [];
let keywordData = [];
let storeCurrentPage = 1;
let keywordCurrentPage = 1;
const itemsPerPage = 20;

let storeSortKey = 'rating';
let storeSortDir = 'desc';
let keywordSortKey = 'date';
let keywordSortDir = 'desc';

// --- 数据清洗函数 ---
function cleanFeedback(feedback) {
    const match = String(feedback || '').match(/(\d{1,3})\s*[％%]/);
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
    loadingSpinner.classList.remove('hidden');
    storesView.classList.add('hidden');
    keywordsView.classList.add('hidden');
}

function hideLoading() {
    loadingSpinner.classList.add('hidden');
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
        sortStoreData();
        renderStoreTable();
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
        sortKeywordData();
        renderKeywordTable();
    } catch (error) {
        console.error("获取关键词数据失败: ", error);
        alert("获取关键词数据失败，请检查控制台");
    } finally {
        hideLoading();
    }
}

// --- 排序功能 ---
function sortStoreData() {
    storeData.sort((a, b) => {
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

function sortKeywordData() {
    keywordData.sort((a, b) => {
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

// 绑定排序事件
document.getElementById('rating-header').addEventListener('click', () => {
    storeSortDir = storeSortDir === 'desc' ? 'asc' : 'desc';
    storeSortKey = 'rating';
    sortStoreData();
    renderStoreTable();
});

document.getElementById('keyword-date-header').addEventListener('click', () => {
    keywordSortDir = keywordSortDir === 'desc' ? 'asc' : 'desc';
    keywordSortKey = 'date';
    sortKeywordData();
    renderKeywordTable();
});

// --- 渲染表格功能 ---
function renderStoreTable() {
    storeTableBody.innerHTML = '';
    storeNoData.classList.add('hidden');
    storeCountSpan.textContent = storeData.length;

    if (storeData.length === 0) {
        storeNoData.classList.remove('hidden');
        return;
    }

    const totalPages = Math.ceil(storeData.length / itemsPerPage);
    const startIndex = (storeCurrentPage - 1) * itemsPerPage;
    const paginatedData = storeData.slice(startIndex, startIndex + itemsPerPage);

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
            <td data-tooltip="${item.site || 'N/A'}">${item.site || 'N/A'}</td>
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
    keywordCountSpan.textContent = keywordData.length;

    if (keywordData.length === 0) {
        keywordNoData.classList.remove('hidden');
        return;
    }

    const totalPages = Math.ceil(keywordData.length / itemsPerPage);
    const startIndex = (keywordCurrentPage - 1) * itemsPerPage;
    const paginatedData = keywordData.slice(startIndex, startIndex + itemsPerPage);

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
            <td data-tooltip="${item.site || 'N/A'}">${item.site || 'N/A'}</td>
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
});

keywordsTab.addEventListener('click', () => {
    keywordsTab.classList.add('active');
    storesTab.classList.remove('active');
    keywordsView.classList.remove('hidden');
    storesView.classList.add('hidden');
    keywordCurrentPage = 1;
    if (keywordData.length === 0) fetchKeywordData();
});

// 初始化时自动加载数据
auth.onAuthStateChanged((user) => {
    if (user) {
        storesTab.click();
    }
});
