
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth, GoogleAuthProvider, signInWithRedirect,
  getRedirectResult, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDqPJFaBp0x4ZBxXA46cAQ83iKx2NP6_Q4",
  authDomain: "seller-data-hgy.firebaseapp.com",
  projectId: "seller-data-hgy",
  storageBucket: "seller-data-hgy.firebasestorage.app",
  messagingSenderId: "663736276108",
  appId: "1:663736276108:web:f7dc897d49b342fbc217a9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const container = document.getElementById("data-container");

loginBtn.onclick = async () => {
  await signInWithRedirect(auth, provider);
};

logoutBtn.onclick = async () => {
  await signOut(auth);
  window.location.reload();
};

getRedirectResult(auth).catch(error => {
  alert("登录失败：" + error.message);
});

onAuthStateChanged(auth, user => {
  if (user) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    loadData();
  } else {
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    container.innerHTML = "请登录以查看数据";
  }
});

async function loadData() {
  const snapshot = await getDocs(collection(db, "scraped_data"));
  container.innerHTML = "";
  snapshot.forEach(doc => {
    const div = document.createElement("div");
    div.className = "item";
    div.textContent = JSON.stringify(doc.data(), null, 2);
    container.appendChild(div);
  });
}
