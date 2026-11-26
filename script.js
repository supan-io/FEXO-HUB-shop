/* FEXO HUB — Firebase connected website */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const db=firebase.firestore(),storage=firebase.storage(),auth=firebase.auth();
let site={content:{...DEFAULT_CONTENT},topics:[],music:[]};
let products=[],orders=[],editingProduct=null,selectedFiles=[],currentProduct=null;

const toast=m=>{const t=$("#toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2400)};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const openModal=s=>$(s).classList.add("open");
const closeModal=el=>el.classList.remove("open");
$$(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m||e.target.dataset.close!==undefined)closeModal(m)}));
document.addEventListener("keydown",e=>{if(e.key==="Escape")$$(".modal.open").forEach(closeModal)});

/* ---------- Firebase data ---------- */
async function initSite(){
  const ref=db.collection("site").doc("main");
  const snap=await ref.get();
  if(!snap.exists)await ref.set({content:DEFAULT_CONTENT,topics:[],music:[]});
  ref.onSnapshot(doc=>{site=doc.data()||site;renderAll();if(isAdmin())renderAdmin()});
  db.collection("products").onSnapshot(s=>{products=s.docs.map(d=>({id:d.id,...d.data()}));renderAll();if(isAdmin())renderAdmin()});
  db.collection("orders").onSnapshot(s=>{orders=s.docs.map(d=>({id:d.id,...d.data()}));if(isAdmin())renderOrders()});
}
const isAdmin=()=>auth.currentUser&&auth.currentUser.email===ADMIN_EMAIL;

/* ---------- Public rendering ---------- */
function renderAll(){
  $("#year").textContent=new Date().getFullYear();$("#footerBrand").textContent=site.content.siteName;
  $("#heroEyebrow").textContent=site.content.eyebrow;$("#heroTitle").textContent=site.content.title;$("#heroText").textContent=site.content.text;
  $("#sponsorTitle").textContent=site.content.sponsorTitle;$("#sponsorText").textContent=site.content.sponsorText;$("#sponsorLink").href=site.content.sponsorLink;
  renderNav();renderTopics();renderProducts();renderMusic();renderUser();
}
function renderNav(){
  const nav=$("#mainNav");nav.innerHTML=`<a href="#home">Home</a><a href="#topics">Collections</a><a href="#products">Products</a><a href="#music">Music</a><a href="#sponsor">Sponsor</a>`;
  allPages().forEach(p=>{const a=document.createElement("a");a.href="#products";a.textContent=`${p.topicName} / ${p.name}`;a.onclick=()=>filterProducts(p.topicId,p.id);nav.appendChild(a)});
}
const allPages=()=>site.topics.flatMap(t=>t.pages.map(p=>({...p,topicId:t.id,topicName:t.name})));
function renderTopics(){
  $("#topicsGrid").innerHTML=site.topics.map(t=>`<article class="card" data-topic="${t.id}"><h3>${esc(t.name)}</h3><p>${t.pages.length} pages</p><div class="count">${products.filter(p=>p.topicId===t.id).length} products</div></article>`).join("")||`<p class="empty">No topics yet.</p>`;
  $$("#topicsGrid .card").forEach(c=>c.onclick=()=>filterProducts(c.dataset.topic,"all"));
}
function productCard(p){
  const offer=p.offerEnds&&new Date(p.offerEnds)>new Date();
  return `<article class="product" data-id="${p.id}"><img class="thumb" src="${p.images[0]||"https://placehold.co/600x600/0a1020/00e5ff?text=FEXO+HUB"}" loading="lazy"><div class="product-body"><h4>${esc(p.name)}</h4><div><span class="price">৳${Number(p.price).toFixed(2)}</span>${p.oldPrice?`<span class="old-price">৳${Number(p.oldPrice).toFixed(2)}</span>`:""}</div>${offer?`<div class="offer" data-countdown="${p.offerEnds}">Offer ending</div>`:""}</div></article>`;
}
function renderProducts(list=products){
  $("#productsGrid").innerHTML=list.map(productCard).join("");
  $("#emptyState").classList.toggle("hidden",list.length>0);
  $$("#productsGrid .product").forEach(el=>el.onclick=()=>showProduct(el.dataset.id));
  startCountdowns();
}
function filterProducts(topicId,pageId){
  let list=products;if(topicId!=="all")list=list.filter(p=>p.topicId===topicId);if(pageId&&pageId!=="all")list=list.filter(p=>p.pageId===pageId);
  const t=site.topics.find(x=>x.id===topicId),p=t?.pages.find(x=>x.id===pageId);
  $("#productsTitle").textContent=p?`${t.name} — ${p.name}`:t?t.name:"All products";
  $("#productsSubtitle").textContent=`${list.length} products available`;renderProducts(list);
  document.getElementById("products").scrollIntoView({behavior:"smooth"});
}
function showProduct(id){
  const p=products.find(x=>x.id===id);if(!p)return;currentProduct=p;
  $("#productName").textContent=p.name;$("#productPrice").textContent=`৳${Number(p.price).toFixed(2)}`;
  $("#productOldPrice").textContent=p.oldPrice?`৳${Number(p.oldPrice).toFixed(2)}`:"";
  $("#productDetails").textContent=p.details||"No additional details provided.";
  $("#productImages").innerHTML=p.images.length?p.images.map(i=>`<img src="${i}">`).join(""):`<img src="https://placehold.co/800x600/0a1020/00e5ff?text=FEXO+HUB">`;
  const offer=p.offerEnds&&new Date(p.offerEnds)>new Date();
  $("#productOffer").classList.toggle("hidden",!offer);
  if(offer)$("#productOffer").textContent=`Special price ends: ${new Date(p.offerEnds).toLocaleString()}`;
  openModal("#productModal");
}
function startCountdowns(){
  $$("[data-countdown]").forEach(el=>{const end=new Date(el.dataset.countdown);
    const tick=()=>{const left=end-Date.now();if(left<=0){el.textContent="Offer ended";return}
    const d=Math.floor(left/864e5),h=Math.floor(left/36e5)%24,m=Math.floor(left/6e4)%60,s=Math.floor(left/1e3)%60;
    el.textContent=`Ends in ${d}d ${h}h ${m}m ${s}s`};tick();setInterval(tick,1000)});
}
function renderMusic(){
  $("#musicList").innerHTML=site.music.map(m=>`<div class="music-item"><div><strong>${esc(m.name)}</strong><small>Background music</small></div><button class="btn btn-ghost" data-play="${m.url}">Play</button></div>`).join("")||`<p class="empty">No music uploaded yet.</p>`;
  $$("[data-play]").forEach(b=>b.onclick=()=>{const a=$("#siteMusic");if(a.src!==b.dataset.play)a.src=b.dataset.play;a.paused?a.play():a.pause()});
}

/* ---------- Auth ---------- */
$("#accountBtn").onclick=()=>openModal("#accountModal");
$("#googleSignIn").onclick=async()=>{try{await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());closeModal($("#accountModal"));toast("Signed in with Google")}catch(e){toast(e.message)}};
$("#signOutBtn").onclick=async()=>{await auth.signOut();toast("Signed out")};
function renderUser(){const u=auth.currentUser;$("#userArea").classList.toggle("hidden",!u);$("#googleArea").classList.toggle("hidden",!!u);if(u)$("#userEmail").textContent=u.email;$("#accountBtn").textContent=u?"Account":"Sign in"}
auth.onAuthStateChanged(renderUser);

/* ---------- Orders ---------- */
$("#orderBtn").onclick=()=>{
  if(!auth.currentUser){closeModal($("#productModal"));openModal("#accountModal");toast("Please sign in with Google to order");return}
  $("#orderProduct").textContent=`${currentProduct.name} — ৳${Number(currentProduct.price).toFixed(2)}`;openModal("#orderModal");
};
$("#orderForm").onsubmit=async e=>{
  e.preventDefault();const f=new FormData(e.target);
  await db.collection("orders").add({productId:currentProduct.id,productName:currentProduct.name,price:currentProduct.price,quantity:+f.get("quantity"),
  customer:auth.currentUser.email,name:f.get("name"),phone:f.get("phone"),address:f.get("address"),date:new Date().toISOString()});
  e.target.reset();closeModal($("#orderModal"));toast("Order placed successfully");
};

/* ---------- Admin ---------- */
$("#adminBtn").onclick=$("#heroAdmin").onclick=()=>isAdmin()?openAdmin():openModal("#adminLogin");
$("#adminLoginForm").onsubmit=async e=>{
  e.preventDefault();const f=new FormData(e.target);
  try{const cred=await auth.signInWithEmailAndPassword(f.get("email"),f.get("password"));
  if(cred.user.email!==ADMIN_EMAIL){await auth.signOut();toast("This account is not an admin");return}
  closeModal($("#adminLogin"));openAdmin()}catch(err){toast(err.message)}
};
$("#adminClose").onclick=async()=>{$("#adminPanel").classList.add("hidden");await auth.signOut();renderAll()};
function openAdmin(){$("#adminPanel").classList.remove("hidden");renderAdmin()}
$$(".admin-tab").forEach(b=>b.onclick=()=>{$$(".admin-tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");
$$(".admin-view").forEach(v=>v.classList.add("hidden"));$("#tab-"+b.dataset.tab).classList.remove("hidden")});
function renderAdmin(){
  const c=$("#contentForm");c.siteName.value=site.content.siteName;c.heroEyebrow.value=site.content.eyebrow;c.heroTitle.value=site.content.title;
  c.heroText.value=site.content.text;c.sponsorTitle.value=site.content.sponsorTitle;c.sponsorText.value=site.content.sponsorText;c.sponsorLink.value=site.content.sponsorLink;
  $("#topicsAdmin").innerHTML=site.topics.map(t=>`<div class="admin-item"><div><strong>${esc(t.name)}</strong><br><small>${t.pages.map(p=>esc(p.name)).join(" • ")||"No pages"}</small></div><div class="admin-actions"><button data-del-topic="${t.id}" class="danger">Delete</button></div></div>`).join("");
  $$("[data-del-topic]").forEach(b=>b.onclick=async()=>{if(!confirm("Delete this topic, pages and products?"))return;
  const id=b.dataset.delTopic;const newTopics=site.topics.filter(t=>t.id!==id);
  await db.collection("site").doc("main").update({topics:newTopics});
  const old=products.filter(p=>p.topicId===id);for(const p of old)await db.collection("products").doc(p.id).delete()});
  const ts=$("#productTopic");ts.innerHTML=site.topics.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join("");updatePageOptions();
  renderProductsAdmin();renderMusicAdmin();renderOrders();
}
function updatePageOptions(){const t=$("#productTopic").value||site.topics[0]?.id;const topic=site.topics.find(x=>x.id===t);
$("#productPage").innerHTML=(topic?.pages||[]).map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("")}
$("#productTopic").onchange=updatePageOptions;
$("#topicForm").onsubmit=async e=>{
  e.preventDefault();const f=new FormData(e.target);
  let topics=[...site.topics];let topic=topics.find(t=>t.name.toLowerCase()===f.get("name").toLowerCase());
  if(!topic){topic={id:crypto.randomUUID(),name:f.get("name"),pages:[]};topics.push(topic)}
  topic.pages.push({id:crypto.randomUUID(),name:f.get("page")});
  await db.collection("site").doc("main").update({topics});e.target.reset();toast("Page created");
};
$("#contentForm").onsubmit=async e=>{
  e.preventDefault();const f=new FormData(e.target);
  await db.collection("site").doc("main").update({content:{siteName:f.get("siteName"),eyebrow:f.get("heroEyebrow"),title:f.get("heroTitle"),text:f.get("heroText"),sponsorTitle:f.get("sponsorTitle"),sponsorText:f.get("sponsorText"),sponsorLink:f.get("sponsorLink")}});
  toast("Website content updated");
};
const readFile=file=>new Promise(res=>{const r=new FileReader();r.onload=()=>res(r.result);r.readAsDataURL(file)});
$("#productImagesInput").onchange=e=>{selectedFiles=[...e.target.files];$("#imagePreview").innerHTML="";selectedFiles.forEach(f=>{const url=URL.createObjectURL(f);$("#imagePreview").insertAdjacentHTML("beforeend",`<img src="${url}">`)})};
$("#productForm").onsubmit=async e=>{
  e.preventDefault();if(!isAdmin())return toast("Admin access required");
  const f=new FormData(e.target);const id=editingProduct||crypto.randomUUID();
  const urls=[];
  for(const file of selectedFiles){const ref=storage.ref(`products/${id}/${crypto.randomUUID()}-${file.name}`);await ref.put(file);urls.push(await ref.getDownloadURL())}
  const existing=editingProduct?products.find(p=>p.id===editingProduct).images:[];
  const product={name:f.get("name"),price:+f.get("price"),oldPrice:f.get("oldPrice")?+f.get("oldPrice"):null,offerEnds:f.get("offerEnds")||null,
  details:f.get("details"),topicId:f.get("topic"),pageId:f.get("page"),images:[...existing,...urls]};
  if(editingProduct)await db.collection("products").doc(editingProduct).update(product);else await db.collection("products").doc(id).set(product);
  editingProduct=null;selectedFiles=[];$("#imagePreview").innerHTML="";$("#cancelProduct").classList.add("hidden");e.target.reset();toast("Product saved");
};
$("#cancelProduct").onclick=()=>{editingProduct=null;selectedFiles=[];$("#imagePreview").innerHTML="";$("#cancelProduct").classList.add("hidden");$("#productForm").reset()};
function renderProductsAdmin(){
  const q=$("#productSearchAdmin").value.toLowerCase();
  $("#productsAdmin").innerHTML=products.filter(p=>p.name.toLowerCase().includes(q)).map(p=>`<div class="admin-item"><div><strong>${esc(p.name)}</strong><br><small>৳${p.price} • ${p.images.length} images</small></div><div class="admin-actions"><button data-edit="${p.id}">Edit</button><button data-del="${p.id}" class="danger">Delete</button></div></div>`).join("");
  $$("[data-edit]").forEach(b=>b.onclick=()=>{const p=products.find(x=>x.id===b.dataset.edit);editingProduct=p.id;const f=$("#productForm");
  f.name.value=p.name;f.price.value=p.price;f.oldPrice.value=p.oldPrice||"";f.offerEnds.value=p.offerEnds||"";f.details.value=p.details||"";
  f.topic.value=p.topicId;updatePageOptions();f.page.value=p.pageId;$("#cancelProduct").classList.remove("hidden")});
  $$("[data-del]").forEach(b=>b.onclick=async()=>{if(confirm("Delete this product?")){await db.collection("products").doc(b.dataset.del).delete();toast("Product deleted")}});
}
$("#productSearchAdmin").oninput=renderProductsAdmin;

/* ---------- Unlimited music ---------- */
$("#musicForm").onsubmit=async e=>{
  e.preventDefault();if(!isAdmin())return toast("Admin access required");
  const f=new FormData(e.target);const file=f.get("song");const name=f.get("name");
  const id=crypto.randomUUID();const ref=storage.ref(`music/${id}-${file.name}`);await ref.put(file);
  const url=await ref.getDownloadURL();const music=[...site.music,{id,name,url}];
  await db.collection("site").doc("main").update({music});e.target.reset();toast("Song uploaded");
};
function renderMusicAdmin(){
  $("#musicAdmin").innerHTML=site.music.map(m=>`<div class="admin-item"><div><strong>${esc(m.name)}</strong><br><small>${esc(m.url)}</small></div>
  <div class="admin-actions"><button data-rename="${m.id}">Edit name</button><button data-del-music="${m.id}" class="danger">Delete</button></div></div>`).join("");
  $$("[data-rename]").forEach(b=>b.onclick=async()=>{const m=site.music.find(x=>x.id===b.dataset.rename);const name=prompt("New song name",m.name);if(!name)return;
  const music=site.music.map(x=>x.id===m.id?{...x,name}:x);await db.collection("site").doc("main").update({music});toast("Song name updated")});
  $$("[data-del-music]").forEach(b=>b.onclick=async()=>{if(!confirm("Delete this song?"))return;const m=site.music.find(x=>x.id===b.dataset.delMusic);
  try{await storage.refFromURL(m.url).delete()}catch(e){}const music=site.music.filter(x=>x.id!==m.id);await db.collection("site").doc("main").update({music});toast("Song deleted")});
}
function renderOrders(){
  $("#ordersAdmin").innerHTML=orders.map(o=>`<div class="admin-item"><div><strong>${esc(o.productName)}</strong> × ${o.quantity}<br><small>${esc(o.name)} • ${esc(o.phone)} • ${esc(o.customer)}</small><br><small>${esc(o.address)}</small></div><div class="admin-actions"><button data-del-order="${o.id}" class="danger">Delete</button></div></div>`).join("")||`<p class="empty">No orders yet.</p>`;
  $$("[data-del-order]").forEach(b=>b.onclick=async()=>{await db.collection("orders").doc(b.dataset.delOrder).delete();toast("Order deleted")});
}
$("#exportData").onclick=()=>{const blob=new Blob([JSON.stringify({site,products,orders},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="fexo-hub-backup.json";a.click()};

/* ---------- Search ---------- */
$("#searchInput").oninput=e=>{
  const q=e.target.value.toLowerCase().trim();if(!q){renderProducts();$("#productsTitle").textContent="All products";$("#productsSubtitle").textContent=`${products.length} products available`;return}
  const list=products.filter(p=>p.name.toLowerCase().includes(q)||String(p.details||"").toLowerCase().includes(q));
  $("#productsTitle").textContent=`Search: “${e.target.value}”`;$("#productsSubtitle").textContent=`${list.length} results`;renderProducts(list);
  document.getElementById("products").scrollIntoView({behavior:"smooth"});
};
$("#searchBtn").onclick=()=>$("#searchInput").dispatchEvent(new Event("input"));
renderAll();initSite();
