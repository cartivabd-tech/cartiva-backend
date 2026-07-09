# Cartiva - Implementation TODO

- [x] Add TikTok link everywhere (shop topbar + admin settings + cart/checkout topbar)
- [x] Implement free-delivery pricing rule in cart + checkout totals:
  - [x] Delivery charge = 0 if any cart item has `deliveryOption === "free-delivery"`
  - [x] Else inside Dhaka = 60, outside Dhaka = 120
- [x] Implement product click popup photo gallery on `index.html`:
  - [x] Modal overlay with all product images as thumbnails
  - [x] Show product details (name, category, description, original/discount price, stock)
  - [x] Add-to-cart button inside modal (disabled for out-of-stock)
- [x] Update global settings storage in admin to include TikTok URL
- [x] Add customer login/signup and logout option on shop/cart/checkout/product pages
- [x] Gate checkout: user must be logged in to place orders
- [ ] Update `product.html` free-delivery badge to match the same deliveryOption rule (UI already exists; verify)





