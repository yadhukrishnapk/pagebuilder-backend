// One-shot seed script: node src/seedProducts.js
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import Product from "./models/Product.js";

dotenv.config();

const BRANDS = ["Zara", "H&M", "Mango", "Biba", "Forever New", "Shein", "Urbanic", "Only", "Missguided", "Nike", "Adidas", "Puma", "Levi's", "Uniqlo"];

const CATALOG = {
  Tops: {
    titles: ["Crew Neck Tee", "V-Neck Tee", "Striped Polo", "Henley Shirt", "Oversized Tee", "Cropped Tank", "Button Down Shirt", "Knit Sweater", "Hoodie", "Silk Blouse"],
    price: [699, 2499],
    img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
  },
  Bottoms: {
    titles: ["Slim Fit Jeans", "Wide Leg Trousers", "Chino Pants", "Cargo Pants", "Pleated Skirt", "Denim Shorts", "Jogger Pants", "Palazzo Pants", "Pencil Skirt", "Track Pants"],
    price: [999, 3499],
    img: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800",
  },
  "Ethnic Wear": {
    titles: ["Anarkali Kurti", "Banarasi Saree", "Chikankari Kurta", "Silk Dupatta", "Lehenga Choli", "Embroidered Sherwani", "Cotton Salwar Suit", "Bandhani Dupatta", "Phulkari Kurta", "Indo-Western Gown"],
    price: [1299, 7999],
    img: "https://images.unsplash.com/photo-1610189844229-1c3c9f04c04f?w=800",
  },
  Outerwear: {
    titles: ["Puffer Jacket", "Wool Coat", "Leather Biker Jacket", "Denim Jacket", "Trench Coat", "Bomber Jacket", "Parka", "Windbreaker", "Faux Fur Coat", "Quilted Vest"],
    price: [2499, 9999],
    img: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800",
  },
  Activewear: {
    titles: ["Performance Leggings", "Sports Bra", "Running Shorts", "Compression Tee", "Yoga Pants", "Track Jacket", "Athletic Tank", "Gym Hoodie", "Tennis Skirt", "Cycling Shorts"],
    price: [899, 3299],
    img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
  },
  Footwear: {
    titles: ["White Sneakers", "Running Shoes", "Leather Loafers", "Ankle Boots", "Platform Heels", "Ballet Flats", "Canvas Slip-Ons", "Chunky Sandals", "Hiking Boots", "Derby Shoes"],
    price: [1499, 6999],
    img: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800",
  },
  Accessories: {
    titles: ["Leather Belt", "Silk Scarf", "Wool Beanie", "Aviator Sunglasses", "Gold Chain Necklace", "Woven Hat", "Bucket Hat", "Tie Set", "Suspenders", "Printed Bandana"],
    price: [299, 2999],
    img: "https://images.unsplash.com/photo-1611923134239-b9be5816e23d?w=800",
  },
  Bags: {
    titles: ["Tote Bag", "Crossbody Bag", "Leather Backpack", "Clutch", "Bucket Bag", "Duffel Bag", "Messenger Bag", "Mini Sling", "Laptop Sleeve", "Weekender"],
    price: [899, 6999],
    img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800",
  },
  Jewelry: {
    titles: ["Pearl Earrings", "Gold Hoops", "Layered Necklace", "Charm Bracelet", "Stackable Rings", "Statement Earrings", "Pendant Necklace", "Cuff Bracelet", "Anklet", "Brooch"],
    price: [399, 4999],
    img: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800",
  },
  Swimwear: {
    titles: ["Halter Bikini", "One-Piece Swimsuit", "High Waist Bikini", "Rash Guard", "Boardshorts", "Tankini", "String Bikini", "Sport Swimsuit", "Crochet Bikini", "Monokini"],
    price: [799, 3499],
    img: "https://images.unsplash.com/photo-1570976447640-ac859286962d?w=800",
  },
  Nightwear: {
    titles: ["Silk Pajama Set", "Cotton Nightie", "Satin Robe", "Lounge Shorts Set", "Flannel PJs", "Kimono Robe", "Sleep Tee", "Nightgown", "Cami Set", "Thermal Sleepwear"],
    price: [699, 2999],
    img: "https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800",
  },
  Loungewear: {
    titles: ["Fleece Hoodie Set", "Ribbed Lounge Set", "Oversized Sweatshirt", "Lounge Pants", "Co-ord Set", "Matching Jogger Set", "Knit Lounge Top", "Plush Robe", "Terry Shorts", "Henley Lounge Set"],
    price: [999, 3999],
    img: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800",
  },
  "Formal Wear": {
    titles: ["Slim Fit Suit", "Tailored Blazer", "Pencil Dress", "Pleated Midi Skirt", "Oxford Dress Shirt", "Silk Blouse", "Wool Trousers", "Tuxedo Set", "Cocktail Dress", "Sheath Dress"],
    price: [1999, 12999],
    img: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800",
  },
  "Winter Collection": {
    titles: ["Wool Sweater", "Thermal Base Layer", "Fleece Lined Leggings", "Snow Boots", "Beanie & Glove Set", "Puffer Parka", "Cable Knit Cardigan", "Flannel Shirt", "Corduroy Pants", "Faux Shearling Jacket"],
    price: [1299, 7999],
    img: "https://images.unsplash.com/photo-1520975916090-3105956dac38?w=800",
  },
  "Summer Collection": {
    titles: ["Linen Shirt", "Cotton Shorts", "Sundress", "Straw Hat", "Espadrilles", "Breezy Tunic", "Flutter Sleeve Top", "Board Shorts", "Crochet Dress", "Tropical Print Shirt"],
    price: [699, 2999],
    img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800",
  },
};

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function slugify(s) {
  return s.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-|-$/g, "");
}

async function run() {
  await connectDB();

  // Find highest existing "pN" id so we don't collide
  const existing = await Product.find({ id: /^p\d+$/ }).select("id");
  const maxN = existing.reduce((m, p) => {
    const n = parseInt(p.id.slice(1), 10);
    return isFinite(n) && n > m ? n : m;
  }, 0);

  let nextN = maxN + 1;
  const toInsert = [];

  for (const [category, cfg] of Object.entries(CATALOG)) {
    for (const title of cfg.titles) {
      const brand = pick(BRANDS);
      const price = rand(cfg.price[0], cfg.price[1]);
      const discount = rand(0, 40);
      const finalPrice = Math.round(price * (1 - discount / 100));
      toInsert.push({
        id: `p${nextN++}`,
        title,
        slug: slugify(`${title}-${brand}`),
        description: `${title} by ${brand}. ${category.toLowerCase()} piece with quality materials and modern fit.`,
        category,
        subCategory: category,
        brand,
        price,
        discountPercentage: discount,
        finalPrice,
        currency: "INR",
        sizes: pick([["S", "M", "L"], ["XS", "S", "M", "L", "XL"], ["One Size"], ["6", "7", "8", "9", "10"]]),
        colors: [
          { name: pick(["Black", "White", "Navy", "Olive", "Cream", "Red", "Blue"]), hex: pick(["#000", "#fff", "#1e3a8a", "#556b2f", "#f5f5dc", "#dc2626", "#2563eb"]) },
        ],
        stock: rand(5, 120),
        rating: (rand(35, 50) / 10),
        reviewsCount: rand(10, 500),
        thumbnail: `${cfg.img}&sig=${nextN}`,
        isNewArrival: Math.random() < 0.3,
        isTrending: Math.random() < 0.25,
        isBestSeller: Math.random() < 0.2,
      });
    }
  }

  const result = await Product.insertMany(toInsert);
  console.log(`Inserted ${result.length} products across ${Object.keys(CATALOG).length} categories`);
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
