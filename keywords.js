let allKeywordData = [];
const keywordDataList = document.getElementById('keyword-data-list');
const keywordSearchInput = document.getElementById('keyword-search-input');
const keywordSiteFilter = document.getElementById('keyword-site-filter');

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
    }
}

async function deleteKeywordData(docId) {
    if (confirm('确定要删除这条关键词数据吗？')) {
        try {
            await db.collection('scraped_data').doc(docId).delete();
            allKeywordData = allKeywordData.filter(item => item.id !== docId);
            renderKeywordData(allKeywordData);
            alert('关键词数据删除成功！');
        } catch (error) {
            alert(`删除失败: ${error.message}`);
        }
    }
}

function renderKeywordData(data) {
    if (data.length === 0) {
        keywordDataList.innerHTML = '<p>没有找到任何关键词数据。</p>';
        return;
    }
    keywordDataList.innerHTML = data.map(item => `
        <div class="data-card">
            <button class="delete-btn" onclick="deleteKeywordData('${item.id}')">&times;</button>
            <h3>关键词采集</h3>
            <p><strong>关键词:</strong> ${item.keyword}</p>
            <p><strong>站点:</strong> ${item.site}</p>
            <p><strong>结果数:</strong> ${item.count}</p>
            <p><strong>采集日期:</strong> ${item.date}</p>
        </div>
    `).join('');
}

function filterAndSearchKeywords() {
    const searchText = keywordSearchInput.value.toLowerCase();
    const selectedSite = keywordSiteFilter.value;
    const filteredData = allKeywordData.filter(item => {
        const matchesSearch = item.keyword?.toLowerCase().includes(searchText) ||
                              item.site?.toLowerCase().includes(searchText);
        const matchesSite = !selectedSite || item.site === selectedSite;
        return matchesSearch && matchesSite;
    });
    renderKeywordData(filteredData);
}

keywordSearchInput.addEventListener('input', filterAndSearchKeywords);
keywordSiteFilter.addEventListener('change', filterAndSearchKeywords);

// 页面加载后立即获取数据
if (auth.currentUser) {
    fetchKeywordData();
} else {
    // 监听认证状态，登录后再加载数据
    auth.onAuthStateChanged(user => {
        if (user) {
            fetchKeywordData();
        }
    });
}
