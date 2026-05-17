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

const srv = http.createServer(app);
const wss = new ws.Server({ server: srv });

wss.on("connection", (socket) => {
  const cid = Math.random().toString(36).substring(7);
  console.log(`[${cid}] Client Connected`);

  socket.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);

      const normalizeProduct = (row) => ({
        ...row,
        price: parseFloat(String(row.price ?? "0").replace(/[^0-9.]/g, "")) || 0,
      });

      // 🏠 HANDLE HOME CONTENT
      if (data.action === "getHomeContent") {
        const defaultCategories = ["Dairy & Eggs", "Fruits & Vegetables", "Snacks", "Bakery", "Cold Drinks", "Instant Food", "Sweet Tooth", "Atta, Rice & Dal"];

        // Get one image per category
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

        const featuredProducts = db.prepare("SELECT * FROM products ORDER BY RANDOM() LIMIT 10").all().map(normalizeProduct);

        trySend(socket, { action: "homeContent", categories, products: featuredProducts });
      }

      // 🔍 HANDLE SEARCHES
      if (data.action === "search") {
        const { searchTerm } = data;
        
        let prods = [];
        if (searchTerm.toLowerCase() === "popular") {
          prods = db.prepare("SELECT * FROM products ORDER BY RANDOM() LIMIT 20").all().map(normalizeProduct);
        } else {
          const keywords = searchTerm.trim().split(/\s+/).filter((k) => k.length > 0);
          
          if (keywords.length > 0) {
            const conditions = keywords.map(() => "(name LIKE ? OR category LIKE ?)").join(" AND ");
            const params = [];
            keywords.forEach((kw) => {
              params.push(`%${kw}%`, `%${kw}%`);
            });
            
            prods = db.prepare(`SELECT * FROM products WHERE ${conditions} LIMIT 20`).all(...params).map(normalizeProduct);
          }
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