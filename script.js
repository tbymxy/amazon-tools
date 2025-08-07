// 你的 Firebase 配置
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDqPJFaBp0x4ZBxXA46cAQ83iKx2NP6_Q4",
    authDomain: "seller-data-hgy.firebaseapp.com",
    projectId: "seller-data-hgy",
    storageBucket: "seller-data-hgy.firebasestorage.app",
    messagingSenderId: "663736276108",
    appId: "1:663736276108:web:f7dc897d49b342fbc217a9"
};

// 初始化 Firebase
firebase.initializeApp(FIREBASE_CONFIG);
const auth = firebase.auth();
const db = firebase.firestore();

// UI 元素
const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const authErrorMessage = document.getElementById('auth-error-message');
const userEmailSpan = document.getElementById('user-email');
const dataList = document.getElementById('data-list');
const searchInput = document.getElementById('search-input');
const siteFilter = document.getElementById('site-filter');

let allData = []; // 存储所有数据的全局变量

// 监听登录状态变化
auth.onAuthStateChanged(user => {
    if (user) {
        // 用户已登录
        loginContainer.style.display = 'none';
        dashboardContainer.style.display = 'block';
        logoutBtn.style.display = 'inline-block';
        userEmailSpan.textContent = user.email;
        fetchData();
    } else {
        // 用户未登录
        loginContainer.style.display = 'flex';
        dashboardContainer.style.display = 'none';
        logoutBtn.style.display = 'none';
        userEmailSpan.textContent = '';
    }
});

// 登录事件
loginBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    authErrorMessage.textContent = '';
    auth.signInWithEmailAndPassword(email, password)
        .catch(error => {
            authErrorMessage.textContent = `登录失败: ${error.message}`;
        });
});

// 注册事件
registerBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    authErrorMessage.textContent = '';
    auth.createUserWithEmailAndPassword(email, password)
        .catch(error => {
            authErrorMessage.textContent = `注册失败: ${error.message}`;
        });
});

// 退出登录事件
logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

// 从 Firestore 获取数据
async function fetchData() {
    try {
        const snapshot = await db.collection('scraped_data').get();
        const sites = new Set();
        allData = snapshot.docs.map(doc => {
            const data = doc.data();
            data.id = doc.id;
            sites.add(data.site);
            return data;
        });
        
        // 动态填充站点筛选器
        siteFilter.innerHTML = '<option value="">所有站点</option>';
        sites.forEach(site => {
            const option = document.createElement('option');
            option.value = site;
            option.textContent = site;
            siteFilter.appendChild(option);
        });

        renderData(allData);
    } catch (error) {
        dataList.innerHTML = `<p class="error-message">获取数据失败: ${error.message}</p>`;
    }
}

// 删除数据
async function deleteData(docId) {
    if (confirm('确定要删除这条数据吗？')) {
        try {
            await db.collection('scraped_data').doc(docId).delete();
            // 从本地数据中移除，并重新渲染
            allData = allData.filter(item => item.id !== docId);
            renderData(allData);
            alert('数据删除成功！');
        } catch (error) {
            alert(`删除失败: ${error.message}`);
        }
    }
}

// 渲染数据列表
function renderData(data) {
    if (data.length === 0) {
        dataList.innerHTML = '<p>没有找到任何数据。</p>';
        return;
    }
    dataList.innerHTML = data.map(item => {
        const isKeyword = item.keyword;
        if (isKeyword) {
            return `
                <div class="data-card">
                    <button class="delete-btn" onclick="deleteData('${item.id}')">&times;</button>
                    <h3>关键词采集</h3>
                    <p><strong>关键词:</strong> ${item.keyword}</p>
                    <p><strong>站点:</strong> ${item.site}</p>
                    <p><strong>结果数:</strong> ${item.count}</p>
                    <p><strong>采集日期:</strong> ${item.date}</p>
                </div>
            `;
        } else {
            return `
                <div class="data-card">
                    <button class="delete-btn" onclick="deleteData('${item.id}')">&times;</button>
                    <h3>店铺采集</h3>
                    <p><strong>店铺名:</strong> ${item.sellerName}</p>
                    <p><strong>SellerID:</strong> ${item.sellerId}</p>
                    <p><strong>站点:</strong> ${item.site}</p>
                    <p><strong>Feedback:</strong> ${item.feedback}</p>
                    <p><strong>推荐产品数:</strong> ${item.recommendCount}</p>
                </div>
            `;
        }
    }).join('');
}

// 筛选和搜索功能
function filterAndSearch() {
    const searchText = searchInput.value.toLowerCase();
    const selectedSite = siteFilter.value;
    const filteredData = allData.filter(item => {
        const matchesSearch = item.sellerName?.toLowerCase().includes(searchText) || 
                              item.keyword?.toLowerCase().includes(searchText) || 
                              item.sellerId?.toLowerCase().includes(searchText) ||
                              item.site?.toLowerCase().includes(searchText);
        const matchesSite = !selectedSite || item.site === selectedSite;
        return matchesSearch && matchesSite;
    });
    renderData(filteredData);
}

searchInput.addEventListener('input', filterAndSearch);
siteFilter.addEventListener('change', filterAndSearch);
