const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const puppeteer = require('puppeteer');

// Firebase Admin SDK
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// 直接将你的私钥 JSON 数据嵌入到代码中
const serviceAccount = {
  "type": "service_account",
  "project_id": "seller-data-hgy",
  "private_key_id": "f563af6a7ba0b1922722761898d96631e51848f9",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC0sdluQM+8UN/X\ne0g9ksvVeTBLz2dwGUx9pXtJcoIgVTiOVkKcfic2hDq4uys4X9mT/aINnTxbSp0E\nzDt7emmRhQ4/IQW8xmZ+mOMCtWAxNunGZKCZY4b4GA5X5DRy43u7VNQypBbAyU3C\nWOX7OBHXwdWMVvLyBa5P8ZBdnSTaovl4FLWYSbgC21tsL/9nULs1xaVaLXJ5Cdfo\nXza8SHjTW58P5gichQJ7FkZV8be0W9p/MCR1c8OCp5vYQBOnq87fQAcRlPKWItlZ\nZccdI8KB2M9eJdB7E9uOQGCHsn14ZgN9hNZh3r4aIDJHonwjNty+fGmnng+/Glne\nzMB/p3tzAgMBAAECggEADq15r3qFRVM+c4b4ncPMWelPsoDE8rajX3tvMc6i4lR5\n1RoNrB+VONjx2iqd/qTOjDZokPmKOxIrAgZC+Ks/YwovV5JroGNvVO4/Vmt8RlMj\nFzH6V6tdfc6ab6pCVmjDFrrzx69Lh9pyPgyxlb/+twtwOMehUWaDu8uwAeKvaTD7\nr0EYegRz28Lc69gAZvzx9o/cOqVyiN2Yq/Y7qrYnupNuYlNcjr0dxi9f5C2BwyV7\ndE8vquibzpNxY3YZJpsANzC8NVzhimNwcM2syDIv3l0RDcn3AqnF5rPxi4tQIB9+\nBef1lilv20NrYA9/Mmn8ZMM2/79yYqMO783MaJN6zQKBgQDw4AM5zOOvsbFx1cYS\nUjIqOaOZKi6tlpbSUvpmc7Lt8wokaZubbrjPY/zj28GbpbPzBR4uV8b0koZYH2iF\nCuPuO1KrKTMwQ+MYFJYMqBe9N+IKOJbPQj5p9pA2De1zppipamdEEHJ+LsWkAZiZ\navXgpDvVf9CZnCu8Gi/4UWEIrQKBgQDACnUvLxDTSfzkhz7Z0s/958akH5B+Oi5G\n+znjZsSyP+9VAgIPBDd18WofMuCZDm1+5N5KjhfRvgiYxX1u+/0xQHVJVz74uHyM\nGFkQwi7C+OO7II52HpBQLAyUlXm/VVGpKU8s5KtRLG2wOaNM1Ofo5zmX4ldTRKUb\n9ZRVCdp4nwKBgQDHJP2lwO6RaIDDE7GhnhFZdbP7QrO60qC5HN9m6ssJDYHaHvIG\nrKDg3dLL8/j6nSHMjvOn7uxPcgDeRIFeVWWipaswVWy7v7S2SPbRWnvedaBNQQH2\nMtd1NeN+vT8O+bKHhq//xvVRu4utj6BBXvwPkNjjJ7wn88T4zFHSpD1sNQKBgAfB\npGAGf6B5EYzNZZ14pUv1C5HfcH+Yq/vT88+afAFTEcCWNy0SF4dc+9NMw8OK0KNa\nbRwHxzCCg2hgOaO868oMd3BB5No44VbrONWzch4P3WrWcsqUi3GhhdSOgP9YW9cA\nQyFmDwFVUQzYFx9oTgGbLTlUPACx+hU6Awa4QimzAoGAKYAFPktbJaSoOk16/pBZ\nulYVlE2KVZ12UhWm4u4ibyw6esslfYlS96DGA6G4YDbi7WZh+lv28evo/VZtgyUp\nOA0o8iFqJ4t8vvSy4h7kdlVMuE1R2vw+RR4wooTfhXv5w1l2+ipls3HpWE4pO2Mr\nL6ya3ChNs9y0zZ7KyznuiOM=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@seller-data-hgy.iam.gserviceaccount.com",
  "client_id": "114853517685530512823",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40seller-data-hgy.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

// 初始化 Firebase Admin SDK
initializeApp({
    credential: cert(serviceAccount)
});
const db = getFirestore();

const app = express();
const port = 3000;

// CORS 配置: 允许来自你的 GitHub Pages 页面的请求
app.use(cors({
    origin: 'https://tbymxy.github.io'
}));
app.use(bodyParser.json());

// 抓取并更新 Firestore 的主路由
app.post('/updateStore', async (req, res) => {
    const { id, site, sellerId } = req.body;

    if (!id || !site || !sellerId) {
        console.error('错误: 缺少必要的请求参数。');
        return res.status(400).json({ success: false, error: '缺少必要的参数: id, site, 或 sellerId' });
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
        
        try {
            await page.goto(storeUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        } catch (e) {
            console.error(`访问店铺页面超时或失败: ${e.message}`);
        }
        
        const data = await page.evaluate(() => {
            const getSafeText = (sel) => {
                const el = document.querySelector(sel);
                return el ? el.textContent.trim() : 'N/A';
            };

            const cleanFeedback = (feedback) => {
                const match = String(feedback || '').match(/(\d{1,3})\s*[％%]/);
                return match ? `${match[1]}%` : 'N/A';
            };
            const cleanNumberWithDot = (text) => {
                if (!text) return 'N/A';
                return String(text).replace(/(\d),(\d)/g, '$1.$2');
            };

            const sellerName = getSafeText('#seller-name');
            const feedbackRaw = getSafeText('#seller-info-feedback-summary > span > a > b');
            const rating = getSafeText('#rating-365d-num > span.ratings-reviews-count');
            const reviewsRaw = getSafeText('#effective-timeperiod-rating-year-description');

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
            const url = window.location.href;
            if (url.includes('.co.jp')) return 'A1VC38T7YXB528';
            if (url.includes('.com')) return 'ATVPDKIKX0DER';
            if (url.includes('.co.uk')) return 'A1F83G8C2ARO7P'; // 修复 marketplaceID
            if (url.includes('.de')) return 'A1PA6795UKMFR9';
            if (url.includes('.fr')) return 'A13V1IB3VIYZZH';
            return '';
        });
        const recommendUrl = `https://www.${site}/s?me=${sellerId}&marketplaceID=${marketplaceId}`;
        
        console.log(`正在访问 Featured 页面: ${recommendUrl}`);

        const recommendCount = await getFeaturedCount(page, recommendUrl);

        // 将所有数据整合
        const updatedData = {
            ...data,
            featuredCount: recommendCount,
            lastUpdated: new Date()
        };

        // 写入 Firestore
        console.log('准备写入 Firestore 的数据:', updatedData);
        
        const docRef = db.collection('amazonStores').doc(id);
        
        // 增加写入超时，防止无限等待
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Firestore 写入超时，请检查网络或Firebase配置')), 10000)
        );
        const firestoreUpdate = docRef.set(updatedData, { merge: true });

        await Promise.race([firestoreUpdate, timeout]);
        
        console.log(`数据已成功写入 Firestore。文档ID: ${id}`);
        
        res.status(200).json({ success: true, message: `店铺 ${id} 更新成功` });

    } catch (error) {
        console.error(`更新店铺 ${id} 失败:`, error);
        // 确保在任何错误发生时，浏览器都能被关闭
        if (browser) {
            await browser.close();
        }
        res.status(500).json({ success: false, error: '代理服务器内部错误' });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

// getFeaturedCount 函数
async function getFeaturedCount(page, url) {
    try {
        console.log(`[getFeaturedCount] 正在访问 URL: ${url}`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const countText = await page.evaluate(() => {
            const h2 = document.querySelector('#search > span > div > h1 > div > div:nth-child(1) > div > h2 > span:nth-child(1)');
            return h2 ? h2.textContent.trim() : '';
        });
        
        // 从文本中提取数字
        const match = countText.match(/\d+/);
        return match ? parseInt(match[0], 10) : 'N/A';
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
