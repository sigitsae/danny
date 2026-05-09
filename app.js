import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import {
  getFirestore, doc, setDoc, getDoc, collection,
  getDocs, deleteDoc, onSnapshot, writeBatch
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBj2AfcWXeF-BmE8oPyv8fhqQxwOm8IpX8",
  authDomain: "garasi-66d7c.firebaseapp.com",
  projectId: "garasi-66d7c",
  storageBucket: "garasi-66d7c.firebasestorage.app",
  messagingSenderId: "749010409779",
  appId: "1:749010409779:web:80e70bf704415d75238646",
  measurementId: "G-75RVEH5TPQ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.FBDB = db;
window.FB = { doc, setDoc, getDoc, collection, getDocs, deleteDoc, onSnapshot, writeBatch };

// =====================================================================
// SHARED DB — pakai window.DB agar inline script & module pakai objek sama
// =====================================================================
if (!window.DB) {
  window.DB = {
    vehicles: [],
    reminders: [],
    taxes: [],
    services: [],
    hof: [],
    profile: {}
  };
}

// Alias lokal untuk kenyamanan kode di bawah
// PENTING: jangan pernah reassign DB = {...}, selalu mutate propertinya
function getDB() { return window.DB; }

// =====================================================================
// FIREBASE SAVE / LOAD
// =====================================================================
window.saveToFirebase = async function () {
  try {
    const DB = getDB();
    const batch = writeBatch(db);
    const cols = ['vehicles', 'reminders', 'taxes', 'services', 'hof'];
    for (const col of cols) {
      const ref = doc(db, 'garage_data', col);
      batch.set(ref, { items: JSON.stringify(DB[col]) });
    }
    const profRef = doc(db, 'garage_data', 'profile');
    batch.set(profRef, DB.profile && Object.keys(DB.profile).length ? DB.profile : { _empty: true });
    await batch.commit();
    console.log('✅ Data tersimpan ke Firebase');
  } catch (e) {
    console.error('Firebase save error:', e);
    try { localStorage.setItem('dannys_garage_v1', JSON.stringify(getDB())); } catch (le) {}
  }
};

window.loadFromFirebase = async function () {
  try {
    showSyncIndicator('⚡ Sinkronisasi cloud...');
    const DB = getDB();
    const cols = ['vehicles', 'reminders', 'taxes', 'services', 'hof'];
    let hasData = false;
    for (const col of cols) {
      const snap = await getDoc(doc(db, 'garage_data', col));
      if (snap.exists()) {
        DB[col] = JSON.parse(snap.data().items || '[]');
        hasData = true;
      }
    }
    const profSnap = await getDoc(doc(db, 'garage_data', 'profile'));
    if (profSnap.exists()) {
      const d = profSnap.data();
      DB.profile = d._empty ? {} : d;
      hasData = true;
    }
    if (!hasData) {
      try {
        const ls = localStorage.getItem('dannys_garage_v1');
        if (ls) {
          const parsed = JSON.parse(ls);
          Object.assign(DB, parsed);
          await window.saveToFirebase();
        }
      } catch (e) {}
    }
    hideSyncIndicator();
    if (typeof renderHome === 'function') renderHome();
  } catch (e) {
    console.error('Firebase load error:', e);
    hideSyncIndicator();
    try {
      const s = localStorage.getItem('dannys_garage_v1');
      if (s) Object.assign(getDB(), JSON.parse(s));
    } catch (le) {}
    if (typeof renderHome === 'function') renderHome();
  }
};

window.saveDB = function () {
  try { localStorage.setItem('dannys_garage_v1', JSON.stringify(getDB())); } catch (e) {}
  window.saveToFirebase().then(() => {
    showSyncIndicator('✅ Tersimpan di cloud');
    setTimeout(hideSyncIndicator, 1500);
  });
};

window.clearAllData = async function () {
  const DB = getDB();
  DB.vehicles = []; DB.reminders = []; DB.taxes = [];
  DB.services = []; DB.hof = []; DB.profile = {};
  try { localStorage.removeItem('dannys_garage_v1'); } catch (e) {}
  if (window.FBDB) {
    try {
      const batch = writeBatch(db);
      ['vehicles', 'reminders', 'taxes', 'services', 'hof', 'profile'].forEach(col => {
        batch.delete(doc(db, 'garage_data', col));
      });
      await batch.commit();
    } catch (e) { console.error('Error hapus Firebase:', e); }
  }
  if (typeof renderHome === 'function') renderHome();
  if (typeof showToast === 'function') showToast('✅ Semua data telah dihapus!');
};

// =====================================================================
// BOOT
// =====================================================================
window.addEventListener('DOMContentLoaded', async () => {
  if (typeof showSyncIndicator === 'function')
    document.getElementById('loading-status').textContent = 'Memuat data garasi...';
  await window.loadFromFirebase();
  if (typeof hideLoadingScreen === 'function') hideLoadingScreen();
});

// Helper sync indicator (dipanggil sebelum inline script mungkin belum tersedia)
function showSyncIndicator(msg) {
  const el = document.getElementById('sync-indicator');
  if (el) { el.textContent = msg; el.classList.add('show'); }
}
function hideSyncIndicator() {
  const el = document.getElementById('sync-indicator');
  if (el) el.classList.remove('show');
}

// =====================================================================
// PWA INSTALL PROMPT
// =====================================================================
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById('install-btn');
  if (btn) btn.style.display = 'flex';
  console.log('[PWA] Install prompt tersedia');
});

window.installApp = async function() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') {
    console.log('[PWA] User menerima install');
  } else {
    console.log('[PWA] User menolak install');
  }
  deferredPrompt = null;
};

window.addEventListener('appinstalled', () => {
  console.log('[PWA] App berhasil diinstall');
  const btn = document.getElementById('install-btn');
  if (btn) btn.style.display = 'none';
  deferredPrompt = null;
});
