document.addEventListener('DOMContentLoaded', () => {
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
    window.firebase.initializeApp(FIREBASE_CONFIG);
    const db = window.firebase.firestore();

    const tabs = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const storeList = document.getElementById('stores-data');
    const keywordList = document.getElementById('keywords-data');
    const storeSearchInput = document.getElementById('store-search-input');
    const keywordSearchInput = document.getElementById('keyword-search-input');
    const storeSearchBtn = document.getElementById('store-search-btn');
    const keywordSearchBtn = document.getElementById('keyword-search-btn');
    const storeSortSelect = document.getElementById('store-sort-select');
    const keywordSortSelect = document.getElementById('keyword-sort-select');
    const storeRefreshBtn = document.getElementById('store-refresh-btn');
    const keywordRefreshBtn = document.getElementById('keyword-refresh-btn');

    let currentTab = 'stores';
    let storesData = [];
    let keywordsData = [];

    // 显示通知
    function showNotification(message, isError = false) {
        const notif = document.createElement('div');
        notif.className = `notification ${isError ? 'error' : ''}`;
        notif.textContent = message;
        document.body.appendChild(notif);
        notif.style.display = 'block';
        setTimeout(() => notif.remove(), 3000);
    }

    // 渲染店铺数据
    function renderStores(data) {
        storeList.innerHTML = '';
        if (data.length === 0) {
            storeList.innerHTML = '<div class="empty-state">没有找到店铺数据。</div>';
            return;
        }
        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'data-card';
            card.innerHTML = `
                <h3 class="card-title">${item.sellerName || 'N/A'}</h3>
                <div class="card-body">
                    <p><strong>站点:</strong> ${item.site}</p>
                    <p><strong>SellerID:</strong> ${item.sellerId}</p>
                    <p><strong>Feedback:</strong> ${item.feedback || 'N/A'}</p>
                    <p><strong>Reviews:</strong> ${item.reviews || 'N/A'}</p>
                    <p><strong>推荐产品数:</strong> ${item.recommendCount || 'N/A'}</p>
                    <p><strong>新品产品数:</strong> ${item.newCount || 'N/A'}</p>
                    <p><strong>采集时间:</strong> ${new Date(item.createdAt).toLocaleString()}</p>
                    <p><a href="${item.url}" target="_blank">查看店铺详情</a></p>
                </div>
                <div class="card-actions">
                    <button class="delete-btn" data-id="${item.id}" data-type="store">删除</button>
                </div>
            `;
            storeList.appendChild(card);
        });
    }

    // 渲染关键词数据
    function renderKeywords(data) {
        keywordList.innerHTML = '';
        if (data.length === 0) {
            keywordList.innerHTML = '<div class="empty-state">没有找到关键词数据。</div>';
            return;
        }
        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'data-card';
            card.innerHTML = `
                <h3 class="card-title">${item.keyword || 'N/A'}</h3>
                <div class="card-body">
                    <p><strong>站点:</strong> ${item.site}</p>
                    <p><strong>搜索结果数:</strong> ${item.count || 'N/A'}</p>
                    <p><strong>采集日期:</strong> ${item.date}</p>
                    <p><a href="${item.url}" target="_blank">查看搜索结果</a></p>
                </div>
                <div class="card-actions">
                    <button class="delete-btn" data-id="${item.id}" data-type="keyword">删除</button>
                </div>
            `;
            keywordList.appendChild(card);
        });
    }

    // 从 Firestore 获取数据
    async function fetchData(collectionName) {
        const list = collectionName === 'scraped_data_stores' ? storeList : keywordList;
        list.innerHTML = '<div class="loading">正在加载数据...</div>';
        try {
            const snapshot = await db.collection(collectionName).get();
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return data;
        } catch (error) {
            list.innerHTML = '<div class="empty-state">数据加载失败，请检查网络或Firebase配置。</div>';
            console.error("Error fetching data: ", error);
            showNotification('数据加载失败。', true);
            return [];
        }
    }

    // 筛选和排序数据
    function filterAndSortData(data, type) {
        const searchInput = type === 'store' ? storeSearchInput : keywordSearchInput;
        const sortSelect = type === 'store' ? storeSortSelect : keywordSortSelect;
        const searchTerm = searchInput.value.toLowerCase();
        const sortValue = sortSelect.value;
        const [sortField, sortOrder] = sortValue.split('_');

        let filteredData = data.filter(item => {
            if (type === 'store') {
                return (item.sellerName && item.sellerName.toLowerCase().includes(searchTerm)) ||
                       (item.sellerId && item.sellerId.toLowerCase().includes(searchTerm));
            } else {
                return item.keyword && item.keyword.toLowerCase().includes(searchTerm);
            }
        });

        filteredData.sort((a, b) => {
            let valA = a[sortField] || '';
            let valB = b[sortField] || '';

            // 特殊处理数字排序
            if (sortField === 'reviews' || sortField === 'count') {
                valA = parseInt(valA.replace(/,/g, '')) || 0;
                valB = parseInt(valB.replace(/,/g, '')) || 0;
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return filteredData;
    }

    // 更新显示
    function updateDisplay(type) {
        if (type === 'stores') {
            const filtered = filterAndSortData(storesData, 'store');
            renderStores(filtered);
        } else if (type === 'keywords') {
            const filtered = filterAndSortData(keywordsData, 'keyword');
            renderKeywords(filtered);
        }
    }

    // 切换选项卡
    tabs.forEach(tab => {
        tab.addEventListener('click', async () => {
            const tabName = tab.dataset.tab;
            currentTab = tabName;

            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabName}-tab`).classList.add('active');

            if (tabName === 'stores' && storesData.length === 0) {
                storesData = await fetchData('scraped_data');
                updateDisplay('stores');
            } else if (tabName === 'keywords' && keywordsData.length === 0) {
                // 关键词数据也存放在 scraped_data 中，但需要筛选
                keywordsData = (await fetchData('scraped_data')).filter(item => item.keyword);
                updateDisplay('keywords');
            } else {
                updateDisplay(tabName);
            }
        });
    });

    // 删除数据
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const docId = e.target.dataset.id;
            const docType = e.target.dataset.type;

            if (!confirm(`确定要删除这条${docType === 'store' ? '店铺' : '关键词'}数据吗？`)) {
                return;
            }

            try {
                // 你的油猴脚本将店铺和关键词都存入了同一个名为 "scraped_data" 的集合
                await db.collection("scraped_data").doc(docId).delete();
                showNotification('数据删除成功！');

                // 从本地数组中移除并更新视图
                if (docType === 'store') {
                    storesData = storesData.filter(item => item.id !== docId);
                    updateDisplay('stores');
                } else {
                    keywordsData = keywordsData.filter(item => item.id !== docId);
                    updateDisplay('keywords');
                }
            } catch (error) {
                console.error("Error removing document: ", error);
                showNotification('删除失败。', true);
            }
        }
    });

    // 搜索和排序事件
    storeSearchBtn.addEventListener('click', () => updateDisplay('stores'));
    keywordSearchBtn.addEventListener('click', () => updateDisplay('keywords'));
    storeSortSelect.addEventListener('change', () => updateDisplay('stores'));
    keywordSortSelect.addEventListener('change', () => updateDisplay('keywords'));

    // 刷新按钮事件
    storeRefreshBtn.addEventListener('click', async () => {
        storesData = await fetchData('scraped_data');
        updateDisplay('stores');
    });

    keywordRefreshBtn.addEventListener('click', async () => {
        // 关键词数据也存放在 scraped_data 中，但需要筛选
        keywordsData = (await fetchData('scraped_data')).filter(item => item.keyword);
        updateDisplay('keywords');
    });

    // 初始加载店铺数据
    async function init() {
        storesData = await fetchData('scraped_data');
        updateDisplay('stores');
    }
    init();
});
