## Fix: Cart Item Key Mismatch & Order Storage Bugs

### Bugs Fixed

#### 1. Cart Item Key Mismatch (`item.id` vs `item.productId`)
The `CartivaCart` module in `js/app.js` stores cart items as `{ productId, qty }`, but `checkout.html` and `cart.html` were reading them using `item.id` instead of `item.productId`. This caused:
- Products not found in `liveProducts` → names/prices showed as undefined/0 on checkout
- Quantity update/remove functions failing silently in `cart.html`
- Backend order API receiving items with empty `productId`, causing 400 rejections

**Files fixed:** `checkout.html`, `cart.html`

#### 2. Login Redirect Absolute Path
`login.html` used absolute paths (`/index.html`) which could break on subpath or local deployments.

**File fixed:** `login.html`

### Testing
- ✅ All **52 backend tests pass** across 6 test suites
- Suites: `store.test.js`, `auth.test.js`, `orders.test.js`, `admin.test.js`, `health.test.js`, `middleware.test.js`

