/* FEXO HUB - Firebase connected website */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const db=firebase.firestore(),storage=firebase.storage(),auth=firebase.auth();
const siteRef=db.collection("site").doc("main");
let site={content:{...DEFAULT_CONTENT},topics:[],music:[]};
let products=[],orders=[],editingProduct=null,selectedFiles=[],currentProduct=null;

const toast=m=>{const t=$("#toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2800)};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const openModal=s=>$(s).classList.add("open");
const closeModal=el=>el.classList.remove("open");
$$(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m||e.target.dataset.close!==undefined)closeModal(m)}));
document.addEventListener("keydown",e=>{if(e.key==="Escape")$$(".modal.open").forEach(closeModal)});
const isAdmin=()=>!!auth.currentUser&&auth.currentUser.email===ADMIN_EMAIL;
const saveSite=async part=>{try{await siteRef.set(part,{merge:true})}catch(e){toast("Save failed: "+e.message);throw e}};
const run=fn=>async(...a)=>{try{await fn(...a)}catch(e){console.error(e);toast(e.message||"Something went wrong")}};

/* ---------- Live data ---------- */
function initSite(){
  siteRef.onSnapshot(doc=>{
    const d=doc.exists?doc.data():{};
    site={content:{...DEFAULT_CONTENT,...(d.content||{})},topics:d.topics||[],music:d.music||[]};
    renderAll();if(isAdmin()&&!formBusy())renderAdmin();
  },e=>console.error(e));
  db.collection("products").onSnapshot(s=>{
    products=s.docs.map(d=>({id:d.id,...d.data(),images:d.data().images||[]}));
    renderAll();if(isAdmin())renderProductsAdmin();
  },e=>console.error(e));
}
function listenOrders(){
  if(!isAdmin())return;
  db.collection("orders").onSnapshot(s=>{orders=s.docs.map(d=>({id:d.id,...d.data()}));renderOrders()},e=>console.error(e));
}
const formBusy=()=>["contentForm","topicForm","productForm","musicForm"].some(id=>$("#"+id).contains(document.activeElement));

/* ---------- Public rendering ---------- */
const allPages=()=>site.topics.flatMap(t=>(t.pages||[]).map(p=>({...p,topicId:t.id,topicName:t.name})));
function renderAll(){
  $("#year").textContent=new Date().getFullYear();$("#footerBrand").textContent=site.content.siteName;
  document.title=site.content.siteName;
  $("#heroEyebrow").textContent=site.content.eyebrow;$("#heroTitle").textContent=site.content.title;$("#heroText").textContent=site.content.text;
  $("#sponsorTitle").textContent=site.content.sponsorTitle;$("#sponsorText").textContent=site.content.sponsorText;$("#sponsorLink").href=site.content.sponsorLink||"#";
  renderNav();renderTopics();if(!$("#searchInput").value)renderProducts();renderMusic();renderUser();
}
function renderNav(){
  const nav=$("#mainNav");nav.innerHTML=`<a href="#home">Home</a><a href="#topics">Collections</a><a href="#products">Products</a><a href="#music">Music</a><a href="#sponsor">Sponsor</a>`;
  allPages().forEach(p=>{const a=document.createElement("a");a.textContent=`${p.topicName} / ${p.name}`;a.onclick=()=>filterProducts(p.topicId,p.id);nav.appendChild(a)});
}
function renderTopics(){
  $("#topicsGrid").innerHTML=site.topics.map(t=>`<article class="card" data-topic="${t.id}"><h3>${esc(t.name)}</h3><p>${(t.pages||[]).map(p=>esc(p.name)).join(" &bull; ")||"No pages"}</p><div class="count">${products.filter(p=>p.topicId===t.id).length} products</div></article>`).join("")||`<p class="empty">No collections yet.</p>`;
  $$("#topicsGrid .card").forEach(c=>c.onclick=()=>filterProducts(c.dataset.topic,"all"));
}
function productCard(p){
  const offer=p.offerEnds&&new Date(p.offerEnds)>new Date();
  return `<article class="product" data-id="${p.id}"><img class="thumb" src="${esc(p.images[0]||"https://placehold.co/600x600/0a1020/00e5ff?text=FEXO+HUB")}" loading="lazy" alt=""><div class="product-body"><h4>${esc(p.name)}</h4><div><span class="price">&#2547;${Number(p.price).toFixed(2)}</span>${p.oldPrice?`<span class="old-price">&#2547;${Number(p.oldPrice).toFixed(2)}</span>`:""}</div>${offer?`<div class="offer" data-countdown="${p.offerEnds}">Offer ending</div>`:""}</div></article>`;
}
let timers=[];
function renderProducts(list){
  list=list||[...products].sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  $("#productsGrid").innerHTML=list.map(productCard).join("");
  $("#emptyState").classList.toggle("hidden",list.length>0);
  if(!$("#searchInput").value&&$("#productsTitle").textContent==="All products")$("#productsSubtitle").textContent=`${list.length} products available`;
  $$("#productsGrid .product").forEach(el=>el.onclick=()=>showProduct(el.dataset.id));
  startCountdowns();
}
function filterProducts(topicId,pageId){
  $("#searchInput").value="";
  let list=products.filter(p=>p.topicId===topicId);if(pageId&&pageId!=="all")list=list.filter(p=>p.pageId===pageId);
  const t=site.topics.find(x=>x.id===topicId),p=t?.pages.find(x=>x.id===pageId);
  $("#productsTitle").textContent=p?`${t.name} - ${p.name}`:t?t.name:"All products";
  $("#productsSubtitle").textContent=`${list.length} products available`;renderProducts(list);
  document.getElementById("products").scrollIntoView({behavior:"smooth"});
}
function showProduct(id){
  const p=products.find(x=>x.id===id);if(!p)return;currentProduct=p;
  $("#productName").textContent=p.name;$("#productPrice").textContent=`\u09f3${Number(p.price).toFixed(2)}`;
  $("#productOldPrice").textContent=p.oldPrice?`\u09f3${Number(p.oldPrice).toFixed(2)}`:"";
  $("#productDetails").textContent=p.details||"No additional details provided.";
  $("#productImages").innerHTML=p.images.length?p.images.map(i=>`<img src="${esc(i)}" alt="">`).join(""):`<img src="https://placehold.co/800x600/0a1020/00e5ff?text=FEXO+HUB" alt="">`;
  const offer=p.offerEnds&&new Date(p.offerEnds)>new Date();
  $("#productOffer").classList.toggle("hidden",!offer);
  if(offer)$("#productOffer").textContent=`Special price ends: ${new Date(p.offerEnds).toLocaleString()}`;
  openModal("#productModal");
}
function startCountdowns(){
  timers.forEach(clearInterval);timers=[];
  $$("[data-countdown]").forEach(el=>{const end=new Date(el.dataset.countdown);
    const tick=()=>{const left=end-Date.now();if(left<=0){el.textContent="Offer ended";return}
    const d=Math.floor(left/864e5),h=Math.floor(left/36e5)%24,m=Math.floor(left/6e4)%60,s=Math.floor(left/1e3)%60;
    el.textContent=`Ends in ${d}d ${h}h ${m}m ${s}s`};tick();timers.push(setInterval(tick,1000))});
}
function renderMusic(){
  $("#musicList").innerHTML=site.music.map(m=>`<div class="music-item"><div><strong>${esc(m.name)}</strong><small>Song</small></div><button class="btn btn-ghost" data-play="${esc(m.url)}">Play / Pause</button></div>`).join("")||`<p class="empty">No music yet.</p>`;
  $$("[data-play]").forEach(b=>b.onclick=()=>{const a=$("#siteMusic");if(a.getAttribute("src")!==b.dataset.play){a.src=b.dataset.play;a.play()}else a.paused?a.play():a.pause()});
}

/* ---------- Auth ---------- */
$("#accountBtn").onclick=()=>openModal("#accountModal");
$("#googleSignIn").onclick=run(async()=>{await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());closeModal($("#accountModal"));toast("Signed in with Google")});
$("#signOutBtn").onclick=run(async()=>{await auth.signOut();toast("Signed out")});
function renderUser(){const u=auth.currentUser;$("#userArea").classList.toggle("hidden",!u);$("#googleArea").classList.toggle("hidden",!!u);if(u)$("#userEmail").textContent=u.email;$("#accountBtn").textContent=u?"Account":"Sign in"}
auth.onAuthStateChanged(()=>{renderUser();listenOrders();listenMyOrders();});

/* ---------- Orders ---------- */
$("#orderBtn").onclick=()=>{
  if(!auth.currentUser){closeModal($("#productModal"));openModal("#accountModal");toast("Please sign in with Google to order");return}
  $("#orderProduct").textContent=`${currentProduct.name} - \u09f3${Number(currentProduct.price).toFixed(2)}`;closeModal($("#productModal"));openModal("#orderModal");
};
$("#orderForm").onsubmit=run(async e=>{
  e.preventDefault();const f=new FormData(e.target);
  await db.collection("orders").add({productId:currentProduct.id,productName:currentProduct.name,price:currentProduct.price,quantity:+f.get("quantity"),
  customer:auth.currentUser.email,name:f.get("name"),phone:f.get("phone"),address:f.get("address"),date:new Date().toISOString()});
  e.target.reset();closeModal($("#orderModal"));toast("Order placed successfully");
});

/* ---------- Admin ---------- */
$("#adminBtn").onclick=()=>isAdmin()?openAdmin():openModal("#adminLogin");
$("#adminLoginForm").onsubmit=run(async e=>{
  e.preventDefault();const f=new FormData(e.target);
  const cred=await auth.signInWithEmailAndPassword(f.get("email"),f.get("password"));
  if(cred.user.email!==ADMIN_EMAIL){await auth.signOut();toast("This account is not an admin");return}
  closeModal($("#adminLogin"));openAdmin();
});
$("#adminClose").onclick=run(async()=>{$("#adminPanel").classList.add("hidden");await auth.signOut()});
function openAdmin(){$("#adminPanel").classList.remove("hidden");renderAdmin();listenOrders()}
$$(".admin-tab").forEach(b=>b.onclick=()=>{$$(".admin-tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");
$$(".admin-view").forEach(v=>v.classList.add("hidden"));$("#tab-"+b.dataset.tab).classList.remove("hidden")});
function renderAdmin(){
  const c=$("#contentForm").elements;c.siteName.value=site.content.siteName||"";c.heroEyebrow.value=site.content.eyebrow||"";c.heroTitle.value=site.content.title||"";
  c.heroText.value=site.content.text||"";c.sponsorTitle.value=site.content.sponsorTitle||"";c.sponsorText.value=site.content.sponsorText||"";c.sponsorLink.value=site.content.sponsorLink||"";
  renderTopicsAdmin();refreshTopicSelect();renderProductsAdmin();renderMusicAdmin();renderOrders();
}
function renderTopicsAdmin(){
  $("#topicsAdmin").innerHTML=site.topics.map(t=>`<div class="admin-item"><div><strong>${esc(t.name)}</strong><br><small>${(t.pages||[]).map(p=>esc(p.name)).join(" &bull; ")||"No pages"}</small></div><div class="admin-actions"><button data-add-page="${t.id}">Add page</button><button data-ren-topic="${t.id}">Rename</button><button data-del-topic="${t.id}" class="danger">Delete</button></div></div>`).join("")||`<p class="empty">Create your first topic and page.</p>`;
  $$("[data-add-page]").forEach(b=>b.onclick=run(async()=>{const n=prompt("New page name");if(!n)return;
    await saveSite({topics:site.topics.map(t=>t.id===b.dataset.addPage?{...t,pages:[...(t.pages||[]),{id:crypto.randomUUID(),name:n}]}:t)});toast("Page added")}));
  $$("[data-ren-topic]").forEach(b=>b.onclick=run(async()=>{const t=site.topics.find(x=>x.id===b.dataset.renTopic);const n=prompt("Topic name",t.name);if(!n)return;
    await saveSite({topics:site.topics.map(x=>x.id===t.id?{...x,name:n}:x)});toast("Topic renamed")}));
  $$("[data-del-topic]").forEach(b=>b.onclick=run(async()=>{if(!confirm("Delete this topic, its pages and its products?"))return;
    const id=b.dataset.delTopic;await saveSite({topics:site.topics.filter(t=>t.id!==id)});
    for(const p of products.filter(p=>p.topicId===id))await db.collection("products").doc(p.id).delete();toast("Topic deleted")}));
}
function refreshTopicSelect(){
  const ts=$("#productTopic"),cur=ts.value;ts.innerHTML=site.topics.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join("");
  if(cur&&site.topics.some(t=>t.id===cur))ts.value=cur;updatePageOptions();
}
function updatePageOptions(){const t=$("#productTopic").value||site.topics[0]?.id;const topic=site.topics.find(x=>x.id===t);const cur=$("#productPage").value;
$("#productPage").innerHTML=(topic?.pages||[]).map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("");if(cur)$("#productPage").value=cur}
$("#productTopic").onchange=()=>{$("#productPage").value="";updatePageOptions()};
$("#topicForm").onsubmit=run(async e=>{
  e.preventDefault();const f=new FormData(e.target);const topics=site.topics.map(t=>({...t,pages:[...(t.pages||[])]}));
  let topic=topics.find(t=>t.name.toLowerCase()===f.get("name").trim().toLowerCase());
  if(!topic){topic={id:crypto.randomUUID(),name:f.get("name").trim(),pages:[]};topics.push(topic)}
  topic.pages.push({id:crypto.randomUUID(),name:f.get("page").trim()});
  await saveSite({topics});e.target.reset();toast("Page created");
});
$("#contentForm").onsubmit=run(async e=>{
  e.preventDefault();const f=new FormData(e.target);
  await saveSite({content:{siteName:f.get("siteName"),eyebrow:f.get("heroEyebrow"),title:f.get("heroTitle"),text:f.get("heroText"),sponsorTitle:f.get("sponsorTitle"),sponsorText:f.get("sponsorText"),sponsorLink:f.get("sponsorLink")}});
  toast("Website content updated");
});
$("#productImagesInput").onchange=e=>{selectedFiles=[...e.target.files];$("#imagePreview").innerHTML="";selectedFiles.forEach(f=>{$("#imagePreview").insertAdjacentHTML("beforeend",`<img src="${URL.createObjectURL(f)}" alt="">`)})};
const resetProductForm=()=>{editingProduct=null;selectedFiles=[];$("#imagePreview").innerHTML="";$("#cancelProduct").classList.add("hidden");$("#productForm").reset();refreshTopicSelect()};
$("#productForm").onsubmit=run(async e=>{
  e.preventDefault();if(!isAdmin())return toast("Admin access required");
  if(!site.topics.length)return toast("Create a topic and page first");
  const f=new FormData(e.target);const id=editingProduct||crypto.randomUUID();const btn=e.target.querySelector("button.btn-neon");btn.disabled=true;
  try{
    const urls=[];let n=0;
    for(const file of selectedFiles){n++;toast(`Uploading image ${n}/${selectedFiles.length}...`);const ref=storage.ref(`products/${id}/${Date.now()}-${file.name}`);await ref.put(file);urls.push(await ref.getDownloadURL())}
    const old=editingProduct?products.find(p=>p.id===editingProduct):null;
    const product={name:f.get("pname"),price:+f.get("price"),oldPrice:f.get("oldPrice")?+f.get("oldPrice"):null,offerEnds:f.get("offerEnds")||null,
    details:f.get("details"),topicId:f.get("topic"),pageId:f.get("page"),images:[...(old?.images||[]),...urls],createdAt:old?.createdAt||Date.now()};
    await db.collection("products").doc(id).set(product);resetProductForm();toast("Product saved");
  }finally{btn.disabled=false}
});
$("#cancelProduct").onclick=resetProductForm;
function renderProductsAdmin(){
  const q=$("#productSearchAdmin").value.toLowerCase();
  $("#productsAdmin").innerHTML=products.filter(p=>p.name.toLowerCase().includes(q)).map(p=>`<div class="admin-item"><div><strong>${esc(p.name)}</strong><br><small>&#2547;${p.price} &bull; ${p.images.length} images</small></div><div class="admin-actions"><button data-edit="${p.id}">Edit</button>${p.images.length?`<button data-clear-img="${p.id}">Clear images</button>`:""}<button data-del="${p.id}" class="danger">Delete</button></div></div>`).join("")||`<p class="empty">No products.</p>`;
  $$("[data-edit]").forEach(b=>b.onclick=()=>{const p=products.find(x=>x.id===b.dataset.edit);editingProduct=p.id;const f=$("#productForm").elements;
  f.pname.value=p.name;f.price.value=p.price;f.oldPrice.value=p.oldPrice||"";f.offerEnds.value=p.offerEnds||"";f.details.value=p.details||"";
  f.topic.value=p.topicId;updatePageOptions();f.page.value=p.pageId;selectedFiles=[];$("#imagePreview").innerHTML=p.images.map(i=>`<img src="${esc(i)}" alt="">`).join("");
  $("#cancelProduct").classList.remove("hidden");toast("Editing: new images will be added to existing ones");$("#productForm").scrollIntoView({behavior:"smooth"})});
  $$("[data-clear-img]").forEach(b=>b.onclick=run(async()=>{if(!confirm("Remove all images from this product?"))return;
    const p=products.find(x=>x.id===b.dataset.clearImg);for(const u of p.images){try{await storage.refFromURL(u).delete()}catch(e){}}
    await db.collection("products").doc(p.id).update({images:[]});toast("Images removed")}));
  $$("[data-del]").forEach(b=>b.onclick=run(async()=>{if(!confirm("Delete this product?"))return;const p=products.find(x=>x.id===b.dataset.del);
    for(const u of p.images){try{await storage.refFromURL(u).delete()}catch(e){}}
    await db.collection("products").doc(p.id).delete();toast("Product deleted")}));
}
$("#productSearchAdmin").oninput=renderProductsAdmin;

/* ---------- Unlimited music ---------- */
$("#musicForm").onsubmit=run(async e=>{
  e.preventDefault();if(!isAdmin())return toast("Admin access required");
  const f=new FormData(e.target);const file=f.get("song"),name=f.get("sname");const btn=e.target.querySelector("button");btn.disabled=true;
  try{toast("Uploading song...");const id=crypto.randomUUID();const ref=storage.ref(`music/${id}-${file.name}`);await ref.put(file);
  const url=await ref.getDownloadURL();await saveSite({music:[...site.music,{id,name,url}]});e.target.reset();toast("Song uploaded")}finally{btn.disabled=false}
});
function renderMusicAdmin(){
  $("#musicAdmin").innerHTML=site.music.map(m=>`<div class="admin-item"><div><strong>${esc(m.name)}</strong></div><div class="admin-actions"><button data-rename="${m.id}">Edit name</button><button data-del-music="${m.id}" class="danger">Delete</button></div></div>`).join("")||`<p class="empty">No songs yet.</p>`;
  $$("[data-rename]").forEach(b=>b.onclick=run(async()=>{const m=site.music.find(x=>x.id===b.dataset.rename);const name=prompt("New song name",m.name);if(!name)return;
    await saveSite({music:site.music.map(x=>x.id===m.id?{...x,name}:x)});toast("Song updated")}));
  $$("[data-del-music]").forEach(b=>b.onclick=run(async()=>{if(!confirm("Delete this song?"))return;const m=site.music.find(x=>x.id===b.dataset.delMusic);
    try{await storage.refFromURL(m.url).delete()}catch(e){}await saveSite({music:site.music.filter(x=>x.id!==m.id)});toast("Song deleted")}));
}
function renderOrders(){
  const list=[...orders].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  $("#ordersAdmin").innerHTML=list.map(o=>`<div class="admin-item"><div><strong>${esc(o.productName)}</strong> x ${o.quantity}<br><small>${esc(o.name)} &bull; ${esc(o.phone)} &bull; ${esc(o.customer)}</small><br><small>${esc(o.address)}</small></div><div class="admin-actions"><button data-del-order="${o.id}" class="danger">Delete</button></div></div>`).join("")||`<p class="empty">No orders yet.</p>`;
  $$("[data-del-order]").forEach(b=>b.onclick=run(async()=>{await db.collection("orders").doc(b.dataset.delOrder).delete();toast("Order deleted")}));
}
$("#exportData").onclick=()=>{const blob=new Blob([JSON.stringify({site,products,orders},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="fexo-hub-backup.json";a.click()};

/* ---------- Search ---------- */
$("#searchInput").oninput=e=>{
  const q=e.target.value.toLowerCase().trim();
  if(!q){$("#productsTitle").textContent="All products";renderProducts();return}
  const list=products.filter(p=>p.name.toLowerCase().includes(q));
  $("#productsTitle").textContent=`Search: ${e.target.value}`;$("#productsSubtitle").textContent=`${list.length} results`;renderProducts(list);
  document.getElementById("products").scrollIntoView({behavior:"smooth"});
};
$("#searchBtn").onclick=()=>$("#searchInput").dispatchEvent(new Event("input"));
renderAll();initSite();


/* Customer orders */
let myOrders=[];
function listenMyOrders(){
  if(!auth.currentUser){myOrders=[];renderMyOrders();return}
  db.collection("orders").where("customer","==",auth.currentUser.email)
    .onSnapshot(s=>{myOrders=s.docs.map(d=>({id:d.id,...d.data()}));renderMyOrders()},e=>console.error(e));
}
function renderMyOrders(){
  const el=$("#myOrdersList");if(!el)return;
  el.innerHTML=myOrders.map(o=>`<div class="admin-item"><div><strong>${esc(o.productName)}</strong> x ${o.quantity}<br><small>Status: pending &bull; ${new Date(o.date).toLocaleString()}</small></div><div class="admin-actions"><span class="tiny">Support: 01570267525</span></div></div>`).join("")||`<p class="empty">No orders yet. Sign in and place an order.</p>`;
}
