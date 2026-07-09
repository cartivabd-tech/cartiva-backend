// Product catalog for Cartiva
// Each product must have: id, name, price, category, description, image (optional), stock (in-stock|out-of-stock|upcoming), originalPrice

(function () {
  const products = [
    {
      id: "P-3114",
      name: "Awei T53 TWS Colorful Light Wireless Earbuds",
      price: 1450,
      originalPrice: 1570,
      deliveryOption: "delivery-included",
      category: "TWS",
      stock: "in-stock",
      description: "Brand: Awei\nModel T53\nBluetooth version: 5.3 (Jieli chip AC7003D8)\nSupported protocols: HSP, HFP, A2DP, AVRCP\nTalk time: 7H\nPlaying time: 6H\nCharging time: 1H\nStandby time: 200h\nInterface: type-c\nBattery capacity in charging case: 300mAh (with protection plate)\nEarbuds battery capacity: 40mAh*2 (without protection plate but IC)\nBest transmission distance: <1m\nMaximum transmission distance: 10m\nVoice prompt: support\nSensitivity: 104 ± 3dB\nHorn diameter: 10mm\nImpedance: 16Ω\nFrequency response range: 20Hz-20KHz\nMultipoint connection: nonsupport\nManual: Chinese and English\nIncluded accessories: USB charging cable, user manual, and earphones of different sizes\nColorful lights in the charging case: yes\nMetallic paint on the lid\nWaterproof rate: IPX6\nCall noise reduction: DNS\nThey charge for 10 minutes",
      image: "https://easydrop.asia/products/image-1758454201402-383473880.png",
      images: [
        "https://easydrop.asia/products/image-1758454201402-383473880.png",
        "https://easydrop.asia/products/image-1758454201402-467060304.png",
        "https://easydrop.asia/products/image-1758454201401-108447345.png",
        "https://easydrop.asia/products/image-1758454201402-823039863.jpeg"
      ]
    },
    {
      id: "P-3115",
      name: "AWEI T88 ANC (Special Addition) Earbuds With Deep Noise Reduction, -35dB ANC High Definition Sound Quaily. ( 6-Month Official Warranty )",
      price: 1370,
      originalPrice: 1450,
      deliveryOption: "delivery-included",
      category: "TWS",
      stock: "in-stock",
      description: "Bluetooth version: 5.4\n\nSupported protocols: HSP, HFP, A2DP, AVRCP\n\nBattery capacity of earbuds: 35mAh*2 (protection IC)\n\nBattery capacity of charging case: 230mAh (protection board)\n\nCharging time: 1.0h\n\nCall time: 4h\n\nPlay time: 5.5h\n\nStandby time: 200h\n\nHorn diameter: 10mm\n\nSensitivity: 100±3dB\n\nImpedance: 16Ω\n\nMaximum transmission distance: 10m\n\nVoice prompt: supported\n\nMulti-point connection: unsupported\n\nWearing method: in-ear-style\n\nUser manual: Chinese and English\n\nInterface: Type-C\n\nWaterproof rate: IPX6 (earbuds only)\n\nAccessories: USB charging cable",
      image: "https://easydrop.asia/products/image-1758454450924-325850482.png",
      images: [
        "https://easydrop.asia/products/image-1758454450924-325850482.png",
        "https://easydrop.asia/products/image-1758454450925-402913809.jpeg"
      ]
    },
    {
      id: "P-3116",
      name: "AWEI TZ30 Open Ear Clip Bluetooth Headset ( 6-Month Official Warranty )",
      price: 1600,
      originalPrice: 1600,
      deliveryOption: "delivery-included",
      category: "TWS",
      stock: "in-stock",
      description: "Experience ultimate comfort, safety, and crystal-clear sound with Awei Air Conduction Ear Hook Earphones. Designed for sports, outdoor activities, and everyday use, these open-ear wireless headphones combine high-fidelity audio with ergonomic design and advanced features like Active Noise Cancellation (ANC).\n\n🎧 Key Features\n\nStyle: Ear Hook / Open-Ear Conduction – Comfortable, pressure-free fit that keeps ears open and aware of surroundings.\n\nVocalism Principle: Air Conduction for natural, high-fidelity sound.\n\nActive Noise Cancelling (ANC): Block background noise while keeping calls and music clear.\n\nSound Isolating & HiFi Audio: Dual 13mm drivers deliver crisp highs, rich mids, and punchy bass.\n\nWireless Bluetooth Connectivity: Stable connection up to 10 meters with Type-C charging.\n\nLong Battery Life:\n\nEarbuds: 45mAh × 2\n\nCharging Case: 300mAh\n\nStandby Time: Up to 300 hours\n\nWaterproof & Sweatproof: IP-rated for sports and outdoor activities.\n\nMulti-Function Use: Perfect for video games, mobile phones, powersports, office, study, and general outdoor use.\n\nLightweight & Portable: Each earbud weighs only 5g for all-day comfort.\n\nControl & Voice Assistant: Touch controls for music, calls, and Apple Siri support.\n\n📦 Package Includes\n\n1 × Pair of Awei Air Conduction Ear Hook Earphones\n\n1 × Charging Case\n\n1 × USB Type-C Charging Cable",
      image: "https://easydrop.asia/products/image-1758454450924-325850482.png",
      images: ["https://easydrop.asia/products/image-1758454450924-325850482.png"]
    },
    {
      id: "P-3117",
      name: "AWEI T56 ANC Earbuds With Screen Intelligent Interaction ( 6-Month Official Warranty )",
      price: 1800,
      originalPrice: 0,
      deliveryOption: "free-delivery",
      category: "TWS",
      stock: "in-stock",
      description: "Smart screen interactive TWS earbuds with ANC noise cancellation.",
      image: "https://easydrop.asia/products/image-1758454201402-383473880.png", // Replace with actual T56 image if available
      images: ["https://easydrop.asia/products/image-1758454201402-383473880.png"]
    },
    {
      id: "P-3118",
      name: "Awei TA17 ANC True Wireless Earbuds ( 6-Month Official Warranty )",
      price: 1650,
      originalPrice: 1785,
      deliveryOption: "delivery-included",
      category: "TWS",
      stock: "in-stock",
      description: "High-quality ANC true wireless earbuds by Awei.",
      image: "https://easydrop.asia/products/image-1758454450924-325850482.png", // Replace with actual TA17 image if available
      images: ["https://easydrop.asia/products/image-1758454450924-325850482.png"]
    },
    {
      id: "P-3119",
      name: "Awei T92 Anc Pro 6-mic Deep Noise Reduction Wireless Earbuds ( 6-Month Official Warranty )",
      price: 2050,
      originalPrice: 2350,
      deliveryOption: "free-delivery",
      category: "TWS",
      stock: "in-stock",
      description: "Pro 6-mic deep noise reduction wireless earbuds.",
      image: "https://easydrop.asia/products/image-1758454450925-402913809.jpeg", // Replace with actual T92 image if available
      images: ["https://easydrop.asia/products/image-1758454450925-402913809.jpeg"]
    }
  ];

  // Expose globally
  window.CartivaProducts = products;

  // LocalStorage Sync override logic to prevent stale database
  try {
    const raw = localStorage.getItem('cartiva_products_v1');
    if (raw) {
      const saved = JSON.parse(raw);
      if (Array.isArray(saved) && saved.length > 3) {
        window.CartivaProducts = saved;
      } else {
        localStorage.setItem('cartiva_products_v1', JSON.stringify(products));
      }
    } else {
      localStorage.setItem('cartiva_products_v1', JSON.stringify(products));
    }
  } catch (e) {
    localStorage.setItem('cartiva_products_v1', JSON.stringify(products));
  }
})();