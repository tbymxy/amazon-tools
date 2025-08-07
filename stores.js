let allStoreData = [];
const storeDataList = document.getElementById('store-data-list');
const storeSearchInput = document.getElementById('store-search-input');
const storeSiteFilter = document.getElementById('store-site-filter');

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
    }
}

async function deleteStoreData(docId) {
    if (confirm('确定要删除这条店铺数据吗？')) {
        try {
            await db.collection('scraped_data').doc(docId).delete();
            allStoreData = allStoreData.filter(item => item.id !== docId);
            renderStoreData(allStoreData);
            alert('店铺数据删除成功！');
        } catch (error) {
            alert(`删除失败: ${error.message}`);
        }
    }
}

function renderStoreData(data) {
    if (data.length === 0) {
        storeDataList.innerHTML = '<p>没有找到任何店铺数据。</p>';
        return;
    }
    storeDataList.innerHTML = data.map(item => `
        <div class="data-card">
            <button class="delete-btn" onclick="deleteStoreData('${item.id}')">&times;</button>
            <h3>店铺采集</h3>
            <p><strong>店铺名:</strong> ${item.sellerName}</p>
            <p><strong>SellerID:</strong> ${item.sellerId}</p>
            <p><strong>站点:</strong> ${item.site}</p>
            <p><strong>Feedback:</strong> ${item.feedback}</p>
            <p><strong>推荐产品数:</strong> ${item.recommendCount}</p>
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

storeSearchInput.addEventListener('input', filterAndSearchStores);
storeSiteFilter.addEventListener('change', filterAndSearchStores);

// 页面加载后立即获取数据
if (auth.currentUser) {
    fetchStoreData();
} else {
    // 监听认证状态，登录后再加载数据
    auth.onAuthStateChanged(user => {
        if (user) {
            fetchStoreData();
        }
    });
}
