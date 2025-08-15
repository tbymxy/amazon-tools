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
const ratingHeader = document.getElementById('rating-header');
const keywordDateHeader = document.getElementById('keyword-date-header');
const storeFiltersDiv = document.getElementById('store-filters');
const keywordFiltersDiv = document.getElementById('keyword-filters');

const storeSearchInput = document.getElementById('store-search-input');
const keywordSearchInput = document.getElementById('keyword-search-input');

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


// 原始数据和过滤数据
let storeData = [];
let keywordData = [];
let filteredStoreData = [];
let filteredKeywordData = [];

// 排序和筛选状态
let storeSortKey = 'rating';
let storeSortDir = 'desc';
let keywordSortKey = 'date';
let keywordSortDir = 'desc';

let activeStoreSiteFilter = 'all';
let activeKeywordSiteFilter = 'all';

// 多选状态
let selectedStoreIds = [];
let selectedKeywordIds = [];

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

// 绑定搜索事件
storeSearchInput.addEventListener('input', () => {
    filterAndSortStoreData();
    renderStoreTable();
});

keywordSearchInput.addEventListener('input', () => {
    filterAndSortKeywordData();
    renderKeywordTable();
});

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
            filterAndSortStoreData();
            renderStoreTable();
        } else {
            activeKeywordSiteFilter = 'all';
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
                filterAndSortStoreData();
                renderStoreTable();
            } else {
                activeKeywordSiteFilter = site;
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

        let keywordLink = item.keyword || 'N/A';
        if (keywordUrl !== '#') {
            keywordLink = `<a href="${keywordUrl}" target="_blank">${item.keyword}</a>`;
        }
        
        tr.innerHTML = `
            <td><input type="checkbox" class="keyword-checkbox" data-id="${item.id}" ${isSelected ? 'checked' : ''}></td>
            <td>${index + 1}</td>
            <td data-tooltip="${item.site || 'N/A'}">${getSiteAbbreviation(item.site) || 'N/A'}</td>
            <td data-tooltip="${item.keyword || 'N/A'}">${keywordLink}</td>
            <td data-tooltip="${item.keywordZh || 'N/A'}">${item.keywordZh || 'N/A'}</td>
            <td data-tooltip="${item.count || 'N/A'}">${item.count || 'N/A'}</td>
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

// --- 导入导出功能 ---
function exportToCsv(data, filename) {
    if (data.length === 0) {
        alert('没有数据可供导出！');
        return;
    }
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const item of data) {
        const values = headers.map(header => {
            const value = item[header] || '';
            // Escape special characters in CSV
            const escaped = ('' + value).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 模板文件下载函数
const storeTemplateHeaders = ['site', 'sellerId', 'sellerName', 'feedback', 'rating', 'reviews', 'Featured', 'NewestArrivals', 'url'];
const keywordTemplateHeaders = ['site', 'keyword', 'keywordZh', 'count', 'date', 'url'];

function downloadTemplate(headers, filename) {
    const csvRows = [];
    csvRows.push(headers.join(','));
    csvRows.push(headers.map(() => '').join(',')); // Add an empty line for the template

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


function handleImport(file, collectionName) {
    if (!file) {
        alert('请选择一个文件！');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const text = e.target.result;
            const lines = text.split('\n');
            const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
            const dataToImport = [];

            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim() === '') continue;
                const values = lines[i].split(',').map(value => value.trim().replace(/"/g, ''));
                if (values.length !== headers.length) {
                    console.warn(`Skipping malformed row: ${lines[i]}`);
                    continue;
                }
                const record = {};
                headers.forEach((header, index) => {
                    record[header] = values[index];
                });
                dataToImport.push(record);
            }

            if (dataToImport.length > 0) {
                await importDataToFirestore(dataToImport, collectionName);
                alert('数据导入成功！');
                if (collectionName === 'amazonStores') {
                    fetchStoreData();
                } else {
                    fetchKeywordData();
                }
            } else {
                alert('文件内容为空或格式不正确。');
            }
        } catch (error) {
            console.error("导入文件失败: ", error);
            alert('文件解析失败，请确保格式正确。');
        }
    };
    reader.readAsText(file);
}

async function importDataToFirestore(data, collectionName) {
    const batch = db.batch();
    const collectionRef = db.collection(collectionName);
    const uniqueRecords = new Map();

    // Find a suitable unique identifier. Assuming `sellerName` for stores and `keyword` for keywords.
    const uniqueKey = collectionName === 'amazonStores' ? 'sellerName' : 'keyword';

    for (const record of data) {
        if (record[uniqueKey]) {
            uniqueRecords.set(record[uniqueKey], record);
        }
    }

    const uniqueRecordsArray = Array.from(uniqueRecords.values());
    const existingDocs = await collectionRef.where(uniqueKey, 'in', Array.from(uniqueRecords.keys())).get();

    const existingDocsMap = new Map();
    existingDocs.forEach(doc => {
        existingDocsMap.set(doc.data()[uniqueKey], doc.id);
    });

    for (const record of uniqueRecordsArray) {
        const existingDocId = existingDocsMap.get(record[uniqueKey]);
        if (existingDocId) {
            batch.update(collectionRef.doc(existingDocId), record);
        } else {
            batch.set(collectionRef.doc(), record);
        }
    }
    
    await batch.commit();
}


storeExportBtn.addEventListener('click', () => {
    exportToCsv(filteredStoreData, 'amazon_stores.csv');
});

storeImportBtn.addEventListener('click', () => {
    storeImportFile.click();
});

storeImportFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    handleImport(file, 'amazonStores');
});

storeDownloadTemplateBtn.addEventListener('click', () => {
    downloadTemplate(storeTemplateHeaders, 'amazon_stores_template.csv');
});

keywordExportBtn.addEventListener('click', () => {
    exportToCsv(filteredKeywordData, 'amazon_keywords.csv');
});

keywordImportBtn.addEventListener('click', () => {
    keywordImportFile.click();
});

keywordImportFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    handleImport(file, 'amazonKeywords');
});

keywordDownloadTemplateBtn.addEventListener('click', () => {
    downloadTemplate(keywordTemplateHeaders, 'amazon_keywords_template.csv');
});

storeDeleteSelectedBtn.addEventListener('click', deleteSelectedStores);
keywordDeleteSelectedBtn.addEventListener('click', deleteSelectedKeywords);


// 全选/取消全选功能
storeSelectAll.addEventListener('change', (e) => toggleSelectAll(e.target.checked, 'store'));
keywordSelectAll.addEventListener('change', (e) => toggleSelectAll(e.target.checked, 'keyword'));

function toggleSelectAll(isChecked, type) {
    const checkboxes = document.querySelectorAll(`.${type}-checkbox`);
    const deleteBtn = type === 'store' ? storeDeleteSelectedBtn : keywordDeleteSelectedBtn;
    const tableBody = type === 'store' ? storeTableBody : keywordTableBody;

    if (isChecked) {
        if (type === 'store') {
            selectedStoreIds = filteredStoreData.map(item => item.id);
        } else {
            selectedKeywordIds = filteredKeywordData.map(item => item.id);
        }
    } else {
        if (type === 'store') {
            selectedStoreIds = [];
        } else {
            selectedKeywordIds = [];
        }
    }
    
    checkboxes.forEach(cb => {
        cb.checked = isChecked;
        const row = cb.closest('tr');
        if (row) {
            if (isChecked) {
                row.classList.add('selected');
            } else {
                row.classList.remove('selected');
            }
        }
    });

    deleteBtn.disabled = selectedStoreIds.length === 0 && selectedKeywordIds.length === 0;
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

async function deleteSelectedStores() {
    if (selectedStoreIds.length === 0) return;
    if (confirm(`确定要删除选中的 ${selectedStoreIds.length} 条店铺数据吗？`)) {
        try {
            const batch = db.batch();
            selectedStoreIds.forEach(id => {
                const docRef = db.collection('amazonStores').doc(id);
                batch.delete(docRef);
            });
            await batch.commit();
            selectedStoreIds = [];
            fetchStoreData();
            alert('批量删除成功！');
        } catch (error) {
            console.error("批量删除失败: ", error);
            alert('批量删除失败，请检查控制台。');
        }
    }
}

async function deleteSelectedKeywords() {
    if (selectedKeywordIds.length === 0) return;
    if (confirm(`确定要删除选中的 ${selectedKeywordIds.length} 条关键词数据吗？`)) {
        try {
            const batch = db.batch();
            selectedKeywordIds.forEach(id => {
                const docRef = db.collection('amazonKeywords').doc(id);
                batch.delete(docRef);
            });
            await batch.commit();
            selectedKeywordIds = [];
            fetchKeywordData();
            alert('批量删除成功！');
        } catch (error) {
            console.error("批量删除失败: ", error);
            alert('批量删除失败，请检查控制台。');
        }
    }
}

// --- 页面切换功能 ---
storesTab.addEventListener('click', () => {
    storesTab.classList.add('active');
    keywordsTab.classList.remove('active');
    storesView.classList.remove('hidden');
    keywordsView.classList.add('hidden');
    if (storeData.length === 0) fetchStoreData();
    else processStoreData();
    updateSortIcon(ratingHeader, storeSortDir);
});

keywordsTab.addEventListener('click', () => {
    keywordsTab.classList.add('active');
    storesTab.classList.remove('active');
    keywordsView.classList.remove('hidden');
    storesView.classList.add('hidden');
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