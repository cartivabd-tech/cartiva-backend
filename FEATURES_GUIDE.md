# Cartiva E-Commerce - New Features Guide

## 🎯 Quick Start

### Admin Panel Access
1. Go to `admin.html`
2. Login with: **Username: admin | Password: admin123**

---

## 📋 Customer Orders Management

### View Customer Orders
- Access the **"Customer Orders"** section in the admin panel
- See all customer details:
  - Order ID
  - Customer Name, Phone, Email
  - Delivery Address & City
  - Payment Method Used
  - Total Amount Paid
  - Items Ordered

### Order Actions
- **View Button**: Click to see complete order details with items list
- **Clear All Orders**: Remove all orders (cannot be undone)

### Order Data Location
- Stored in browser: `localStorage` → `cartiva_orders_v1`
- Automatically saved when customers complete checkout

---

## 💰 Pricing Management

### Add Discount Prices
1. In admin panel → **Product Manager** section
2. Fill in fields:
   - **Original Price**: Original product price (e.g., 16.99)
   - **Discount Price**: Selling price (e.g., 12.99)
3. Click "Save product"

### Display
- **Shop page**: Shows original price with strikethrough, displays discount price
- **Product detail**: Shows both prices
- **Cart**: Shows discount pricing for each item

### Example
```
Original Price: ৳16.99 ← (strikethrough)
Discount Price: ৳12.99 ← (main price shown)
```

---

## 📦 Stock Management

### Stock Status Options
1. **In Stock** ✅ (Green badge)
   - Product available for purchase
   - "Add" button enabled on shop

2. **Out of Stock** ❌ (Red badge)
   - Product unavailable
   - "Add" button shows "Out" and is disabled

3. **Upcoming** ⏳ (Orange badge)
   - Product coming soon
   - "Add" button shows "Coming" and is disabled

### How to Set Stock Status
1. In admin panel → **Product Manager**
2. Select **Stock Status** dropdown
3. Choose one of the three options
4. Click "Save product"

### Customer View
- Stock badges appear on:
  - Shop page (index.html)
  - Product detail page (product.html)
  - Shopping cart (cart.html)
- Color-coded for quick recognition
- Disabled buttons prevent purchases of unavailable items

---

## ⚙️ Admin Panel Operations

### Create New Product
1. Fill all fields:
   - Product ID (unique)
   - Name
   - Original Price
   - Discount Price
   - Stock Status
   - Category
   - Description
   - Image URL (optional)
   - Image color (for auto-generated images)
2. Click "Save product"

### Edit Existing Product
1. Find product in "Existing products" table
2. Click "Edit"
3. Form auto-fills with current data
4. Make changes
5. Click "Save product"

### Delete Product
1. Find product in "Existing products" table
2. Click "Delete"
3. Confirm deletion

### Import Defaults
- Click "Import defaults" to restore sample products
- Overwrites current product list

### Clear Form
- Click "Clear" to reset all input fields

---

## 🔄 Data Synchronization

### Where Data is Stored
```javascript
cartiva_products_v1      // All products with prices and stock
cartiva_orders_v1        // All customer orders
cartiva_admin_session_v1 // Admin login session
cartiva_logo_url_v1      // Custom store logo
```

### Changes Apply Immediately
- Products edited in admin panel
- Visible instantly on shop pages (after page refresh)
- Cart updates with new prices automatically

---

## 📊 Example Workflow

### 1. Add a Product with Discount
```
Product ID: p_shirt_001
Name: Premium Cotton T-Shirt
Original Price: 25.99
Discount Price: 19.99
Stock: In Stock
Category: Fashion
Description: High-quality cotton shirt
```

### 2. Customer Views Product
- Sees: ~~৳25.99~~ **৳19.99** with "In Stock" badge
- Can add to cart

### 3. Product Goes Out of Stock
- Admin changes Stock to "Out of Stock"
- Customer sees: "Out of Stock" badge (red)
- "Add" button shows "Out" (disabled)
- Cannot purchase

### 4. View Customer Order
- Go to "Customer Orders" in admin
- Click "View" on order
- See all details: items, customer info, payment method, total

---

## 🎨 Stock Status Colors

| Status | Color | Hex | Display |
|--------|-------|-----|---------|
| In Stock | Green | #22c55e | Buy available |
| Out of Stock | Red | #ef4444 | Cannot buy |
| Upcoming | Orange | #f59e0b | Coming soon |

---

## 💡 Tips

1. **Always set prices correctly**: Discount price should be lower than original
2. **Use meaningful Product IDs**: e.g., `p_shirt_001` instead of `p1`
3. **Monitor orders**: Check "Customer Orders" regularly
4. **Backup your data**: Export localStorage periodically
5. **Test changes**: Always refresh shop page after admin changes

---

## ❓ FAQ

**Q: How long is order data stored?**
A: Orders stay in browser localStorage until you clear them manually.

**Q: Can I change prices for existing products?**
A: Yes! Edit the product and update both original and discount prices.

**Q: What happens to products when I clear the form?**
A: The form clears, but previously saved products remain in the system.

**Q: Can customers see the original price?**
A: Yes, it's shown with a strikethrough when there's a discount.

**Q: How do I export customer orders?**
A: Open browser DevTools > Application > Local Storage > cartiva_orders_v1 > Copy JSON

---

**Version:** 1.0 | **Last Updated:** June 2026
