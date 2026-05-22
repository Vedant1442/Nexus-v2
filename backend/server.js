const express = require("express");
const http = require("http");
const ws = require("ws");
const cors = require("cors");
const Database = require("better-sqlite3"); // Assuming you use better-sqlite3, or adapt to standard sqlite3
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// 🔌 Connect directly to your local SQLite file
const dbPath = path.join(__dirname, "blinkit_v2.db");
const db = new Database(dbPath, { readonly: true }); // Open in read-only mode for safety on Render!

console.log("⚡ Connected to local SQLite Catalog successfully!");

// Strip currency symbols and parse price to Number
const normalizeProduct = (row) => ({
  ...row,
  price: parseFloat(String(row.price ?? "0").replace(/[^0-9.]/g, "")) || 0,
});

// 🧠 Simple in-memory cache for home content to avoid expensive DB operations on every connection
let homeContentCache = {
  data: null,
  timestamp: 0,
  TTL: 5 * 60 * 1000, // 5 minutes
};

function getHomeContent() {
  const now = Date.now();
  if (homeContentCache.data && (now - homeContentCache.timestamp < homeContentCache.TTL)) {
    return homeContentCache.data;
  }

  const defaultCategories = ["Dairy & Eggs", "Fruits & Vegetables", "Snacks", "Bakery", "Cold Drinks", "Instant Food", "Sweet Tooth", "Atta, Rice & Dal"];

  // Get one image per category - optimized with index
  const catImageRows = db.prepare(`
    SELECT category, image FROM products
    WHERE category IS NOT NULL AND image IS NOT NULL
    GROUP BY category
  `).all();

  const catImageMap = {};
  catImageRows.forEach((r) => { catImageMap[r.category] = r.image; });

  let catRows = Object.keys(catImageMap).sort(() => 0.5 - Math.random()).slice(0, 10);
  while (catRows.length < 10) catRows.push(defaultCategories[catRows.length] || `Category ${catRows.length + 1}`);

  const categories = catRows.map((cat, i) => ({
    id: String(i + 1),
    name: cat,
    image: catImageMap[cat] || null,
  }));

  // Featured: 10 random products - still a bit heavy but cached now
  const featuredProducts = db.prepare("SELECT * FROM products ORDER BY RANDOM() LIMIT 10").all().map(normalizeProduct);

  homeContentCache = {
    data: { categories, products: featuredProducts },
    timestamp: now,
    TTL: homeContentCache.TTL
  };

  return homeContentCache.data;
}

// 🧠 Search cache to dedupe frequent queries
const searchCache = new Map();
const SEARCH_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

function getCachedSearch(query) {
  const hit = searchCache.get(query);
  if (hit && (Date.now() - hit.timestamp < SEARCH_CACHE_TTL)) {
    return hit.products;
  }
  return null;
}

function setCachedSearch(query, products) {
  if (searchCache.size > 100) {
    const firstKey = searchCache.keys().next().value;
    searchCache.delete(firstKey);
  }
  searchCache.set(query, { products, timestamp: Date.now() });
}

const srv = http.createServer(app);
const wss = new ws.Server({ server: srv });

wss.on("connection", (socket) => {
  const cid = Math.random().toString(36).substring(7);
  console.log(`[${cid}] Client Connected`);

  socket.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);

      // 🏠 HANDLE HOME CONTENT
      if (data.action === "getHomeContent") {
        const { categories, products } = getHomeContent();
        trySend(socket, { action: "homeContent", categories, products });
      }

      // 🔍 HANDLE SEARCHES
      if (data.action === "search") {
        const { searchTerm } = data;
        const normalizedTerm = searchTerm.trim().toLowerCase();

        let prods = getCachedSearch(normalizedTerm);
        
        if (!prods) {
          if (normalizedTerm === "popular") {
            // Re-use featured products for popular search if available, otherwise fetch
            const home = getHomeContent();
            prods = home.products.slice(0, 20);
            if (prods.length < 10) {
               prods = db.prepare("SELECT * FROM products ORDER BY RANDOM() LIMIT 20").all().map(normalizeProduct);
            }
          } else {
            const keywords = normalizedTerm.split(/\s+/).filter((k) => k.length > 0);
            
            if (keywords.length > 0) {
              const conditions = keywords.map(() => "(name LIKE ? OR category LIKE ?)").join(" AND ");
              const params = [];
              keywords.forEach((kw) => {
                const term = `%${kw}%`;
                params.push(term, term);
              });

              prods = db.prepare(`SELECT * FROM products WHERE ${conditions} LIMIT 20`).all(...params).map(normalizeProduct);
            } else {
              prods = [];
            }
          }
          setCachedSearch(normalizedTerm, prods);
        }

        trySend(socket, { action: "streamUpdate", source: "blinkit", products: prods });
        trySend(socket, { action: "searchResults", total: prods.length });
      }

    } catch (e) {
      console.error(`[${cid}] Error:`, e.message);
    }
  });
});

function trySend(socket, obj) {
  if (socket.readyState === ws.OPEN) socket.send(JSON.stringify(obj));
}

const PORT = process.env.PORT || 5000;
srv.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 NEXUS V2 CORE ACTIVE ON PORT ${PORT}`);
});