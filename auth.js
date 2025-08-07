// Firebase 配置，请确保你的 API Key 等信息正确无误。
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

// 统一处理认证状态变化的监听器
auth.onAuthStateChanged(user => {
    // 获取所有需要根据登录状态变化的 DOM 元素
    const userEmailSpan = document.getElementById('user-email');
    const logoutBtn = document.getElementById('logout-btn');
    const loginContainer = document.getElementById('login-container');
    const dashboardContainer = document.getElementById('dashboard-container');

    if (user) {
        // 如果用户已登录，更新 UI
        if (loginContainer) loginContainer.style.display = 'none';
        if (dashboardContainer) dashboardContainer.style.display = 'block';
        if (userEmailSpan) userEmailSpan.textContent = user.email;
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
    } else {
        // 如果用户未登录，更新 UI
        if (loginContainer) loginContainer.style.display = 'flex';
        if (dashboardContainer) dashboardContainer.style.display = 'none';
        if (userEmailSpan) userEmailSpan.textContent = '';
        if (logoutBtn) logoutBtn.style.display = 'none';

        // 如果在非登录页面，自动跳转回主页
        if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
            window.location.href = 'index.html';
        }
    }
});

// 在 DOM 内容加载完成后，绑定所有事件监听器
document.addEventListener('DOMContentLoaded', () => {
    // 登录和注册功能
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');
    const authErrorMessage = document.getElementById('auth-error-message');

    // 绑定登录按钮事件，并检查元素是否存在
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault(); // 阻止默认的表单提交行为
            const email = emailInput.value;
            const password = passwordInput.value;
            if (authErrorMessage) authErrorMessage.textContent = '';
            auth.signInWithEmailAndPassword(email, password).catch(error => {
                if (authErrorMessage) authErrorMessage.textContent = `登录失败: ${error.message}`;
            });
        });
    }

    // 绑定注册按钮事件
    if (registerBtn) {
        registerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const email = emailInput.value;
            const password = passwordInput.value;
            if (authErrorMessage) authErrorMessage.textContent = '';
            auth.createUserWithEmailAndPassword(email, password).catch(error => {
                if (authErrorMessage) authErrorMessage.textContent = `注册失败: ${error.message}`;
            });
        });
    }

    // 绑定退出登录按钮事件
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                window.location.href = 'index.html';
            });
        });
    }
});
