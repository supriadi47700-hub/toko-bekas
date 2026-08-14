(function(){
'use strict';

var DEFAULT_CONFIG={storeName:'Adi Store',tagline:'Barang bekas berkualitas',waNumber:'',password:'admin123',logo:''};
var CAT_EMOJI={elektronik:'📱',fashion:'👕',furniture:'🪑',buku:'📚',olahraga:'⚽',lainnya:'📦'};
var COND_COLOR={'seperti baru':'#00b894','sangat baik':'#0984e3','baik':'#6c5ce7','cukup':'#fdcb6e'};

var state={config:{},products:[],cart:[],isAdmin:false,currentFilter:'semua',currentSort:'terbaru',searchQuery:'',currentProduct:null};

function loadData(){
try{
var c=JSON.parse(localStorage.getItem('adi_config'));
var p=JSON.parse(localStorage.getItem('adi_products'));
var ct=JSON.parse(localStorage.getItem('adi_cart'));
state.config=c||JSON.parse(JSON.stringify(DEFAULT_CONFIG));
state.products=p||[];
state.cart=ct||[];
}catch(e){
state.config=JSON.parse(JSON.stringify(DEFAULT_CONFIG));
state.products=[];
state.cart=[];
}
}

function saveConfig(){localStorage.setItem('adi_config',JSON.stringify(state.config))}
function saveProducts(){localStorage.setItem('adi_products',JSON.stringify(state.products))}
function saveCart(){localStorage.setItem('adi_cart',JSON.stringify(state.cart))}

function formatPrice(n){return 'Rp '+Number(n).toLocaleString('id-ID')}
function formatDate(ts){
var d=new Date(ts);
var m=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
return d.getDate()+' '+m[d.getMonth()]+' '+d.getFullYear();
}
function genId(){return Date.now().toString(36)+Math.random().toString(36).substr(2,5)}
function escHtml(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML}

function showToast(msg){
var t=document.getElementById('toast');
if(!t)return;
t.textContent=msg;
t.classList.add('show');
setTimeout(function(){t.classList.remove('show')},2500);
}

function fileToBase64(file){
return new Promise(function(resolve,reject){
var r=new FileReader();
r.onload=function(){resolve(r.result)};
r.onerror=reject;
r.readAsDataURL(file);
});
}

function renderHeader(){
var c=state.config;
var sn=document.getElementById('storeName');
var st=document.getElementById('storeTagline');
if(sn)sn.textContent=c.storeName||DEFAULT_CONFIG.storeName;
if(st)st.textContent=c.tagline||DEFAULT_CONFIG.tagline;
document.title=(c.storeName||DEFAULT_CONFIG.storeName)+' - Toko Bekas Premium';
var li=document.getElementById('logoImg');
var le=document.getElementById('logoEmoji');
if(li&&le){
if(c.logo){li.src=c.logo;li.style.display='block';le.style.display='none'}
else{li.style.display='none';le.style.display='inline'}
}
}

function renderStats(){
var ti=document.getElementById('totalItems');
var tc=document.getElementById('totalCategories');
var pr=document.getElementById('priceRange');
if(ti)ti.textContent=state.products.length;
var cats=[];
for(var i=0;i<state.products.length;i++){
if(cats.indexOf(state.products[i].category)===-1)cats.push(state.products[i].category);
}
if(tc)tc.textContent=cats.length;
if(pr){
if(state.products.length>0){
var min=state.products[0].price;
for(var j=1;j<state.products.length;j++){if(state.products[j].price<min)min=state.products[j].price}
pr.textContent=formatPrice(min);
}else{pr.textContent='-'}
}
}

function getFiltered(){
var f=state.products.slice();
if(state.currentFilter!=='semua'){
f=f.filter(function(p){return p.category===state.currentFilter});
}
if(state.searchQuery){
var q=state.searchQuery.toLowerCase();
f=f.filter(function(p){
return p.name.toLowerCase().indexOf(q)!==-1||p.description.toLowerCase().indexOf(q)!==-1||p.category.toLowerCase().indexOf(q)!==-1;
});
}
switch(state.currentSort){
case 'termurah':f.sort(function(a,b){return a.price-b.price});break;
case 'termahal':f.sort(function(a,b){return b.price-a.price});break;
case 'nama':f.sort(function(a,b){return a.name.localeCompare(b.name)});break;
default:f.sort(function(a,b){return b.createdAt-a.createdAt});break;
}
return f;
}

function renderProducts(){
var grid=document.getElementById('productGrid');
var empty=document.getElementById('emptyState');
if(!grid)return;
var filtered=getFiltered();
if(filtered.length===0){
grid.innerHTML='';
if(empty){
empty.style.display='block';
var h3=empty.querySelector('h3');
var pp=empty.querySelector('p');
if(state.products.length>0&&(state.currentFilter!=='semua'||state.searchQuery)){
if(h3)h3.textContent='Tidak ditemukan';
if(pp)pp.textContent='Coba kategori lain atau kata kunci berbeda';
}else{
if(h3)h3.textContent='Belum ada barang';
if(pp)pp.textContent='Klik ⚙️ untuk login admin dan tambah barang pertama Anda!';
}
}
return;
}
if(empty)empty.style.display='none';
var html='';
for(var i=0;i<filtered.length;i++){
var p=filtered[i];
var imgContent=p.image?'<img src="'+p.image+'" alt="'+escHtml(p.name)+'">':(CAT_EMOJI[p.category]||'📦');
var condColor=COND_COLOR[p.condition]||'#6c5ce7';
html+='<div class="product-card" data-id="'+p.id+'" style="animation-delay:'+i*0.05+'s">';
html+='<div class="product-image">'+imgContent+'<span class="product-badge">'+escHtml(p.condition)+'</span></div>';
html+='<div class="product-info">';
html+='<div class="product-name">'+escHtml(p.name)+'</div>';
html+='<div class="product-price">'+formatPrice(p.price)+'</div>';
html+='<div class="product-meta">';
html+='<span class="product-condition" style="background:'+condColor+'22;color:'+condColor+'">'+escHtml(p.condition)+'</span>';
html+='<span class="product-category-tag">'+(CAT_EMOJI[p.category]||'')+' '+escHtml(p.category)+'</span>';
html+='</div></div></div>';
}
grid.innerHTML=html;
var cards=grid.querySelectorAll('.product-card');
for(var k=0;k<cards.length;k++){
(function(card){
card.addEventListener('click',function(){
var id=card.getAttribute('data-id');
for(var x=0;x<state.products.length;x++){
if(state.products[x].id===id){openDetail(state.products[x]);break}
}
});
})(cards[k]);
}
}

function openDetail(product){
state.currentProduct=product;
var modal=document.getElementById('modalDetail');
var overlay=document.getElementById('modalOverlay');
if(!modal||!overlay)return;
var mi=document.getElementById('modalImage');
if(mi)mi.innerHTML=product.image?'<img src="'+product.image+'" alt="">':(CAT_EMOJI[product.category]||'📦');
var mn=document.getElementById('modalName');if(mn)mn.textContent=product.name;
var mp=document.getElementById('modalPrice');if(mp)mp.textContent=formatPrice(product.price);
var mc=document.getElementById('modalCondition');if(mc)mc.textContent=product.condition;
var mcat=document.getElementById('modalCategory');if(mcat)mcat.textContent=(CAT_EMOJI[product.category]||'')+' '+product.category;
var md=document.getElementById('modalDesc');if(md)md.textContent=product.description||'Tidak ada deskripsi';
var mdt=document.getElementById('modalDate');if(mdt)mdt.textContent='📅 Ditambahkan: '+formatDate(product.createdAt);
overlay.style.display='block';
modal.style.display='block';
document.body.style.overflow='hidden';
}

function closeDetail(){
var modal=document.getElementById('modalDetail');
var overlay=document.getElementById('modalOverlay');
if(modal)modal.style.display='none';
if(overlay)overlay.style.display='none';
document.body.style.overflow='';
state.currentProduct=null;
}

function renderCartBadge(){
var total=0;
for(var i=0;i<state.cart.length;i++)total+=state.cart[i].qty;
var badge=document.getElementById('cartBadge');
if(badge)badge.textContent=total;
}

function addToCart(product){
var found=false;
for(var i=0;i<state.cart.length;i++){
if(state.cart[i].id===product.id){state.cart[i].qty++;found=true;break}
}
if(!found){
state.cart.push({id:product.id,name:product.name,price:product.price,image:product.image,category:product.category,qty:1});
}
saveCart();renderCartBadge();showToast('✅ Ditambah ke keranjang!');
}

function renderCart(){
var container=document.getElementById('cartItems');
if(!container)return;
if(state.cart.length===0){
container.innerHTML='<div style="text-align:center;padding:40px;color:#b2bec3"><span style="font-size:48px;display:block;margin-bottom:12px">🛒</span>Keranjang kosong</div>';
var ct=document.getElementById('cartTotal');if(ct)ct.textContent='Rp 0';
return;
}
var html='';
for(var i=0;i<state.cart.length;i++){
var item=state.cart[i];
var img=item.image?'<img src="'+item.image+'" alt="">':(CAT_EMOJI[item.category]||'📦');
html+='<div class="cart-item" data-id="'+item.id+'">';
html+='<div class="cart-item-img">'+img+'</div>';
html+='<div class="cart-item-info"><div class="cart-item-name">'+escHtml(item.name)+'</div><div class="cart-item-price">'+formatPrice(item.price)+'</div></div>';
html+='<div class="cart-item-qty">';
html+='<button class="qty-btn" data-action="minus" data-id="'+item.id+'">−</button>';
html+='<span class="qty-num">'+item.qty+'</span>';
html+='<button class="qty-btn" data-action="plus" data-id="'+item.id+'">+</button>';
html+='</div>';
html+='<button class="btn-remove-item" data-id="'+item.id+'">🗑️</button>';
html+='</div>';
}
container.innerHTML=html;
var total=0;
for(var j=0;j<state.cart.length;j++)total+=state.cart[j].price*state.cart[j].qty;
var ct2=document.getElementById('cartTotal');if(ct2)ct2.textContent=formatPrice(total);

var qtyBtns=container.querySelectorAll('.qty-btn');
for(var k=0;k<qtyBtns.length;k++){
(function(btn){
btn.addEventListener('click',function(e){
e.stopPropagation();
var id=btn.getAttribute('data-id');
var action=btn.getAttribute('data-action');
for(var x=0;x<state.cart.length;x++){
if(state.cart[x].id===id){
if(action==='plus')state.cart[x].qty++;
else if(action==='minus'&&state.cart[x].qty>1)state.cart[x].qty--;
else if(action==='minus'&&state.cart[x].qty<=1){state.cart.splice(x,1);x--}
break;
}
}
saveCart();renderCart();renderCartBadge();
});
})(qtyBtns[k]);
}

var removeBtns=container.querySelectorAll('.btn-remove-item');
for(var m=0;m<removeBtns.length;m++){
(function(btn){
btn.addEventListener('click',function(e){
e.stopPropagation();
var id=btn.getAttribute('data-id');
state.cart=state.cart.filter(function(item){return item.id!==id});
saveCart();renderCart();renderCartBadge();showToast('🗑️ Dihapus dari keranjang');
});
})(removeBtns[m]);
}
}

function openCart(){renderCart();var o=document.getElementById('cartOverlay');var s=document.getElementById('cartSidebar');if(o)o.style.display='block';if(s)s.style.display='flex';document.body.style.overflow='hidden'}
function closeCart(){var o=document.getElementById('cartOverlay');var s=document.getElementById('cartSidebar');if(o)o.style.display='none';if(s)s.style.display='none';document.body.style.overflow=''}

function checkoutWA(){
if(state.cart.length===0){showToast('🛒 Keranjang masih kosong!');return}
var wa=state.config.waNumber;
if(!wa){showToast('⚠️ Nomor WA belum diatur! Klik ⚙️ → Pengaturan');return}
var msg='🛒 *PESANAN BARU - '+(state.config.storeName||'Adi Store')+'*\n';
msg+='━━━━━━━━━━━━━━━━━━\n\n';
for(var i=0;i<state.cart.length;i++){
var item=state.cart[i];
msg+=(i+1)+'. *'+item.name+'*\n   '+item.qty+'x @ '+formatPrice(item.price)+' = '+formatPrice(item.price*item.qty)+'\n\n';
}
var total=0;for(var j=0;j<state.cart.length;j++)total+=state.cart[j].price*state.cart[j].qty;
msg+='━━━━━━━━━━━━━━━━━━\n💰 *TOTAL: '+formatPrice(total)+'*\n\nMohon konfirmasi ketersediaan. Terima kasih! 🙏';
window.open('https://wa.me/'+wa+'?text='+encodeURIComponent(msg),'_blank');
}

function clearCart(){
if(state.cart.length===0)return;
if(confirm('Kosongkan semua keranjang?')){state.cart=[];saveCart();renderCart();renderCartBadge();showToast('🗑️ Keranjang dikosongkan')}
}

function openAdmin(){
var o=document.getElementById('adminOverlay');var p=document.getElementById('adminPanel');
if(o)o.style.display='block';if(p)p.style.display='block';
document.body.style.overflow='hidden';
if(state.isAdmin){
var al=document.getElementById('adminLogin');var ac=document.getElementById('adminContent');
if(al)al.style.display='none';if(ac)ac.style.display='block';
loadAdminSettings();renderAdminProducts();
}else{
var al2=document.getElementById('adminLogin');var ac2=document.getElementById('adminContent');
if(al2)al2.style.display='block';if(ac2)ac2.style.display='none';
}
}

function closeAdmin(){
var o=document.getElementById('adminOverlay');var p=document.getElementById('adminPanel');
if(o)o.style.display='none';if(p)p.style.display='none';
document.body.style.overflow='';
}

function adminLogin(){
var pw=document.getElementById('adminPassword');
if(!pw)return;
if(pw.value===state.config.password){
state.isAdmin=true;
var al=document.getElementById('adminLogin');var ac=document.getElementById('adminContent');
if(al)al.style.display='none';if(ac)ac.style.display='block';
loadAdminSettings();renderAdminProducts();showToast('✅ Login berhasil!');
}else{showToast('❌ Password salah!');pw.value=''}
}

function adminLogout(){
state.isAdmin=false;
var al=document.getElementById('adminLogin');var ac=document.getElementById('adminContent');
if(al)al.style.display='block';if(ac)ac.style.display='none';
var pw=document.getElementById('adminPassword');if(pw)pw.value='';
showToast('🚪 Logout berhasil');
}

function loadAdminSettings(){
var sn=document.getElementById('settingName');if(sn)sn.value=state.config.storeName||'';
var st=document.getElementById('settingTagline');if(st)st.value=state.config.tagline||'';
var sw=document.getElementById('settingWA');if(sw)sw.value=state.config.waNumber||'';
var sp=document.getElementById('settingPassword');if(sp)sp.value='';
var lp=document.getElementById('logoPreview');
if(lp){if(state.config.logo){lp.src=state.config.logo;lp.style.display='block'}else{lp.style.display='none'}}
}

function saveSettings(){
var sn=document.getElementById('settingName');
var st=document.getElementById('settingTagline');
var sw=document.getElementById('settingWA');
var sp=document.getElementById('settingPassword');
var lf=document.getElementById('settingLogo');
if(sn&&sn.value.trim())state.config.storeName=sn.value.trim();
if(st&&st.value.trim())state.config.tagline=st.value.trim();
if(sw&&sw.value.trim())state.config.waNumber=sw.value.trim().replace(/[^0-9]/g,'');
if(sp&&sp.value.trim())state.config.password=sp.value.trim();
if(lf&&lf.files&&lf.files[0]){
fileToBase64(lf.files[0]).then(function(b64){
state.config.logo=b64;saveConfig();renderHeader();loadAdminSettings();showToast('✅ Pengaturan tersimpan!');
}).catch(function(){showToast('❌ Gagal upload logo')});
}else{saveConfig();renderHeader();loadAdminSettings();showToast('✅ Pengaturan tersimpan!')}
}

function addProduct(){
var pn=document.getElementById('prodName');
var pp=document.getElementById('prodPrice');
var pc=document.getElementById('prodCategory');
var pco=document.getElementById('prodCondition');
var pd=document.getElementById('prodDesc');
var pi=document.getElementById('prodImage');
if(!pn||!pp)return;
var name=pn.value.trim();
var price=parseInt(pp.value);
if(!name){showToast('⚠️ Nama barang harus diisi!');return}
if(!price||price<=0){showToast('⚠️ Harga harus diisi!');return}
var category=pc?pc.value:'lainnya';
var condition=pco?pco.value:'baik';
var desc=pd?pd.value.trim():'';
if(pi&&pi.files&&pi.files[0]){
fileToBase64(pi.files[0]).then(function(b64){
var product={id:genId(),name:name,price:price,category:category,condition:condition,description:desc,image:b64,createdAt:Date.now()};
state.products.unshift(product);saveProducts();resetProdForm();renderProducts();renderStats();renderAdminProducts();showToast('✅ Barang berhasil ditambahkan!');
}).catch(function(){showToast('❌ Gagal upload foto')});
}else{
var product2={id:genId(),name:name,price:price,category:category,condition:condition,description:desc,image:'',createdAt:Date.now()};
state.products.unshift(product2);saveProducts();resetProdForm();renderProducts();renderStats();renderAdminProducts();showToast('✅ Barang berhasil ditambahkan!');
}
}

function resetProdForm(){
var pn=document.getElementById('prodName');if(pn)pn.value='';
var pp=document.getElementById('prodPrice');if(pp)pp.value='';
var pd=document.getElementById('prodDesc');if(pd)pd.value='';
var pi=document.getElementById('prodImage');if(pi)pi.value='';
var ip=document.getElementById('imagePreview');if(ip)ip.style.display='none';
}

function renderAdminProducts(){
var container=document.getElementById('adminProductList');
var count=document.getElementById('adminItemCount');
if(count)count.textContent=state.products.length;
if(!container)return;
if(state.products.length===0){container.innerHTML='<p style="text-align:center;color:#b2bec3;padding:20px">Belum ada barang</p>';return}
var html='';
for(var i=0;i<state.products.length;i++){
var p=state.products[i];
var img=p.image?'<img src="'+p.image+'" alt="">':(CAT_EMOJI[p.category]||'📦');
html+='<div class="admin-product-item" data-id="'+p.id+'">';
html+='<div class="admin-prod-img">'+img+'</div>';
html+='<div class="admin-prod-info"><div class="admin-prod-name">'+escHtml(p.name)+'</div><div class="admin-prod-price">'+formatPrice(p.price)+' · '+escHtml(p.condition)+'</div></div>';
html+='<button class="btn-delete-prod" data-id="'+p.id+'">🗑️</button>';
html+='</div>';
}
container.innerHTML=html;
var delBtns=container.querySelectorAll('.btn-delete-prod');
for(var k=0;k<delBtns.length;k++){
(function(btn){
btn.addEventListener('click',function(e){
e.stopPropagation();
if(confirm('Hapus barang ini?')){
var id=btn.getAttribute('data-id');
state.products=state.products.filter(function(p){return p.id!==id});
state.cart=state.cart.filter(function(c){return c.id!==id});
saveProducts();saveCart();renderProducts();renderStats();renderAdminProducts();renderCartBadge();showToast('🗑️ Barang dihapus');
}
});
})(delBtns[k]);
}
}

function resetAllData(){
if(confirm('⚠️ PERINGATAN!\n\nSemua data akan dihapus permanen:\n- Semua barang\n- Keranjang\n- Pengaturan toko\n\nLanjutkan?')){
if(confirm('Yakin 100%? Ini tidak bisa dibatalkan!')){
localStorage.removeItem('adi_config');localStorage.removeItem('adi_products');localStorage.removeItem('adi_cart');
state.config=JSON.parse(JSON.stringify(DEFAULT_CONFIG));state.products=[];state.cart=[];state.isAdmin=false;
renderAll();closeAdmin();showToast('🗑️ Semua data dihapus');
}
}
}

function exportData(){
var data={config:state.config,products:state.products,cart:state.cart,exportDate:new Date().toISOString(),version:'2.0'};
var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
var url=URL.createObjectURL(blob);
var a=document.createElement('a');a.href=url;
a.download='backup-adi-store-'+new Date().toISOString().slice(0,10)+'.json';
document.body.appendChild(a);a.click();document.body.removeChild(a);
URL.revokeObjectURL(url);showToast('📥 Backup berhasil didownload!');
}

function importData(){
var fileInput=document.getElementById('importFile');
if(!fileInput||!fileInput.files||!fileInput.files[0]){showToast('⚠️ Pilih file backup dulu!');return}
var reader=new FileReader();
reader.onload=function(e){
try{
var data=JSON.parse(e.target.result);
if(data.config)state.config=data.config;
if(data.products)state.products=data.products;
if(data.cart)state.cart=data.cart;
saveConfig();saveProducts();saveCart();renderAll();loadAdminSettings();renderAdminProducts();
showToast('📤 Data berhasil direstore!');
}catch(err){showToast('❌ File backup tidak valid!')}
};
reader.readAsText(fileInput.files[0]);
}

function startPromoRotation(){
var slides=document.querySelectorAll('.promo-slide');
if(slides.length===0)return;
var current=0;
setInterval(function(){
slides[current].classList.remove('active');
current=(current+1)%slides.length;
slides[current].classList.add('active');
},3000);
}

function toggleSearch(){
var bar=document.getElementById('searchBar');
if(!bar)return;
if(bar.style.display==='none'||bar.style.display===''){
bar.style.display='flex';
var si=document.getElementById('searchInput');if(si)si.focus();
}else{
bar.style.display='none';
var si2=document.getElementById('searchInput');if(si2)si2.value='';
state.searchQuery='';renderProducts();
}
}

function setupImagePreview(inputId,previewId){
var input=document.getElementById(inputId);
var preview=document.getElementById(previewId);
if(!input||!preview)return;
input.addEventListener('change',function(e){
var file=e.target.files[0];
if(file){
fileToBase64(file).then(function(b64){preview.src=b64;preview.style.display='block'}).catch(function(){preview.style.display='none'});
}else{preview.style.display='none'}
});
}

function renderAll(){renderHeader();renderStats();renderProducts();renderCartBadge()}

function initEvents(){
var btnSearch=document.getElementById('btnSearch');if(btnSearch)btnSearch.addEventListener('click',toggleSearch);
var btnCart=document.getElementById('btnCart');if(btnCart)btnCart.addEventListener('click',openCart);
var btnAdmin=document.getElementById('btnAdmin');if(btnAdmin)btnAdmin.addEventListener('click',openAdmin);
var btnCloseSearch=document.getElementById('btnCloseSearch');if(btnCloseSearch)btnCloseSearch.addEventListener('click',toggleSearch);
var searchInput=document.getElementById('searchInput');
if(searchInput)searchInput.addEventListener('input',function(e){state.searchQuery=e.target.value;renderProducts()});

var catBtns=document.querySelectorAll('.cat-btn');
for(var i=0;i<catBtns.length;i++){
(function(btn){
btn.addEventListener('click',function(){
for(var j=0;j<catBtns.length;j++)catBtns[j].classList.remove('active');
btn.classList.add('active');state.currentFilter=btn.getAttribute('data-cat');renderProducts();
});
})(catBtns[i]);
}

var sortSelect=document.getElementById('sortSelect');
if(sortSelect)sortSelect.addEventListener('change',function(e){state.currentSort=e.target.value;renderProducts()});

var btnCloseCart=document.getElementById('btnCloseCart');if(btnCloseCart)btnCloseCart.addEventListener('click',closeCart);
var cartOverlay=document.getElementById('cartOverlay');if(cartOverlay)cartOverlay.addEventListener('click',closeCart);
var btnCheckout=document.getElementById('btnCheckout');if(btnCheckout)btnCheckout.addEventListener('click',checkoutWA);
var btnClearCart=document.getElementById('btnClearCart');if(btnClearCart)btnClearCart.addEventListener('click',clearCart);

var btnCloseAdmin=document.getElementById('btnCloseAdmin');if(btnCloseAdmin)btnCloseAdmin.addEventListener('click',closeAdmin);
var adminOverlay=document.getElementById('adminOverlay');if(adminOverlay)adminOverlay.addEventListener('click',closeAdmin);
var btnLogin=document.getElementById('btnLogin');if(btnLogin)btnLogin.addEventListener('click',adminLogin);
var adminPassword=document.getElementById('adminPassword');
if(adminPassword)adminPassword.addEventListener('keypress',function(e){if(e.key==='Enter')adminLogin()});
var btnSaveSettings=document.getElementById('btnSaveSettings');if(btnSaveSettings)btnSaveSettings.addEventListener('click',saveSettings);
var btnAddProduct=document.getElementById('btnAddProduct');if(btnAddProduct)btnAddProduct.addEventListener('click',addProduct);
var btnResetAll=document.getElementById('btnResetAll');if(btnResetAll)btnResetAll.addEventListener('click',resetAllData);
var btnLogout=document.getElementById('btnLogout');if(btnLogout)btnLogout.addEventListener('click',adminLogout);
var btnExportData=document.getElementById('btnExportData');if(btnExportData)btnExportData.addEventListener('click',exportData);
var btnImportData=document.getElementById('btnImportData');if(btnImportData)btnImportData.addEventListener('click',importData);

var btnCloseModal=document.getElementById('btnCloseModal');if(btnCloseModal)btnCloseModal.addEventListener('click',closeDetail);
var modalOverlay=document.getElementById('modalOverlay');if(modalOverlay)modalOverlay.addEventListener('click',closeDetail);
var btnAddCartModal=document.getElementById('btnAddCartModal');
if(btnAddCartModal)btnAddCartModal.addEventListener('click',function(){if(state.currentProduct){addToCart(state.currentProduct);closeDetail()}});
var btnWADirect=document.getElementById('btnWADirect');
if(btnWADirect)btnWADirect.addEventListener('click',function(){
if(!state.currentProduct)return;
var wa=state.config.waNumber;
if(!wa){showToast('⚠️ Nomor WA belum diatur!');return}
var p=state.currentProduct;
var msg='Halo, saya tertarik dengan:\n\n*'+p.name+'*\nHarga: '+formatPrice(p.price)+'\nKondisi: '+p.condition+'\n\nApakah masih tersedia?';
window.open('https://wa.me/'+wa+'?text='+encodeURIComponent(msg),'_blank');
});

setupImagePreview('prodImage','imagePreview');
setupImagePreview('settingLogo','logoPreview');
}

function init(){
console.log('🏪 Adi Store v2.0 - Initializing...');
loadData();renderAll();initEvents();startPromoRotation();
console.log('✅ Adi Store ready! Products: '+state.products.length);
}

if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init)}else{init()}

})();

