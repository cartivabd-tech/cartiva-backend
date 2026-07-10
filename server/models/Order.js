// অর্ডার সাবমিট করার রিয়েল-টাইম এপিআই হ্যান্ডলিং লজিক (স্কিমা অনুযায়ী ফিক্সড)
    document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if(currentCart.length === 0) {
        showToast('Your cart is empty! Add products first.');
        return;
      }

      const selectedOption = deliverySelect.options[deliverySelect.selectedIndex];
      const shippingCost = Number(selectedOption.getAttribute('data-cost') || 60);
      const deliveryLocText = selectedOption.text;
      
      let subtotal = 0;
      const parsedItems = currentCart.map(item => {
        const itemId = item.id || item.productId;
        const p = liveProducts.find(x => (x.id === itemId || x._id === itemId)) || item;
        subtotal += Number(p.price || 0) * Number(item.qty || item.quantity || 1);
        return {
          productId: itemId,
          name: p.name,
          price: Number(p.price),
          qty: Number(item.qty || item.quantity || 1)
        };
      });

      const userEmail = document.getElementById('email').value;

      // আপনার order.js মঙ্গুস স্কিমার সাথে ১০০% সিঙ্ক করা পেলোড
      const orderPayload = {
        customerEmail: userEmail, // required ফিল্ড ম্যাচ করা হলো
        customer: {
          fullName: document.getElementById('fullName').value, // name -> fullName
          phone: document.getElementById('phone').value,
          email: userEmail,
          address: document.getElementById('address').value,
          city: document.getElementById('city').value,
          postal: document.getElementById('postalCode').value // postalCode -> postal
        },
        payment: document.getElementById('paymentMethod').value, // paymentMethod -> payment
        deliveryLocation: deliveryLocText,
        deliveryCharge: shippingCost,
        totals: { // রুট লেভেল থেকে totals অবজেক্টের ভেতরে নেওয়া হলো
          subtotal: subtotal,
          delivery: shippingCost,
          total: subtotal + shippingCost
        },
        items: parsedItems
      };

      try {
        showToast('Processing order...');
        
        const targetApiUrl = window.CartivaApiBase.endsWith('/') 
          ? window.CartivaApiBase + 'api/orders' 
          : window.CartivaApiBase + '/api/orders';

        const res = await fetch(targetApiUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          mode: 'cors',
          body: JSON.stringify(orderPayload)
        });

        const data = await res.json();

        if(res.ok || res.status === 201) {
          showToast('Order placed successfully!');
          clearLocalCart();
          setTimeout(() => {
            alert(`Order Successful!\nYour Order ID: ${data.orderId || (data.order && data.order.orderId) || 'ORD-SUCCESS'}`);
            window.location.href = 'index.html';
          }, 800);
        } else {
          console.error("Server validation failed:", data);
          showToast(data.message || 'Server rejected the order.');
        }
      } catch(err) {
        console.error("Network or MongoDB connection dropped.", err);
        showToast('Network error, trying again...');
      }
    });

    function clearLocalCart() {
      if (window.CartivaCart && typeof window.CartivaCart.clearCart === 'function') {
        window.CartivaCart.clearCart();
      } else {
        localStorage.removeItem('cartiva_cart_v1');
        window.dispatchEvent(new CustomEvent('cartiva:cartChanged'));
      }
    }