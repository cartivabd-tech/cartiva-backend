// Shared cart logic (client-side, localStorage-backed)
// Cart item format: { productId: string, qty: number }

(function () {
  const STORAGE_KEY = "cartiva_cart_v1";

  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((x) => x && typeof x.productId === "string" && Number.isFinite(x.qty))
        .map((x) => ({ productId: x.productId, qty: clampQty(x.qty) }));
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  function clampQty(qty) {
    const n = Number(qty);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.floor(n));
  }

  function getCartCount() {
    return loadCart().reduce((sum, item) => sum + item.qty, 0);
  }

  function findCartItem(cart, productId) {
    return cart.find((x) => x.productId === productId) || null;
  }

  function addToCart(productId, qty = 1) {
    const q = clampQty(qty);
    if (q <= 0) return;

    const cart = loadCart();
    const existing = findCartItem(cart, productId);

    if (existing) existing.qty += q;
    else cart.push({ productId, qty: q });

    saveCart(cart);
    dispatchCartChanged();
  }

  function setQty(productId, qty) {
    const q = clampQty(qty);
    const cart = loadCart();

    const idx = cart.findIndex((x) => x.productId === productId);
    if (idx === -1) {
      if (q > 0) cart.push({ productId, qty: q });
    } else {
      if (q <= 0) cart.splice(idx, 1);
      else cart[idx].qty = q;
    }

    saveCart(cart);
    dispatchCartChanged();
  }

  function removeFromCart(productId) {
    const cart = loadCart();
    const next = cart.filter((x) => x.productId !== productId);
    saveCart(next);
    dispatchCartChanged();
  }

  function clearCart() {
    saveCart([]);
    dispatchCartChanged();
  }

  function getCartDetailed() {
    const products = window.CartivaProducts || [];
    const map = new Map(products.map((p) => [p.id, p]));

    return loadCart()
      .map((item) => {
        const product = map.get(item.productId);
        if (!product) return null;
        const qty = item.qty;
        return { product, qty, lineTotal: product.price * qty };
      })
      .filter(Boolean);
  }

  function getTotals() {
    const detailed = getCartDetailed();
    const subtotal = detailed.reduce((sum, x) => sum + x.lineTotal, 0);

    // Shipping is calculated at checkout based on delivery location.
    // Keep this method as product-only totals (shipping=0).
    const shipping = 0;
    const tax = 0;
    const total = subtotal + shipping;

    return { subtotal, shipping, tax, total };
  }

  function cartHasFreeDeliveryEligible() {
    const detailed = getCartDetailed();
    return detailed.some((x) => x.product && x.product.deliveryOption === 'free-delivery');
  }

  // ফিক্সড ইংলিশ ফরম্যাট ফাংশন
  function formatMoney(n) {
    const num = Number(n);
    if (!Number.isFinite(num)) return "৳0";
    return "৳" + num.toLocaleString('en-US'); 
  }

  function dispatchCartChanged() {
    window.dispatchEvent(new CustomEvent("cartiva:cartChanged"));
  }

  // Expose globally
  window.CartivaCart = {
    STORAGE_KEY,
    getCartCount,
    addToCart,
    setQty,
    removeFromCart,
    clearCart,
    getCartDetailed,
    getTotals,
    cartHasFreeDeliveryEligible,
    formatMoney,
  };
})();

// Customer auth (backend-based)
(function () {
  const SESSION_KEY = 'cartiva_customer_session_v2';

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.token !== 'string') return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function setSession(sess) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sess));
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function getApiBase() {
    // Render API base URL should be set globally like:
    //   window.CartivaApiBase = 'https://your-backend.onrender.com'
    // You can also override by setting window.CartivaApiBase in each HTML.
    return window.CartivaApiBase || 'https://cartiva-backend.vercel.app';
  }

  async function register(email, password) {
    const res = await fetch(getApiBase() + '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data?.error || 'Sign up failed' };
    }
    return { ok: true };
  }

  async function login(email, password) {
    const res = await fetch(getApiBase() + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) return false;

    setSession({ token: data.token, email: data.user?.email || email });
    return true;
  }

  function logout() {
    clearSession();
  }

  function getCurrentUser() {
    const s = getSession();
    if (!s) return null;
    return { email: s.email };
  }

  window.UserAuth = {
    register,
    login,
    logout,
    getCurrentUser,
    getToken() {
      return getSession()?.token || null;
    },
  };
})();

