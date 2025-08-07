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

// 全局认证状态监听器
auth.onAuthStateChanged(user => {
    const userEmailSpan = document.getElementById('user-email');
    const logoutBtn = document.getElementById('logout-btn');
    const loginContainer = document.getElementById('login-container');
    const dashboardContainer = document.getElementById('dashboard-container');

    if (user) {
        // 用户已登录
        if (loginContainer) loginContainer.style.display = 'none';
        if (dashboardContainer) dashboardContainer.style.display = 'block';
        if (userEmailSpan) userEmailSpan.textContent = user.email;
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
    } else {
        // 用户未登录
        if (loginContainer) loginContainer.style.display = 'flex';
        if (dashboardContainer) dashboardContainer.style.display = 'none';
        if (userEmailSpan) userEmailSpan.textContent = '';
        if (logoutBtn) logoutBtn.style.display = 'none';

        // 如果用户在非登录页，强制跳转回主页
        if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
            window.location.href = 'index.html';
        }
    }
});

// DOM 内容加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    // 登录/注册逻辑
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');
    const authErrorMessage = document.getElementById('auth-error-message');

    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault(); // 阻止表单默认提交行为
            const email = emailInput.value;
            const password = passwordInput.value;
            authErrorMessage.textContent = '';
            auth.signInWithEmailAndPassword(email, password).catch(error => {
                authErrorMessage.textContent = `登录失败: ${error.message}`;
            });
        });
    }

    if (registerBtn) {
        registerBtn.addEventListener('click', (e) => {
            e.preventDefault(); // 阻止表单默认提交行为
            const email = emailInput.value;
            const password = passwordInput.value;
            authErrorMessage.textContent = '';
            auth.createUserWithEmailAndPassword(email, password).catch(error => {
                authErrorMessage.textContent = `注册失败: ${error.message}`;
            });
        });
    }

    // 退出登录逻辑
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                window.location.href = 'index.html';
            });
        });
    }
});
