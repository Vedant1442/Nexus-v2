const http = require("http");
const ws = require("ws");
const cors = require("cors");
const axios = require("axios");
const morgan = require("morgan");
const express = require("express");
require("dotenv").config();

const searchCache = require("./lib/searchCache");
const quickCommerce = require("./lib/quickCommerce");
const resolveChromiumExecutable = require("./lib/resolveChromiumExecutable");
const { launchBrowser } = require("./lib/launchBrowser");

const extractors = [
  require("./extractors/blinkit"),
  require("./extractors/zepto"),
  require("./extractors/instamart"),
  require("./extractors/bigbasket"),
];

const STREAM_SOURCES = ["blinkit", "zepto", "instamart", "bigbasket"];

const app = express();
const srv = http.createServer(app);
const wss = new ws.Server({ server: srv });

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

/** @typedef {{ blinkit: any[], zepto: any[], instamart: any[], bigbasket: any[] }} ProductBuckets */

/** @returns {ProductBuckets} */
function emptyProducts() {
  return { blinkit: [], zepto: [], instamart: [], bigbasket: [] };
}

// ── GLOBAL STATE ─────────────────────────────────────────────────────────────
const globalPages = {};
const globalCoords = { lat: 19.076, lon: 72.877 };

// ── WARP POOL ────────────────────────────────────────────────────────────────
async function initPool() {
  const detected = resolveChromiumExecutable();
  if (detected) console.log(`🧭 Chromium for scrapers: ${detected}`);
  else
    console.warn(
      "[nexus] No system Chrome/Chromium detected. Install Chrome/Edge or run:\n       cd backend && npx puppeteer browsers install chrome",
    );

  console.log("🚀 Warming up NEXUS V2 Warp Pool...");

  let browser;
  try {
    browser = await launchBrowser();
  } catch (e) {
    console.error("❌ Warp pool bootstrap failed:", e.message);
    return;
  }

  for (const ex of extractors) {
    try {
      const p = await browser.newPage();
      await p.setRequestInterception(true);
      p.on("request", (req) => {
        if (["image", "media", "font"].includes(req.resourceType())) req.abort();
        else req.continue();
      });

      const home =
        ex.name === "blinkit"
          ? "https://blinkit.com/"
          : ex.name === "zepto"
            ? "https://www.zepto.com/"
            : ex.name === "instamart"
              ? "https://www.swiggy.com/instamart"
              : "https://www.bigbasket.com/";

      await p.goto(home, { waitUntil: "domcontentloaded", timeout: 60000 });
      globalPages[ex.name] = p;
      console.log(`✅ ${ex.name} pooled`);
    } catch (e) {
      console.error(`❌ ${ex.name} failed:`, e.message);
    }
  }
}

initPool();

// ── HTTP (health + SKU refresh when QuickCommerce configured) ─────────────
app.get("/api/health", (req, res) => {
  const chrom = resolveChromiumExecutable();
  res.json({
    ok: true,
    quickCommerce: !!process.env.QUICKCOMMERCE_API_KEY,
    searchCacheTtlMs: searchCache.ttlMs(),
    scrapers: {
      active: extractors.map((e) => e.name).filter((n) => !!globalPages[n]),
      pooledCount: extractors.filter((e) => !!globalPages[e.name]).length,
      chromiumDetected: !!chrom,
      chromiumPathHint: chrom,
    },
  });
});

app.get("/api/product-refresh", async (req, res) => {
  const itemId = req.query.item_id || req.query.itemId;
  const platformGuess = req.query.source || req.query.platform || "";
  const platform =
    quickCommerce.qcNameForSource(platformGuess) ||
    String(platformGuess || "").trim();
  const lat = parseFloat(req.query.lat || globalCoords.lat);
  const lon = parseFloat(req.query.lon || globalCoords.lon);

  if (!itemId || !platform) {
    return res.status(422).json({
      error: "Provide item_id and source (blinkit|zepto|instamart|bigbasket) or platform (e.g. BlinkIt).",
    });
  }

  if (!process.env.QUICKCOMMERCE_API_KEY) {
    return res.status(503).json({
      error: "QUICKCOMMERCE_API_KEY not configured; live SKU refresh unavailable.",
    });
  }

  try {
    const items = await quickCommerce.fetchItem(
      platform,
      String(itemId),
      lat,
      lon,
      process.env.DEFAULT_PINCODE
    );
    res.json({
      status: "ok",
      items,
      fetchedAt: new Date().toISOString(),
    });
  } catch (e) {
    const code = e.status && e.status < 600 ? e.status : 503;
    res.status(code).json({ error: e.message || "Upstream error" });
  }
});

// ── SEARCH ENGINE ───────────────────────────────────────────────────────────
function emitSearchResults(socket, /** @type {ProductBuckets} */ products, meta) {
  for (const name of STREAM_SOURCES) {
    const prods = products[name] || [];
    if (prods.length) {
      trySend(socket, {
        action: "streamUpdate",
        source: name,
        products: prods,
      });
    }
  }
  trySend(socket, {
    action: "searchResults",
    products,
    meta: {
      fetchedAt: meta.fetchedAt,
      dataSource: meta.dataSource,
      fromCache: !!meta.fromCache,
      cacheTtlMs: meta.cacheTtlMs ?? searchCache.ttlMs(),
    },
  });
}

async function performScrape(page, query, ex, coords) {
  return new Promise((resolve) => {
    let done = false;
    const timeout = setTimeout(() => {
      if (!done) {
        done = true;
        resolve([]);
      }
    }, 15000);

    const handler = async (res) => {
      if (done) return;
      if (ex.match(res.url())) {
        try {
          const json = await res.json();
          const prods = ex.extract(json);
          if (prods.length > 0) {
            done = true;
            clearTimeout(timeout);
            page.off("response", handler);
            resolve(prods);
          }
        } catch {
          /* ignore parse errors */
        }
      }
    };

    page.on("response", handler);
    void (async () => {
      try {
        const url =
          ex.name === "zepto"
            ? ex.url(query, coords.lat, coords.lon)
            : ex.url(query);
        await page.goto(url, { waitUntil: "commit", timeout: 12000 });
      } catch {
        /* navigate errors fall through timeout */
      }
    })();
  });
}

async function loadFreshProducts(searchTerm, coords, cid) {
  let merged = emptyProducts();
  let dataSource = "scrape";
  let usedQuickCommerce = false;

  if (process.env.QUICKCOMMERCE_API_KEY) {
    const pin = process.env.DEFAULT_PINCODE;
    const groupPlatforms = (
      process.env.QUICKCOMMERCE_GROUP_PLATFORMS || "Zepto,Swiggy,BigBasket"
    ).trim();

    const blinkPromise = quickCommerce
      .searchSinglePlatform(searchTerm, coords.lat, coords.lon, "BlinkIt", pin)
      .then((list) => {
        merged.blinkit = list;
      })
      .catch((e) => {
        console.warn(`[${cid}] BlinkIt /v1/search:`, e.message);
      });

    const groupPromise = groupPlatforms
      ? quickCommerce
          .groupSearch(searchTerm, coords.lat, coords.lon, pin, groupPlatforms)
          .then(({ products }) => {
            for (const k of ["zepto", "instamart", "bigbasket"]) {
              if (products[k]?.length) merged[k] = products[k];
            }
          })
          .catch((e) => {
            console.warn(`[${cid}] QuickCommerce groupsearch:`, e.message);
          })
      : Promise.resolve();

    await Promise.all([blinkPromise, groupPromise]);

    const anyApi =
      merged.blinkit.length ||
      merged.zepto.length ||
      merged.instamart.length ||
      merged.bigbasket.length;
    if (anyApi) {
      usedQuickCommerce = true;
      dataSource = "quickcommerce";
    }
  }

  const scrapeList = extractors.filter((ex) => {
    if (!globalPages[ex.name]) return false;
    if (!usedQuickCommerce) return true;
    return !merged[ex.name]?.length;
  });

  if (!scrapeList.length) return { products: merged, dataSource };

  await Promise.all(
    scrapeList.map(async (ex) => {
      const page = globalPages[ex.name];
      const prods = await performScrape(page, searchTerm, ex, coords).catch(() => []);
      if (prods.length) merged[ex.name] = prods;
    }),
  );

  if (usedQuickCommerce && scrapeList.length) dataSource = "quickcommerce+scrape";

  return { products: merged, dataSource };
}

// ── WEBSOCKET ───────────────────────────────────────────────────────────────
wss.on("connection", (socket) => {
  const cid = Math.random().toString(36).slice(2, 10);
  console.log(`[${cid}] Connected`);

  socket.on("message", async (raw) => {
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return;
    }

    if (data.action === "setLocation") {
      try {
        const res = await axios.get(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(data.location)}&limit=1`,
          { headers: { "User-Agent": "NexusV2/1.0" } }
        );
        if (res.data?.[0]) {
          globalCoords.lat = parseFloat(res.data[0].lat);
          globalCoords.lon = parseFloat(res.data[0].lon);
          trySend(socket, {
            action: "statusUpdate",
            message: "Location Ready",
          });
        }
      } catch {
        /* ignore */
      }
    }

    if (data.action === "search") {
      const searchTerm = data.searchTerm;
      if (!searchTerm) return;
      const bypassCache = !!data.bypassCache;

      void (async () => {
        console.log(`[${cid}] Search: "${searchTerm}" (bypassCache=${bypassCache})`);

        const key = searchCache.makeKey(
          searchTerm,
          globalCoords.lat,
          globalCoords.lon
        );

        if (!bypassCache) {
          const hit = searchCache.get(key);
          if (hit?.products) {
            emitSearchResults(socket, hit.products, {
              fetchedAt: hit.fetchedAt,
              dataSource: hit.dataSource + ":cache",
              fromCache: true,
            });
            return;
          }
        }

        const { products, dataSource } = await loadFreshProducts(
          searchTerm,
          globalCoords,
          cid
        );
        const fetchedAt = new Date().toISOString();
        searchCache.set(key, products, { fetchedAt, dataSource });
        emitSearchResults(socket, products, {
          fetchedAt,
          dataSource,
          fromCache: false,
        });
      })();
    }
  });
});

function trySend(socket, obj) {
  if (socket.readyState === 1) socket.send(JSON.stringify(obj));
}

const PORT = process.env.PORT || 5000;
srv.listen(PORT, () =>
  console.log(`🚀 NEXUS V2 Core Engine on ${PORT}`)
);
