import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, limit, serverTimestamp, doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let soundOn=localStorage.getItem("fexo_sound")!=="false",audioCtx=null;
function beep(f=600,d=.08){if(!soundOn)return;try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==="suspended")audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type="square";o.frequency.value=f;g.gain.value=.05;o.connect(g);g.connect(audioCtx.destination);o.start();setTimeout(()=>o.stop(),d*1000)}catch(e){}}
$("#soundToggle").textContent=soundOn?"🔊 Sound ON":"🔇 Sound OFF";
$("#soundToggle").onclick=()=>{soundOn=!soundOn;localStorage.setItem("fexo_sound",soundOn);$("#soundToggle").textContent=soundOn?"🔊 Sound ON":"🔇 Sound OFF";beep(800)};
let user=null;
onAuthStateChanged(auth,u=>{user=u;$("#authBtn").textContent=u?"Logout":"Login"});
$("#authBtn").onclick=()=>{if(user){signOut(auth);toast("Logged out")}else $("#authModal").classList.remove("hidden")};
$("#closeAuth").onclick=()=>$("#authModal").classList.add("hidden");
$("#authForm").onsubmit=async e=>{e.preventDefault();try{const em=$("#authEmail").value,pw=$("#authPassword").value;let u;try{u=await signInWithEmailAndPassword(auth,em,pw)}catch{u=await createUserWithEmailAndPassword(auth,em,pw)}user=u.user;$("#authModal").classList.add("hidden");toast("Welcome "+user.email);beep(900)}catch(err){toast(err.message)}};
let pageOrder=["home","products","sponsorship","leaderboard","games"],current=0;
function goto(id){const i=pageOrder.indexOf(id);if(i<0)return;current=i;$$(".tab").forEach(t=>t.classList.toggle("active",t.dataset.page===id));$$(".page").forEach(p=>p.classList.remove("active"));$("#"+id).classList.add("active");window.scrollTo({top:0,behavior:"smooth"});beep(520)}
$$(".tab").forEach(t=>t.onclick=()=>goto(t.dataset.page));
$$("[data-goto]").forEach(c=>c.onclick=()=>goto(c.dataset.goto));
let touchX=0;document.addEventListener("touchstart",e=>touchX=e.touches[0].clientX,{passive:true});
document.addEventListener("touchend",e=>{const dx=e.changedTouches[0].clientX-touchX;if(Math.abs(dx)<70)return;const n=current+(dx<0?1:-1);if(n>=0&&n<pageOrder.length)goto(pageOrder[n])},{passive:true});
function today(){return new Date().toISOString().slice(0,10)}
function visitorId(){let id=localStorage.getItem("fexo_visitor_id");if(!id){id=crypto.randomUUID();localStorage.setItem("fexo_visitor_id",id)}return id}
async function markVisitor(){try{await addDoc(collection(db,"presence"),{visitorId:visitorId(),lastSeen:serverTimestamp(),date:today()})}catch(e){}}
setInterval(markVisitor,20000);markVisitor();
async function updateVisitors(){try{const q=query(collection(db,"presence"),where("date","==",today()));const snap=await getDocs(q);const now=Date.now();let live=0;const seen=new Set();snap.forEach(d=>{const t=d.data().lastSeen?.toMillis?.()||0;if(now-t<60000)live++;seen.add(d.data().visitorId)});$("#liveVisitors").textContent=`🟢 Live: ${live}`;$("#dailyVisitors").textContent=`👥 Today: ${seen.size}`}catch(e){}}
setInterval(updateVisitors,5000);updateVisitors();
function renderProducts(){$("#productGrid").innerHTML=CONFIG.products.map(p=>`<div class="product-card ${p.stock?"":"out"}"><img src="${p.image}"><h3>${p.name}</h3><p>${CONFIG.currency}${p.price}</p><span class="badge ${p.stock?"live":"stockout"}">${p.stock?"In stock":"Out of stock"}</span><button ${p.stock?"":"disabled"} data-buy="${p.id}">Order Now</button></div>`).join("");$$("[data-buy]").forEach(b=>b.onclick=()=>openCheckout(b.dataset.buy))}
let selectedProduct=null,locationData=null;
function openCheckout(id){selectedProduct=CONFIG.products.find(p=>p.id===id);$("#checkoutTotal").textContent=CONFIG.currency+selectedProduct.price;$("#checkoutModal").classList.remove("hidden");beep(700)}
$("#closeCheckout").onclick=()=>$("#checkoutModal").classList.add("hidden");
const divisionSel=$("#division"),districtSel=$("#district"),upazillaSel=$("#upazilla");
Object.keys(CONFIG.locations).forEach(d=>divisionSel.add(new Option(d,d)));
divisionSel.onchange=()=>{districtSel.innerHTML='<option value="">Select District</option>';upazillaSel.innerHTML='<option value="">Select Upazilla</option>';districtSel.disabled=!divisionSel.value;upazillaSel.disabled=true;Object.keys(CONFIG.locations[divisionSel.value]||{}).forEach(d=>districtSel.add(new Option(d,d)));validate()};
districtSel.onchange=()=>{upazillaSel.innerHTML='<option value="">Select Upazilla</option>';const ups=CONFIG.locations[divisionSel.value]?.[districtSel.value]||[];ups.forEach(u=>upazillaSel.add(new Option(u,u)));upazillaSel.disabled=!districtSel.value;validate()};
["#fullName","#phone","#email","#area"].forEach(s=>$(s).oninput=validate);
$("#locationBtn").onclick=()=>{if(!navigator.geolocation)return $("#locationStatus").textContent="Location not supported.";navigator.geolocation.getCurrentPosition(pos=>{locationData={lat:pos.coords.latitude,lng:pos.coords.longitude};$("#locationStatus").textContent=`Location shared: ${locationData.lat.toFixed(4)}, ${locationData.lng.toFixed(4)}`;beep(900)},()=>$("#locationStatus").textContent="Location permission denied.")};
function validPhone(v){return /^(\+8801|8801|01)[3-9]\d{8}$/.test(v.replace(/[\s-]/g,""))}
function validEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)}
function validate(){const ok=$("#fullName").value.trim()&&validPhone($("#phone").value)&&validEmail($("#email").value)&&divisionSel.value&&districtSel.value&&upazillaSel.value;$("#confirmOrder").disabled=!ok;return !!ok}
$("#checkoutForm").onsubmit=async e=>{e.preventDefault();if(!validate())return;try{await addDoc(collection(db,"orders"),{product:selectedProduct,quantity:1,total:selectedProduct.price,name:$("#fullName").value.trim(),phone:$("#phone").value.trim(),email:$("#email").value.trim(),division:divisionSel.value,district:districtSel.value,upazilla:upazillaSel.value,area:$("#area").value.trim(),location:locationData,payment:"COD",paymentStatus:"Unpaid",status:"pending",placedAt:Date.now(),cancelUntil:Date.now()+CONFIG.cancelWindowMinutes*60000,userId:user?.uid||null});$("#checkoutModal").classList.add("hidden");toast("Order placed. You can cancel within 15 minutes.");beep(1000);renderShopLeaderboard()}catch(err){toast(err.message)}};
function roundInfo(){const period=CONFIG.leaderboardResetHours*3600000;const start=Math.floor(Date.now()/period)*period;return{id:"R"+start,start,end:start+period}}
async function renderShopLeaderboard(){try{const r=roundInfo();const q=query(collection(db,"orders"),where("status","!=","cancelled"),orderBy("status"),limit(100));const snap=await getDocs(q);const counts={};snap.forEach(d=>{const o=d.data();if(o.placedAt>=r.start&&o.placedAt<r.end)counts[o.name]=(counts[o.name]||0)+1});const rows=Object.entries(counts).sort((a,b)=>b[1]-a[1]);$("#shopLeaderboard").innerHTML=rows.length?rows.map(([n,c],i)=>`<li>${i+1}. ${n} — ${c} order${c>1?"s":""}</li>`).join(""):"<li>No customers yet.</li>"}catch(e){$("#shopLeaderboard").innerHTML="<li>Leaderboard loading…</li>"}}
async function renderGameLeaderboard(){try{const r=roundInfo();const q=query(collection(db,"gameScores"),where("roundId","==",r.id),orderBy("score","desc"),limit(10));const snap=await getDocs(q);const rows=[];snap.forEach(d=>rows.push(d.data()));$("#gameLeaderboard").innerHTML=rows.length?rows.map((s,i)=>`<li>${i+1}. ${s.name} — ${s.score}</li>`).join(""):"<li>No players yet.</li>"}catch(e){$("#gameLeaderboard").innerHTML="<li>Leaderboard loading…</li>"}}
function countdown(){const r=roundInfo(),left=r.end-Date.now(),d=Math.floor(left/86400000),h=Math.floor(left%86400000/3600000),m=Math.floor(left%3600000/60000);const t=`Resets in ${d}d ${h}h ${m}m`;$("#shopCountdown").textContent=t;$("#gameCountdown").textContent=t}
setInterval(()=>{renderShopLeaderboard();renderGameLeaderboard();countdown()},30000);countdown();
window.addEventListener("message",async e=>{if(e.data?.type==="FEXO_GAME_SCORE"){if(!user){toast("Login required to enter the Game Leaderboard.");return}try{const r=roundInfo();await addDoc(collection(db,"gameScores"),{roundId:r.id,userId:user.uid,name:user.email.split("@")[0],game:e.data.game,score:e.data.score,createdAt:serverTimestamp()});renderGameLeaderboard();toast("Score submitted.")}catch(err){toast(err.message)}}});
$("#sponsorForm").onsubmit=async e=>{e.preventDefault();const phone=$("#sponsorPhone").value;if(!validPhone(phone))return toast("Enter a valid Bangladeshi phone number.");try{await addDoc(collection(db,"sponsors"),{name:$("#sponsorName").value,email:$("#sponsorEmail").value,phone,message:$("#sponsorMessage").value,createdAt:serverTimestamp()});toast("Sponsorship request received.");e.target.reset();beep(900)}catch(err){toast(err.message)}};
let toastTimer;function toast(m){const t=$("#toast");t.textContent=m;t.classList.remove("hidden");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.add("hidden"),3200)}
renderProducts();renderShopLeaderboard();renderGameLeaderboard();