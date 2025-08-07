const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDqPJFaBp0x4ZBxXA46cAQ83iKx2NP6_Q4",
    authDomain: "seller-data-hgy.firebaseapp.com",
    projectId: "seller-data-hgy",
    storageBucket: "seller-data-hgy.firebasestorage.app",
    messagingSenderId: "663736276108",
    appId: "1:663736276108:web:f7dc897d49b342fbc217a9"
};

firebase.initializeApp(FIREBASE_CONFIG);
const auth = firebase.auth();
const db = firebase.firestore();

// 登录和注册逻辑 (只在 index.html 中有效)
if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
    const loginContainer = document.getElementById('login-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const authErrorMessage = document.getElementById('auth-error-message');
    
    // 确保只在有这些元素的页面执行
    if (loginContainer && dashboardContainer) {
        auth.onAuthStateChanged(user => {
            if (user) {
                loginContainer.style.display = 'none';
                dashboardContainer.style.display = 'block';
                document.getElementById('user-email').textContent = user.email;
                document.getElementById('logout-btn').style.display = 'inline-block';
            } else {
                loginContainer.style.display = 'flex';
                dashboardContainer.style.display = 'none';
            }
        });
    
        loginBtn.addEventListener('click', () => {
            const email = emailInput.value;
            const password = passwordInput.value;
            authErrorMessage.textContent = '';
            auth.signInWithEmailAndPassword(email, password).catch(error => {
                authErrorMessage.textContent = `登录失败: ${error.message}`;
            });
        });
    
        registerBtn.addEventListener('click', () => {
            const email = emailInput.value;
            const password = passwordInput.value;
            authErrorMessage.textContent = '';
            auth.createUserWithEmailAndPassword(email, password).catch(error => {
                authErrorMessage.textContent = `注册失败: ${error.message}`;
            });
        });
    }
