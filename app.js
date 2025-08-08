// Firebase 配置
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDqPJFaBp0x4ZBxXA46cAQ83iKx2NP6_Q4",
    authDomain: "seller-data-hgy.firebaseapp.com",
    projectId: "seller-data-hgy",
    storageBucket: "seller-data-hgy.firebasestorage.app",
    messagingSenderId: "663736276108",
    appId: "1:663736276108:web:f7dc897d49b342fbc217a9"
};

// 初始化 Firebase 并定义全局变量
firebase.initializeApp(FIREBASE_CONFIG);
const auth = firebase.auth();
const db = firebase.firestore();

// UI 元素
const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');
const authErrorMessage = document.getElementById('auth-error-message');
const userEmailSpan = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');

// 登录/注册按钮
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');

// 导航和数据区域
const showStoresBtn = document.getElementById('show-stores-btn');
const showKeywordsBtn = document.getElementById('show-keywords-btn');
const storesSection = document.getElementById('stores-section');
const keywordsSection = document.getElementById('keywords-section');

// 店铺数据元素
const storeDataList = document.getElementById('store-data-list');
const storeSearchInput = document.getElementById('store-search-input');
const storeSiteFilter = document.getElementById('store-site-filter');
const storeTotalCount = document.getElementById('store-total-count');
const storePagination = document.getElementById('store-pagination');
let allStoreData = [];
let filteredStoreData = [];
let currentPageStore = 1;
const itemsPerPage = 20;

// 关键词数据元素
const keywordDataList = document.getElementById('keyword-data-list');
const keywordSearchInput = document.getElementById('keyword-search-input');
const keywordSiteFilter = document.getElementById('keyword-site-filter');
const keywordTotalCount = document.getElementById('keyword-total-count');
const keywordPagination = document.getElementById('keyword-pagination');
let allKeywordData = [];
let filteredKeywordData = [];
let currentPageKeyword = 1;

// --- 辅助函数：渲染和过滤 ---

function getStoreUrl(sellerId, site) {
    const domainMap = {
        'amazon.com': 'www.amazon.com',
        'amazon.co.uk': 'www.amazon.co.uk',
        'amazon.de': 'www.amazon.de',
        'amazon.fr': 'www.amazon.fr',
        'amazon.es': 'www.amazon.es',
        'amazon.it': 'www.amazon.it',
        'amazon.ca': 'www.amazon.ca',
        'amazon.jp': 'www.amazon.co.jp',
        'amazon.au': 'www.amazon.com.au'
    };
    const domain = domainMap[site] || 'www.amazon.com';
    return `https://${domain}/sp?seller=${sellerId}`;
}

function getKeywordUrl(keyword, site) {
    const domainMap = {
        'amazon.com': 'www.amazon.com',
        'amazon.co.uk': 'www.amazon.co.uk',
        'amazon.de': 'www.amazon.de',
        'amazon.fr': 'www.amazon.fr',
        'amazon.es': 'www.amazon.es',
        'amazon.it': 'www.amazon.it',
        'amazon.ca': 'www.amazon.ca',
        'amazon.jp': 'www.amazon.co.jp',
        'amazon.au': 'www.amazon.com.au'
    };
    const domain = domainMap[site] || 'www.amazon.com';
    return `https://${domain}/s?k=${encodeURIComponent(keyword)}`;
}

function renderPagination(totalItems, currentPage, container, renderFunction) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    container.innerHTML = '';

    if (totalPages <= 1) return;

    const createButton = (text, page, isActive = false) => {
        const button = document.createElement('button');
        button.textContent = text;
        button.classList.add('copilot-amz-btn', 'pagination-btn');
        if (isActive) button.classList.add('active');
        button.disabled = isActive;
        button.addEventListener('click', () => {
            currentPage = page;
            if (renderFunction === renderStoreData) currentPageStore = page;
            else currentPageKeyword = page;
            const start = (page - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const dataToRender = (renderFunction === renderStoreData) ? filteredStoreData.slice(start, end) : filteredKeywordData.slice(start, end);
            renderFunction(dataToRender);
            renderPagination(totalItems, currentPage, container, renderFunction);
        });
        return button;
    };

    container.appendChild(createButton('上一页', currentPage > 1 ? currentPage - 1 : 1, currentPage === 1));

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (currentPage <= 3) endPage = Math.min(totalPages, 5);
    if (currentPage > totalPages - 2) startPage = Math.max(1, totalPages - 4);

    if (startPage > 1) {
        container.appendChild(createButton('1', 1));
        if (startPage > 2) {
            const span = document.createElement('span');
            span.textContent = '...';
            container.appendChild(span);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        container.appendChild(createButton(i, i, i === currentPage));
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const span = document.createElement('span');
            span.textContent = '...';
            container.appendChild(span);
        }
        container.appendChild(createButton(totalPages, totalPages));
    }

    container.appendChild(createButton('下一页', currentPage < totalPages ? currentPage + 1 : totalPages, currentPage === totalPages));
}

function renderStoreData(data) {
    if (data.length === 0) {
        storeDataList.innerHTML = '<tr><td colspan="10">没有找到任何店铺数据。</td></tr>';
        return;
    }
    const startIndex = (currentPageStore - 1) * itemsPerPage;
    storeDataList.innerHTML = data.map((item, index) => {
        // 数据清洗：移除 Feedback 中的逗号
        const cleanedFeedback = (item.feedback || 'N/A').toString().replace(/,/g, '');
        return `
        <tr>
            <td>${startIndex + index + 1}</td>
            <td>${item.site || 'N/A'}</td>
            <td><a href="${getStoreUrl(item.sellerId, item.site)}" target="_blank">${item.sellerName || 'N/A'}</a></td>
            <td>${cleanedFeedback}</td>
            <td>${item.rating || 'N/A'}</td>
            <td>${item.reviews || 'N/A'}</td>
            <td>${item.recommendCount || 'N/A'}</td>
            <td>${item.newProductCount || 'N/A'}</td>
            <td>${item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
            <td>
                <button class="action-btn update-btn" onclick="updateData('${item.id}')">更新</button>
                <button class="action-btn delete-btn" onclick="deleteData('${item.id}', 'amazonStores')">删除</button>
            </td>
        </tr>
    `}).join('');
    storeTotalCount.textContent = filteredStoreData.length;
    renderPagination(filteredStoreData.length, currentPageStore, storePagination, renderStoreData);
}

function renderKeywordData(data) {
    if (data.length === 0) {
        keywordDataList.innerHTML = '<tr><td colspan="6">没有找到任何关键词数据。</td></tr>';
        return;
    }
    const startIndex = (currentPageKeyword - 1) * itemsPerPage;
    keywordDataList.innerHTML = data.map((item, index) => `
        <tr>
            <td>${startIndex + index + 1}</td>
            <td>${item.site || 'N/A'}</td>
            <td><a href="${getKeywordUrl(item.keyword, item.site)}" target="_blank">${item.keyword || 'N/A'}</a></td>
            <td>${item.count || 'N/A'}</td>
            <td>${item.date || 'N/A'}</td>
            <td><button class="action-btn delete-btn" onclick="deleteData('${item.id}', 'amazonKeywords')">删除</button></td>
        </tr>
    `).join('');
    keywordTotalCount.textContent = filteredKeywordData.length;
    renderPagination(filteredKeywordData.length, currentPageKeyword, keywordPagination, renderKeywordData);
}

function filterAndSearchStores() {
    const searchText = storeSearchInput.value.toLowerCase();
    const selectedSite = storeSiteFilter.value;
    filteredStoreData = allStoreData.filter(item => {
        const matchesSearch = (item.sellerName?.toLowerCase().includes(searchText) ||
            item.sellerId?.toLowerCase().includes(searchText));
        const matchesSite = !selectedSite || item.site === selectedSite;
        return matchesSearch && matchesSite;
    });
    const start = (currentPageStore - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    renderStoreData(filteredStoreData.slice(start, end));
}

function filterAndSearchKeywords() {
    const searchText = keywordSearchInput.value.toLowerCase();
    const selectedSite = keywordSiteFilter.value;
    filteredKeywordData = allKeywordData.filter(item => {
        const matchesSearch = item.keyword?.toLowerCase().includes(searchText);
        const matchesSite = !selectedSite || item.site === selectedSite;
        return matchesSearch && matchesSite;
    });
    const start = (currentPageKeyword - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    renderKeywordData(filteredKeywordData.slice(start, end));
}

// --- 操作函数 ---

async function deleteData(docId, collectionName) {
    if (confirm('确定要删除这条数据吗？')) {
        try {
            await db.collection(collectionName).doc(docId).delete();
            if (collectionName === 'amazonStores') {
                allStoreData = allStoreData.filter(item => item.id !== docId);
                filterAndSearchStores();
            } else {
                allKeywordData = allKeywordData.filter(item => item.id !== docId);
                filterAndSearchKeywords();
            }
            alert('数据删除成功！');
        } catch (error) {
            alert(`删除失败: ${error.message}`);
        }
    }
}
window.deleteData = deleteData;

async function updateData(docId) {
    alert(`更新功能尚未实现，文档ID: ${docId}`);
}
window.updateData = updateData;

// --- 数据获取 ---

async function fetchStoreData() {
    storeDataList.innerHTML = '<tr><td colspan="10">正在加载店铺数据...</td></tr>';
    try {
        const snapshot = await db.collection('amazonStores').get();
        const sites = new Set();
        allStoreData = snapshot.docs.map(doc => {
            const data = doc.data();
            data.id = doc.id;
            sites.add(data.site);
            return data;
        });

        // 确保 rating 是数字，以便正确排序
        allStoreData.sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));

        storeSiteFilter.innerHTML = '<option value="">所有站点</option>';
        sites.forEach(site => {
            const option = document.createElement('option');
            option.value = site;
            option.textContent = site;
            storeSiteFilter.appendChild(option);
        });
        filterAndSearchStores();
    } catch (error) {
        storeDataList.innerHTML = `<tr><td colspan="10" class="error-message">获取店铺数据失败: ${error.message}</td></tr>`;
        console.error("Error fetching store data:", error);
    }
}

async function fetchKeywordData() {
    keywordDataList.innerHTML = '<tr><td colspan="6">正在加载关键词数据...</td></tr>';
    try {
        const snapshot = await db.collection('amazonKeywords').get();
        const sites = new Set();
        allKeywordData = snapshot.docs.map(doc => {
            const data = doc.data();
            data.id = doc.id;
            sites.add(data.site);
            return data;
        });

        allKeywordData.sort((a, b) => {
            const dateA = new Date(a.date || '1970-01-01');
            const dateB = new Date(b.date || '1970-01-01');
            return dateB - dateA;
        });

        keywordSiteFilter.innerHTML = '<option value="">所有站点</option>';
        sites.forEach(site => {
            const option = document.createElement('option');
            option.value = site;
            option.textContent = site;
            keywordSiteFilter.appendChild(option);
        });
        filterAndSearchKeywords();
    } catch (error) {
        keywordDataList.innerHTML = `<tr><td colspan="6" class="error-message">获取关键词数据失败: ${error.message}</td></tr>`;
        console.error("Error fetching keyword data:", error);
    }
}

// --- 认证状态监听器 (启动) ---
auth.onAuthStateChanged(user => {
    if (user) {
        if (loginContainer) loginContainer.style.display = 'none';
        if (dashboardContainer) dashboardContainer.style.display = 'block';
        if (userEmailSpan) userEmailSpan.textContent = user.email;
        if (logoutBtn) logoutBtn.style.display = 'inline-block';

        // 第一次登录时加载数据
        if (allStoreData.length === 0) {
            fetchStoreData();
        }
        if (allKeywordData.length === 0) {
            fetchKeywordData();
        }
    } else {
        if (loginContainer) loginContainer.style.display = 'flex';
        if (dashboardContainer) dashboardContainer.style.display = 'none';
        if (userEmailSpan) userEmailSpan.textContent = '';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
});

// --- 事件监听器 (启动) ---
document.addEventListener('DOMContentLoaded', () => {
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            loginBtn.disabled = true;
            authErrorMessage.textContent = '';
            auth.signInWithEmailAndPassword(emailInput.value, passwordInput.value)
                .catch(error => {
                    authErrorMessage.textContent = `登录失败: ${error.message}`;
                })
                .finally(() => {
                    loginBtn.disabled = false;
                });
        });
    }
    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            registerBtn.disabled = true;
            authErrorMessage.textContent = '';
            auth.createUserWithEmailAndPassword(emailInput.value, passwordInput.value)
                .catch(error => {
                    authErrorMessage.textContent = `注册失败: ${error.message}`;
                })
                .finally(() => {
                    registerBtn.disabled = false;
                });
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut();
        });
    }

    if (showStoresBtn) {
        showStoresBtn.addEventListener('click', () => showSection('stores'));
    }
    if (showKeywordsBtn) {
        showKeywordsBtn.addEventListener('click', () => showSection('keywords'));
    }

    if (storeSearchInput) storeSearchInput.addEventListener('input', () => {
        currentPageStore = 1;
        filterAndSearchStores();
    });
    if (storeSiteFilter) storeSiteFilter.addEventListener('change', () => {
        currentPageStore = 1;
        filterAndSearchStores();
    });
    if (keywordSearchInput) keywordSearchInput.addEventListener('input', () => {
        currentPageKeyword = 1;
        filterAndSearchKeywords();
    });
    if (keywordSiteFilter) keywordSiteFilter.addEventListener('change', () => {
        currentPageKeyword = 1;
        filterAndSearchKeywords();
    });
});
