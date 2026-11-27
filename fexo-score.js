/* FEXO HUB - game score helper
   Game page e eta add korun (game er script er age):
     <script src="../../fexo-score.js"></script>
   Game over hole:
     FexoScore.submit(finalScore);
   Hub e fire jete:  FexoScore.exit();
   Same domain e thakle Game Hub er login ekhaneo kaj kore. */
(function(){
const cfg={apiKey:"AIzaSyCfnHmflYAlp8qwlwLiuTubr0Z995yR8Uc",authDomain:"fexo-hub.firebaseapp.com",projectId:"fexo-hub",storageBucket:"fexo-hub.firebasestorage.app",messagingSenderId:"937734056640",appId:"1:937734056640:web:32329e4054e96a6fc51b25"};
const CYCLE_DAYS=3; // config.js er LB_CYCLE_DAYS er sathe mil rakhben
const BD_OFFSET=6*36e5,CYCLE_MS=CYCLE_DAYS*864e5,cycleId=()=>Math.floor((Date.now()+BD_OFFSET)/CYCLE_MS);
const base=document.currentScript.src,HUB=new URL("index.html",base).href,V="https://www.gstatic.com/firebasejs/10.12.2/";
const gameId=()=>new URLSearchParams(location.search).get("game")||decodeURIComponent((location.pathname.match(/\/games\/([^\/]+)/)||[])[1]||"");
const load=src=>new Promise((res,rej)=>{const s=document.createElement("script");s.src=src;s.onload=res;s.onerror=()=>rej(new Error("Failed to load "+src));document.head.appendChild(s)});
function say(m){let t=document.getElementById("fexoScoreToast");if(!t){t=document.createElement("div");t.id="fexoScoreToast";t.style.cssText="position:fixed;left:50%;top:16px;transform:translateX(-50%);background:#06222b;border:1px solid #00e5ff;color:#fff;padding:10px 18px;border-radius:999px;font:600 14px sans-serif;z-index:2147483647;opacity:0;transition:opacity .3s;pointer-events:none";document.body.appendChild(t)}
t.textContent=m;t.style.opacity=1;clearTimeout(t._t);t._t=setTimeout(()=>t.style.opacity=0,3500)}
const ready=(async()=>{if(!window.firebase)await load(V+"firebase-app-compat.js");
await Promise.all([load(V+"firebase-auth-compat.js"),load(V+"firebase-firestore-compat.js")]);
if(!firebase.apps.length)firebase.initializeApp(cfg);
await new Promise(r=>{const off=firebase.auth().onAuthStateChanged(()=>{off();r()})})})();
async function submit(score){score=Math.floor(Number(score));const gid=gameId();
if(!gid||!isFinite(score)||score<=0)return{ok:false,reason:"invalid"};
try{await ready;const u=firebase.auth().currentUser;
if(!u){say("Sign in on Game Hub to save your score");return{ok:false,reason:"login"}}
const db=firebase.firestore(),ref=db.collection("leaderboards").doc(gid+"_"+cycleId()).collection("scores").doc(u.uid);
const r=await db.runTransaction(async t=>{const d=await t.get(ref),best=d.exists?d.data().score:0;if(score<=best)return{saved:false,best};
t.set(ref,{uid:u.uid,name:u.displayName||(u.email||"Player").split("@")[0],score,updatedAt:Date.now()});return{saved:true,best:score}});
say(r.saved?"New high score: "+r.best.toLocaleString()+"!":"Your best stays "+r.best.toLocaleString());
return{ok:true,...r}}catch(e){say("Score save failed: "+e.message);return{ok:false,reason:e.message}}}
window.FexoScore={submit,exit:()=>{location.href=HUB},hubUrl:HUB};
})();
