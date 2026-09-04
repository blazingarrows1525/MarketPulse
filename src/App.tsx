import { useEffect, useState } from "react";
import ActivityView from "./components/ActivityView";
import Dashboard from "./components/Dashboard";
import SignalsView from "./components/SignalsView";
import StockDetailModal from "./components/StockDetailModal";
import WatchlistView from "./components/WatchlistView";
import SettingsView from "./components/SettingsView";
import type { StockData } from "./data";
import { fetchMarketOverview, fetchStockDetail, searchStocksAPI, updateSessionCheckpoint } from "./api";

type Page = "dashboard" | "watchlist" | "market" | "signals" | "activity" | "settings";

function MarketPulseLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 4px" }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: "linear-gradient(135deg, #00C896 0%, #00A87A 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 0 12px rgba(0,200,150,0.3)",
      }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <polyline points="1,14 5,8 8,11 12,4 17,7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="17" cy="7" r="1.5" fill="white" />
        </svg>
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1, letterSpacing: "-0.02em" }}>MarketPulse</p>
        <p style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.04em", marginTop: 1 }}>Know what changed.</p>
      </div>
    </div>
  );
}

const navItems: { id: Page; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "watchlist", label: "Watchlist", icon: "☰" },
  { id: "market", label: "Market Overview", icon: "◫" },
  { id: "signals", label: "Signals", icon: "⚡" },
  { id: "activity", label: "Activity", icon: "⏱" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

function Sidebar({ page, setPage, marketStatus }: { page: Page; setPage: (p: Page) => void; marketStatus: any }) {
  return (
    <aside
      className="sidebar-desktop"
      style={{
        width: 220, flexShrink: 0,
        background: "#0A0C12",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column",
        height: "100%", position: "sticky", top: 0,
      }}
    >
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <MarketPulseLogo />
      </div>

      <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={`nav-item ${page === item.id ? "active" : ""}`}
            style={{
              width: "100%", padding: "9px 12px", borderRadius: 8, border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 10, textAlign: "left", background: "transparent",
              position: "relative",
            }}
          >
            <span style={{ fontSize: 14, width: 18, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</span>
          </button>
        ))}
      </nav>

      <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div
          onClick={() => setPage("market")}
          style={{
            padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: marketStatus.isOpen ? "var(--positive)" : "#FF4D6A",
            }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>
              {marketStatus.statusText}
            </span>
          </div>
          <p className="font-data" style={{ fontSize: 10, color: "var(--text-muted)" }}>
            {marketStatus.exchange} · {marketStatus.nextSession}
          </p>
        </div>
      </div>
    </aside>
  );
}

function Header({
  page,
  setPage,
  marketStatus,
  onSelectStock,
  onRefresh,
}: {
  page: Page;
  setPage: (p: Page) => void;
  marketStatus: any;
  onSelectStock: (s: StockData) => void;
  onRefresh: () => void;
}) {
  const [searchVal, setSearchVal] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    if (!searchVal.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoadingSearch(true);
      const res = await searchStocksAPI(searchVal);
      setSearchResults(res);
      setLoadingSearch(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchVal]);

  const handleSelectSearchResult = async (ticker: string) => {
    try {
      const detail = await fetchStockDetail(ticker);
      onSelectStock(detail);
      setSearchVal("");
      setShowSearch(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header style={{
      height: 58, borderBottom: "1px solid rgba(255,255,255,0.06)",
      display: "flex", alignItems: "center", padding: "0 24px",
      background: "rgba(8,10,15,0.92)", backdropFilter: "blur(12px)",
      position: "sticky", top: 0, zIndex: 40, gap: 12,
    }}>
      {/* Search */}
      <div style={{ flex: 1, maxWidth: 360, position: "relative" }}>
        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--text-muted)" }}>⌕</span>
        <input
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          onFocus={() => setShowSearch(true)}
          placeholder="Search real stocks (e.g. RELIANCE, INFY, AAPL)..."
          style={{
            width: "100%", padding: "7px 12px 7px 30px", borderRadius: 8,
            background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
            color: "var(--text-primary)", fontSize: 12, outline: "none",
          }}
        />
        {showSearch && (searchVal || searchResults.length > 0) && (
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
            background: "#0E1117", border: "1px solid var(--border)", borderRadius: 10,
            padding: 8, zIndex: 50, maxHeight: 280, overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}>
            {loadingSearch ? (
              <p style={{ fontSize: 11, color: "var(--text-muted)", padding: "8px 12px" }}>Searching live market data...</p>
            ) : searchResults.length > 0 ? (
              searchResults.map(s => (
                <div
                  key={s.ticker}
                  onClick={() => handleSelectSearchResult(s.ticker)}
                  style={{
                    padding: "8px 10px", borderRadius: 6, cursor: "pointer",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.06)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                >
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{s.ticker}</span>
                    <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.name}</p>
                  </div>
                  <span style={{ fontSize: 10, color: "var(--teal)", background: "rgba(0,200,150,0.1)", padding: "2px 6px", borderRadius: 4 }}>
                    {s.exchange}
                  </span>
                </div>
              ))
            ) : (
              <p style={{ fontSize: 11, color: "var(--text-muted)", padding: "8px 12px" }}>No results found for "{searchVal}"</p>
            )}
          </div>
        )}
      </div>

      {/* Right cluster */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
        {/* Dynamic market status */}
        <div
          onClick={() => setPage("market")}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 6, cursor: "pointer",
            background: marketStatus.isOpen ? "rgba(0,200,150,0.1)" : "rgba(255,77,106,0.08)",
            border: marketStatus.isOpen ? "1px solid rgba(0,200,150,0.2)" : "1px solid rgba(255,77,106,0.15)",
          }}
        >
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: marketStatus.isOpen ? "var(--positive)" : "var(--negative)" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: marketStatus.isOpen ? "var(--positive)" : "var(--negative)" }}>
            {marketStatus.statusText}
          </span>
        </div>

        {/* Sync Button */}
        <button
          onClick={onRefresh}
          style={{
            display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.04)",
            border: "1px solid var(--border)", borderRadius: 8, padding: "5px 10px", cursor: "pointer",
            color: "var(--text-secondary)", fontSize: 11,
          }}
        >
          <span>↻</span>
          <span className="font-data" style={{ fontSize: 11 }}>Sync</span>
        </button>

        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowNotifs(v => !v)}
            style={{
              width: 34, height: 34, borderRadius: 8, border: "1px solid var(--border)",
              background: showNotifs ? "rgba(255,255,255,0.08)" : "transparent", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: "var(--text-secondary)",
            }}
          >
            🔔
            <span style={{
              position: "absolute", top: 4, right: 4, width: 8, height: 8,
              borderRadius: "50%", background: "var(--amber)",
              border: "1.5px solid #080A0F",
            }} />
          </button>
          {showNotifs && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0, width: 280,
              background: "#0E1117", border: "1px solid var(--border)", borderRadius: 10,
              padding: 12, zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Notifications & Alerts</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div
                  onClick={() => { setPage("signals"); setShowNotifs(false); }}
                  style={{ fontSize: 11, color: "var(--text-secondary)", padding: 6, background: "rgba(255,255,255,0.03)", borderRadius: 6, cursor: "pointer" }}
                >
                  ⚡ <strong>ZOMATO</strong> volume ratio reached 4.2×
                </div>
                <div
                  onClick={() => { setPage("watchlist"); setShowNotifs(false); }}
                  style={{ fontSize: 11, color: "var(--text-secondary)", padding: 6, background: "rgba(255,255,255,0.03)", borderRadius: 6, cursor: "pointer" }}
                >
                  🔔 <strong>HDFCBANK</strong> alert ₹1,680 touched
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div style={{ position: "relative" }}>
          <div
            onClick={() => setShowProfile(v => !v)}
            style={{
              width: 32, height: 32, borderRadius: 8, cursor: "pointer",
              background: "linear-gradient(135deg, #7C6FFF 0%, #00C896 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "white",
            }}
          >
            S
          </div>
          {showProfile && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0, width: 200,
              background: "#0E1117", border: "1px solid var(--border)", borderRadius: 10,
              padding: 12, zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Sneha</p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10 }}>MarketPulse Premium</p>
              <button
                onClick={() => { setPage("settings"); setShowProfile(false); }}
                style={{
                  width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)",
                  background: "rgba(255,255,255,0.04)", color: "var(--text-secondary)", fontSize: 11, cursor: "pointer",
                }}
              >
                Settings & Preferences
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function MarketOverview() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchMarketOverview().then(setData);
  }, []);

  const indices = data?.indices || [
    { name: "NIFTY 50", value: "24,677.80", change: "+0.34%", pos: true },
    { name: "SENSEX", value: "81,224.75", change: "+0.29%", pos: true },
    { name: "NIFTY BANK", value: "52,301.45", change: "-0.12%", pos: false },
    { name: "NIFTY IT", value: "39,854.20", change: "+1.47%", pos: true },
  ];

  const sectors = data?.sectors || [
    { name: "Information Technology", change: "+1.47%", pos: true },
    { name: "Energy", change: "+1.12%", pos: true },
    { name: "Auto", change: "+0.87%", pos: true },
    { name: "Banking", change: "-0.12%", pos: false },
    { name: "NBFC", change: "-1.23%", pos: false },
    { name: "Consumer Tech", change: "+2.31%", pos: true },
  ];

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 4 }}>Market Overview</h1>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>NSE · Live Market Overview</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 28 }}>
        {indices.map((idx: any) => (
          <div key={idx.name} className="glass" style={{ padding: "18px 20px" }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>{idx.name}</p>
            <p className="font-data" style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4, letterSpacing: "-0.02em" }}>{idx.value}</p>
            <p className="font-data" style={{ fontSize: 13, color: idx.pos ? "var(--positive)" : "var(--negative)", fontWeight: 500 }}>{idx.change}</p>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>Sector Performance</h2>
      <div className="glass" style={{ overflow: "hidden" }}>
        {sectors.map((s: any) => (
          <div key={s.name} className="table-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px" }}>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{s.name}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                height: 4, width: 60, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden",
              }}>
                <div style={{
                  height: "100%",
                  width: `${Math.min(100, (Math.abs(parseFloat(s.change)) / 2.5) * 100)}%`,
                  background: s.pos ? "var(--positive)" : "var(--negative)",
                  borderRadius: 2,
                }} />
              </div>
              <span className="font-data" style={{ fontSize: 13, fontWeight: 600, color: s.pos ? "var(--positive)" : "var(--negative)", width: 52, textAlign: "right" }}>
                {s.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [marketStatus, setMarketStatus] = useState<any>({ isOpen: false, statusText: "Market Closed", exchange: "NSE", nextSession: "Opens in 17h 42m" });

  const loadMarketStatus = async () => {
    const data = await fetchMarketOverview();
    if (data && data.status) setMarketStatus(data.status);
  };

  useEffect(() => {
    loadMarketStatus();
  }, []);

  const handleRefresh = async () => {
    await updateSessionCheckpoint();
    await loadMarketStatus();
    window.dispatchEvent(new CustomEvent("marketpulse:refresh"));
  };

  const content = {
    dashboard: <Dashboard onViewDetail={setSelectedStock} onNavigate={(p) => setPage(p as Page)} />,
    watchlist: <WatchlistView onViewDetail={setSelectedStock} />,
    market: <MarketOverview />,
    signals: <SignalsView onViewDetail={setSelectedStock} />,
    activity: <ActivityView onViewDetail={setSelectedStock} />,
    settings: <SettingsView />,
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--bg)", color: "var(--text-primary)" }}>
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <Sidebar page={page} setPage={setPage} marketStatus={marketStatus} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Header
            page={page}
            setPage={setPage}
            marketStatus={marketStatus}
            onSelectStock={setSelectedStock}
            onRefresh={handleRefresh}
          />
          <main style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }}>
            {content[page]}
          </main>
        </div>
      </div>

      <StockDetailModal stock={selectedStock} onClose={() => setSelectedStock(null)} />
    </div>
  );
}
