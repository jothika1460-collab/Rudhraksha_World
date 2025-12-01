// Config
const WHATSAPP_NUMBER = "919384406190"; // change as needed

// State
let products = JSON.parse(localStorage.getItem("products") || "[]");
let cart = JSON.parse(localStorage.getItem("cart") || "[]");

// If products is not an array, replace with empty array
if (!Array.isArray(products)) {
  products = [];
  localStorage.setItem("products", JSON.stringify(products));
}

// DOM refs
document.addEventListener('DOMContentLoaded', () => {
  const productsGrid = document.getElementById('productsGrid');
  const cartCountEl = document.getElementById('cartCount');
  const cartSidebar = document.getElementById('cartSidebar');
  const closeCartBtn = document.getElementById('closeCart');
  const cartItemsEl = document.getElementById('cartItems');
  const cartTotalEl = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const checkoutModal = document.getElementById('checkoutModal');
  const cancelCheckout = document.getElementById('cancelCheckout');
  const payNowBtn = document.getElementById('payNowBtn');
  const overlay = document.getElementById('overlay');
  const cartBtn = document.getElementById('cartBtn');

  function saveProducts(){ localStorage.setItem("products", JSON.stringify(products)); }
  function saveCart(){ localStorage.setItem("cart", JSON.stringify(cart)); updateCartCount(); }
  function updateCartCount(){ const totalItems = cart.reduce((s,i)=> s + (i.quantity||0), 0); cartCountEl.textContent = totalItems; }

  function escapeHtml(str){ if (!str && str !== 0) return ''; return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }

  // render
  function loadProducts(){
    productsGrid.innerHTML = '';
    if (!products || products.length === 0){
      productsGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#666">No products available. Use <a href="admin.html">Admin</a> to add products.</p>';
      return;
    }
    products.forEach((product, index) => {
      const card = document.createElement('div');
      card.className = 'product-card';
      const imgSrc = product.image || './images/placeholder.png';
      card.innerHTML = `
        <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(product.name||'product')}" onerror="this.src='./images/placeholder.png'">
        <div style="padding:10px 12px">
          <div class="product-name">${escapeHtml(product.name||'Unnamed')}</div>
          <div class="product-price">₹${Number(product.price||0)}</div>
          <div class="quantity-container">
            <input type="number" min="1" value="1" class="quantity-input" data-index="${index}">
            <button class="add-to-cart-btn" data-index="${index}">Add to Cart</button>
          </div>
        </div>
      `;
      productsGrid.appendChild(card);
    });
    attachCartButtons();
  }

  function addToCart(product, quantity){
    if (!product) return;
    const qty = Math.max(1, Number(quantity) || 1);
    const existing = cart.find(i => i.id === product.id);
    if (existing) existing.quantity = (existing.quantity||0) + qty;
    else cart.push({ ...product, quantity: qty, id: product.id || Date.now() });
    saveCart();
    renderCartItems();
    alert(`${product.name} (x${qty}) added to cart`);
  }

  function removeFromCart(index){
    if (index < 0 || index >= cart.length) return;
    cart.splice(index,1);
    saveCart();
    renderCartItems();
  }

  function changeQty(index, qty){
    qty = Math.max(1, Number(qty) || 1);
    if (cart[index]) { cart[index].quantity = qty; saveCart(); renderCartItems(); }
  }

  function renderCartItems(){
    cartItemsEl.innerHTML = '';
    if (!cart || cart.length === 0){
      cartItemsEl.innerHTML = '<p>Your cart is empty.</p>';
      cartTotalEl.textContent = 0;
      return;
    }
    let total = 0;
    cart.forEach((item, idx) => {
      const subtotal = Number(item.price||0) * Number(item.quantity||1);
      total += subtotal;
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <img src="${escapeHtml(item.image||'./images/placeholder.png')}" onerror="this.src='./images/placeholder.png'">
        <div style="flex:1">
          <div><strong>${escapeHtml(item.name)}</strong></div>
          <div>₹${item.price} x <input type="number" min="1" value="${item.quantity}" class="cart-qty" data-idx="${idx}" style="width:60px"></div>
        </div>
        <div>
          <button class="remove-btn" data-idx="${idx}" style="background:#ff6b6b;color:#fff;border:none;padding:6px 8px;border-radius:6px;cursor:pointer">Remove</button>
        </div>
      `;
      cartItemsEl.appendChild(div);
    });
    cartTotalEl.textContent = total;
    // events
    cartItemsEl.querySelectorAll('.remove-btn').forEach(b=> b.addEventListener('click', e=> removeFromCart(Number(e.currentTarget.dataset.idx))));
    cartItemsEl.querySelectorAll('.cart-qty').forEach(inp=> inp.addEventListener('change', e=> changeQty(Number(e.currentTarget.dataset.idx), Number(e.currentTarget.value))));
  }

  function attachCartButtons(){
    document.querySelectorAll('.add-to-cart-btn').forEach(btn=>{
      btn.addEventListener('click', e=>{
        const index = Number(e.currentTarget.dataset.index);
        const product = products[index];
        const qtyInput = document.querySelector(`.quantity-input[data-index="${index}"]`);
        const qty = qtyInput ? Number(qtyInput.value || 1) : 1;
        addToCart(product, qty);
      });
    });
  }

  function openCart(){ cartSidebar.classList.add('open'); overlay.classList.add('active'); renderCartItems(); }
  function closeCart(){ cartSidebar.classList.remove('open'); overlay.classList.remove('active'); }

  cartBtn?.addEventListener('click', openCart);
  closeCartBtn?.addEventListener('click', closeCart);
  overlay?.addEventListener('click', ()=> { checkoutModal.classList.remove('active'); closeCart(); });

  checkoutBtn?.addEventListener('click', ()=>{
    if (!cart || cart.length === 0) return alert('Cart is empty!');
    checkoutModal.classList.add('active');
    overlay.classList.add('active');
  });

  cancelCheckout?.addEventListener('click', ()=>{
    checkoutModal.classList.remove('active');
    overlay.classList.remove('active');
  });

  payNowBtn?.addEventListener('click', ()=>{
    const name = document.getElementById('custName').value.trim();
    const mobile = document.getElementById('custMobile').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    if (!name || !mobile || !address) { alert('Please fill all fields'); return; }
    if (!cart || cart.length === 0) { alert('Cart is empty'); return; }
    const orderText = cart.map(i => `${i.name} x ${i.quantity}`).join(', ');
    const totalPrice = cart.reduce((s,i)=> s + (Number(i.price||0) * Number(i.quantity||1)), 0);
    const whatsappMsg = `New Order\nName: ${name}\nMobile: ${mobile}\nAddress: ${address}\nOrder: ${orderText}\nTotal: ₹${totalPrice}`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMsg)}`;
    window.open(url, '_blank');

    cart = [];
    saveCart();
    renderCartItems();
    checkoutModal.classList.remove('active');
    overlay.classList.remove('active');
    alert('Order sent!');
  });

  // Remove any leftover default-image element if present
  const defaultImage = document.getElementById('defaultImage');
  if (defaultImage) defaultImage.remove();

  // Initial render
  loadProducts();
  updateCartCount();
  renderCartItems();
});
