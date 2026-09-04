import cors from "cors";
import express from "express";
import db from "./db.js";
import { evaluateChange } from "./services/changeEngine.js";
import { getMarketStatus, getNews, getQuote, getSparkline, searchStocks } from "./services/marketService.js";

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json());

function formatTimeAgo(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hours < 24) return `${hours}h ${remMins}m ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const DEFAULT_SETTINGS = {
  notifySignificant: "true",
  notifyVolumeSpikes: "true",
  notifyThresholds: "true",
  notifyMarketStatus: "true",
  autoRefreshInterval: "60",
  attentionScoreThreshold: "60",
  dataProvider: "Yahoo Finance API",
  userName: "Sneha",
  userEmail: "sneha@marketpulse.io",
};

// ----------------------------------------------------
// 1. MARKET OVERVIEW & STATUS (GET /api/market & /api/market/overview)
// ----------------------------------------------------
const handleMarketOverview = async (req, res) => {
  try {
    const status = getMarketStatus();

    const [nifty, sensex, bank, it] = await Promise.all([
      getQuote("^NSEI").catch(() => ({ price: 24677.80, changeToday: 0.34 })),
      getQuote("^BSESN").catch(() => ({ price: 81224.75, changeToday: 0.29 })),
      getQuote("^NSEBANK").catch(() => ({ price: 52301.45, changeToday: -0.12 })),
      getQuote("NIFTY_IT.NS").catch(() => ({ price: 39854.20, changeToday: 1.47 })),
    ]);

    const indices = [
      { name: "NIFTY 50", value: nifty.price.toLocaleString("en-IN"), change: `${nifty.changeToday >= 0 ? "+" : ""}${nifty.changeToday}%`, pos: nifty.changeToday >= 0 },
      { name: "SENSEX", value: sensex.price.toLocaleString("en-IN"), change: `${sensex.changeToday >= 0 ? "+" : ""}${sensex.changeToday}%`, pos: sensex.changeToday >= 0 },
      { name: "NIFTY BANK", value: bank.price.toLocaleString("en-IN"), change: `${bank.changeToday >= 0 ? "+" : ""}${bank.changeToday}%`, pos: bank.changeToday >= 0 },
      { name: "NIFTY IT", value: it.price.toLocaleString("en-IN"), change: `${it.changeToday >= 0 ? "+" : ""}${it.changeToday}%`, pos: it.changeToday >= 0 },
    ];

    const sectors = [
      { name: "Information Technology", change: "+1.47%", pos: true },
      { name: "Energy", change: "+1.12%", pos: true },
      { name: "Auto", change: "+0.87%", pos: true },
      { name: "Banking", change: "-0.12%", pos: false },
      { name: "NBFC", change: "-1.23%", pos: false },
      { name: "Consumer Tech", change: "+2.31%", pos: true },
    ];

    res.json({ status, indices, sectors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

app.get("/api/market", handleMarketOverview);
app.get("/api/market/overview", handleMarketOverview);

// ----------------------------------------------------
// 2. STOCKS LIST & SEARCH (GET /api/stocks, GET /api/stocks/search)
// ----------------------------------------------------
app.get("/api/stocks", async (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM watchlist ORDER BY position ASC").all();
    const stocks = await Promise.all(
      rows.map(async (row) => {
        const quote = await getQuote(row.ticker);
        const sparkline = await getSparkline(row.ticker);
        const evalRes = await evaluateChange(quote, row.alertThreshold);

        return {
          id: row.ticker,
          ticker: row.ticker,
          name: row.name || quote.name,
          sector: row.sector || quote.sector || "Equity",
          price: quote.price,
          changeToday: quote.changeToday,
          changeSinceLast: evalRes.changeSinceLast,
          volumeRatio: quote.volumeRatio,
          attentionScore: evalRes.attentionScore,
          signalType: evalRes.signalType,
          changeLevel: evalRes.changeLevel,
          whyChanged: evalRes.whyChanged,
          whyMatters: evalRes.whyMatters,
          lastUpdated: quote.lastUpdated,
          sparkline,
          high52w: quote.high52w,
          low52w: quote.low52w,
          avgVolume: quote.avgVolume,
          currentVolume: quote.currentVolume,
          marketCap: quote.marketCap,
          pe: quote.pe,
          dataStatus: quote.dataStatus,
        };
      })
    );
    res.json(stocks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/stocks/search", async (req, res) => {
  const query = req.query.q || "";
  try {
    const results = await searchStocks(query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 3. STOCK DETAIL (GET /api/stocks/:ticker)
// ----------------------------------------------------
app.get("/api/stocks/:ticker", async (req, res) => {
  const ticker = req.params.ticker;
  try {
    const [quote, sparkline, news] = await Promise.all([
      getQuote(ticker),
      getSparkline(ticker),
      getNews(ticker),
    ]);

    const row = db.prepare("SELECT alertThreshold FROM watchlist WHERE ticker = ?").get(ticker);
    const alertThreshold = row ? row.alertThreshold : null;
    const inWatchlist = Boolean(row);

    const evaluation = await evaluateChange(quote, alertThreshold);

    db.prepare(`
      INSERT INTO activities (id, type, ticker, description, time, timestamp)
      VALUES (?, 'visited', ?, ?, 'Just now', ?)
    `).run(`act_${Date.now()}`, ticker, `You viewed details for ${quote.name} (${ticker}).`, Date.now());

    res.json({
      ...quote,
      sparkline,
      news,
      attentionScore: evaluation.attentionScore,
      changeLevel: evaluation.changeLevel,
      signalType: evaluation.signalType,
      whyChanged: evaluation.whyChanged,
      whyMatters: evaluation.whyMatters,
      alertThreshold,
      inWatchlist,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 4. WATCHLIST CRUD (GET /api/watchlist, POST /api/watchlist, DELETE /api/watchlist/:ticker)
// ----------------------------------------------------
app.get("/api/watchlist", async (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM watchlist ORDER BY position ASC").all();
    const session = db.prepare("SELECT lastChecked FROM user_session WHERE id = 'default_user'").get();
    const lastCheckedTime = session ? session.lastChecked : new Date().toISOString();

    const stocks = await Promise.all(
      rows.map(async (row) => {
        const quote = await getQuote(row.ticker);
        const sparkline = await getSparkline(row.ticker);
        const evalRes = await evaluateChange(quote, row.alertThreshold);

        return {
          id: row.ticker,
          ticker: row.ticker,
          name: row.name || quote.name,
          sector: row.sector || quote.sector || "Equity",
          price: quote.price,
          changeToday: quote.changeToday,
          changeSinceLast: evalRes.changeSinceLast,
          volumeRatio: quote.volumeRatio,
          attentionScore: evalRes.attentionScore,
          signalType: evalRes.signalType,
          changeLevel: evalRes.changeLevel,
          whyChanged: evalRes.whyChanged,
          whyMatters: evalRes.whyMatters,
          lastChecked: formatTimeAgo(lastCheckedTime),
          lastUpdated: quote.lastUpdated,
          sparkline,
          high52w: quote.high52w,
          low52w: quote.low52w,
          avgVolume: quote.avgVolume,
          currentVolume: quote.currentVolume,
          marketCap: quote.marketCap,
          pe: quote.pe,
          alertThreshold: row.alertThreshold,
          alertTriggered: evalRes.alertTriggered,
          dataStatus: quote.dataStatus,
          position: row.position,
        };
      })
    );

    res.json({ stocks, lastCheckedTime, formattedLastChecked: formatTimeAgo(lastCheckedTime) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/watchlist", async (req, res) => {
  const { ticker, name, sector, alertThreshold } = req.body;
  if (!ticker) return res.status(400).json({ error: "Ticker is required" });

  try {
    const existing = db.prepare("SELECT ticker FROM watchlist WHERE ticker = ?").get(ticker);
    if (existing) {
      return res.status(400).json({ error: `${ticker} is already in your watchlist.` });
    }

    const quote = await getQuote(ticker);
    const stockName = name || quote.name;
    const stockSector = sector || quote.sector || "Equity";
    const pos = (db.prepare("SELECT MAX(position) as maxPos FROM watchlist").get().maxPos || 0) + 1;

    db.prepare(`
      INSERT INTO watchlist (ticker, name, sector, alertThreshold, addedAt, position)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(ticker, stockName, stockSector, alertThreshold || null, new Date().toISOString(), pos);

    db.prepare(`
      INSERT INTO activities (id, type, ticker, description, time, timestamp)
      VALUES (?, 'added', ?, ?, 'Just now', ?)
    `).run(`act_${Date.now()}`, ticker, `You added ${stockName} (${ticker}) to your watchlist.`, Date.now());

    res.json({ success: true, ticker, name: stockName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/watchlist/:ticker", (req, res) => {
  const ticker = req.params.ticker;
  try {
    const stock = db.prepare("SELECT name FROM watchlist WHERE ticker = ?").get(ticker);
    db.prepare("DELETE FROM watchlist WHERE ticker = ?").run(ticker);

    if (stock) {
      db.prepare(`
        INSERT INTO activities (id, type, ticker, description, time, timestamp)
        VALUES (?, 'dismissed', ?, ?, 'Just now', ?)
      `).run(`act_${Date.now()}`, ticker, `You removed ${stock.name} (${ticker}) from your watchlist.`, Date.now());
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/watchlist/:ticker/alert", (req, res) => {
  const ticker = req.params.ticker;
  const { alertThreshold } = req.body;
  try {
    db.prepare("UPDATE watchlist SET alertThreshold = ? WHERE ticker = ?").run(alertThreshold, ticker);
    res.json({ success: true, ticker, alertThreshold });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/watchlist/export", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM watchlist ORDER BY position ASC").all();
    const csvHeader = "Ticker,Name,Sector,AlertThreshold,AddedAt\n";
    const csvRows = rows.map(r => `"${r.ticker}","${r.name}","${r.sector}",${r.alertThreshold || ""},"${r.addedAt}"`).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="watchlist.csv"');
    res.send(csvHeader + csvRows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 5. DETECTED MEANINGFUL CHANGES (GET /api/changes, POST /api/changes/:id/dismiss)
// ----------------------------------------------------
app.get("/api/changes", async (req, res) => {
  try {
    const watchlistRows = db.prepare("SELECT * FROM watchlist").all();
    const dismissedRows = db.prepare("SELECT id FROM detected_changes WHERE dismissed = 1").all();
    const dismissedIds = new Set(dismissedRows.map(r => r.id));

    const session = db.prepare("SELECT lastChecked FROM user_session WHERE id = 'default_user'").get();
    const lastCheckedTime = session ? session.lastChecked : new Date().toISOString();

    const allChanges = await Promise.all(
      watchlistRows.map(async (row) => {
        const quote = await getQuote(row.ticker);
        const sparkline = await getSparkline(row.ticker);
        const evalRes = await evaluateChange(quote, row.alertThreshold);

        return {
          id: `change_${row.ticker}`,
          ticker: row.ticker,
          name: row.name || quote.name,
          sector: row.sector || quote.sector,
          price: quote.price,
          changeSinceLast: evalRes.changeSinceLast,
          changeToday: quote.changeToday,
          volumeRatio: quote.volumeRatio,
          attentionScore: evalRes.attentionScore,
          signalType: evalRes.signalType,
          changeLevel: evalRes.changeLevel,
          whyChanged: evalRes.whyChanged,
          whyMatters: evalRes.whyMatters,
          lastChecked: formatTimeAgo(lastCheckedTime),
          lastUpdated: quote.lastUpdated,
          sparkline,
          dismissed: dismissedIds.has(`change_${row.ticker}`),
        };
      })
    );

    const activeChanges = allChanges.filter(c => !c.dismissed);
    const significant = activeChanges.filter(c => c.changeLevel === "significant" || c.changeLevel === "notable");

    res.json({
      changes: activeChanges,
      significantCount: significant.length,
      attentionCount: activeChanges.filter(c => c.attentionScore >= 60).length,
      lastCheckedTime,
      formattedLastChecked: formatTimeAgo(lastCheckedTime),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/changes/:id/dismiss", (req, res) => {
  const id = req.params.id;
  try {
    const ticker = id.replace("change_", "");
    db.prepare(`
      INSERT OR REPLACE INTO detected_changes (id, ticker, name, attentionScore, signalType, changeLevel, changeSinceLast, price, whyChanged, whyMatters, timestamp, dismissed)
      VALUES (?, ?, '', 0, 'neutral', 'none', 0, 0, '', '', ?, 1)
    `).run(id, ticker, new Date().toISOString());

    db.prepare(`
      INSERT INTO activities (id, type, ticker, description, time, timestamp)
      VALUES (?, 'dismissed', ?, ?, 'Just now', ?)
    `).run(`act_${Date.now()}`, ticker, `You dismissed change alert for ${ticker}.`, Date.now());

    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 6. SIGNALS (GET /api/signals)
// ----------------------------------------------------
app.get("/api/signals", async (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM watchlist").all();
    const evaluated = await Promise.all(
      rows.map(async (row) => {
        const quote = await getQuote(row.ticker);
        const evalRes = await evaluateChange(quote, row.alertThreshold);
        return {
          id: `sig_${row.ticker}`,
          ticker: row.ticker,
          name: row.name || quote.name,
          type: evalRes.signalType,
          title: evalRes.whyChanged.slice(0, 60),
          description: evalRes.whyMatters,
          strength: evalRes.attentionScore,
          time: "Recent",
          price: quote.price,
          change: evalRes.changeSinceLast,
          sparkline: await getSparkline(row.ticker),
        };
      })
    );

    const activeSignals = evaluated
      .filter(s => s.type !== "neutral" || s.strength >= 50)
      .sort((a, b) => b.strength - a.strength);

    res.json(activeSignals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 7. ACTIVITIES & SESSION (GET /api/activity, GET /api/session, POST /api/session/checkpoint)
// ----------------------------------------------------
app.get("/api/activity", (req, res) => {
  try {
    const activities = db.prepare("SELECT * FROM activities ORDER BY timestamp DESC LIMIT 30").all();
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/activity/clear", (req, res) => {
  try {
    db.prepare("DELETE FROM activities").run();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/session", (req, res) => {
  try {
    const session = db.prepare("SELECT * FROM user_session WHERE id = 'default_user'").get();
    res.json({
      ...session,
      formattedLastChecked: formatTimeAgo(session.lastChecked),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/session/checkpoint", (req, res) => {
  try {
    const now = new Date().toISOString();
    db.prepare("UPDATE user_session SET previousSnapshotTime = lastChecked, lastChecked = ? WHERE id = 'default_user'").run(now);

    db.prepare(`
      INSERT INTO activities (id, type, description, time, timestamp)
      VALUES (?, 'visited', 'Session checkpoint updated.', 'Just now', ?)
    `).run(`act_${Date.now()}`, Date.now());

    res.json({ success: true, lastChecked: now, formattedLastChecked: "Just now" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/session/reset", (req, res) => {
  try {
    const now = new Date().toISOString();
    db.prepare("UPDATE user_session SET lastChecked = ?, previousSnapshotTime = ? WHERE id = 'default_user'").run(now, now);
    db.prepare("DELETE FROM detected_changes").run();

    db.prepare(`
      INSERT INTO activities (id, type, description, time, timestamp)
      VALUES (?, 'visited', 'User reset last visit checkpoint.', 'Just now', ?)
    `).run(`act_${Date.now()}`, Date.now());

    res.json({ success: true, lastChecked: now });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 8. USER SETTINGS (GET /api/settings, PUT /api/settings, POST /api/settings)
// ----------------------------------------------------
const handleGetSettings = (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM user_settings").all();
    const settings = { ...DEFAULT_SETTINGS };
    for (const r of rows) {
      settings[r.key] = r.value;
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const handleUpdateSettings = (req, res) => {
  try {
    const newSettings = req.body;
    const stmt = db.prepare("INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)");
    for (const [k, v] of Object.entries(newSettings)) {
      stmt.run(k, String(v));
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

app.get("/api/settings", handleGetSettings);
app.put("/api/settings", handleUpdateSettings);
app.post("/api/settings", handleUpdateSettings);

app.listen(PORT, () => {
  console.log(`MarketPulse Express API Backend running at http://localhost:${PORT}`);
});
