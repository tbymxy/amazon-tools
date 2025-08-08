// server.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const cors = require('cors'); // 确保 cors 模块已引入
// ...

const app = express();
const port = 3000;

// 暂时将 CORS 配置为允许所有来源和所有请求方法
// 这将排除跨域问题，用于测试
// 成功后，可以再将 origin 限制为 'https://tbymxy.github.io'
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
}));

app.use(bodyParser.json());


// ⚠️ 请将您的 Firebase Admin SDK 配置粘贴到这里 ⚠️
// 1. 登录 Firebase 控制台
// 2. 选择您的项目
// 3. 进入 "项目设置" > "服务账号"
// 4. 生成一个新的私钥并下载 JSON 文件
// 5. 将该 JSON 文件中的内容复制到下面的对象中

const serviceAccount = {
  "type": "service_account",
  "project_id": "seller-data-hgy",
  "private_key_id": "6765862928e26bc807fa54783952798f4514cd09",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDN155yIsu3oPAE\nO9I1r4j0P0KBBidsen3VO4CP6fKlbSxWS/vDVkW+GkG0aW5xg2Lm+RMCI31MEAqE\nM3yOgHGYcWtoSkgfg+wCQ2ggdSIz8ve4ksV1QvuyD/TDHyK+xZL8wszv7Jh0h0Nr\nQCjOcG+BtEauD2ag689NHzVBe2T3OZtAUnLkIfN/KvbiWKKTZDPja4yt4YNC18Da\ng8ESFZPpyYO5y8eWQzKUq74LMX5SJTVUSXncCKDstZsMMVWcm/KJEnzUwgeC5RUM\nYFCzlAwze7MQ3kDcgfpH0NB1ji+Q6O4SCAEpqrGjt7TZ7zeCao6Gy0QorjKf7cSC\ngPpjEjqTAgMBAAECggEALdrcPbHZrwEHpvHKnNILUNnsz0BXNPe+o2tbcvPbbZW5\n/El1/uhvpe9EdtPL2ja6KBkRbncIeRLTvOqZU0dyxtJxamytz3N8dm6cuipN4cO9\nAp2TplEzL9IVJQiBHX13Bp7At6v9tGvTjYdf78klVgAahLkClFOjvRr4Kqu57Ma+\nTJwCw4f4q3M5fJa6E31refqi7N91u6wZUniadrxpIrnq3rU3ikuW3peLhIMmyjBO\npF/8SADKwRdT8bMBphiLV56Ij44eW9ytqtT8VYTs9ZAGAm5tYmqpjaqmCvw+w0Bx\n9YXy6nM4tii3sR8CdB5Ynx5Dnk3Wz2/CsXfA6ThpiQKBgQD63mbC1jg/Uf55dKAV\nL+IME9Hd50qGkKcMtjD3Hv+452hqOZU4vJOXmJ+7ouDBUvqrwGj2pwVi825HrNqz\nW+iTQXElg7QM9XQ+UmF35cAan8N2SEwy9GDUHTxEnReXQwr9/snae6bZOfDgWwSt\nkyFT3/jI7qyW+QCYsMvIIz3bCwKBgQDSDXMqBqh6u9JV7QUovl/C8Yl7cTtvkIR8\nOxW+EFFzLt1A34Wyex5GEaJBO9yQijl9JGodT/HlRpjac55K6O02Q09hStpXERMA\nIokbMxrI6fcSgfwv7VYmEGorbYfcxx3kd7gUqhozD8oBqNsiFRPAnBfGYTcGotbv\nSO2bptmTmQKBgQCDqwjqR/77lPBoFMMUe647wodK3WMrH27d6B3pBhcXmDUgU5qz\nTZ51WYC0vbcTIJc6X+F3W5AjMDr4WYvryVhXOWjGVMrCZm2dbCWGBUr/bkzrnuSH\ndeYATlvcc0r3dBOn3ftZtb6LkrKPPpZE98ztNcdgxoxFLOmYOmqqX3zOowKBgQDD\nMMRntTAyfP6D4nD834tVN+Yt05cLoRu75Zvatoc5pb7sXcl7hXUoX5KLU/kuR4QM\nih4hhvydtfCsbuwVaEWmOv40xr4GUlN5uJ33rJGjSebSR//0+XMog/Bk0q+BtXZN\nrAJfEYKvGGj7CdI35aYpQePF8OiVPhTE3twN3AorYQKBgQDG6L84FOXJrDPvmulS\nYVShOtIRbcLuyHsIp5CxU6DgsDIG0kd0HOb/M+llbxQVbaUGwxVVJyzhjBrpJX3V\nM+BoO4+hAu3E605pbemCx5TCIkDM0lItlFYdPcmEcg1UTFEiECscyxoo75yZJDpI\nHWUaZok5WZ3lNL1zZxrNlIaWVw==\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@seller-data-hgy.iam.gserviceaccount.com",
  "client_id": "114853517685530512823",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40seller-data-hgy.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}


// 初始化 Firebase Admin SDK
initializeApp({
    credential: cert(serviceAccount)
});
const db = getFirestore();

// 获取 Featured Count 的辅助函数（使用 Puppeteer）
async function getFeaturedCount(page, url) {
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const countText = await page.evaluate(() => {
            const h2 = document.querySelector('#search > span > div > h1 > div > div:nth-child(1) > div > h2 > span:nth-child(1)');
            return h2 ? h2.textContent.trim() : '';
        });
        const match = countText.match(/(?:共|over|超過|of over)\s*([\d,\.]+)\s*(?:個|results)?/i);
        if (match) {
            return match[1].replace(/[\.,]/g, '');
        }
        return 'N/A';
    } catch (e) {
        console.error(`Error fetching featured count for URL ${url}:`, e);
        return 'N/A';
    }
}

// 代理更新店铺数据的 API
app.post('/updateStore', async (req, res) => {
    const { id, site, sellerId } = req.body;

    if (!id || !site || !sellerId) {
        return res.status(400).json({ success: false, error: '缺少 ID, site 或 sellerId' });
    }

    console.log(`Received request to update store: ${id}, site: ${site}, sellerId: ${sellerId}`);

    let browser;
    try {
        console.log('正在启动 Puppeteer 浏览器...');
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        // 访问店铺页面获取基本信息
        const storeUrl = `https://www.${site}/sp?seller=${sellerId}`;
        console.log(`正在访问店铺页面: ${storeUrl}`);
        
        // **重要修改:** 增加导航超时，并处理异常
        try {
            await page.goto(storeUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        } catch (e) {
            console.error(`访问店铺页面超时或失败: ${e.message}`);
            // 如果超时，我们仍然尝试继续，因为可能是页面加载慢
        }
        
        const data = await page.evaluate(() => {
            // ... 你的数据抓取代码 ...
            const getSafeText = (sel) => {
                const el = document.querySelector(sel);
                return el ? el.textContent.trim() : 'N/A';
            };

            const sellerName = getSafeText('#seller-name');
            const feedbackRaw = getSafeText('#seller-info-feedback-summary > span > a > b');
            const rating = getSafeText('#rating-365d-num > span.ratings-reviews-count');
            const reviewsRaw = getSafeText('#effective-timeperiod-rating-year-description');
            
            // 数据清洗（在前端和后端都保留，以防万一）
            const cleanFeedback = (feedback) => {
                const match = String(feedback || '').match(/(\d{1,3})\s*[％%]/);
                return match ? `${match[1]}%` : 'N/A';
            };
            const cleanNumberWithDot = (text) => {
                if (!text) return 'N/A';
                return String(text).replace(/(\d),(\d)/g, '$1.$2');
            };

            return {
                sellerName: sellerName,
                feedback: cleanFeedback(feedbackRaw),
                rating: cleanNumberWithDot(rating),
                reviews: cleanNumberWithDot(reviewsRaw),
            };
        });
        console.log('抓取到的数据:', data);


        // 访问搜索页面获取 featuredCount
        const marketplaceId = await page.evaluate(() => {
            // ... 你的 marketplaceId 获取逻辑 ...
            const url = window.location.href;
            if (url.includes('.co.jp')) return 'A1VC38T7YXB528';
            if (url.includes('.com')) return 'ATVPDKIKX0DER';
            // ... (可以添加更多站点的判断逻辑)
            return '';
        });
        const recommendUrl = `https://www.${site}/s?me=${sellerId}&marketplaceID=${marketplaceId}`;
        
        console.log(`正在访问 Featured 页面: ${recommendUrl}`);

        // **重要修改:** 增加导航超时
        const recommendCount = await getFeaturedCount(page, recommendUrl);

        // ... 将所有数据整合 ...
        const updatedData = {
            ...data,
            featuredCount: recommendCount,
            lastUpdated: new Date()
        };

        // 写入 Firestore
        console.log('准备写入 Firestore 的数据:', updatedData);
        
        // --- 核心改动 ---
        // 使用 Promise.race 增加写入超时，防止无限等待
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Firestore 写入超时，请检查网络或Firebase配置')), 10000)
        );
        
        const firestoreUpdate = db.collection('amazonStores').doc(id).set(updatedData, { merge: true });

        await Promise.race([firestoreUpdate, timeout]);
        // --- 核心改动结束 ---
        
        console.log(`数据已成功写入 Firestore。文档ID: ${id}`);
        
        res.status(200).json({ success: true, message: `店铺 ${id} 更新成功` });

    } catch (error) {
        console.error(`更新店铺 ${id} 失败:`, error);
        res.status(500).json({ success: false, error: '代理服务器内部错误' });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

// `getFeaturedCount` 函数也需要增加超时和日志
async function getFeaturedCount(page, url) {
    try {
        console.log(`[getFeaturedCount] 正在访问 URL: ${url}`);
        // **重要修改:** 增加超时选项
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const countText = await page.evaluate(() => {
            const h2 = document.querySelector('#search > span > div > h1 > div > div:nth-child(1) > div > h2 > span:nth-child(1)');
            return h2 ? h2.textContent.trim() : '';
        });
        // ... 你的数据清洗逻辑 ...
        return 'N/A';
    } catch (e) {
        console.error(`[getFeaturedCount] 访问页面或抓取数据失败:`, e);
        return 'N/A';
    }
}


app.listen(port, () => {
    console.log(`Proxy server listening at http://localhost:${port}`);
    console.log('请确保已安装Node.js, Express, Puppeteer 和 Firebase Admin SDK');
    console.log('运行以下命令安装依赖: npm install express body-parser cors puppeteer firebase-admin');
    console.log('请在浏览器中打开您的前端页面，即可通过该服务更新数据。');
});
