import * as THREE from "three";

const canvas=document.getElementById("game");
const renderer=new THREE.WebGPURenderer({canvas,antialias:true});
await renderer.init();

function applyQuality(){
const dpr=Math.min(devicePixelRatio||1,2);
renderer.setPixelRatio(dpr);
renderer.setSize(innerWidth,innerHeight);
}
applyQuality();
renderer.shadowMap.enabled=true;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x87b8d8);
scene.fog=new THREE.Fog(0x87b8d8,70,320);

const camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.1,700);

const sun=new THREE.DirectionalLight(0xfff2cc,2.3);
sun.position.set(70,110,45);
sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-130;sun.shadow.camera.right=130;
sun.shadow.camera.top=130;sun.shadow.camera.bottom=-130;
scene.add(sun);
scene.add(new THREE.HemisphereLight(0xbfe3ff,0x3b2f22,1.15));

const worldSize=240;
const ground=new THREE.Mesh(new THREE.PlaneGeometry(worldSize,worldSize),new THREE.MeshStandardMaterial({color:0x3b3b3b,roughness:.95}));
ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);

const roadMat=new THREE.MeshStandardMaterial({color:0x1d1d1d,roughness:.7});
for(let i=-110;i<=110;i+=40){
const rx=new THREE.Mesh(new THREE.PlaneGeometry(worldSize,13),roadMat);
rx.rotation.x=-Math.PI/2;rx.position.set(0,.02,i);scene.add(rx);
const rz=new THREE.Mesh(new THREE.PlaneGeometry(13,worldSize),roadMat);
rz.rotation.x=-Math.PI/2;rz.position.set(i,.02,0);scene.add(rz);
}

const colors=[0xd9c9a3,0xb98b5e,0x8d6e63,0x9e9e9e,0xcfd8dc,0xa1887f,0x80cbc4,0xf0e68c];
const buildings=[],enterableBuildings=[];

for(let x=-100;x<=100;x+=22){
for(let z=-100;z<=100;z+=22){
if(Math.abs(x)<12||Math.abs(z)<12)continue;
const h=9+Math.random()*34,w=9+Math.random()*7;
const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,w),new THREE.MeshStandardMaterial({color:colors[Math.floor(Math.random()*colors.length)],roughness:.85}));
b.position.set(x+(Math.random()-.5)*4,h/2,z+(Math.random()-.5)*4);
b.castShadow=b.receiveShadow=true;scene.add(b);buildings.push(b);

if(Math.random()<.16){
const door=new THREE.Mesh(new THREE.PlaneGeometry(2.4,3.2),new THREE.MeshStandardMaterial({color:0x222222,emissive:0x2266ff,emissiveIntensity:.6}));
door.position.set(b.position.x,b.position.y-h/2+1.6,b.position.z+w/2+.03);
scene.add(door);
enterableBuildings.push({mesh:b,door,name:"Local Shop",text:"আপনি দোকানে ঢুকেছেন। এখানে চা, বিস্কুট, চিপস এবং অতিরিক্ত গসিপ পাওয়া যায়।"});
}
}
}

const rickshaws=[];
const rGeo=new THREE.BoxGeometry(1.7,1.2,2.8);
const rMat=new THREE.MeshStandardMaterial({color:0x22aa44,metalness:.15,roughness:.55});

for(let i=0;i<16;i++){
const r=new THREE.Mesh(rGeo,rMat);
r.position.set((Math.random()-.5)*180,.75,(Math.random()-.5)*180);
r.rotation.y=Math.random()*Math.PI*2;r.castShadow=true;scene.add(r);
rickshaws.push({mesh:r,occupied:false,speed:0});
}

const chaStallMat=new THREE.MeshStandardMaterial({color:0xff7043});
const shops=[];
for(let i=0;i<7;i++){
const s=new THREE.Mesh(new THREE.BoxGeometry(3.4,2.4,3.4),chaStallMat);
s.position.set((Math.random()-.5)*160,1.2,(Math.random()-.5)*160);
s.castShadow=true;scene.add(s);
shops.push({mesh:s,name:"Cha er Dokan",text:"আপনি দোকানে ঢুকেছেন। এখানে চা, সিগারেট, চিপস এবং গসিপ পাওয়া যায়।"});
}

const player=new THREE.Group();
const playerBody=new THREE.Mesh(new THREE.CapsuleGeometry(.45,1.1,6,12),new THREE.MeshStandardMaterial({color:0xffd400}));
playerBody.position.y=1.05;playerBody.castShadow=true;player.add(playerBody);
const playerHead=new THREE.Mesh(new THREE.SphereGeometry(.32,20,20),new THREE.MeshStandardMaterial({color:0xd7a26b}));
playerHead.position.y=1.95;playerHead.castShadow=true;player.add(playerHead);
scene.add(player);

const state={
velocity:new THREE.Vector3(),money:500,wanted:1,punchCooldown:0,nearNPC:null,
running:false,joystick:{active:false,x:0,y:0},
look:{active:false,lastX:0,lastY:0},yaw:0,pitch:0,
vehicle:null,interior:null,nearEnterable:null,nearVehicle:null
};

const npcData=[
{name:"Cha Wala Karim",color:0xff7043,lines:["ভাই, চায়ে চিনি কমাইছি—দাম কিন্তু বাড়াইছি। এটাই তো development!","দুধ নাই, চা আছে। বিশ্বাস করেন, এটাই আসল চা।","আপনি mission করেন, আমি চা বিক্রি করি। দেশটা এভাবেই চলে।"]},
{name:"RickshawALA Jashim",color:0x22aa44,lines:["ভাই, ট্রাফিকে আটকায়া গেলে ভাড়া বাড়বে—এটা market economy!","আমার rickshaw-এর brake নাই, কিন্তু confidence full।","গাড়ি লুট করার আগে horn বাজান; এটা তো culture!"]},
{name:"Political Poster Bhai",color:0x9c27b0,lines:["ভাই, poster লাগাইতে হবে। দেশের ভাগ্য এখন দেয়ালের ওপর নির্ভরশীল।","আমি কাউকে দোষ দিই না—আমি শুধু glue-এর দাম নিয়ে চিন্তিত।","Vote চাই, কিন্তু আগে একটা চা খাইয়েন।"]},
{name:"Load-shedding Uncle",color:0x607d8b,lines:["বিদ্যুৎ গেছে? না ভাই, এটা বিদ্যুতের বিরতি—professional rest।","Fan ঘুরছে না, কিন্তু আমার মাথা ঘুরছে।","গাড়ি চালান, কিন্তু ট্রাফিক আইন মানেন—নাহলে আমি ভিডিও করব।"]}
];

const npcs=[];
for(const d of npcData){
const g=new THREE.Group();
const b=new THREE.Mesh(new THREE.CapsuleGeometry(.42,1.05,6,12),new THREE.MeshStandardMaterial({color:d.color}));
b.position.y=1;b.castShadow=true;g.add(b);
const h=new THREE.Mesh(new THREE.SphereGeometry(.3,18,18),new THREE.MeshStandardMaterial({color:0xd7a26b}));
h.position.y=1.85;g.add(h);
g.position.set((Math.random()-.5)*100,0,(Math.random()-.5)*100);
scene.add(g);
npcs.push({mesh:g,data:d,lineIndex:0,alive:true});
}

const missionTarget=new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.3,3.2,24),new THREE.MeshStandardMaterial({color:0xffd400,emissive:0xffaa00,emissiveIntensity:.8}));
missionTarget.position.set(75,1.6,-75);scene.add(missionTarget);

const joystickBase=document.getElementById("joystick-base");
const joystickKnob=document.getElementById("joystick-knob");
const lookArea=document.getElementById("look-area");
const btnRun=document.getElementById("btn-run");
const btnPunch=document.getElementById("btn-punch");
const btnTalk=document.getElementById("btn-talk");
const btnEnter=document.getElementById("btn-enter");
const btnVehicle=document.getElementById("btn-vehicle");
const btnHorn=document.getElementById("btn-horn");

const moneyEl=document.getElementById("money");
const wantedEl=document.getElementById("wanted");
const missionEl=document.getElementById("mission");
const dialogueBox=document.getElementById("dialogue");
const speakerEl=document.getElementById("speaker");
const dialogueText=document.getElementById("dialogue-text");
const dialogueClose=document.getElementById("dialogue-close");
const interiorUI=document.getElementById("interior-ui");
const interiorTitle=document.getElementById("interior-title");
const interiorText=document.getElementById("interior-text");
const interiorExit=document.getElementById("interior-exit");
const toastEl=document.getElementById("toast");
const playerDot=document.getElementById("player-dot");
const missionDot=document.getElementById("mission-dot");

function updateHUD(){moneyEl.textContent=`৳ ${state.money}`;wantedEl.textContent=`Wanted: ${"★".repeat(state.wanted)}`;}

let toastTimer;
function showToast(text){toastEl.textContent=text;toastEl.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>toastEl.classList.remove("show"),2800);}

function setJoystick(x,y){
const max=40,dist=Math.min(Math.hypot(x,y),max),ang=Math.atan2(y,x);
joystickKnob.style.transform=`translate(${Math.cos(ang)*dist}px,${Math.sin(ang)*dist}px)`;
state.joystick.active=dist>6;state.joystick.x=x/max;state.joystick.y=y/max;
}

function joystickStart(e){e.preventDefault();state.joystick.active=true;joystickMove(e);}
function joystickMove(e){
const t=e.touches?e.touches[0]:e;
const r=joystickBase.getBoundingClientRect();
setJoystick(t.clientX-(r.left+r.width/2),t.clientY-(r.top+r.height/2));
}
function joystickEnd(){state.joystick.active=false;state.joystick.x=0;state.joystick.y=0;joystickKnob.style.transform="translate(0,0)";}

joystickBase.addEventListener("touchstart",joystickStart,{passive:false});
joystickBase.addEventListener("touchmove",e=>{e.preventDefault();joystickMove(e);},{passive:false});
joystickBase.addEventListener("touchend",joystickEnd);
joystickBase.addEventListener("touchcancel",joystickEnd);

lookArea.addEventListener("touchstart",e=>{
const t=e.touches[0];state.look.active=true;state.look.lastX=t.clientX;state.look.lastY=t.clientY;
},{passive:false});

lookArea.addEventListener("touchmove",e=>{
e.preventDefault();
if(!state.look.active)return;
const t=e.touches[0];
const dx=t.clientX-state.look.lastX,dy=t.clientY-state.look.lastY;
state.look.lastX=t.clientX;state.look.lastY=t.clientY;
state.yaw-=dx*.0045;
state.pitch=THREE.MathUtils.clamp(state.pitch-dy*.0035,-.7,.7);
},{passive:false});

lookArea.addEventListener("touchend",()=>state.look.active=false);
lookArea.addEventListener("touchcancel",()=>state.look.active=false);

btnRun.addEventListener("touchstart",e=>{e.preventDefault();state.running=true;btnRun.style.background="#38ff88";});
btnRun.addEventListener("touchend",()=>{state.running=false;btnRun.style.background="";});
btnPunch.addEventListener("touchstart",e=>{e.preventDefault();punch();});
btnTalk.addEventListener("touchstart",e=>{e.preventDefault();talk();});
btnEnter.addEventListener("touchstart",e=>{e.preventDefault();enterPlace();});
btnVehicle.addEventListener("touchstart",e=>{e.preventDefault();vehicleAction();});
btnHorn.addEventListener("touchstart",e=>{e.preventDefault();horn();});
dialogueClose.addEventListener("click",()=>dialogueBox.classList.add("hidden"));
interiorExit.addEventListener("click",()=>{state.interior=null;interiorUI.classList.add("hidden");});

addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();applyQuality();});

let dialogueTimer;
function talk(){
if(state.vehicle){showToast("গাড়ি থেকে নামে তারপর কথা বলুন!");return;}
if(!state.nearNPC){showToast("কাছে কোনো NPC নাই।");return;}
const n=state.nearNPC,line=n.data.lines[n.lineIndex%n.data.lines.length];
speakerEl.textContent=n.data.name;dialogueText.textContent=line;dialogueBox.classList.remove("hidden");
n.lineIndex++;state.money+=10;updateHUD();
showToast("চায়ের দাম বাড়লো, কিন্তু আপনার ব্যাগে ৳10 ঢুকলো!");
clearTimeout(dialogueTimer);dialogueTimer=setTimeout(()=>dialogueBox.classList.add("hidden"),5000);
}

function punch(){
if(state.vehicle){showToast("গাড়ি থেকে নামে তারপর মারামারি!");return;}
if(state.punchCooldown>0)return;state.punchCooldown=.45;
let hit=false;
for(const n of npcs){
if(!n.alive)continue;
if(player.position.distanceTo(n.mesh.position)<2.8){
n.mesh.rotation.z+=.8;n.mesh.position.x+=(Math.random()-.5)*2;n.mesh.position.z+=(Math.random()-.5)*2;
state.wanted=Math.min(5,state.wanted+1);state.money+=25;hit=true;break;
}
}
updateHUD();
showToast(hit?"Maramari successful! Police-এর নজর বাড়লো।":"কাছে কেউ নাই—বাতাসকে মারলেন!");
}

function enterPlace(){
if(state.vehicle){showToast("আগে গাড়ি থেকে নামুন।");return;}
if(!state.nearEnterable){showToast("কাছে কোনো দরজা বা দোকান নাই।");return;}
const place=state.nearEnterable;
state.interior=place;
interiorTitle.textContent=place.name;
interiorText.textContent=place.text;
interiorUI.classList.remove("hidden");
state.money+=20;updateHUD();
}

function nearestVehicle(){
let best=null,bestDist=5;
for(const v of rickshaws){
const d=player.position.distanceTo(v.mesh.position);
if(d<bestDist){bestDist=d;best=v;}
}
return best;
}

function vehicleAction(){
if(state.vehicle){
state.vehicle.occupied=false;state.vehicle=null;
player.position.y=0;
btnVehicle.textContent="গাড়ি";
showToast("Rickshaw থেকে নামলেন। এখন হাঁটতে পারেন।");
return;
}
const v=nearestVehicle();
if(!v){showToast("কাছে কোনো rickshaw নাই।");return;}
v.occupied=true;state.vehicle=v;
btnVehicle.textContent="নামুন";
showToast("Rickshaw-এ উঠলেন! Joystick দিয়ে চালান, হর্ন বাজান।");
}

function horn(){
if(!state.vehicle){showToast("আগে একটা rickshaw-এ উঠুন।");return;}
showToast("পিপ পিপ! সামনের গাড়িও একই কাজ করছে।");
}

function updatePlayer(dt){
if(state.interior)return;

if(state.vehicle){
const v=state.vehicle;
let throttle=-state.joystick.y,steer=state.joystick.x;
if(state.joystick.active){
v.speed+=throttle*22*dt;
}else{v.speed*=.94;}
v.speed=THREE.MathUtils.clamp(v.speed,-12,26);
v.mesh.rotation.y+=steer*dt*(1.4-Math.abs(v.speed)*.015);
const dir=new THREE.Vector3(Math.sin(v.mesh.rotation.y),0,Math.cos(v.mesh.rotation.y));
v.mesh.position.addScaledVector(dir,v.speed*dt);
v.mesh.position.x=THREE.MathUtils.clamp(v.mesh.position.x,-112,112);
v.mesh.position.z=THREE.MathUtils.clamp(v.mesh.position.z,-112,112);
player.position.copy(v.mesh.position);
player.position.y=.1;
return;
}

const forward=new THREE.Vector3();
const right=new THREE.Vector3();
forward.set(Math.sin(state.yaw),0,Math.cos(state.yaw));
right.crossVectors(new THREE.Vector3(0,1,0),forward).normalize();

const move=new THREE.Vector3();
if(state.joystick.active){
move.addScaledVector(forward,-state.joystick.y);
move.addScaledVector(right,state.joystick.x);
}

const targetSpeed=state.running?15:7.5;
if(move.lengthSq()>0){
move.normalize().multiplyScalar(targetSpeed);
state.velocity.lerp(move,.18);
const target=Math.atan2(state.velocity.x,state.velocity.z);
player.rotation.y+=(target-player.rotation.y)*.18;
}else state.velocity.multiplyScalar(.85);

player.position.addScaledVector(state.velocity,dt);
player.position.x=THREE.MathUtils.clamp(player.position.x,-112,112);
player.position.z=THREE.MathUtils.clamp(player.position.z,-112,112);

for(const b of buildings){
const dx=player.position.x-b.position.x,dz=player.position.z-b.position.z;
if(Math.abs(dx)<5.5&&Math.abs(dz)<5.5){
player.position.x+=dx>0?.3:-.3;
player.position.z+=dz>0?.3:-.3;
}
}

if(state.punchCooldown>0)state.punchCooldown-=dt;
}

function updateCamera(){
const target=state.vehicle?state.vehicle.mesh.position:player.position;
const distance=state.vehicle?15:11;
const height=state.vehicle?8:6.5;
const offset=new THREE.Vector3(0,height,-distance)
.applyAxisAngle(new THREE.Vector3(0,1,0),state.yaw);
camera.position.lerp(target.clone().add(offset),.14);
camera.lookAt(target.x,target.y+1.7,target.z);
}

let missionComplete=false;
function updateMission(){
if(player.position.distanceTo(missionTarget.position)<4.5&&!missionComplete){
missionComplete=true;state.money+=1000;state.wanted=0;
missionEl.textContent="Mission Complete: Cha Khoroch Recovery";
showToast("Mission complete! ৳1000 পেলেন—এখন অন্তত ভালো চা খেতে পারবেন।");
updateHUD();
setTimeout(()=>{
missionTarget.position.set((Math.random()-.5)*150,1.6,(Math.random()-.5)*150);
missionComplete=false;missionEl.textContent="New Mission: Biryani Delivery Chaos";
showToast("নতুন mission: Biryani Delivery Chaos!");
},4000);
}
}

function updateMinimap(){
const s=104/worldSize;
const target=state.vehicle?state.vehicle.mesh.position:player.position;
playerDot.style.left=`${(target.x+worldSize/2)*s}px`;
playerDot.style.top=`${104-(target.z+worldSize/2)*s}px`;
missionDot.style.left=`${(missionTarget.position.x+worldSize/2)*s}px`;
missionDot.style.top=`${104-(missionTarget.position.z+worldSize/2)*s}px`;
}

function updateInteractions(){
state.nearEnterable=null;
state.nearNPC=null;

for(const s of shops){
if(player.position.distanceTo(s.mesh.position)<5){state.nearEnterable=s;break;}
}

if(!state.nearEnterable){
for(const b of enterableBuildings){
if(player.position.distanceTo(b.door.position)<5){state.nearEnterable=b;break;}
}
}

for(const n of npcs){
if(!n.alive)continue;
if(player.position.distanceTo(n.mesh.position)<4.2){state.nearNPC=n;n.mesh.lookAt(player.position);}
}
}

const clock=new THREE.Clock();
function loop(){
const dt=Math.min(clock.getDelta(),.05);
updatePlayer(dt);updateCamera();updateInteractions();updateMission();updateMinimap();
renderer.renderAsync(scene,camera);
}
renderer.setAnimationLoop(loop);
updateHUD();
showToast("Dhaka Rush V3! ডান পাশে আঙুল টেনে camera ঘোরান, rickshaw-এ উঠুন।");