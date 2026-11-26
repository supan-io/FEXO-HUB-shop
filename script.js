/* FEXO HUB — customer storefront + no-code admin dashboard */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEY="fexo_hub_data_v1", SESSION="fexo_admin", USER="fexo_user";
let data=load(), editingProduct=null, selectedImages=[], currentProduct=null;

function load(){
  try{const d=JSON.parse(localStorage.getItem(KEY));if(d&&d.topics)return d;}catch(e){}
  return {content:{...window.FEXO_CONFIG.hero,siteName:window.FEXO_CONFIG.siteName,...window.FEXO_CONFIG.sponsor},
  topics:[],products:[],orders:[],music:""};
}
function save(){localStorage.setItem(KEY,JSON.stringify(data));}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2400);}
function openModal(id){$(id).classList.add("open");$(id).setAttribute("aria-hidden","false");}
function closeModal(el){el.classList.remove("open");el.setAttribute("aria-hidden","true");}
$$(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m||e.target.dataset.close!==undefined)closeModal(m);}));
document.addEventListener("keydown",e=>{if(e.key==="Escape")$$(".modal.open").forEach(closeModal);});

/* ---------- Public rendering ---------- */
function topicPages(){return data.topics.flatMap(t=>t.pages.map(p=>({...p,topicId:t.id,topicName:t.name})));}
function renderNav(){
  const nav=$("#mainNav");nav.innerHTML=`<a href="#home" class="active">Home</a><a href="#topics">Collections</a><a href="#products">Products</a><a href="#sponsor">Sponsor</a>`;
  topicPages().forEach(p=>{const a=document.createElement("a");a.href="#products";a.textContent=`${p.topicName} / ${p.name}`;a.dataset.page=p.id;nav.appendChild(a);});
}
function renderTopics(){
  $("#topicsGrid").innerHTML=data.topics.map(t=>`
   <article class="card reveal" data-topic="${t.id}">
     <h3>${esc(t.name)}</h3><p>${t.pages.length} page${t.pages.length!==1?"s":""}</p>
     <div class="count">${data.products.filter(p=>p.topicId===t.id).length} products</div>
   </article>`).join("")||`<p class="empty">No topics yet. Admin can create them.</p>`;
  $$("#topicsGrid .card").forEach(c=>c.onclick=()=>filterProducts(c.dataset.topic,"all"));
}
function productCard(p){
  const offer=p.offerEnds&&new Date(p.offerEnds)>new Date();
  return `<article class="product reveal" data-id="${p.id}">
   <img class="thumb" src="${p.images[0]||"https://placehold.co/600x600/0a1020/00e5ff?text=FEXO+HUB"}" alt="${esc(p.name)}" loading="lazy">
   <div class="product-body"><h4>${esc(p.name)}</h4>
   <div><span class="price">৳${Number(p.price).toFixed(2)}</span>${p.oldPrice?`<span class="old-price">৳${Number(p.oldPrice).toFixed(2)}</span>`:""}</div>
   ${offer?`<div class="offer" data-countdown="${p.offerEnds}">Offer ending</div>`:""}
   </div></article>`;
}
function renderProducts(list=data.products){
  $("#productsGrid").innerHTML=list.map(productCard).join("");
  $("#emptyState").classList.toggle("hidden",list.length>0);
  $$("#productsGrid .product").forEach(el=>el.onclick=()=>showProduct(el.dataset.id));
  startCountdowns();
}
function filterProducts(topicId,pageId){
  let list=data.products;
  if(topicId!=="all")list=list.filter(p=>p.topicId===topicId);
  if(pageId&&pageId!=="all")list=list.filter(p=>p.pageId===pageId);
  const topic=data.topics.find(t=>t.id===topicId),page=topic?.pages.find(p=>p.id===pageId);
  $("#productsTitle").textContent=page?`${topic.name} — ${page.name}`:topic?topic.name:"All products";
  $("#productsSubtitle").textContent=`${list.length} product${list.length!==1?"s":""} available`;
  renderProducts(list);document.getElementById("products").scrollIntoView({behavior:"smooth"});
}
function showProduct(id){
  const p=data.products.find(x=>x.id===id);if(!p)return;currentProduct=p;
  $("#productName").textContent=p.name;$("#productPrice").textContent=`৳${Number(p.price).toFixed(2)}`;
  $("#productOldPrice").textContent=p.oldPrice?`৳${Number(p.oldPrice).toFixed(2)}`:"";
  $("#productDetails").textContent=p.details||"No additional details provided.";
  $("#productImages").innerHTML=p.images.length?p.images.map(src=>`<img src="${src}" alt="">`).join(""):`<img src="https://placehold.co/800x600/0a1020/00e5ff?text=FEXO+HUB">`;
  const offer=p.offerEnds&&new Date(p.offerEnds)>new Date();
  $("#productOffer").classList.toggle("hidden",!offer);
  if(offer)$("#productOffer").textContent=`Special price ends: ${new Date(p.offerEnds).toLocaleString()}`;
  openModal("#productModal");
}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function startCountdowns(){
  $$("[data-countdown]").forEach(el=>{
    const end=new Date(el.dataset.countdown);
    const tick=()=>{const left=end-Date.now();
      if(left<=0){el.textContent="Offer ended";return;}
      const d=Math.floor(left/864e5),h=Math.floor(left/36e5)%24,m=Math.floor(left/6e4)%60,s=Math.floor(left/1e3)%60;
      el.textContent=`Ends in ${d}d ${h}h ${m}m ${s}s`;requestAnimationFrame(()=>{});};
    tick();setInterval(tick,1000);
  });
}

/* ---------- Google sign-in ---------- */
function initGoogle(){
  if(!window.FEXO_CONFIG.googleClientId){$("#googleMessage").textContent="Google sign-in is not configured yet. Add your Google OAuth Client ID in config.js.";return;}
  google.accounts.id.initialize({client_id:window.FEXO_CONFIG.googleClientId,callback:res=>{
    const email=res.credential?JSON.parse(atob(res.credential.split(".")[1])).email:"Google user";
    localStorage.setItem(USER,JSON.stringify({email}));renderUser();closeModal($("#accountModal"));toast("Signed in with Google");
  }});
  google.accounts.id.renderButton($("#googleButton"),{theme:"filled_black",size:"large",shape:"pill"});
}
function renderUser(){
  const u=JSON.parse(localStorage.getItem(USER)||"null");
  $("#userArea").classList.toggle("hidden",!u);$("#googleArea").classList.toggle("hidden",!!u);
  if(u)$("#userEmail").textContent=u.email;
  $("#accountBtn").textContent=u?"Account":"Sign in";
}
$("#accountBtn").onclick=()=>openModal("#accountModal");
$("#signOutBtn").onclick=()=>{localStorage.removeItem(USER);renderUser();toast("Signed out");};

/* ---------- Orders ---------- */
$("#orderBtn").onclick=()=>{
  const user=JSON.parse(localStorage.getItem(USER)||"null");
  if(!user){closeModal($("#productModal"));openModal("#accountModal");toast("Please sign in with Google to order");return;}
  $("#orderProduct").textContent=`${currentProduct.name} — ৳${Number(currentProduct.price).toFixed(2)}`;
  openModal("#orderModal");
};
$("#orderForm").onsubmit=e=>{
  e.preventDefault();const f=new FormData(e.target);
  data.orders.unshift({id:crypto.randomUUID(),productId:currentProduct.id,productName:currentProduct.name,price:currentProduct.price,
  customer:JSON.parse(localStorage.getItem(USER)).email,name:f.get("name"),phone:f.get("phone"),address:f.get("address"),quantity:+f.get("quantity"),date:new Date().toISOString()});
  save();e.target.reset();closeModal($("#orderModal"));toast("Order placed successfully");
};

/* ---------- Admin ---------- */
$("#adminBtn").onclick=$("#heroAdmin").onclick=()=>{
  if(sessionStorage.getItem(SESSION))openAdmin();else openModal("#adminLogin");
};
$("#adminLoginForm").onsubmit=e=>{
  e.preventDefault();
  if(new FormData(e.target).get("password")===window.FEXO_CONFIG.adminPassword){sessionStorage.setItem(SESSION,"1");closeModal($("#adminLogin"));openAdmin();}
  else toast("Incorrect admin password");
};
$("#adminClose").onclick=()=>{$("#adminPanel").classList.add("hidden");sessionStorage.removeItem(SESSION);renderAll();};
function openAdmin(){$("#adminPanel").classList.remove("hidden");renderAdmin();}
$$(".admin-tab").forEach(b=>b.onclick=()=>{
  $$(".admin-tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");
  $$(".admin-view").forEach(v=>v.classList.add("hidden"));$("#tab-"+b.dataset.tab).classList.remove("hidden");
});
function renderAdmin(){
  const c=$("#contentForm");c.siteName.value=data.content.siteName;c.heroEyebrow.value=data.content.eyebrow;c.heroTitle.value=data.content.title;c.heroText.value=data.content.text;c.sponsorTitle.value=data.content.sponsorTitle;c.sponsorText.value=data.content.sponsorText;c.sponsorLink.value=data.content.link;
  $("#topicsAdmin").innerHTML=data.topics.map(t=>`<div class="admin-item"><div><strong>${esc(t.name)}</strong><br><small>${t.pages.map(p=>esc(p.name)).join(" • ")||"No pages"}</small></div>
   <div class="admin-actions"><button data-del-topic="${t.id}" class="danger">Delete</button></div></div>`).join("")||`<p class="empty">Create your first topic and page.</p>`;
  $$("[data-del-topic]").forEach(b=>b.onclick=()=>{if(confirm("Delete this topic, its pages and products?")){const id=b.dataset.delTopic;data.topics=data.topics.filter(t=>t.id!==id);data.products=data.products.filter(p=>p.topicId!==id);save();renderAll();renderAdmin();}});
  const ts=$("#productTopic");ts.innerHTML=data.topics.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join("");
  updatePageOptions();renderProductsAdmin();renderOrders();renderMusic();
}
function updatePageOptions(){
  const t=$("#productTopic").value||data.topics[0]?.id;const topic=data.topics.find(x=>x.id===t);
  $("#productPage").innerHTML=(topic?.pages||[]).map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("");
}
$("#productTopic").onchange=updatePageOptions;
$("#topicForm").onsubmit=e=>{
  e.preventDefault();const f=new FormData(e.target);
  let topic=data.topics.find(t=>t.name.toLowerCase()===f.get("name").toLowerCase());
  if(!topic){topic={id:crypto.randomUUID(),name:f.get("name"),pages:[]};data.topics.push(topic);}
  topic.pages.push({id:crypto.randomUUID(),name:f.get("page")});save();e.target.reset();renderAll();renderAdmin();toast("Page created");
};
$("#productForm").onsubmit=async e=>{
  e.preventDefault();const f=new FormData(e.target);
  const images=selectedImages.length?selectedImages:[...f.getAll("images")].map(readFile);
  const product={id:editingProduct||crypto.randomUUID(),name:f.get("name"),price:+f.get("price"),oldPrice:f.get("oldPrice")?+f.get("oldPrice"):null,
  offerEnds:f.get("offerEnds")||null,details:f.get("details"),topicId:f.get("topic"),pageId:f.get("page"),images:await Promise.all(images)};
  if(editingProduct)data.products=data.products.map(p=>p.id===editingProduct?product:p);else data.products.push(product);
  editingProduct=null;selectedImages=[];$("#imagePreview").innerHTML="";$("#cancelProduct").classList.add("hidden");e.target.reset();
  save();renderAll();renderAdmin();toast("Product saved");
};
$("#cancelProduct").onclick=()=>{editingProduct=null;selectedImages=[];$("#imagePreview").innerHTML="";$("#cancelProduct").classList.add("hidden");$("#productForm").reset();};
function readFile(file){return new Promise(res=>{const r=new FileReader();r.onload=()=>res(r.result);r.readAsDataURL(file);});}
$("input[name=images]").onchange=async e=>{
  selectedImages=[...e.target.files].map(readFile);$("#imagePreview").innerHTML="";
  for(const f of e.target.files){const url=await readFile(f);$("#imagePreview").insertAdjacentHTML("beforeend",`<img src="${url}">`);}
};
function renderProductsAdmin(){
  const q=$("#productSearchAdmin").value.toLowerCase();
  $("#productsAdmin").innerHTML=data.products.filter(p=>p.name.toLowerCase().includes(q)).map(p=>`
   <div class="admin-item"><div><strong>${esc(p.name)}</strong><br><small>৳${p.price} • ${esc(data.topics.find(t=>t.id===p.topicId)?.name||"")}</small></div>
   <div class="admin-actions"><button data-edit="${p.id}">Edit</button><button data-del="${p.id}" class="danger">Delete</button></div></div>`).join("");
  $$("[data-edit]").forEach(b=>b.onclick=()=>{
    const p=data.products.find(x=>x.id===b.dataset.edit);editingProduct=p.id;const f=$("#productForm");
    f.name.value=p.name;f.price.value=p.price;f.oldPrice.value=p.oldPrice||"";f.offerEnds.value=p.offerEnds||"";f.details.value=p.details||"";
    f.topic.value=p.topicId;updatePageOptions();f.page.value=p.pageId;selectedImages=p.images;$("#imagePreview").innerHTML=p.images.map(i=>`<img src="${i}">`).join("");
    $("#cancelProduct").classList.remove("hidden");$("#tab-products").scrollIntoView({behavior:"smooth"});
  });
  $$("[data-del]").forEach(b=>b.onclick=()=>{if(confirm("Delete this product?")){data.products=data.products.filter(p=>p.id!==b.dataset.del);save();renderAll();renderAdmin();toast("Product deleted");}});
}
$("#productSearchAdmin").oninput=renderProductsAdmin;
$("#contentForm").onsubmit=e=>{
  e.preventDefault();const f=new FormData(e.target);
  Object.assign(data.content,{siteName:f.get("siteName"),eyebrow:f.get("heroEyebrow"),title:f.get("heroTitle"),text:f.get("heroText"),sponsorTitle:f.get("sponsorTitle"),sponsorText:f.get("sponsorText"),link:f.get("sponsorLink")});
  save();renderAll();toast("Website content updated");
};
function renderMusic(){
  const url=data.music||window.FEXO_CONFIG.music.url;const a=$("#siteMusic");
  if(url&&a.src!==url)a.src=url;
}
$("#musicForm").onsubmit=async e=>{
  e.preventDefault();const file=e.target.song.files[0];if(!file)return;
  data.music=await readFile(file);save();renderMusic();toast("Music uploaded");e.target.reset();
};
$("#musicUrlForm").onsubmit=e=>{e.preventDefault();data.music=new FormData(e.target).get("url");save();renderMusic();toast("Music URL saved");};
$("#removeMusic").onclick=()=>{data.music="";save();$("#siteMusic").removeAttribute("src");toast("Music removed");};
$("#musicBtn").onclick=()=>{const a=$("#siteMusic");if(!a.src){toast("No music uploaded yet");return;}a.paused?a.play():a.pause();$("#musicBtn").classList.toggle("active",!a.paused);};
function renderOrders(){
  $("#ordersAdmin").innerHTML=data.orders.map(o=>`<div class="admin-item"><div><strong>${esc(o.productName)}</strong> × ${o.quantity}<br><small>${esc(o.name)} • ${esc(o.phone)} • ${esc(o.customer)}</small><br><small>${esc(o.address)}</small></div>
  <div class="admin-actions"><button data-del-order="${o.id}" class="danger">Delete</button></div></div>`).join("")||`<p class="empty">No orders yet.</p>`;
  $$("[data-del-order]").forEach(b=>b.onclick=()=>{data.orders=data.orders.filter(o=>o.id!==b.dataset.delOrder);save();renderOrders();});
}
$("#exportData").onclick=()=>{
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);a.download="fexo-hub-backup.json";a.click();
};
$("#importData").onchange=e=>{const r=new FileReader();r.onload=()=>{try{data=JSON.parse(r.result);save();renderAll();renderAdmin();toast("Backup restored");}catch(x){toast("Invalid backup file");}};r.readAsText(e.target.files[0]);};
$("#resetData").onclick=()=>{if(confirm("Delete ALL website data? This cannot be undone.")){localStorage.removeItem(KEY);data=load();save();renderAll();renderAdmin();toast("All data reset");}};

/* ---------- Search & reveal ---------- */
$("#searchInput").oninput=e=>{
  const q=e.target.value.toLowerCase().trim();
  if(!q){renderProducts();$("#productsTitle").textContent="All products";$("#productsSubtitle").textContent="Showing all available items";return;}
  const list=data.products.filter(p=>p.name.toLowerCase().includes(q)||String(p.details||"").toLowerCase().includes(q));
  $("#productsTitle").textContent=`Search: “${e.target.value}”`;$("#productsSubtitle").textContent=`${list.length} result${list.length!==1?"s":""}`;
  renderProducts(list);document.getElementById("products").scrollIntoView({behavior:"smooth"});
};
$("#searchBtn").onclick=()=>$("#searchInput").dispatchEvent(new Event("input"));
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.style.animation="rise .6s cubic-bezier(.2,.8,.2,1) both";io.unobserve(e.target);}}),{threshold:.08});
function observeReveals(){$$(".reveal").forEach(el=>io.observe(el));}
function renderAll(){
  $("#year").textContent=new Date().getFullYear();
  $("#footerBrand").textContent=data.content.siteName;$("#heroEyebrow").textContent=data.content.eyebrow;
  $("#heroTitle").textContent=data.content.title;$("#heroText").textContent=data.content.text;
  $("#sponsorTitle").textContent=data.content.sponsorTitle;$("#sponsorText").textContent=data.content.sponsorText;$("#sponsorLink").href=data.content.link;
  renderNav();renderTopics();renderProducts();renderUser();observeReveals();
}
renderAll();
window.addEventListener("load",initGoogle);
