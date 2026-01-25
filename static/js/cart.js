
let cart = JSON.parse(localStorage.getItem("cart")) || [];


/* ---------- OPEN / CLOSE CART ---------- */
const cartDrawer  = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");
const closeBtn    = document.getElementById("closeCart");


/* OPEN CART */
function openCart() {
  if (!cartDrawer || !cartOverlay) return; // 🔥 IMPORTANT
  cartDrawer.classList.add("open");
  cartOverlay.style.display = "block";
  renderCart();
}

/* CLOSE CART */
function closeCart() {
  if (!cartDrawer || !cartOverlay) return;
  cartDrawer.classList.remove("open");
  cartOverlay.style.display = "none";
}

/* ❌ OUTSIDE CLICK → CLOSE */
cartOverlay?.addEventListener("click", closeCart);

/* ❌ CLOSE BUTTON */
closeBtn?.addEventListener("click", closeCart);

/* ✅ CART KE ANDAR CLICK SAFE */
cartDrawer?.addEventListener("click", e => e.stopPropagation());

// 🔥 checkout page
function goToCheckout() {
  if (cart.length === 0) {
    alert("Cart empty");
    return;
  }
  window.location.href = "/checkout";
}


/* ---------- ADD TO CART ---------- */
document.querySelectorAll(".add-to-cart").forEach(btn => {
  btn.addEventListener("click", () => {
    const card = btn.closest(".menu-card");

    if (!card) return;

    const id = card.dataset.id;
    const name = card.dataset.name;
    const price = Number(card.dataset.price);

    let item = cart.find(i => i.id === id);

    if (item) item.qty++;
    else cart.push({ id, name, price, qty: 1 });

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    openCart(); // 🔥 auto open with items
  });
});

/* ---------- RENDER CART ---------- */
function renderCart() {
  const box = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");

  if (!box || !totalEl) return;

  box.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    box.innerHTML = "<p>Your cart is empty</p>";
    totalEl.innerText = 0;
    updateCartCount();
    return;
  }

  cart.forEach((item, index) => {
    total += item.price * item.qty;

    box.innerHTML += `
      <div class="cart-item-row">

        <!-- ITEM INFO -->
        <div class="cart-item-name">
          <strong>${item.name}</strong><br>
          ₹${item.price}
        </div>

        <!-- QTY CONTROL -->
        <div class="cart-item-qty">
          <button onclick="changeQty(${index}, -1)">−</button>
          <span>${item.qty}</span>
          <button onclick="changeQty(${index}, 1)">+</button>
        </div>

        <!-- ACTION BUTTONS -->
        <div class="cart-item-actions">
          <button class="remove-btn"
            onclick="removeItem(${index})">
            Remove
          </button>

          <button class="order-btn"
            onclick="orderSingleItem(${index})">
            Order
          </button>
        </div>

      </div>
    `;
  });

  totalEl.innerText = total;
  updateCartCount();
}



/* ---------- QUANTITY ---------- */
function changeQty(index, delta) {
  cart[index].qty += delta;

  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }

  saveCart();
  renderCart();
  updateCartCount(); // 🔥 MUST
}


/* ---------- REMOVE ---------- */
function removeItem(index) {
  cart.splice(index, 1);
  saveCart();
  renderCart();
  updateCartCount(); // 🔥 MUST
}

/* ---------- SAVE ---------- */
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

/* ---------- COUNT ---------- */
function updateCartCount() {
  const cartData = JSON.parse(localStorage.getItem("cart")) || [];
  const count = cartData.reduce((sum, item) => sum + item.qty, 0);

  document.querySelectorAll(".cart-count").forEach(el => {
    el.innerText = count + " items";
  });
  
}

// function checkout(){
//    if(cart.length === 0){
//       alert("Cart is empty");
//       return;
//    }
//    localStorage.setItem("cart", JSON.stringify(cart));
//    window.location.href = "/checkout";
// }


/* ---------- WHATSAPP ---------- */
function orderOnWhatsApp() {
  if (!cart.length) return alert("Cart empty");

  let msg = "🛒 *Food Order*%0A%0A";
  let total = 0;

  cart.forEach(i => {
    msg += `${i.name} x ${i.qty} = ₹${i.price * i.qty}%0A`;
    total += i.price * i.qty;
  });

  msg += `%0A*Total:* ₹${total}`;
  window.open(`https://wa.me/8989660980?text=${msg}`);
}

document.addEventListener("DOMContentLoaded", function () {
  updateCartCount();
});

function buySingleItem(index) {
  const item = cart[index];

  let msg = `🛒 *Food Order*%0A%0A`;
  msg += `${item.name} x ${item.qty}%0A`;
  msg += `Price: ₹${item.price * item.qty}`;

  const phone = "8989660980"; // apna WhatsApp number
  window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
}
// order singal items 
function orderSingleItem(index) {
  const item = cart[index];
  if (!item) return;

  let msg = "🛒 *Food Order*%0A%0A";
  msg += `${item.name}%0A`;
  msg += `Quantity: ${item.qty}%0A`;
  msg += `Price: ₹${item.price * item.qty}`;

  const phone = "8989660980"; // apna WhatsApp number
  window.open(
    `https://wa.me/${phone}?text=${msg}`,
    "_blank"
  );
}
