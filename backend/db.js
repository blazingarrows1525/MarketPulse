import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
const dataDir = isVercel ? "/tmp/data" : path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "marketpulse.db");
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma("journal_mode = WAL");

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS watchlist (
    ticker TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sector TEXT,
    alertThreshold REAL,
    addedAt TEXT NOT NULL,
    position INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS user_session (
    id TEXT PRIMARY KEY,
    lastChecked TEXT NOT NULL,
    previousSnapshotTime TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS detected_changes (
    id TEXT PRIMARY KEY,
    ticker TEXT NOT NULL,
    name TEXT NOT NULL,
    attentionScore INTEGER NOT NULL,
    signalType TEXT NOT NULL,
    changeLevel TEXT NOT NULL,
    changeSinceLast REAL NOT NULL,
    price REAL NOT NULL,
    whyChanged TEXT NOT NULL,
    whyMatters TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    dismissed INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    ticker TEXT,
    description TEXT NOT NULL,
    time TEXT NOT NULL,
    timestamp INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Seed default watchlist if empty
const countStmt = db.prepare("SELECT COUNT(*) as count FROM watchlist");
const { count } = countStmt.get();

if (count === 0) {
  const insertWatchlist = db.prepare(`
    INSERT INTO watchlist (ticker, name, sector, alertThreshold, addedAt, position)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const initialStocks = [
    { ticker: "RELIANCE.NS", name: "Reliance Industries", sector: "Energy", alertThreshold: 1450, pos: 1 },
    { ticker: "HDFCBANK.NS", name: "HDFC Bank", sector: "Banking", alertThreshold: 1680, pos: 2 },
    { ticker: "INFY.NS", name: "Infosys", sector: "Technology", alertThreshold: 1850, pos: 3 },
    { ticker: "TCS.NS", name: "TCS", sector: "Technology", alertThreshold: 4000, pos: 4 },
    { ticker: "BAJFINANCE.NS", name: "Bajaj Finance", sector: "NBFC", alertThreshold: 7000, pos: 5 },
    { ticker: "TATAMOTORS.NS", name: "Tata Motors", sector: "Auto", alertThreshold: 900, pos: 6 },
    { ticker: "ZOMATO.NS", name: "Zomato", sector: "Consumer Tech", alertThreshold: 250, pos: 7 },
    { ticker: "WIPRO.NS", name: "Wipro", sector: "Technology", alertThreshold: 500, pos: 8 },
  ];

  const now = new Date().toISOString();
  for (const s of initialStocks) {
    insertWatchlist.run(s.ticker, s.name, s.sector, s.alertThreshold, now, s.pos);
  }
}

// Seed default user session if empty
const sessionCount = db.prepare("SELECT COUNT(*) as count FROM user_session").get().count;
if (sessionCount === 0) {
  const twoHoursAgo = new Date(Date.now() - 2.25 * 60 * 60 * 1000).toISOString();
  db.prepare(`
    INSERT INTO user_session (id, lastChecked, previousSnapshotTime)
    VALUES ('default_user', ?, ?)
  `).run(twoHoursAgo, twoHoursAgo);
}

// Seed default initial activity if empty
const actCount = db.prepare("SELECT COUNT(*) as count FROM activities").get().count;
if (actCount === 0) {
  const insertAct = db.prepare(`
    INSERT INTO activities (id, type, ticker, description, time, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const initialActivities = [
    { id: "a1", type: "alert", ticker: "HDFCBANK.NS", description: "Your ₹1,680 price alert for HDFCBANK was triggered.", time: "38 min ago", ts: Date.now() - 38 * 60000 },
    { id: "a2", type: "visited", ticker: "INFY.NS", description: "You last viewed INFY detail page.", time: "2h 14m ago", ts: Date.now() - 134 * 60000 },
    { id: "a3", type: "threshold", ticker: "BAJFINANCE.NS", description: "BAJFINANCE broke below your watched level of ₹7,000.", time: "1h 22m ago", ts: Date.now() - 82 * 60000 },
    { id: "a4", type: "added", ticker: "ZOMATO.NS", description: "You added ZOMATO to your watchlist.", time: "3 days ago", ts: Date.now() - 3 * 86400000 },
    { id: "a5", type: "dismissed", ticker: "WIPRO.NS", description: "You dismissed a volume alert for WIPRO.", time: "4 days ago", ts: Date.now() - 4 * 86400000 },
  ];

  for (const a of initialActivities) {
    insertAct.run(a.id, a.type, a.ticker, a.description, a.time, a.ts);
  }
}

export default db;
