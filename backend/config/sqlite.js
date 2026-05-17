/**
 * config/sqlite.js
 * Opens (or creates) blinkit_v2.db and exports a shared synchronous DB handle.
 * Place blinkit_v2.db in the backend/ directory (same folder as server.js).
 */
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.resolve(__dirname, '..', 'blinkit_v2.db');

let db;
try {
  db = new Database(DB_PATH);
  
  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');

  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create purchases table
  db.exec(`
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      items TEXT NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'completed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // Create group_carts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS group_carts (
      share_code TEXT PRIMARY KEY,
      host_name TEXT NOT NULL,
      basket_data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log(`✅ SQLite connected (Read/Write): ${DB_PATH}`);
} catch (err) {
  console.error(`❌ SQLite open error: ${err.message}`);
  // Provide a no-op stub so the rest of the server doesn't crash on import
  db = null;
}

module.exports = db;
