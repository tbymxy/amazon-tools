// Firebase 配置
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

// UI 元素
const userEmailSpan = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');

// --- 认证状态监听器 ---
auth.onAuthStateChanged(user => {
    const loginContainer = document.getElementById('login-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    
    if (user) {
        // 用户已登录
        if (loginContainer) loginContainer.style.display = 'none';
        if (dashboardContainer) dashboardContainer.style.display = 'block';
        if (userEmailSpan) userEmailSpan.textContent = user.email;
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        
        // 登录后跳转逻辑
        if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
            // 登录后，无需停留在主页，可以根据需求跳转到默认页面
            // window.location.href = 'stores.html'; 
        }
    } else {
        // 用户未登录
        if (loginContainer) loginContainer.style.display = 'flex';
        if (dashboardContainer) dashboardContainer.style.display = 'none';
        if (userEmailSpan) userEmailSpan.textContent = '';
        if (logoutBtn) logoutBtn.style.display = 'none';
        
        // 如果用户在非登录页，则强制跳转回主页
        if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
            window.location.href = 'index.html';
        }
    }
});

// --- 登录和注册处理函数 (只在主页有效) ---
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');
    const authErrorMessage = document.getElementById('auth-error-message');

    if (loginBtn && registerBtn) {
        // 绑定登录按钮事件
        loginBtn.addEventListener('click', () => {
            const email = emailInput.value;
            const password = passwordInput.value;
            authErrorMessage.textContent = '';
            auth.signInWithEmailAndPassword(email, password).catch(error => {
                authErrorMessage.textContent = `登录失败: ${error.message}`;
            });
        });

        // 绑定注册按钮事件
        registerBtn.addEventListener('click', () => {
            const email = emailInput.value;
            const password = passwordInput.value;
            authErrorMessage.textContent = '';
            auth.createUserWithEmailAndPassword(email, password).catch(error => {
                authErrorMessage.textContent = `注册失败: ${error.message}`;
            });
        });
    }
});

// --- 退出登录处理函数 (所有页面都有效) ---
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            console.log('用户已成功退出');
            window.location.href = 'index.html';
        });
    });
}
