
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
// document.querySelectorAll(".add-to-cart").forEach(btn => {
//   btn.addEventListener("click", () => {
//     const card = btn.closest(".menu-card");

//     if (!card) return;

//     const id = card.dataset.id;
//     const name = card.dataset.name;
//     const price = Number(card.dataset.price);

//     let item = cart.find(i => i.id === id);

//     if (item) item.qty++;
//     else cart.push({ id, name, price, qty: 1 });

//     localStorage.setItem("cart", JSON.stringify(cart));
//     updateCartCount();
//     openCart(); // 🔥 auto open with items
//   });
// });
document.addEventListener("click", function (e) {
  const btn = e.target.closest(".add-to-cart");
  if (!btn) return;

  // 🔥 CASE 1: Button me data-* diya hua
  let id = btn.dataset.id;
  let name = btn.dataset.name;
  let price = Number(btn.dataset.price);

  // 🔥 CASE 2: Menu page (menu-card)
  if (!id) {
    const card = btn.closest(".menu-card");
    if (!card) return;

    id = card.dataset.id;
    name = card.dataset.name;
    price = Number(card.dataset.price);
  }

  let item = cart.find(i => i.id === id);

  if (item) {
    item.qty++;
  } else {
    cart.push({ id, name, price, qty: 1 });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  // openCart(); // 🔥 slider se click par bhi open hoga
  
    // ✅ 🔥 FIX
  if (cartDrawer?.classList.contains("open")) {
    renderCart();
  }
    // ✅ popup show karo
  showToast(`${name} added to cart`);
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
            onclick="goToCheckout()">
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


document.addEventListener("DOMContentLoaded", function () {
  updateCartCount();
});

document.querySelectorAll(".order-now").forEach(btn => {
  btn.addEventListener("click", function () {

    const card = this.closest(".menu-card");

    const singleItemCart = [{
      id: card.dataset.id,
      name: card.dataset.name,
      price: Number(card.dataset.price),
      qty: 1
    }];

    // 👇 Checkout ke liye sirf ye item bhejo
    fetch("/sync-cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(singleItemCart)
    }).then(() => {
      window.location.href = "/checkout";
    });

  });
});


function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.innerText = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
}
