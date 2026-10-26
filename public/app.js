const API = "/api";
const state = { menu: [], category: "All", search: "", cart: {}, myOrderIds: [], isAdmin: false };
const $ = (selector) => document.querySelector(selector);
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}
function toast(message) {
  const el = $("#toast"); el.textContent = message; el.classList.add("show");
  clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 2800);
}
function cartCount() { return Object.values(state.cart).reduce((sum, item) => sum + item.quantity, 0); }
function cartTotal() { return Object.values(state.cart).reduce((sum, item) => sum + item.price * item.quantity, 0); }

async function loadMenu() {
  try {
    state.menu = await request(`${API}/menu`);
    $("#menuCount").textContent = state.menu.filter(item => item.available).length;
    renderMenu(); renderCartFab();
  } catch (err) {
    $("#menuGrid").innerHTML = `<div class="empty-state">Could not load menu. ${esc(err.message)}<br><br>Check that MongoDB is running and refresh.</div>`;
  }
}
function renderMenu() {
  const list = state.menu.filter(item => item.available &&
    (state.category === "All" || item.category === state.category) &&
    item.name.toLowerCase().includes(state.search.toLowerCase()));
  $("#menuGrid").innerHTML = list.length ? list.map(item => `
    <article class="menu-card">
      <div class="food-image"><span>${esc(item.image || "🍽️")}</span><label class="food-label">${item.prepTime} MIN</label></div>
      <div class="card-content"><span class="category-label">${esc(item.category)}</span><h3>${esc(item.name)}</h3><p>${esc(item.description || "Freshly prepared for you.")}</p>
        <div class="card-bottom"><div><div class="price">${money(item.price)}</div><div class="prep">Fresh · Quick pickup</div></div><button class="add-btn" data-add="${item._id}" aria-label="Add ${esc(item.name)} to cart">+</button></div>
      </div>
    </article>`).join("") : `<div class="empty-state">No dishes found. Try another category or search.</div>`;
}
function renderCartFab() {
  const count = cartCount();
  $("#cartFab").classList.toggle("hidden", count === 0);
  $("#cartFabCount").textContent = count;
  $("#cartFabTotal").textContent = money(cartTotal());
}
function addToCart(id, delta = 1) {
  const item = state.menu.find(entry => entry._id === id);
  if (!item) return;
  if (!state.cart[id]) state.cart[id] = { ...item, quantity: 0 };
  state.cart[id].quantity += delta;
  if (state.cart[id].quantity <= 0) delete state.cart[id];
  renderCartFab();
  toast(delta > 0 ? `${item.name} added to cart` : "Cart updated");
}
function renderCart() {
  const items = Object.values(state.cart);
  $("#cartItems").innerHTML = items.length ? items.map(item => `
    <div class="cart-row"><div class="cart-emoji">${esc(item.image)}</div><div class="cart-row-main"><b>${esc(item.name)}</b><small>${money(item.price)} each</small></div>
      <div class="qty-controls"><button data-qty="${item._id}" data-delta="-1" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button data-qty="${item._id}" data-delta="1" aria-label="Increase quantity">+</button></div>
    </div>`).join("") : `<div class="empty-state">Your cart is empty. Add something delicious from the menu.</div>`;
  $("#cartTotal").textContent = money(cartTotal());
  $("#checkoutForm").classList.toggle("hidden", items.length === 0);
}
function openCart() { renderCart(); $("#modalBackdrop").classList.remove("hidden"); }
function closeCart() { $("#modalBackdrop").classList.add("hidden"); }

async function placeOrder(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const items = Object.values(state.cart).map(item => ({ menuItem: item._id, quantity: item.quantity }));
  const submit = event.currentTarget.querySelector("button[type=submit]");
  submit.disabled = true; submit.textContent = "Placing order…";
  try {
    const order = await request(`${API}/orders`, { method: "POST", body: {
      customerName: form.get("customerName"), studentId: form.get("studentId"),
      pickupNote: form.get("pickupNote"), items
    }});
    state.myOrderIds = [order._id, ...state.myOrderIds].slice(0, 10);
    localStorage.setItem("campusbiteOrderIds", JSON.stringify(state.myOrderIds));
    state.cart = {}; renderCartFab(); closeCart(); event.currentTarget.reset();
    toast(`Order placed! Your order ID is ${order._id.slice(-6).toUpperCase()}`);
    await loadMyOrders();
    $("#orders").scrollIntoView({ behavior: "smooth" });
  } catch (err) { toast(err.message); }
  finally { submit.disabled = false; submit.innerHTML = 'Place order <span>→</span>'; }
}
function statusClass(status) { return String(status).toLowerCase(); }
async function loadMyOrders() {
  state.myOrderIds = JSON.parse(localStorage.getItem("campusbiteOrderIds") || "[]");
  if (!state.myOrderIds.length) {
    $("#myOrders").innerHTML = `<div class="empty-state">Your recent orders will appear here after checkout.</div>`; return;
  }
  try {
    const all = await request(`${API}/orders`);
    const mine = all.filter(order => state.myOrderIds.includes(order._id));
    $("#myOrders").innerHTML = mine.length ? mine.map(order => `
      <article class="order-card"><div><h3>Order #${order._id.slice(-6).toUpperCase()} · ${esc(order.customerName)}</h3>
      <p>${order.items.map(item => `${esc(item.name)} × ${item.quantity}`).join(", ")}<br>${new Date(order.createdAt).toLocaleString()}</p></div>
      <div class="order-right"><span class="order-total">${money(order.totalAmount)}</span><span class="status ${statusClass(order.status)}">${esc(order.status)}</span></div></article>`).join("") : `<div class="empty-state">No matching orders found.</div>`;
  } catch (err) { $("#myOrders").innerHTML = `<div class="empty-state">${esc(err.message)}</div>`; }
}

async function loadAdmin() {
  const [stats, orders, menu] = await Promise.all([
    request(`${API}/orders/stats`), request(`${API}/orders`), request(`${API}/menu`)
  ]);
  $("#adminStats").innerHTML = [
    ["Total orders", stats.totalOrders], ["Active orders", stats.activeOrders],
    ["Recorded sales", money(stats.revenue)], ["Available dishes", stats.availableMenuItems]
  ].map(([label, value]) => `<div class="admin-stat"><small>${label}</small><b>${value}</b></div>`).join("");
  $("#adminOrders").innerHTML = orders.length ? orders.map(order => `<tr>
    <td>#${order._id.slice(-6).toUpperCase()}<br><small>${new Date(order.createdAt).toLocaleDateString()}</small></td>
    <td>${esc(order.customerName)}<br><small>${esc(order.studentId || "No student ID")}</small></td>
    <td>${order.items.map(item => `${esc(item.name)} × ${item.quantity}`).join("<br>")}</td>
    <td><b>${money(order.totalAmount)}</b></td><td><span class="status ${statusClass(order.status)}">${esc(order.status)}</span></td>
    <td><select data-status="${order._id}" aria-label="Update order status">${["Received","Preparing","Ready","Completed","Cancelled"].map(s => `<option ${s === order.status ? "selected" : ""}>${s}</option>`).join("")}</select></td>
  </tr>`).join("") : `<tr><td colspan="6">No orders yet.</td></tr>`;
  $("#adminMenu").innerHTML = menu.map(item => `<div class="admin-menu-item"><span class="menu-emoji">${esc(item.image)}</span><div><b>${esc(item.name)}</b><small>${money(item.price)} · ${esc(item.category)} · ${item.available ? "Available" : "Unavailable"}</small></div><button data-availability="${item._id}" data-next="${!item.available}">${item.available ? "Mark unavailable" : "Make available"}</button><button data-delete-menu="${item._id}" class="delete-menu-btn">Delete</button></div>`).join("");
}
async function openAdmin() {
  try {
    const auth = await request(`${API}/auth/me`);
    state.isAdmin = auth.isAdmin;
    if (state.isAdmin) {
      $("#loginPanel").classList.add("hidden");
      $("#adminPanel").classList.remove("hidden");
      $("#adminPanel").scrollIntoView({ behavior: "smooth" });
      await loadAdmin();
    } else {
      $("#adminPanel").classList.add("hidden");
      $("#loginPanel").classList.remove("hidden");
      $("#loginPanel").scrollIntoView({ behavior: "smooth" });
    }
  } catch (err) { toast(err.message); }
}

document.addEventListener("click", async event => {
  const add = event.target.closest("[data-add]");
  const qty = event.target.closest("[data-qty]");
  const availability = event.target.closest("[data-availability]");
  const status = event.target.closest("[data-status]");
  if (add) addToCart(add.dataset.add, 1);
  if (qty) { addToCart(qty.dataset.qty, Number(qty.dataset.delta)); renderCart(); }
  if (availability) {
    try {
      await request(`${API}/menu/${availability.dataset.availability}`, { method: "PUT", body: { available: availability.dataset.next === "true" } });
      await loadMenu(); await loadAdmin(); toast("Menu availability updated");
    } catch (err) { toast(err.message); }
  }
  const del = event.target.closest("[data-delete-menu]");
  if (del) {
    if (!confirm("Delete this menu item? This cannot be undone.")) return;
    try {
      await request(`${API}/menu/${del.dataset.deleteMenu}`, { method: "DELETE" });
      delete state.cart[del.dataset.deleteMenu];
      await loadMenu(); await loadAdmin(); renderCartFab(); toast("Menu item deleted");
    } catch (err) { toast(err.message); }
  }
  if (status) {
    try {
      await request(`${API}/orders/${status.dataset.status}/status`, { method: "PATCH", body: { status: status.value } });
      await loadAdmin(); await loadMyOrders(); toast("Order status updated");
    } catch (err) { toast(err.message); }
  }
});
$("#categoryFilters").addEventListener("click", event => {
  const btn = event.target.closest("[data-category]"); if (!btn) return;
  state.category = btn.dataset.category;
  document.querySelectorAll(".filter").forEach(el => el.classList.toggle("active", el === btn));
  renderMenu();
});
$("#searchInput").addEventListener("input", event => { state.search = event.target.value; renderMenu(); });
$("#openCart").addEventListener("click", openCart);
$("#closeCart").addEventListener("click", closeCart);
$("#modalBackdrop").addEventListener("click", event => { if (event.target.id === "modalBackdrop") closeCart(); });
$("#checkoutForm").addEventListener("submit", placeOrder);
$("#refreshOrders").addEventListener("click", loadMyOrders);
$("#adminToggle").addEventListener("click", openAdmin);
$("#closeAdmin").addEventListener("click", () => $("#adminPanel").classList.add("hidden"));
$("#seedMenu").addEventListener("click", async () => {
  try { const result = await request(`${API}/menu/seed`, { method: "POST", body: {} }); toast(result.message); await loadMenu(); await loadAdmin(); }
  catch (err) { toast(err.message); }
});
$("#adminLoginForm").addEventListener("submit", async event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const errorEl = $("#loginError"); errorEl.classList.add("hidden");
  try {
    await request(`${API}/auth/login`, { method: "POST", body: { username: form.get("username"), password: form.get("password") } });
    state.isAdmin = true; event.currentTarget.reset();
    $("#loginPanel").classList.add("hidden"); $("#adminPanel").classList.remove("hidden");
    await loadAdmin(); $("#adminPanel").scrollIntoView({ behavior: "smooth" }); toast("Signed in as admin");
  } catch (err) { errorEl.textContent = err.message; errorEl.classList.remove("hidden"); }
});
$("#closeLogin").addEventListener("click", () => $("#loginPanel").classList.add("hidden"));
$("#adminLogout").addEventListener("click", async () => {
  try { await request(`${API}/auth/logout`, { method: "POST", body: {} }); } catch {}
  state.isAdmin = false; $("#adminPanel").classList.add("hidden"); $("#addMenuForm").classList.add("hidden");
  $("#adminToggle").textContent = "Admin login"; toast("Logged out");
});
$("#showAddMenu").addEventListener("click", () => $("#addMenuForm").classList.toggle("hidden"));
$("#cancelAddMenu").addEventListener("click", () => $("#addMenuForm").classList.add("hidden"));
$("#addMenuForm").addEventListener("submit", async event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  data.price = Number(data.price); data.prepTime = Number(data.prepTime); data.available = true;
  try {
    await request(`${API}/menu`, { method: "POST", body: data });
    event.currentTarget.reset(); $("#addMenuForm").classList.add("hidden");
    await loadMenu(); await loadAdmin(); toast("Menu item added");
  } catch (err) { toast(err.message); }
});
$("#year").textContent = new Date().getFullYear();
loadMenu();
loadMyOrders();
