// Simple front-end store + dataLayer pushes for GTM/pixel testing
window.dataLayer = window.dataLayer || [];

// Mock product data
const products = [
  {id: 'p1', title: 'Classic White Tee', price: 12.99, currency: 'USD', img: 'assets/img/shirt1.jpg', category:'tees'},
  {id: 'p2', title: 'Blue Denim Jacket', price: 59.99, currency: 'USD', img: 'assets/img/jacket1.jpg', category:'jackets'},
  {id: 'p3', title: 'Slim Chinos', price: 34.99, currency: 'USD', img: 'assets/img/chinos1.jpg', category:'bottoms'},
  {id: 'p4', title: 'Stripe Polo', price: 22.00, currency: 'USD', img: 'assets/img/polo1.jpg', category:'tees'}
];

window.storeProducts = products.map(p => ({id:p.id,name:p.title,price:p.price,currency:p.currency}))

// Utilities: localStorage cart/wishlist
function getCart(){return JSON.parse(localStorage.getItem('cart')||'[]')}
function saveCart(c){localStorage.setItem('cart',JSON.stringify(c)); updateCartCount();}
function getWishlist(){return JSON.parse(localStorage.getItem('wishlist')||'[]')}
function saveWishlist(w){localStorage.setItem('wishlist',JSON.stringify(w));}

function updateCartCount(){
  const cnt = getCart().reduce((s,i)=>s+i.qty,0);
  const el = document.getElementById('cart-count'); if(el) el.textContent = cnt;
}

// Render product list on index
function renderProductList(){
  const el = document.getElementById('product-list');
  if(!el) return;
  el.innerHTML = '';
  products.forEach(p=>{
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `
      <img src="${p.img}" alt="${p.title}">
      <h3>${p.title}</h3>
      <p>$${p.price.toFixed(2)}</p>
      <div style="display:flex;gap:8px;margin-top:8px">
        <a class="btn" href="product.html?id=${p.id}">View</a>
        <button class="btn" onclick="addToCart('${p.id}')">Add to cart</button>
        <button onclick="addToWishlist('${p.id}')">♡</button>
      </div>
    `;
    el.appendChild(card);
  });
}

// Product detail page
function renderProductDetail(){
  const el = document.getElementById('product-detail');
  if(!el) return;
  const params = new URLSearchParams(location.search);
  const id = params.get('id') || products[0].id;
  const p = products.find(x=>x.id===id);
  if(!p) return el.textContent='Product not found';
  el.innerHTML = `
    <div><img src="${p.img}" alt="${p.title}"></div>
    <div>
      <h1>${p.title}</h1>
      <p>$${p.price.toFixed(2)}</p>
      <p class="muted">Category: ${p.category}</p>
      <div style="margin-top:12px">
        <button class="btn" onclick="addToCart('${p.id}')">Add to cart</button>
        <button onclick="addToWishlist('${p.id}')">Add to wishlist</button>
      </div>
      <p style="margin-top:20px">Product description: Lightweight, breathable fabric.</p>
    </div>
  `;

  // dataLayer push: view_item
  dataLayer.push({
    event: 'view_item',
    ecommerce: {items:[{item_id:p.id, item_name:p.title, price:p.price, currency:p.currency}]}
  });
}

// Add to cart
function addToCart(id, qty=1){
  const p = products.find(x=>x.id===id); if(!p) return;
  const cart = getCart();
  const found = cart.find(i=>i.id===id);
  if(found) found.qty += qty; else cart.push({id:id, qty:qty, price:p.price, name:p.title});
  saveCart(cart);

  // dataLayer push: add_to_cart (standard)
  dataLayer.push({
    event: 'add_to_cart',
    ecommerce: {currency: p.currency, value: p.price*qty, items:[{item_id:p.id, item_name:p.title, price:p.price, quantity:qty}]}
  });
  alert('Added to cart');
}

// Wishlist
function addToWishlist(id){
  const wl = getWishlist(); if(!wl.includes(id)) wl.push(id); saveWishlist(wl); updateWishlist();
  const p = products.find(x=>x.id===id);
  dataLayer.push({event:'add_to_wishlist', ecommerce:{items:[{item_id:p.id,item_name:p.title,price:p.price}]}});
  alert('Added to wishlist');
}

function updateWishlist(){
  const el = document.getElementById('wishlist-items'); if(!el) return;
  const wl = getWishlist(); el.innerHTML='';
  wl.forEach(id=>{
    const p = products.find(x=>x.id===id);
    const d = document.createElement('div'); d.className='card'; d.innerHTML=`<h3>${p.title}</h3><p>$${p.price}</p><button onclick="addToCart('${p.id}')">Add to cart</button>`; el.appendChild(d);
  });
}

// Render cart
function renderCart(){
  const el = document.getElementById('cart-items'); if(!el) return;
  const cart = getCart(); el.innerHTML='';
  let total=0;
  cart.forEach(item=>{
    const p = products.find(x=>x.id===item.id);
    const div = document.createElement('div'); div.className='card';
    div.innerHTML = `<h3>${p.title}</h3><p>Qty: ${item.qty} | Price: $${(item.price*item.qty).toFixed(2)}</p><button onclick="removeFromCart('${item.id}')">Remove</button>`;
    el.appendChild(div);
    total += item.price*item.qty;
  });
  const totEl = document.getElementById('cart-total'); if(totEl) totEl.textContent = '$' + total.toFixed(2);
}

function removeFromCart(id){
  let cart = getCart(); cart = cart.filter(i=>i.id!==id); saveCart(cart); renderCart();
}

// Checkout flow: push begin_checkout and purchase
function handleCheckout(){
  const cart = getCart(); if(cart.length===0){alert('Cart empty'); return}
  const items = cart.map(i=>({item_id:i.id,item_name:i.name,price:i.price,quantity:i.qty}));
  const value = cart.reduce((s,i)=>s+i.price*i.qty,0);
  dataLayer.push({event:'begin_checkout', ecommerce:{value:value, currency:'USD', items:items}});
  // For demo, redirect to checkout page
  location.href = 'checkout.html';
}

function completePurchase(formData){
  const cart = getCart(); const items = cart.map(i=>({item_id:i.id,item_name:i.name,price:i.price,quantity:i.qty}));
  const value = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const tx = 'TX' + Date.now();
  dataLayer.push({
    event:'purchase',
    ecommerce:{transaction_id:tx, value:value, currency:'USD', items:items}
  });
  localStorage.removeItem('cart'); updateCartCount(); alert('Purchase simulated — transaction ' + tx); location.href='index.html';
}

// Contact form
function handleContactSubmit(ev){
  ev.preventDefault(); const f = ev.target; const data = {name:f.name.value,email:f.email.value,message:f.message.value};
  dataLayer.push({event:'contact', lead:{name:data.name,email:data.email}, ecommerce:{}});
  alert('Message sent (simulated)'); f.reset();
}

// Register/login mock
function handleRegister(ev){ev.preventDefault(); const f=ev.target; dataLayer.push({event:'sign_up', user:{email:f.email.value}}); alert('Registered (mock)'); location.href='index.html'}
function handleLogin(ev){ev.preventDefault(); const f=ev.target; dataLayer.push({event:'login', user:{email:f.email.value}}); alert('Logged in (mock)'); location.href='index.html'}

// Init page
function init(){
  updateCartCount(); renderProductList(); renderProductDetail(); renderCart(); updateWishlist();

  // Attach handlers
  const contactForm = document.getElementById('contact-form'); if(contactForm) contactForm.addEventListener('submit', handleContactSubmit);
  const checkoutForm = document.getElementById('checkout-form'); if(checkoutForm) checkoutForm.addEventListener('submit', function(ev){ ev.preventDefault(); completePurchase(new FormData(checkoutForm)) });
  const registerForm = document.getElementById('register-form'); if(registerForm) registerForm.addEventListener('submit', handleRegister);
  const loginForm = document.getElementById('login-form'); if(loginForm) loginForm.addEventListener('submit', handleLogin);

  // Expose function for product buttons in HTML
  window.addToCart = addToCart; window.addToWishlist=addToWishlist; window.removeFromCart=removeFromCart; window.handleCheckout=handleCheckout;
}

window.addEventListener('DOMContentLoaded', init);