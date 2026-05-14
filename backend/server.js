const express = require("express");
const http = require("http");
const ws = require("ws");
const puppeteer = require("puppeteer");
const path = require("path");
const blinkitApi = require("./services/blinkit");

const app = express();
const srv = http.createServer(app);
const wss = new ws.Server({ server: srv });

// Store browser instances (Now used as fallback/session refreshers)
let globalBrowser = null;
let globalPages = {};
let globalCoords = { lat: 19.076, lon: 72.877 };

async function initPool() {
  console.log("🚀 Warming up NEXUS V2 (Blinkit Mode) Warp Pool...");
  // We keep Puppeteer only as a background "session warmer" to ensure cookies are fresh
  try {
    globalBrowser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-web-security"]
    });
    const page = await globalBrowser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36");
    await page.goto("https://blinkit.com", { waitUntil: "networkidle2", timeout: 30000 });
    console.log("✅ Warp Pool session warmed up");
    globalPages["blinkit"] = page;
  } catch (e) {
    console.error("❌ Pool Warmup Error (Proceeding with API-only mode):", e.message);
  }
}

initPool();

wss.on("connection", (socket) => {
  const cid = Math.random().toString(36).substring(7);
  console.log(`[${cid}] Warp Connected`);

  socket.on("message", async (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.action === "getHomeContent") {
        console.log(`[${cid}] Fetching Home via API...`);
        const categories = await blinkitApi.getLayout(globalCoords.lat, globalCoords.lon);
        
        if (categories.length > 0) {
          trySend(socket, { action: "homeContent", categories, products: [] });
        } else {
          // Robust Fallback
          const fallback = [
            { name: "Dairy & Eggs", image: "https://cdn.grofers.com/app/images/category/cms_images/rc-upload-1700735371138-2", id: "1" },
            { name: "Fruits & Veg", image: "https://cdn.grofers.com/app/images/category/cms_images/rc-upload-1702384236960-4", id: "2" },
            { name: "Snacks", image: "https://cdn.grofers.com/app/images/category/cms_images/rc-upload-1700735371138-13", id: "3" }
          ];
          trySend(socket, { action: "homeContent", categories: fallback, products: [] });
        }
      }

      if (data.action === "search") {
        const { searchTerm } = data;
        console.log(`[${cid}] API Search: "${searchTerm}"`);
        
        const prods = await blinkitApi.search(searchTerm, globalCoords.lat, globalCoords.lon);
        trySend(socket, { action: "searchResults", products: { blinkit: prods } });
      }

    } catch (e) {
      console.error(`[${cid}] Message Error:`, e.message);
    }
  });
});

function trySend(socket, obj) {
  if (socket.readyState === ws.OPEN) socket.send(JSON.stringify(obj));
}

const PORT = 5000;
srv.listen(PORT, "0.0.0.0", () => {
  console.log(`\x1b[32m🚀 NEXUS V2 BLINKIT CORE ACTIVE ON ${PORT}\x1b[0m`);
  console.log(`\x1b[36m📡 Integration: Atanu-Prasun Postman Collection v1\x1b[0m`);
});
