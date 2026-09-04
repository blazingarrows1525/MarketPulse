# MarketPulse — Know what changed.

MarketPulse is an intelligent, high-density market watchlist and analytics platform designed to answer one question instantly: **"What changed since my last visit?"**

Rather than flooding users with static price tickers, MarketPulse uses a custom **Meaningful Change Engine** that compares real market data against user session checkpoints, calculates a 0–100 **Attention Score**, and provides factual explanations for why a stock moved and why it matters.

---

## 🌟 Key Features

1. **Session-Aware Change Tracking**:
   - Stores user's last visited timestamp in SQLite.
   - On returning, computes exact price deltas, volume spikes, and news catalysts since that timestamp.
   - Displays clear summary: *"X meaningful changes since your last visit."*

2. **Meaningful Change Engine & Attention Scoring (0–100)**:
   - Evaluates price movement magnitude ($\ge 5\% \rightarrow 40\text{ pts}$).
   - Detects volume ratio anomalies ($V/V_{20d\_avg} \ge 4.0\times \rightarrow 35\text{ pts}$).
   - Detects 52-week high/low breakouts and threshold breaches.
   - Formulates factual **"Why it changed"** and contextual **"Why it matters"** reasons. If no catalyst is present, explicitly states *"No confirmed catalyst identified."*

3. **Real-Time Market Data via Yahoo Finance**:
   - Real price quotes, 52-week statistics, daily volume, average volume, market cap, P/E ratios, historical intraday sparklines, and breaking news.
   - Supports Indian NSE/BSE stocks (`RELIANCE.NS`, `INFY.NS`, `TCS.NS`, `ZOMATO.NS`) and US global stocks (`AAPL`, `NVDA`, `TSLA`).

4. **Watchlist CRUD & Custom Price Alerts**:
   - Search real market symbols and add to watchlist.
   - Remove stocks, set target price alert thresholds.
   - Full SQLite persistence across browser reloads and restarts.

5. **Dynamic Market Open/Closed Status**:
   - Dynamically checks exchange operating hours and displays `MARKET OPEN` / `MARKET CLOSED` along with countdown to next trading session.

6. **Interactive UI Navigation**:
   - **Dashboard**: What Changed cards, Worth Attention list, What Did I Miss table.
   - **Watchlist**: Complete grid view with filters, live status badges, and Add Stock modal.
   - **Market Overview**: NIFTY 50, SENSEX, NIFTY BANK, NIFTY IT, and sector performance bars.
   - **Signals**: Dynamic alerts ranked by signal strength.
   - **Activity**: Comprehensive historical audit log.
   - **Settings**: System & data sync preferences.

---

## 🏗 Architecture

```
MarketPulse Frontend (React 19 + Tailwind v4 + Vite)
      │
      ▼ REST API Proxy (/api)
Express Backend Server (port 3001)
 ├── SQLite Database (backend/data/marketpulse.db)
 ├── Meaningful Change Engine (backend/services/changeEngine.js)
 └── Yahoo Finance API Client (backend/services/marketService.js)
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### 2. Installation
```bash
npm install
```

### 3. Run Development Application

**Terminal 1 — Express Backend Server**:
```bash
node backend/server.js
```
*Backend runs on `http://localhost:3001` and initializes SQLite database automatically.*

**Terminal 2 — Vite Dev Server**:
```bash
npm run dev
```
*Frontend runs on `http://localhost:8443` (or Vite assigned port).*

---

## 🔐 Environment Variables

Key settings (stored in `.env` or system environment):
```env
PORT=8443
BACKEND_PORT=3001
```

---

## 📊 Market API Provider & Rate Limits

- **Provider**: Yahoo Finance via `yahoo-finance2`
- **Caching**: 60-second in-memory quote cache during market hours, 5-minute cache for sparklines, 15-minute cache for news.
- **Data Status Labeling**: All data is explicitly labeled as `LIVE` or `MARKET CLOSED`.

---

## 📄 License
MIT License
