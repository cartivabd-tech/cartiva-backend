API summary:

Customer
- POST /api/auth/register { email, password }
- POST /api/auth/login { email, password } -> { token }
- POST /api/orders (authCustomer) payload:
  {
    orderId,
    customerEmail,
    customer: { fullName, phone, email, address, city, postal },
    payment,
    deliveryLocation,
    deliveryCharge,
    totals: { subtotal, delivery, total },
    items: [{ productId, name, price, qty }],
    status
  }

Admin
- POST /api/admin/login { username, password } -> { token }
- POST /api/products (authAdmin) payload:
  { id, name, price, originalPrice, stock, deliveryOption, category, description, image, images }
- DELETE /api/products/:id (authAdmin)
- POST /api/settings (authAdmin) payload:
  { logoUrl, waUrl, fbUrl, igUrl, tikTokUrl }
- GET /api/admin/orders (authAdmin) -> { orders: [...] }

