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
const db = firebase.firestore(); // db 变量现在是全局的，所有函数都能访问

// UI 元素
const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');
const authErrorMessage = document.getElementById('auth-error-message');
const userEmailSpan = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');

// 导航和数据区域
const showStoresBtn = document.getElementById('show-stores-btn');
const showKeywordsBtn = document.getElementById('show-keywords-btn');
const storesSection = document.getElementById('stores-section');
const keywordsSection = document.getElementById('keywords-section');

// 店铺数据元素
const storeDataList = document.getElementById('store-data-list');
const storeSearchInput = document.getElementById('store-search-input');
const storeSiteFilter = document.getElementById('store-site-filter');
let allStoreData = [];

// 关键词数据元素
const keywordDataList = document.getElementById('keyword-data-list');
const keywordSearchInput = document.getElementById('keyword-search-input');
const keywordSiteFilter = document.getElementById('keyword-site-filter');
let allKeywordData = [];

// --- 认证状态监听器 ---
auth.onAuthStateChanged(user => {
    if (user) {
        // 用户已登录：平滑显示仪表盘，并加载数据
        if (loginContainer) loginContainer.style.display = 'none';
        if (dashboardContainer) dashboardContainer.style.display = 'block';
        if (userEmailSpan) userEmailSpan.textContent = user.email;
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        
        // 登录后直接加载所有数据
        fetchStoreData();
        fetchKeywordData();
    } else {
        // 用户未登录：平滑显示登录界面
        if (loginContainer) loginContainer.style.display = 'flex';
        if (dashboardContainer) dashboardContainer.style.display = 'none';
        if (userEmailSpan) userEmailSpan.textContent = '';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
});

// --- 事件监听器 ---
document.addEventListener('DOMContentLoaded', () => {
    // 登录/注册按钮事件
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            authErrorMessage.textContent = '';
            auth.signInWithEmailAndPassword(emailInput.value, passwordInput.value).catch(error => {
                authErrorMessage.textContent = `登录失败: ${error.message}`;
            });
        });
    }
    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            authErrorMessage.textContent = '';
            auth.createUserWithEmailAndPassword(emailInput.value, passwordInput.value).catch(error => {
                authErrorMessage.textContent = `注册失败: ${error.message}`;
            });
        });
    }

    // 退出登录按钮事件
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut();
        });
    }

    // 导航切换按钮事件
    showStoresBtn.addEventListener('click', () => showSection('stores'));
    showKeywordsBtn.addEventListener('click', () => showSection('keywords'));

    // 搜索和筛选事件
    storeSearchInput.addEventListener('input', filterAndSearchStores);
    storeSiteFilter.addEventListener('change', filterAndSearchStores);
    keywordSearchInput.addEventListener('input', filterAndSearchKeywords);
    keywordSiteFilter.addEventListener('change', filterAndSearchKeywords);
});

// --- 功能函数 ---

function showSection(section) {
    if (section === 'stores') {
        storesSection.style.display = 'block';
        keywordsSection.style.display = 'none';
        showStoresBtn.classList.add('active-tab-btn');
        showKeywordsBtn.classList.remove('active-tab-btn');
        renderStoreData(allStoreData); // 切换时重新渲染，保持最新状态
    } else {
        storesSection.style.display = 'none';
        keywordsSection.style.display = 'block';
        showStoresBtn.classList.remove('active-tab-btn');
        showKeywordsBtn.classList.add('active-tab-btn');
        renderKeywordData(allKeywordData); // 切换时重新渲染
    }
}

async function fetchStoreData() {
    try {
        const snapshot = await db.collection('scraped_data').where('sellerId', '!=', null).get();
        const sites = new Set();
        allStoreData = snapshot.docs.map(doc => {
            const data = doc.data();
            data.id = doc.id;
            sites.add(data.site);
            return data;
        });
        
        // 动态填充筛选器并渲染数据
        storeSiteFilter.innerHTML = '<option value="">所有站点</option>';
        sites.forEach(site => {
            const option = document.createElement('option');
            option.value = site;
            option.textContent = site;
            storeSiteFilter.appendChild(option);
        });
        renderStoreData(allStoreData);
    } catch (error) {
        storeDataList.innerHTML = `<p class="error-message">获取店铺数据失败: ${error.message}</p>`;
        console.error("Error fetching store data:", error);
    }
}

async function fetchKeywordData() {
    try {
        const snapshot = await db.collection('scraped_data').where('keyword', '!=', null).get();
        const sites = new Set();
        allKeywordData = snapshot.docs.map(doc => {
            const data = doc.data();
            data.id = doc.id;
            sites.add(data.site);
            return data;
        });

        // 动态填充筛选器并渲染数据
        keywordSiteFilter.innerHTML = '<option value="">所有站点</option>';
        sites.forEach(site => {
            const option = document.createElement('option');
            option.value = site;
            option.textContent = site;
            keywordSiteFilter.appendChild(option);
        });
        renderKeywordData(allKeywordData);
    } catch (error) {
        keywordDataList.innerHTML = `<p class="error-message">获取关键词数据失败: ${error.message}</p>`;
        console.error("Error fetching keyword data:", error);
    }
}

async function deleteData(docId) {
    if (confirm('确定要删除这条数据吗？')) {
        try {
            await db.collection('scraped_data').doc(docId).delete();
            // 从本地数据中移除
            allStoreData = allStoreData.filter(item => item.id !== docId);
            allKeywordData = allKeywordData.filter(item => item.id !== docId);
            // 重新渲染当前显示的列表
            showSection(storesSection.style.display === 'block' ? 'stores' : 'keywords');
            alert('数据删除成功！');
        } catch (error) {
            alert(`删除失败: ${error.message}`);
        }
    }
}
window.deleteData = deleteData; // 将函数暴露给全局，以便 HTML 内联事件调用

function renderStoreData(data) {
    if (data.length === 0) {
        storeDataList.innerHTML = '<p>没有找到任何店铺数据。</p>';
        return;
    }
    storeDataList.innerHTML = data.map(item => `
        <div class="data-card">
            <button class="delete-btn" onclick="deleteData('${item.id}')">&times;</button>
            <h3>店铺采集</h3>
            <p><strong>店铺名:</strong> ${item.sellerName || 'N/A'}</p>
            <p><strong>SellerID:</strong> ${item.sellerId || 'N/A'}</p>
            <p><strong>站点:</strong> ${item.site || 'N/A'}</p>
            <p><strong>Feedback:</strong> ${item.feedback || 'N/A'}</p>
            <p><strong>推荐产品数:</strong> ${item.recommendCount || 'N/A'}</p>
            <p class="timestamp">采集于: ${new Date(item.createdAt).toLocaleDateString()}</p>
        </div>
    `).join('');
}

function renderKeywordData(data) {
    if (data.length === 0) {
        keywordDataList.innerHTML = '<p>没有找到任何关键词数据。</p>';
        return;
    }
    keywordDataList.innerHTML = data.map(item => `
        <div class="data-card">
            <button class="delete-btn" onclick="deleteData('${item.id}')">&times;</button>
            <h3>关键词采集</h3>
            <p><strong>关键词:</strong> ${item.keyword || 'N/A'}</p>
            <p><strong>站点:</strong> ${item.site || 'N/A'}</p>
            <p><strong>结果数:</strong> ${item.count || 'N/A'}</p>
            <p><strong>采集日期:</strong> ${item.date || 'N/A'}</p>
        </div>
    `).join('');
}

function filterAndSearchStores() {
    const searchText = storeSearchInput.value.toLowerCase();
    const selectedSite = storeSiteFilter.value;
    const filteredData = allStoreData.filter(item => {
        const matchesSearch = item.sellerName?.toLowerCase().includes(searchText) || 
                              item.sellerId?.toLowerCase().includes(searchText);
        const matchesSite = !selectedSite || item.site === selectedSite;
        return matchesSearch && matchesSite;
    });
    renderStoreData(filteredData);
}

function filterAndSearchKeywords() {
    const searchText = keywordSearchInput.value.toLowerCase();
    const selectedSite = keywordSiteFilter.value;
    const filteredData = allKeywordData.filter(item => {
        const matchesSearch = item.keyword?.toLowerCase().includes(searchText);
        const matchesSite = !selectedSite || item.site === selectedSite;
        return matchesSearch && matchesSite;
    });
    renderKeywordData(filteredData);
}
