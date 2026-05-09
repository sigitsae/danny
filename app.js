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

window.saveToFirebase = async function() {
  try {
    const batch = writeBatch(db);
    const collections = ['vehicles','reminders','taxes','services','hof'];
    for(const col of collections) {
      const ref = doc(db, 'garage_data', col);
      batch.set(ref, { items: JSON.stringify(DB[col]) });
    }
    const profRef = doc(db, 'garage_data', 'profile');
    batch.set(profRef, DB.profile);
    await batch.commit();
  } catch(e) {
    console.error('Firebase save error:', e);
    try { localStorage.setItem('dannys_garage_v1', JSON.stringify(DB)); } catch(le) {}
  }
};

window.loadFromFirebase = async function() {
  try {
    showSyncIndicator('⚡ Sinkronisasi cloud...');
    const collections = ['vehicles','reminders','taxes','services','hof'];
    let hasData = false;
    for(const col of collections) {
      const snap = await getDoc(doc(db, 'garage_data', col));
      if(snap.exists()) {
        DB[col] = JSON.parse(snap.data().items || '[]');
        hasData = true;
      }
    }
    const profSnap = await getDoc(doc(db, 'garage_data', 'profile'));
    if(profSnap.exists()) {
      DB.profile = profSnap.data();
    }
    if(!hasData) {
      try {
        const ls = localStorage.getItem('dannys_garage_v1');
        if(ls) {
          const parsed = JSON.parse(ls);
          DB = { ...DB, ...parsed };
          await window.saveToFirebase();
        } else {
          seedData();
          await window.saveToFirebase();
        }
      } catch(e) {
        seedData();
        await window.saveToFirebase();
      }
    }
    hideSyncIndicator();
    renderHome();
  } catch(e) {
    console.error('Firebase load error:', e);
    hideSyncIndicator();
    try {
      const s = localStorage.getItem('dannys_garage_v1');
      if(s) { const parsed = JSON.parse(s); DB = {...DB, ...parsed}; }
    } catch(le) {}
    seedData();
    renderHome();
  }
};

window.saveDB = function() {
  try { localStorage.setItem('dannys_garage_v1', JSON.stringify(DB)); } catch(e) {}
  window.saveToFirebase().then(() => {
    showSyncIndicator('✅ Tersimpan di cloud');
    setTimeout(hideSyncIndicator, 1500);
  });
};

window.addEventListener('DOMContentLoaded', () => {
  window.loadFromFirebase();
});

let DB = {
  vehicles: [],
  reminders: [],
  taxes: [],
  services: [],
  hof: [],
  profile: {
    name: 'Danny',
    tagline: 'King of the Road · Bandung',
    bio: 'Kolektor kendaraan premium sejak 2010. Kalau belum ada di garasi saya, berarti belum cukup keren untuk ada di dunia ini. 😎',
    photo: 'https://ik.imagekit.io/5bnhlcghq/danny%20garage.png',
    city: 'Bandung'
  }
};

function showSyncIndicator(msg){
  const el=document.getElementById('sync-indicator');
  el.textContent=msg;el.classList.add('show');
}
function hideSyncIndicator(){
  const el=document.getElementById('sync-indicator');
  el.classList.remove('show');
}
function hideLoadingScreen(){
  const ls=document.getElementById('loading-screen');
  ls.classList.add('hidden');
  setTimeout(()=>ls.style.display='none',500);
}

if(!window.saveDB){
  window.saveDB = function(){
    try{localStorage.setItem('dannys_garage_v1',JSON.stringify(DB));}catch(e){}
  };
}

function seedData(){
  if(DB.vehicles.length > 0) return;
  const today = new Date();
  const fmtD = (d) => d.toISOString().split('T')[0];
  const addDays = (d,n) => {const r=new Date(d);r.setDate(r.getDate()+n);return r;};

  DB.vehicles = [
    {id:'v1',name:'Toyota GR Supra A90',type:'Mobil',plate:'B 7 DAN',year:2022,color:'Merah Metalik',photo:'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/2020_Toyota_GR_Supra_2.0_%28EU%29%2C_front_8.26.19.jpg/1280px-2020_Toyota_GR_Supra_2.0_%28EU%29%2C_front_8.26.19.jpg',notes:'Intake aftermarket, knalpot Akrapovic',status:'Aktif',fav:true},
    {id:'v2',name:'Honda CBR1000RR-R Fireblade',type:'Motor',plate:'D 999 DNY',year:2023,color:'HRC Tricolor',photo:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Honda_CBR1000RR-R_Fireblade_SP_2021.jpg/1280px-Honda_CBR1000RR-R_Fireblade_SP_2021.jpg',notes:'Full racing spec',status:'Aktif',fav:true},
    {id:'v3',name:'Jeep Wrangler Rubicon',type:'Mobil',plate:'B 1234 DNY',year:2021,color:'Hitam Matte',photo:'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/2021_Jeep_Wrangler_%28JL%29_Rubicon%2C_front_8.1.21.jpg/1280px-2021_Jeep_Wrangler_%28JL%29_Rubicon%2C_front_8.1.21.jpg',notes:'Lift kit, ban mud terrain',status:'Aktif',fav:false},
  ];
  DB.reminders = [
    {id:'r1',vehicleId:'v1',doctype:'STNK',name:'STNK GR Supra',expiry:fmtD(addDays(today,18)),warnDays:30,number:'1234567890',notes:'Perpanjang di Samsat Bandung'},
    {id:'r2',vehicleId:'v2',doctype:'STNK',name:'STNK CBR1000RR',expiry:fmtD(addDays(today,5)),warnDays:30,number:'9876543210',notes:''},
    {id:'r3',vehicleId:'v1',doctype:'Asuransi',name:'Asuransi All Risk Supra',expiry:fmtD(addDays(today,90)),warnDays:30,number:'POL-2024-001',notes:'Garda Oto'},
    {id:'r4',vehicleId:'v3',doctype:'KIR',name:'KIR Wrangler',expiry:fmtD(addDays(today,-10)),warnDays:30,number:'',notes:'Sudah kadaluarsa!'},
    {id:'r5',vehicleId:'v1',doctype:'SIM',name:'SIM A Danny',expiry:fmtD(addDays(today,120)),warnDays:60,number:'123456789',notes:''},
  ];
  DB.taxes = [
    {id:'t1',vehicleId:'v1',type:'PKB',amount:12500000,paidDate:fmtD(addDays(today,-180)),status:'Lunas',notes:''},
    {id:'t2',vehicleId:'v2',type:'PKB',amount:4200000,paidDate:fmtD(addDays(today,-60)),status:'Lunas',notes:''},
    {id:'t3',vehicleId:'v3',type:'PKB',amount:8750000,paidDate:'',status:'Belum',notes:'Jatuh tempo bulan depan'},
    {id:'t4',vehicleId:'v1',type:'Asuransi',amount:18000000,paidDate:fmtD(addDays(today,-90)),status:'Lunas',notes:'Garda Oto All Risk'},
  ];
  DB.services = [
    {id:'s1',vehicleId:'v1',type:'Tune Up',date:fmtD(addDays(today,-45)),cost:3500000,km:15000,shop:'Toyota Auto2000 Bandung',desc:'Tune up lengkap, ganti busi, filter udara',next:fmtD(addDays(today,135))},
    {id:'s2',vehicleId:'v2',type:'Ganti Oli',date:fmtD(addDays(today,-20)),cost:850000,km:8500,shop:'AHASS Resmi',desc:'Ganti oli Motul 300V, filter oli',next:fmtD(addDays(today,80))},
    {id:'s3',vehicleId:'v1',type:'Modifikasi',date:fmtD(addDays(today,-10)),cost:22000000,km:14500,shop:'Garage 88 Bandung',desc:'Pasang knalpot Akrapovic titanium, velg BBS',next:''},
  ];
  DB.hof = [
    {id:'h1',vehicleId:'v1',rank:1,reason:'Mahkota garasi saya. Tidak ada yang menandingi kombinasi kecepatan, desain, dan charisma mobil ini.',tags:'Tercepat,Favorit,Modded'},
    {id:'h2',vehicleId:'v2',rank:2,reason:'215 tenaga kuda dalam 200 kg. Ini bukan motor, ini rudal bertirahu.',tags:'Tercepat,Langka'},
  ];
}

const _origLoad = window.loadFromFirebase;
if(_origLoad) {
  window.loadFromFirebase = async function() {
    document.getElementById('loading-status').textContent = 'Memuat data garasi...';
    await _origLoad();
    hideLoadingScreen();
  };
}

setTimeout(()=>{
  hideLoadingScreen();
  if(!window.FBDB){
    try{
      const s=localStorage.getItem('dannys_garage_v1');
      if(s){const p=JSON.parse(s);DB={...DB,...p};}
    }catch(e){}
    seedData();
    renderHome();
  }
}, 5000);

let currentPage = 'home';
function navigate(page){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  const el=document.getElementById('page-'+page);
  if(el){el.classList.add('active');el.classList.add('fade-up');}
  currentPage=page;
  renderPage(page);
  document.querySelector('.screen').scrollTo(0,0);
  const navBtns=document.querySelectorAll('.nav-btn');
  const pageNavMap={home:0,koleksi:1,reminder:2,kalender:3,hof:4};
  if(pageNavMap[page]!==undefined) navBtns[pageNavMap[page]].classList.add('active');
}
function renderPage(page){
  if(page==='home') renderHome();
  else if(page==='koleksi') renderKoleksi();
  else if(page==='reminder') renderReminders();
  else if(page==='pajak') renderPajak();
  else if(page==='kalender') renderKalender();
  else if(page==='servis') renderServis();
  else if(page==='hof') renderHof();
  else if(page==='profil') renderProfil();
}
function uid(){return 'id_'+Date.now()+'_'+Math.random().toString(36).substr(2,5);}
function fmtRp(n){return 'Rp '+Number(n||0).toLocaleString('id-ID');}
function getDaysUntil(dateStr){
  if(!dateStr) return 9999;
  const today=new Date();today.setHours(0,0,0,0);
  const exp=new Date(dateStr);exp.setHours(0,0,0,0);
  return Math.round((exp-today)/(1000*60*60*24));
}
function fmtDate(d){if(!d)return '—';const dt=new Date(d);return dt.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});} 
function getVehicle(id){return DB.vehicles.find(v=>v.id===id)||null;}
function getStatusPill(days){
  if(days<0) return{cls:'pill-danger',label:'KADALUARSA',icls:'rem-ic-danger',icon:'🚨',cardCls:'danger',color:'#FF5252'};
  if(days<=7) return{cls:'pill-danger',label:days+'H',icls:'rem-ic-danger',icon:'🔴',cardCls:'danger',color:'#FF5252'};
  if(days<=30) return{cls:'pill-warn',label:days+'H',icls:'rem-ic-warn',icon:'🟠',cardCls:'warn',color:'#FF7A00'};
  return{cls:'pill-ok',label:days+'H',icls:'rem-ic-ok',icon:'🟢',cardCls:'ok',color:'#26D97F'};
}
function docTypeIcon(t){const m={STNK:'📄',KIR:'🔬',SIM:'🪪',Asuransi:'🛡️',Lainnya:'📎'};return m[t]||'📄';}
function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2500);
}
let confirmCb=null;
function showConfirm(title,sub,cb){
  document.getElementById('confirm-title').textContent=title;
  document.getElementById('confirm-sub').textContent=sub;
  confirmCb=cb;
  document.getElementById('confirm-ok-btn').onclick=()=>{closeModal('confirm-modal');if(confirmCb)confirmCb();};
  document.getElementById('confirm-modal').classList.add('open');
}
function closeModal(id){document.getElementById(id).classList.remove('open');}
function closeOverlay(e,id){if(e.target===document.getElementById(id))closeModal(id);}
function selOpt(el,hiddenId){
  el.closest('.cat-select').querySelectorAll('.cat-opt').forEach(o=>o.classList.remove('active'));
  el.classList.add('active');
  document.getElementById(hiddenId).value=el.dataset.val;
}
let hofTagsSelected=[];
function toggleHofTag(el){
  el.classList.toggle('active');
  hofTagsSelected=[];
  el.closest('.cat-select').querySelectorAll('.cat-opt.active').forEach(o=>hofTagsSelected.push(o.dataset.val));
  document.getElementById('hoff-tags').value=hofTagsSelected.join(',');
}
function getStorageBytes(){return new Blob([JSON.stringify(DB)]).size;}
function formatBytes(bytes){
  if(bytes < 1024) return bytes+' B';
  if(bytes < 1024*1024) return (bytes/1024).toFixed(1)+' KB';
  return (bytes/1024/1024).toFixed(2)+' MB';
}
function updateVehiclePhotoPreview(value){
  const preview=document.getElementById('vf-photo-preview');
  if(!preview) return;
  if(value){
    preview.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:120px;border-radius:12px;overflow:hidden;background:var(--bg3);"><img src="${value}" style="width:100%;height:100%;object-fit:cover;" alt="Preview foto"></div>`;
  } else {
    preview.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:120px;border-radius:12px;background:var(--bg3);color:var(--text3);font-size:12px;">Preview foto</div>`;
  }
}
function clearVehiclePhoto(){
  document.getElementById('vf-photo').value='';
  document.getElementById('vf-photo-file').value='';
  updateVehiclePhotoPreview('');
  showToast('Foto kendaraan dihapus');
}
function getImageDataUrl(file, targetSize = 300 * 1024){
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;
        if(width > maxDim || height > maxDim){
          if(width > height){height = Math.round(height * maxDim/width); width = maxDim;} else {width = Math.round(width * maxDim/height); height = maxDim;}
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000';
        ctx.fillRect(0,0,width,height);
        ctx.drawImage(img,0,0,width,height);

        const getBlob = (quality) => new Promise(res=>canvas.toBlob(res,'image/jpeg',quality));
        let quality = 0.92;
        let blob = await getBlob(quality);
        if(!blob) return reject('Gagal kompres foto');
        while(blob.size > targetSize && quality > 0.35){
          quality -= 0.07;
          blob = await getBlob(quality);
          if(!blob) return reject('Gagal kompres foto');
        }
        while(blob.size > targetSize && (canvas.width > 640 || canvas.height > 640)){
          const nextWidth = Math.round(canvas.width * 0.9);
          const nextHeight = Math.round(canvas.height * 0.9);
          canvas.width = nextWidth;
          canvas.height = nextHeight;
          ctx.clearRect(0,0,nextWidth,nextHeight);
          ctx.drawImage(img,0,0,nextWidth,nextHeight);
          blob = await getBlob(quality);
          if(!blob) return reject('Gagal kompres foto');
        }
        const reader2 = new FileReader();
        reader2.onloadend = ()=>resolve(reader2.result);
        reader2.readAsDataURL(blob);
      };
      img.onerror = ()=>reject('Gagal memuat foto');
      img.src = reader.result;
    };
    reader.onerror = ()=>reject('Gagal membaca file');
    reader.readAsDataURL(file);
  });
}
async function handleVehiclePhotoInput(e){
  const file = e.target.files[0];
  if(!file) return;
  if(!file.type.startsWith('image/')){ showToast('Format harus foto'); return; }
  showSyncIndicator('Mengompres foto...');
  try {
    const dataUrl = await getImageDataUrl(file, 300 * 1024);
    document.getElementById('vf-photo').value = dataUrl;
    updateVehiclePhotoPreview(dataUrl);
    showToast('Foto siap disimpan');
  } catch(err){
    console.error(err);
    showToast('Gagal memproses foto');
  } finally {
    hideSyncIndicator();
  }
}
function renderHome(){
  const criticals=DB.reminders.filter(r=>getDaysUntil(r.expiry)<=30).sort((a,b)=>getDaysUntil(a.expiry)-getDaysUntil(b.expiry));
  const warnCount=DB.reminders.filter(r=>getDaysUntil(r.expiry)<=60).length;
  document.getElementById('stat-total').textContent=DB.vehicles.length;
  document.getElementById('stat-warning').textContent=warnCount;
  const totalPajak=DB.taxes.reduce((s,t)=>s+Number(t.amount||0),0);
  const tp=totalPajak>=1000000?'Rp'+(totalPajak/1000000).toFixed(1)+'Jt':fmtRp(totalPajak);
  document.getElementById('stat-total-pajak').textContent=tp;
  if(criticals.length>0){document.getElementById('hero-alert-badge').style.display='flex';document.getElementById('hero-alert-count').textContent=criticals.length;} else document.getElementById('hero-alert-badge').style.display='none';
  const critEl=document.getElementById('home-critical-docs');
  if(criticals.length===0){critEl.innerHTML='<div class="rem-card ok"><div style="padding:4px 0;font-size:12px;color:var(--green);">✅ Semua dokumen aman!</div></div>';} else{critEl.innerHTML=criticals.slice(0,3).map(r=>{const v=getVehicle(r.vehicleId);const d=getDaysUntil(r.expiry);const s=getStatusPill(d);return`<div class="rem-card ${s.cardCls}" onclick="navigate('reminder')" style="margin-bottom:8px;"><div class="rem-icon-wrap ${s.icls}">${docTypeIcon(r.doctype)}</div><div class="rem-content"><div class="rem-doc-type">${r.doctype} ${v?'· '+v.name:''}</div><div class="rem-vehicle">${r.name}</div><div class="rem-date">Exp: ${fmtDate(r.expiry)}</div></div><div><div class="rem-days-badge" style="color:${s.color};">${d<0?'HABIS':d}</div><div class="rem-days-lbl" style="color:${s.color};">${d<0?'expired':'hari lagi'}</div></div></div>`;}).join('');}
  const vpEl=document.getElementById('home-vehicles-preview');
  if(DB.vehicles.length===0){vpEl.innerHTML='<div class="empty-state"><div class="empty-icon">🚗</div><div class="empty-text">Belum ada kendaraan.</div></div>';} else{vpEl.innerHTML=DB.vehicles.slice(0,2).map(v=>buildVehicleCard(v)).join('');}
  const badge=document.getElementById('nav-badge');
  if(criticals.length>0){badge.style.display='flex';badge.textContent=criticals.length;} else badge.style.display='none';
}
function buildVehicleCard(v){
  const vReminders=DB.reminders.filter(r=>r.vehicleId===v.id);
  const alertPills=vReminders.map(r=>{const d=getDaysUntil(r.expiry);const s=getStatusPill(d);return`<span class="doc-alert-pill ${s.cls}">${docTypeIcon(r.doctype)} ${r.doctype} ${d<0?'HABIS':d+'H'}</span>`;}).join('');
  const ph = v.type==='Mobil' ? '🚗' : '🏍️';
  const imgContent = v.photo
    ? `<img class="vc-img" src="${v.photo}" alt="${v.name}" onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="vc-img-placeholder" style="display:none">${ph}</div>`
    : `<div class="vc-img-placeholder">${ph}</div>`;
  return `<div class="vehicle-card ${v.fav?'featured':''}" onclick="openVehicleDetail('${v.id}')"><div class="vc-img-wrap">${imgContent}<div class="vc-badge ${v.type==='Mobil'?'vc-badge-car':'vc-badge-moto'}">${v.type}</div>${v.fav?'<div class="vc-fav">⭐</div>':''}</div><div class="vc-body"><div class="vc-name">${v.name}</div><div class="vc-plate">${v.plate}</div><div class="vc-stats"><span class="vc-stat-pill pill-silver">${v.year}</span><span class="vc-stat-pill pill-silver">${v.color}</span><span class="vc-stat-pill ${v.status==='Aktif'?'pill-ok':v.status==='Dijual'?'pill-warn':'pill-blue'}">${v.status}</span></div>${vReminders.length>0?`<div class="vc-alert-row">${alertPills}</div>`:''}<div class="action-btn-row"><button class="ab ab-edit" onclick="event.stopPropagation();openEditVehicle('${v.id}')">✏️</button><button class="ab ab-del" onclick="event.stopPropagation();deleteVehicle('${v.id}')">🗑️</button></div></div></div>`;
}
let vehicleFilter='semua';
function filterVehicles(f,el){vehicleFilter=f;document.querySelectorAll('#page-koleksi .tab-btn').forEach(b=>b.classList.remove('active'));if(el)el.classList.add('active');renderKoleksi();}
function renderKoleksi(){
  const list=document.getElementById('koleksi-list');
  let vv=DB.vehicles;
  if(vehicleFilter!=='semua')vv=vv.filter(v=>v.type===vehicleFilter);
  if(vv.length===0){list.innerHTML='<div class="empty-state"><div class="empty-icon">🚗</div><div class="empty-text">Belum ada kendaraan.</div></div>';return;}
  list.innerHTML=vv.map(v=>buildVehicleCard(v)).join('');
}
function openVehicleDetail(id){const v=getVehicle(id);if(!v)return;openEditVehicle(v);}
function openAddVehicle(){
  document.getElementById('vf-title').textContent='Tambah Kendaraan';
  document.getElementById('vf-id').value='';
  document.getElementById('vf-name').value='';
  document.getElementById('vf-plate').value='';
  document.getElementById('vf-year').value='';
  document.getElementById('vf-color').value='';
  document.getElementById('vf-photo').value='';
  document.getElementById('vf-photo-file').value='';
  document.getElementById('vf-notes').value='';
  resetCatSel('vf-type','Mobil');resetCatSel('vf-status','Aktif');resetCatSel('vf-fav','false');
  updateVehiclePhotoPreview('');
  document.getElementById('vehicle-form-modal').classList.add('open');
}
function openEditVehicle(v){
  document.getElementById('vf-title').textContent='Edit Kendaraan';
  document.getElementById('vf-id').value=v.id;
  document.getElementById('vf-name').value=v.name;
  document.getElementById('vf-plate').value=v.plate;
  document.getElementById('vf-year').value=v.year;
  document.getElementById('vf-color').value=v.color;
  document.getElementById('vf-photo').value=v.photo||'';
  document.getElementById('vf-photo-file').value='';
  document.getElementById('vf-notes').value=v.notes||'';
  resetCatSel('vf-type',v.type);resetCatSel('vf-status',v.status||'Aktif');resetCatSel('vf-fav',v.fav?'true':'false');
  updateVehiclePhotoPreview(v.photo||'');
  document.getElementById('vehicle-form-modal').classList.add('open');
}
function resetCatSel(hiddenId,val){
  document.getElementById(hiddenId).value=val;
  const wrap=document.getElementById(hiddenId).previousElementSibling;
  if(wrap&&wrap.classList.contains('cat-select')){wrap.querySelectorAll('.cat-opt').forEach(o=>{o.classList.toggle('active',o.dataset.val===val);});}
}
function saveVehicle(){
  const id=document.getElementById('vf-id').value;
  const data={
    id:id||uid(),
    name:document.getElementById('vf-name').value.trim(),
    type:document.getElementById('vf-type').value,
    plate:document.getElementById('vf-plate').value.trim().toUpperCase(),
    year:document.getElementById('vf-year').value,
    color:document.getElementById('vf-color').value.trim(),
    photo:document.getElementById('vf-photo').value.trim(),
    notes:document.getElementById('vf-notes').value.trim(),
    status:document.getElementById('vf-status').value,
    fav:document.getElementById('vf-fav').value==='true'
  };
  if(!data.name){showToast('⚠️ Nama wajib diisi!');return;}
  if(id){const i=DB.vehicles.findIndex(v=>v.id===id);if(i>=0)DB.vehicles[i]=data;}else DB.vehicles.push(data);
  saveDB();closeModal('vehicle-form-modal');showToast('✅ Kendaraan disimpan!');renderPage(currentPage);
}
function deleteVehicle(id){
  showConfirm('Hapus Kendaraan?','Data reminder dan servis terkait juga akan hilang.',()=>{
    DB.vehicles=DB.vehicles.filter(v=>v.id!==id);
    DB.reminders=DB.reminders.filter(r=>r.vehicleId!==id);
    DB.taxes=DB.taxes.filter(t=>t.vehicleId!==id);
    DB.services=DB.services.filter(s=>s.vehicleId!==id);
    DB.hof=DB.hof.filter(h=>h.vehicleId!==id);
    saveDB();showToast('🗑️ Kendaraan dihapus');renderPage(currentPage);
  });
}
let reminderFilter='semua';
function filterReminders(f,el){reminderFilter=f;document.querySelectorAll('#page-reminder .tab-btn').forEach(b=>b.classList.remove('active'));if(el)el.classList.add('active');renderReminders();}
function renderReminders(){
  let rr=DB.reminders.map(r=>({...r,days:getDaysUntil(r.expiry)})).sort((a,b)=>a.days-b.days);
  if(reminderFilter==='kritis')rr=rr.filter(r=>r.days<=7);
  else if(reminderFilter==='warn')rr=rr.filter(r=>r.days>7&&r.days<=30);
  else if(reminderFilter==='ok')rr=rr.filter(r=>r.days>30);
  const el=document.getElementById('reminder-list');
  if(rr.length===0){el.innerHTML='<div class="empty-state"><div class="empty-icon">⏰</div><div class="empty-text">Tidak ada reminder.</div></div>';return;}
  el.innerHTML=rr.map(r=>{const v=getVehicle(r.vehicleId);const s=getStatusPill(r.days);return`<div class="rem-card ${s.cardCls}" style="margin-bottom:10px;"><div class="rem-icon-wrap ${s.icls}">${docTypeIcon(r.doctype)}</div><div class="rem-content"><div class="rem-doc-type">${r.doctype}${v?' · '+v.name:''}</div><div class="rem-vehicle">${r.name}</div><div class="rem-date">Exp: ${fmtDate(r.expiry)} ${r.number?'· #'+r.number:''}</div>${r.notes?`<div style="font-size:10px;color:var(--text3);margin-top:3px;">${r.notes}</div>`:''}</div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0;"><div class="rem-days-badge" style="color:${s.color};">${r.days<0?'HABIS':r.days}</div><div class="rem-days-lbl" style="color:${s.color};">${r.days<0?'expired':'hari lagi'}</div><div style="display:flex;gap:4px;"><button class="ab ab-edit" onclick="event.stopPropagation();openEditReminder('${r.id}')">✏️</button><button class="ab ab-del" onclick="event.stopPropagation();deleteReminder('${r.id}')">🗑️</button></div></div></div>`;}).join('');
}
function openAddReminder(){
  document.getElementById('rf-title').textContent='Tambah Reminder';
  document.getElementById('rf-id').value='';
  document.getElementById('rf-name').value='';
  document.getElementById('rf-expiry').value='';
  document.getElementById('rf-number').value='';
  document.getElementById('rf-notes').value='';
  resetCatSel('rf-doctype','STNK');
  populateVehicleSelect('rf-vehicle','');
  document.getElementById('reminder-form-modal').classList.add('open');
}
function openEditReminder(id){
  const r=DB.reminders.find(x=>x.id===id);if(!r)return;
  document.getElementById('rf-title').textContent='Edit Reminder';
  document.getElementById('rf-id').value=r.id;
  document.getElementById('rf-name').value=r.name;
  document.getElementById('rf-expiry').value=r.expiry;
  document.getElementById('rf-number').value=r.number||'';
  document.getElementById('rf-notes').value=r.notes||'';
  document.getElementById('rf-warn-days').value=r.warnDays||30;
  resetCatSel('rf-doctype',r.doctype);
  populateVehicleSelect('rf-vehicle',r.vehicleId);
  document.getElementById('reminder-form-modal').classList.add('open');
}
function saveReminder(){
  const id=document.getElementById('rf-id').value;
  const exp=document.getElementById('rf-expiry').value;
  if(!exp){showToast('⚠️ Tanggal kadaluarsa wajib diisi!');return;}
  const data={id:id||uid(),vehicleId:document.getElementById('rf-vehicle').value,doctype:document.getElementById('rf-doctype').value,name:document.getElementById('rf-name').value.trim(),expiry:exp,warnDays:Number(document.getElementById('rf-warn-days').value),number:document.getElementById('rf-number').value.trim(),notes:document.getElementById('rf-notes').value.trim()};
  if(id){const i=DB.reminders.findIndex(r=>r.id===id);if(i>=0)DB.reminders[i]=data;}else DB.reminders.push(data);
  saveDB();closeModal('reminder-form-modal');showToast('✅ Reminder disimpan!');renderPage(currentPage);
}
function deleteReminder(id){showConfirm('Hapus Reminder?','Data ini akan hilang permanen.',()=>{DB.reminders=DB.reminders.filter(r=>r.id!==id);saveDB();showToast('🗑️ Reminder dihapus');renderReminders();});}
function renderPajak(){
  const total=DB.taxes.reduce((s,t)=>s+Number(t.amount||0),0);
  const paid=DB.taxes.filter(t=>t.status==='Lunas').length;
  document.getElementById('pajak-total-amount').textContent=fmtRp(total);
  document.getElementById('pajak-vehicle-count').textContent=DB.vehicles.length;
  document.getElementById('pajak-paid-count').textContent=paid+'/'+DB.taxes.length;
  document.getElementById('pajak-subtitle').textContent=`${DB.taxes.length} item · ${fmtRp(total)} total/tahun`;
  const byVehicle={};
  DB.taxes.forEach(t=>{if(!byVehicle[t.vehicleId])byVehicle[t.vehicleId]=[];byVehicle[t.vehicleId].push(t);});
  DB.vehicles.forEach(v=>{if(!byVehicle[v.id])byVehicle[v.id]=[];});
  const el=document.getElementById('pajak-content');
  if(DB.taxes.length===0&&DB.vehicles.length===0){el.innerHTML='<div class="empty-state"><div class="empty-icon">💰</div><div class="empty-text">Belum ada data pajak.</div></div>';return;}
  el.innerHTML=Object.keys(byVehicle).map(vid=>{
    const v=getVehicle(vid);if(!v)return '';
    const taxes=byVehicle[vid];
    const subTotal=taxes.reduce((s,t)=>s+Number(t.amount||0),0);
    const taxRows=taxes.length>0?taxes.map(t=>{const statusStyle=t.status==='Lunas'?'pill-ok':t.status==='Segera'?'pill-warn':'pill-danger';return`<div class="tax-row"><div><div class="tax-name">${t.type}</div>${t.notes?`<div style="font-size:10px;color:var(--text3);">${t.notes}</div>`:''}</div><div style="display:flex;align-items:center;gap:6px;"><div class="tax-amt">${fmtRp(t.amount)}</div><span class="doc-alert-pill ${statusStyle}" style="font-size:9px;">${t.status}</span><button class="ab ab-edit" onclick="openEditTax('${t.id}')">✏️</button><button class="ab ab-del" onclick="deleteTax('${t.id}')">🗑️</button></div></div>`;}).join(''):`<div class="tax-row"><span style="font-size:12px;color:var(--text3);">Belum ada data pajak</span></div>`;
    return`<div class="tax-card"><div class="tax-card-header"><div style="font-size:24px;">${v.type==='Mobil'?'🚗':'🏍️'}</div><div style="flex:1;"><div class="tax-vh-name">${v.name}</div><div class="tax-plate">${v.plate} · ${fmtRp(subTotal)}/thn</div></div><button class="btn-add-sm" onclick="openAddTaxForVehicle('${v.id}')">+ Pajak</button></div><div class="tax-items">${taxRows}</div></div>`;
  }).join('');
}
function openAddTax(){
  document.getElementById('tf-title').textContent='Tambah Pajak';
  document.getElementById('tf-id').value='';
  document.getElementById('tf-amount').value='';
  document.getElementById('tf-paid-date').value='';
  document.getElementById('tf-notes').value='';
  resetCatSel('tf-type','PKB');
  resetCatSel('tf-status','Lunas');
  populateVehicleSelect('tf-vehicle','');
  document.getElementById('tax-form-modal').classList.add('open');
}
function openAddTaxForVehicle(vid){openAddTax();document.getElementById('tf-vehicle').value=vid;}
function openEditTax(id){
  const t=DB.taxes.find(x=>x.id===id);if(!t)return;
  document.getElementById('tf-title').textContent='Edit Pajak';
  document.getElementById('tf-id').value=t.id;
  document.getElementById('tf-amount').value=t.amount;
  document.getElementById('tf-paid-date').value=t.paidDate||'';
  document.getElementById('tf-notes').value=t.notes||'';
  resetCatSel('tf-type',t.type);
  resetCatSel('tf-status',t.status);
  populateVehicleSelect('tf-vehicle',t.vehicleId);
  document.getElementById('tax-form-modal').classList.add('open');
}
function saveTax(){
  const id=document.getElementById('tf-id').value;
  const data={id:id||uid(),vehicleId:document.getElementById('tf-vehicle').value,type:document.getElementById('tf-type').value,amount:Number(document.getElementById('tf-amount').value)||0,paidDate:document.getElementById('tf-paid-date').value,status:document.getElementById('tf-status').value,notes:document.getElementById('tf-notes').value.trim()};
  if(id){const i=DB.taxes.findIndex(t=>t.id===id);if(i>=0)DB.taxes[i]=data;}else DB.taxes.push(data);
  saveDB();closeModal('tax-form-modal');showToast('✅ Pajak disimpan!');renderPajak();
}
function deleteTax(id){showConfirm('Hapus Data Pajak?','Tidak bisa dibatalkan.',()=>{DB.taxes=DB.taxes.filter(t=>t.id!==id);saveDB();showToast('🗑️ Dihapus');renderPajak();});}
let calDate=new Date();
function prevMonth(){calDate.setMonth(calDate.getMonth()-1);renderKalender();}
function nextMonth(){calDate.setMonth(calDate.getMonth()+1);renderKalender();}
function renderKalender(){
  const MONTHS=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  document.getElementById('cal-month-label').textContent=MONTHS[calDate.getMonth()]+' '+calDate.getFullYear();
  const year=calDate.getFullYear(),month=calDate.getMonth();
  const firstDay=(new Date(year,month,1).getDay()+6)%7;
  const daysInMonth=new Date(year,month+1,0).getDate();
  const today=new Date();
  const monthEvents=[];
  DB.reminders.forEach(r=>{if(!r.expiry)return;const d=new Date(r.expiry);if(d.getFullYear()===year&&d.getMonth()===month){const days=getDaysUntil(r.expiry);monthEvents.push({day:d.getDate(),name:r.name,type:'reminder',days:days,color:days<=7?'#FF5252':days<=30?'#FF7A00':'#26D97F'});}});
  DB.services.forEach(s=>{if(!s.next)return;const d=new Date(s.next);if(d.getFullYear()===year&&d.getMonth()===month){const v=getVehicle(s.vehicleId);monthEvents.push({day:d.getDate(),name:'Servis: '+(v?v.name:''),type:'service',color:'#1E90FF'});}});
  const eventDays=monthEvents.map(e=>e.day);
  const dangerDays=monthEvents.filter(e=>e.days<=7).map(e=>e.day);
  const grid=document.getElementById('cal-grid');
  const DAYS=['Sen','Sel','Rab','Kam','Jum','Sab','Min'];
  let html=DAYS.map(d=>`<div class="cal-day-name">${d}</div>`).join('');
  for(let i=0;i<firstDay;i++)html+=`<div class="cal-day other-month"></div>`;
  for(let d=1;d<=daysInMonth;d++){const isToday=today.getDate()===d&&today.getMonth()===month&&today.getFullYear()===year;const hasEv=eventDays.includes(d);const isDanger=dangerDays.includes(d);html+=`<div class="cal-day ${isToday?'today':''} ${hasEv?'has-event':''} ${isDanger?'danger-day':''}">${d}</div>`;}
  grid.innerHTML=html;
  const evList=document.getElementById('cal-events-list');
  if(monthEvents.length===0){evList.innerHTML='<div style="font-size:12px;color:var(--text3);padding:8px 0;">Tidak ada agenda bulan ini.</div>';return;}
  evList.innerHTML=monthEvents.sort((a,b)=>a.day-b.day).map(e=>`<div class="cal-event-item"><div class="cal-event-dot" style="background:${e.color};"></div><div class="cal-event-name">${e.name}</div><div class="cal-event-date">${e.day} ${MONTHS[month].substr(0,3)}</div></div>`).join('');
}
let servisFilter='semua';
function renderServis(){
  const tabsEl=document.getElementById('servis-filter-tabs');
  tabsEl.innerHTML=`<button class="tab-btn ${servisFilter==='semua'?'active':''}" onclick="filterServis('semua',this)">Semua</button>`+DB.vehicles.map(v=>`<button class="tab-btn ${servisFilter===v.id?'active':''}" onclick="filterServis('${v.id}',this)">${v.type==='Mobil'?'🚗':'🏍️'} ${v.name.split(' ')[0]}</button>`).join('');
  let ss=DB.services.sort((a,b)=>new Date(b.date)-new Date(a.date));
  if(servisFilter!=='semua')ss=ss.filter(s=>s.vehicleId===servisFilter);
  const el=document.getElementById('servis-content');
  if(ss.length===0){el.innerHTML='<div class="empty-state"><div class="empty-icon">🔧</div><div class="empty-text">Belum ada riwayat servis.</div></div>';return;}
  const typeColor={'Ganti Oli':'#26D97F','Tune Up':'#1E90FF','Ganti Ban':'#FF7A00','Body & Paint':'#C9A84C','Modifikasi':'#E03030','Lainnya':'#8A9BAE'};
  el.innerHTML=`<div class="card" style="margin-bottom:10px;">${ss.map((s,i)=>{const v=getVehicle(s.vehicleId);const color=typeColor[s.type]||'#8A9BAE';return`<div class="svc-row"><div class="svc-dot-wrap"><div class="svc-dot" style="background:${color};box-shadow:0 0 6px ${color}55;"></div>${i<ss.length-1?'<div class="svc-line"></div>':''}</div><div style="flex:1;min-width:0;"><div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;"><div><div class="svc-title">${s.type}</div><div class="svc-sub">${v?v.name:''} · ${fmtDate(s.date)}</div>${s.desc?`<div class="svc-sub">${s.desc}</div>`:''}<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px;">${s.cost?`<span class="svc-badge pill-ok">${fmtRp(s.cost)}</span>`:''}${s.km?`<span class="svc-badge pill-blue">${Number(s.km).toLocaleString('id-ID')} KM</span>`:''}${s.shop?`<span class="svc-badge pill-silver">${s.shop}</span>`:''}</div>${s.next?`<div style="font-size:10px;color:var(--orange);margin-top:4px;font-family:'Rajdhani',sans-serif;font-weight:700;">NEXT: ${fmtDate(s.next)}</div>`:''}</div><div style="display:flex;gap:4px;flex-shrink:0;"><button class="ab ab-edit" onclick="openEditService('${s.id}')">✏️</button><button class="ab ab-del" onclick="deleteService('${s.id}')">🗑️</button></div></div></div></div>`;}).join('')}</div>`;
}
function filterServis(f,el){servisFilter=f;document.querySelectorAll('#servis-filter-tabs .tab-btn').forEach(b=>b.classList.remove('active'));if(el)el.classList.add('active');renderServis();}
function openAddService(){
  document.getElementById('svcf-title').textContent='Catat Servis';
  document.getElementById('svcf-id').value='';
  document.getElementById('svcf-date').value='';
  document.getElementById('svcf-cost').value='';
  document.getElementById('svcf-km').value='';
  document.getElementById('svcf-shop').value='';
  document.getElementById('svcf-desc').value='';
  document.getElementById('svcf-next').value='';
  resetCatSel('svcf-type','Ganti Oli');
  populateVehicleSelect('svcf-vehicle','');
  document.getElementById('service-form-modal').classList.add('open');
}
function openEditService(id){
  const s=DB.services.find(x=>x.id===id);if(!s)return;
  document.getElementById('svcf-title').textContent='Edit Servis';
  document.getElementById('svcf-id').value=s.id;
  document.getElementById('svcf-date').value=s.date;
  document.getElementById('svcf-cost').value=s.cost||'';
  document.getElementById('svcf-km').value=s.km||'';
  document.getElementById('svcf-shop').value=s.shop||'';
  document.getElementById('svcf-desc').value=s.desc||'';
  document.getElementById('svcf-next').value=s.next||'';
  resetCatSel('svcf-type',s.type);
  populateVehicleSelect('svcf-vehicle',s.vehicleId);
  document.getElementById('service-form-modal').classList.add('open');
}
function saveService(){
  const id=document.getElementById('svcf-id').value;
  if(!document.getElementById('svcf-date').value){showToast('⚠️ Tanggal wajib diisi!');return;}
  const data={id:id||uid(),vehicleId:document.getElementById('svcf-vehicle').value,type:document.getElementById('svcf-type').value,date:document.getElementById('svcf-date').value,cost:Number(document.getElementById('svcf-cost').value)||0,km:Number(document.getElementById('svcf-km').value)||0,shop:document.getElementById('svcf-shop').value.trim(),desc:document.getElementById('svcf-desc').value.trim(),next:document.getElementById('svcf-next').value};
  if(id){const i=DB.services.findIndex(s=>s.id===id);if(i>=0)DB.services[i]=data;}else DB.services.push(data);
  saveDB();closeModal('service-form-modal');showToast('✅ Servis disimpan!');renderServis();
}
function deleteService(id){showConfirm('Hapus Riwayat Servis?','',()=>{DB.services=DB.services.filter(s=>s.id!==id);saveDB();showToast('🗑️ Dihapus');renderServis();});}
function renderHof(){
  const el=document.getElementById('hof-content');
  const sorted=[...DB.hof].sort((a,b)=>Number(a.rank)-Number(b.rank));
  if(sorted.length===0){el.innerHTML=`<div style="text-align:center;padding:40px 20px;"><div style="font-size:50px;margin-bottom:12px;">🏆</div><div style="font-family:'Bebas Neue',sans-serif;font-size:22px;color:var(--gold);letter-spacing:.05em;margin-bottom:8px;">Hall of Fame Kosong</div><div style="font-size:12px;color:var(--text3);line-height:1.6;">Danny belum memilih kendaraan terbaik.</div></div>`;return;}
  el.innerHTML=sorted.map(h=>{const v=getVehicle(h.vehicleId);if(!v)return '';const rankEmoji=['🥇','🥈','🥉','4️⃣','5️⃣'][h.rank-1]||h.rank;const tags=h.tags?h.tags.split(',').filter(Boolean):[];const imgContent=v.photo?`<img class="hof-img" src="${v.photo}" alt="${v.name}" onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="hof-img-placeholder" style="display:none">🏎️</div>`:`<div class="hof-img-placeholder">🏎️</div>`;return`<div class="hof-card"><div class="hof-number">${h.rank}</div><div class="hof-img-wrap">${imgContent}</div><div class="hof-overlay"><div class="hof-rank-label">${rankEmoji} Rank #${h.rank} · Danny's Pick</div><div class="hof-vh-name">${v.name}</div><div class="hof-vh-desc">"${h.reason||''}"</div>${tags.length>0?`<div class="hof-tags">${tags.map(t=>`<span class="hof-tag pill-warn">${t}</span>`).join('')}</div>`:''}</div><div style="position:absolute;top:10px;right:10px;display:flex;gap:4px;"><button class="ab ab-edit" onclick="openEditHof('${h.id}')">✏️</button><button class="ab ab-del" onclick="deleteHof('${h.id}')">🗑️</button></div></div>`;}).join('');
}
function openAddHof(){
  document.getElementById('hoff-title').textContent='Tambah HOF';
  document.getElementById('hoff-id').value='';
  document.getElementById('hoff-reason').value='';
  hofTagsSelected=[];
  document.getElementById('hoff-tags').value='';
  document.querySelectorAll('#hof-form-modal .cat-opt').forEach(o=>{if(!['1','2','3','4','5'].includes(o.dataset.val))o.classList.remove('active');});
  resetCatSel('hoff-rank','1');
  populateVehicleSelect('hoff-vehicle','');
  document.getElementById('hof-form-modal').classList.add('open');
}
function openEditHof(id){
  const h=DB.hof.find(x=>x.id===id);if(!h)return;
  document.getElementById('hoff-title').textContent='Edit HOF';
  document.getElementById('hoff-id').value=h.id;
  document.getElementById('hoff-reason').value=h.reason||'';
  document.getElementById('hoff-tags').value=h.tags||'';
  hofTagsSelected=(h.tags||'').split(',').filter(Boolean);
  document.querySelectorAll('#hof-form-modal .cat-select:last-of-type .cat-opt').forEach(o=>{o.classList.toggle('active',hofTagsSelected.includes(o.dataset.val));});
  resetCatSel('hoff-rank',String(h.rank));
  populateVehicleSelect('hoff-vehicle',h.vehicleId);
  document.getElementById('hof-form-modal').classList.add('open');
}
function saveHof(){
  const id=document.getElementById('hoff-id').value;
  const data={id:id||uid(),vehicleId:document.getElementById('hoff-vehicle').value,rank:Number(document.getElementById('hoff-rank').value)||1,reason:document.getElementById('hoff-reason').value.trim(),tags:document.getElementById('hoff-tags').value};
  if(id){const i=DB.hof.findIndex(h=>h.id===id);if(i>=0)DB.hof[i]=data;}else DB.hof.push(data);
  saveDB();closeModal('hof-form-modal');showToast('🏆 Masuk Hall of Fame!');renderHof();
}
function deleteHof(id){showConfirm('Keluarkan dari HOF?','',()=>{DB.hof=DB.hof.filter(h=>h.id!==id);saveDB();showToast('🗑️ Dihapus');renderHof();});}
function renderProfil(){
  const p=DB.profile;
  const totalPajak=DB.taxes.reduce((s,t)=>s+Number(t.amount||0),0);
  const totalServisCost=DB.services.reduce((s,sv)=>s+Number(sv.cost||0),0);
  const dbSize=formatBytes(getStorageBytes());
  const el=document.getElementById('profil-content');
  el.innerHTML=`
    <div class="profile-banner">
      <div class="profile-avatar">${p.photo?`<img src="${p.photo}" onerror="this.parentElement.innerHTML='<div class=\\'profile-avatar-placeholder\\'>👑</div>'">`:'<div class="profile-avatar-placeholder">👑</div>'}</div>
      <div><div class="profile-name">${p.name||'Danny'}</div><div class="profile-tagline">${p.tagline||'King of the Road'}</div><div class="profile-bio">${p.bio||''}</div><div style="font-size:10px;color:var(--text3);margin-top:6px;">Database memory tersimpan: <strong>${dbSize}</strong></div></div>
    </div>
    <div class="card card-gold" style="margin-bottom:12px;">
      <div style="padding:14px 16px;">
        <div class="sec-label" style="margin-bottom:10px;">Statistik Garasi</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div style="background:var(--bg3);border-radius:var(--radius-sm);padding:12px;text-align:center;"><div style="font-family:'Bebas Neue',sans-serif;font-size:28px;color:var(--gold);">${DB.vehicles.length}</div><div style="font-size:10px;color:var(--text3);font-family:'Rajdhani',sans-serif;text-transform:uppercase;letter-spacing:.06em;">Total Kendaraan</div></div>
          <div style="background:var(--bg3);border-radius:var(--radius-sm);padding:12px;text-align:center;"><div style="font-family:'Bebas Neue',sans-serif;font-size:28px;color:var(--green);">${DB.reminders.length}</div><div style="font-size:10px;color:var(--text3);font-family:'Rajdhani',sans-serif;text-transform:uppercase;letter-spacing:.06em;">Dokumen Terpantau</div></div>
          <div style="background:var(--bg3);border-radius:var(--radius-sm);padding:12px;text-align:center;"><div style="font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--orange);">${DB.services.length}</div><div style="font-size:10px;color:var(--text3);font-family:'Rajdhani',sans-serif;text-transform:uppercase;letter-spacing:.06em;">Riwayat Servis</div></div>
          <div style="background:var(--bg3);border-radius:var(--radius-sm);padding:12px;text-align:center;"><div style="font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--red2);">${DB.hof.length}</div><div style="font-size:10px;color:var(--text3);font-family:'Rajdhani',sans-serif;text-transform:uppercase;letter-spacing:.06em;">Hall of Fame</div></div>
        </div>
        <div style="background:var(--bg3);border-radius:var(--radius-sm);padding:12px;margin-top:10px;display:flex;justify-content:space-between;align-items:center;"><div style="font-size:11px;color:var(--text3);font-family:'Rajdhani',sans-serif;text-transform:uppercase;letter-spacing:.06em;">Total Pajak/Tahun</div><div style="font-family:'Bebas Neue',sans-serif;font-size:20px;color:var(--gold);">${fmtRp(totalPajak)}</div></div>
        <div style="background:var(--bg3);border-radius:var(--radius-sm);padding:12px;margin-top:8px;display:flex;justify-content:space-between;align-items:center;"><div style="font-size:11px;color:var(--text3);font-family:'Rajdhani',sans-serif;text-transform:uppercase;letter-spacing:.06em;">Total Biaya Servis</div><div style="font-family:'Bebas Neue',sans-serif;font-size:20px;color:var(--blue);">${fmtRp(totalServisCost)}</div></div>
        <div style="background:linear-gradient(135deg,rgba(255,160,0,0.05),rgba(255,160,0,0.1));border:1px solid rgba(255,160,0,0.2);border-radius:var(--radius-sm);padding:12px;margin-top:8px;display:flex;justify-content:space-between;align-items:center;"><div><div style="font-size:11px;color:#FFA000;font-family:'Rajdhani',sans-serif;text-transform:uppercase;letter-spacing:.06em;font-weight:700;">🔥 Firebase Cloud</div><div style="font-size:10px;color:var(--text3);margin-top:2px;">Data tersimpan di Firestore + localStorage</div></div><div style="font-size:11px;color:#FFA000;font-family:'Rajdhani',sans-serif;font-weight:700;">AKTIF ✓</div></div>
      </div>
    </div>
    <div class="card" style="margin-bottom:12px;">
      <div style="padding:14px 16px;">
        <div class="sec-label" style="margin-bottom:10px;">Navigasi Cepat</div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          ${[['koleksi','🚗','Koleksi Kendaraan'],['reminder','⏰','Reminder Dokumen'],['pajak','💰','Pajak Kendaraan'],['servis','🔧','Riwayat Servis'],['hof','🏆','Hall of Fame'],['kalender','📅','Kalender']].map(([pg,ic,lbl])=>`<div onclick="navigate('${pg}')" style="display:flex;align-items:center;gap:12px;padding:10px;background:var(--bg3);border-radius:var(--radius-sm);cursor:pointer;" onmouseenter="this.style.background='var(--gold-pale)'" onmouseleave="this.style.background='var(--bg3)'"><span style="font-size:18px;">${ic}</span><span style="font-size:13px;font-weight:600;color:var(--text);">${lbl}</span><span style="margin-left:auto;color:var(--gold);font-family:'Rajdhani',sans-serif;font-weight:700;">›</span></div>`).join('')}
        </div>
      </div>
    </div>
    <div style="text-align:center;padding:16px 0 8px;font-size:10px;color:var(--text3);font-family:'Rajdhani',sans-serif;letter-spacing:.1em;text-transform:uppercase;">Danny's Garage Hub v2.0 · Powered by 🔥 Firebase</div>
  `;
}
function openEditProfile(){
  const p=DB.profile;
  document.getElementById('prof-name').value=p.name||'';
  document.getElementById('prof-tagline').value=p.tagline||'';
  document.getElementById('prof-bio').value=p.bio||'';
  document.getElementById('prof-photo').value=p.photo||'';
  document.getElementById('prof-city').value=p.city||'';
  document.getElementById('profile-form-modal').classList.add('open');
}
function saveProfile(){
  DB.profile={name:document.getElementById('prof-name').value.trim(),tagline:document.getElementById('prof-tagline').value.trim(),bio:document.getElementById('prof-bio').value.trim(),photo:document.getElementById('prof-photo').value.trim(),city:document.getElementById('prof-city').value.trim()};
  saveDB();closeModal('profile-form-modal');showToast('✅ Profil disimpan!');renderProfil();
}
function populateVehicleSelect(selectId,selectedId){
  const sel=document.getElementById(selectId);if(!sel)return;
  sel.innerHTML=DB.vehicles.length===0?'<option value="">-- Tambah kendaraan dulu --</option>':DB.vehicles.map(v=>`<option value="${v.id}" ${v.id===selectedId?'selected':''}>${v.type==='Mobil'?'🚗':'🏍️'} ${v.name} · ${v.plate}</option>`).join('');
}
renderHome();

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(registration => {
      console.log('Service Worker registered successfully:', registration);
    })
    .catch(error => {
      console.log('Service Worker registration failed:', error);
    });
}
