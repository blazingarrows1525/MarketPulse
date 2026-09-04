import { useCallback, useEffect, useState } from "react";
import { addStockToWatchlist, exportWatchlistCSV, fetchWatchlist, removeStockFromWatchlist, searchStocksAPI } from "../api";
import type { StockData } from "../data";
import Sparkline from "./Sparkline";

type Filter = "all" | "attention" | "gainers" | "losers" | "changed";
type SortField = "name" | "price" | "changeToday" | "changeSinceLast" | "volumeRatio" | "attentionScore" | "dataStatus";

interface Props {
  onViewDetail: (s: StockData) => void;
}

export default function WatchlistView({ onViewDetail }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortAsc, setSortAsc] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any | null>(null);
  const [alertVal, setAlertVal] = useState("");
  const [addingError, setAddingError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchWatchlist();
      setStocks(res.stocks || []);
    } catch (err) {
      console.error("Watchlist load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const handleRef = () => loadData();
    window.addEventListener("marketpulse:refresh", handleRef);
    return () => window.removeEventListener("marketpulse:refresh", handleRef);
  }, [loadData]);

  useEffect(() => {
    if (!addSearch.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      const res = await searchStocksAPI(addSearch);
      setSearchResults(res);
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [addSearch]);

  const handleAddStock = async () => {
    if (!selectedResult) return;
    try {
      setAddingError("");
      const parsedAlert = alertVal ? parseFloat(alertVal) : undefined;
      await addStockToWatchlist(selectedResult.ticker, selectedResult.name, selectedResult.sector, parsedAlert);
      setShowAddModal(false);
      setAddSearch("");
      setSelectedResult(null);
      setAlertVal("");
      await loadData();
    } catch (err: any) {
      setAddingError(err.message || "Failed to add stock");
    }
  };

  const handleRemoveStock = async (e: React.MouseEvent, ticker: string) => {
    e.stopPropagation();
    try {
      await removeStockFromWatchlist(ticker);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(v => !v);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filtered = stocks.filter(s => {
    const cleanT = s.ticker.replace(".NS", "");
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || cleanT.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === "attention") return s.attentionScore >= 60;
    if (filter === "gainers") return s.changeSinceLast > 0;
    if (filter === "losers") return s.changeSinceLast < 0;
    if (filter === "changed") return s.changeLevel !== "none" && s.changeLevel !== "minor";
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let valA = (a as any)[sortField];
    let valB = (b as any)[sortField];
    if (typeof valA === "string") {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const filters: { id: Filter; label: string; count?: number }[] = [
    { id: "all", label: "All", count: stocks.length },
    { id: "attention", label: "Attention", count: stocks.filter(s => s.attentionScore >= 60).length },
    { id: "gainers", label: "Gainers", count: stocks.filter(s => s.changeSinceLast > 0).length },
    { id: "losers", label: "Losers", count: stocks.filter(s => s.changeSinceLast < 0).length },
    { id: "changed", label: "Recently Changed", count: stocks.filter(s => s.changeLevel !== "none" && s.changeLevel !== "minor").length },
  ];

  const signalLabel: Record<string, string> = {
    volume_spike: "Volume Spike",
    breakout: "Breakout",
    threshold: "Alert",
    earnings: "Earnings",
    support: "Support Break",
    reversal: "Reversal",
    neutral: "—",
  };

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 4 }}>Watchlist</h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{stocks.length} stocks · Live synced via Yahoo Finance</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => exportWatchlistCSV()}
            style={{
              padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500,
              background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
              color: "var(--text-secondary)", cursor: "pointer",
            }}
          >
            Export CSV ⤓
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: "var(--teal-dim)", color: "var(--teal)", border: "1px solid rgba(0,200,150,0.2)", cursor: "pointer",
            }}
          >
            + Add Stock
          </button>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "0 0 220px" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--text-muted)" }}>⌕</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search watchlist..."
            style={{
              width: "100%", padding: "8px 12px 8px 28px", borderRadius: 8,
              background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
              color: "var(--text-primary)", fontSize: 12, outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.03)", padding: 3, borderRadius: 8, border: "1px solid var(--border)" }}>
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer",
                background: filter === f.id ? "rgba(255,255,255,0.08)" : "transparent",
                color: filter === f.id ? "var(--text-primary)" : "var(--text-muted)",
                border: "none", transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 5,
              }}
            >
              {f.label}
              {f.count !== undefined && (
                <span style={{
                  fontSize: 10, padding: "1px 5px", borderRadius: 4,
                  background: filter === f.id ? "rgba(0,200,150,0.15)" : "rgba(255,255,255,0.06)",
                  color: filter === f.id ? "var(--teal)" : "var(--text-muted)",
                  fontFamily: "var(--font-data)",
                }}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table with interactive headers for sorting */}
      <div className="glass" style={{ overflow: "hidden" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 80px 100px 40px",
          padding: "10px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          {[
            { label: "Stock", field: "name" },
            { label: "Price", field: "price" },
            { label: "Today", field: "changeToday" },
            { label: "Since Visit", field: "changeSinceLast" },
            { label: "Volume", field: "volumeRatio" },
            { label: "Signal", field: "attentionScore" },
            { label: "Chart", field: null },
            { label: "Updated", field: "dataStatus" },
            { label: "", field: null },
          ].map(h => (
            <span
              key={h.label}
              onClick={() => h.field && handleSort(h.field as SortField)}
              style={{
                fontSize: 10, color: sortField === h.field ? "var(--teal)" : "var(--text-muted)",
                fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "var(--font-data)",
                cursor: h.field ? "pointer" : "default", display: "flex", alignItems: "center", gap: 4,
              }}
            >
              {h.label} {sortField === h.field ? (sortAsc ? "▲" : "▼") : ""}
            </span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Loading market data...</p>
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>No stocks match this filter.</p>
          </div>
        ) : (
          sorted.map(s => {
            const isPositive = s.changeSinceLast >= 0;
            const todayPositive = s.changeToday >= 0;
            const cleanT = s.ticker.replace(".NS", "");

            return (
              <div
                key={s.id || s.ticker}
                className="table-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 80px 100px 40px",
                  padding: "14px 16px", alignItems: "center", cursor: "pointer",
                }}
                onClick={() => onViewDetail(s)}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {s.alertTriggered && (
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--amber)", flexShrink: 0, boxShadow: "0 0 6px rgba(245,166,35,0.6)" }} />
                    )}
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{cleanT}</p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.name}</p>
                    </div>
                  </div>
                </div>

                <span className="font-data" style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                  ₹{s.price ? s.price.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "0.00"}
                </span>

                <span className="font-data" style={{ fontSize: 12, color: todayPositive ? "var(--positive)" : "var(--negative)", fontWeight: 500 }}>
                  {todayPositive ? "+" : ""}{s.changeToday}%
                </span>

                <span className="font-data" style={{ fontSize: 12, color: isPositive ? "var(--positive)" : "var(--negative)", fontWeight: 600 }}>
                  {isPositive ? "+" : ""}{s.changeSinceLast}%
                </span>

                <div>
                  <span className="font-data" style={{
                    fontSize: 11, fontWeight: 600,
                    color: s.volumeRatio >= 2 ? "var(--amber)" : s.volumeRatio >= 1.3 ? "var(--indigo)" : "var(--text-muted)",
                  }}>
                    {s.volumeRatio}×
                  </span>
                </div>

                <div>
                  {s.signalType !== "neutral" ? (
                    <span className={`badge ${s.signalType === "support" ? "badge-negative" : s.signalType === "volume_spike" ? "badge-amber" : "badge-indigo"}`} style={{ fontSize: 9 }}>
                      {signalLabel[s.signalType] || s.signalType}
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>
                  )}
                </div>

                <Sparkline data={s.sparkline || [s.price]} positive={isPositive} width={72} height={28} strokeWidth={1.5} showArea={false} />

                <span className="font-data" style={{ fontSize: 10, color: "var(--text-muted)" }}>{s.dataStatus || "MARKET CLOSED"}</span>

                <button
                  onClick={(e) => handleRemoveStock(e, s.ticker)}
                  title="Remove stock"
                  style={{
                    background: "transparent", border: "none", color: "var(--text-muted)",
                    cursor: "pointer", fontSize: 14, textAlign: "center",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--negative)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; }}
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Add Stock Modal */}
      {showAddModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
        }}>
          <div className="glass" style={{ width: 440, padding: 24, borderRadius: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>Add Stock to Watchlist</h2>

            {addingError && (
              <p style={{ fontSize: 12, color: "var(--negative)", marginBottom: 10, padding: "6px 10px", background: "rgba(255,77,106,0.1)", borderRadius: 6 }}>
                {addingError}
              </p>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>SEARCH TICKER OR COMPANY</label>
              <input
                value={addSearch}
                onChange={e => setAddSearch(e.target.value)}
                placeholder="Type name (e.g. RELIANCE, AAPL, TCS)..."
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: 8,
                  background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
                  color: "var(--text-primary)", fontSize: 13, outline: "none",
                }}
              />
            </div>

            {addSearch && (
              <div style={{
                maxHeight: 180, overflowY: "auto", background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border)", borderRadius: 8, padding: 4, marginBottom: 14,
              }}>
                {searching ? (
                  <p style={{ fontSize: 11, color: "var(--text-muted)", padding: 8 }}>Searching market data...</p>
                ) : searchResults.length > 0 ? (
                  searchResults.map(res => (
                    <div
                      key={res.ticker}
                      onClick={() => setSelectedResult(res)}
                      style={{
                        padding: "8px 10px", borderRadius: 6, cursor: "pointer",
                        background: selectedResult?.ticker === res.ticker ? "rgba(0,200,150,0.15)" : "transparent",
                        border: selectedResult?.ticker === res.ticker ? "1px solid var(--teal)" : "none",
                        display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2,
                      }}
                    >
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{res.ticker}</span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6 }}>{res.name}</span>
                      </div>
                      <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{res.exchange}</span>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: 11, color: "var(--text-muted)", padding: 8 }}>No matching market symbols found.</p>
                )}
              </div>
            )}

            {selectedResult && (
              <div style={{ marginBottom: 16, padding: "10px 12px", borderRadius: 8, background: "rgba(0,200,150,0.08)", border: "1px solid rgba(0,200,150,0.2)" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--teal)" }}>Selected: {selectedResult.ticker} - {selectedResult.name}</p>
                <div style={{ marginTop: 8 }}>
                  <label style={{ fontSize: 10, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>TARGET PRICE ALERT (OPTIONAL)</label>
                  <input
                    type="number"
                    value={alertVal}
                    onChange={e => setAlertVal(e.target.value)}
                    placeholder="Alert price threshold (e.g. 1500)"
                    style={{
                      width: "100%", padding: "6px 10px", borderRadius: 6,
                      background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
                      color: "var(--text-primary)", fontSize: 12, outline: "none",
                    }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => { setShowAddModal(false); setSelectedResult(null); setAddSearch(""); setAddingError(""); }}
                style={{
                  padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                  background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                disabled={!selectedResult}
                onClick={handleAddStock}
                style={{
                  padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: selectedResult ? "var(--teal)" : "rgba(255,255,255,0.1)",
                  color: selectedResult ? "#000" : "var(--text-muted)",
                  border: "none", cursor: selectedResult ? "pointer" : "not-allowed",
                }}
              >
                Add to Watchlist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
