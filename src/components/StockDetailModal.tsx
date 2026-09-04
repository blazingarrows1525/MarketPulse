import { useEffect, useState } from "react";
import { fetchStockDetail, setStockAlertThreshold } from "../api";
import type { StockData } from "../data";
import Sparkline from "./Sparkline";

interface Props {
  stock: StockData | null;
  onClose: () => void;
}

export default function StockDetailModal({ stock: initialStock, onClose }: Props) {
  const [stockDetail, setStockDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [alertInput, setAlertInput] = useState("");
  const [savingAlert, setSavingAlert] = useState(false);
  const [alertSaved, setAlertSaved] = useState(false);

  useEffect(() => {
    if (!initialStock) {
      setStockDetail(null);
      return;
    }
    setLoading(true);
    setStockDetail(initialStock);
    setAlertInput(initialStock.alertThreshold ? String(initialStock.alertThreshold) : "");

    fetchStockDetail(initialStock.ticker)
      .then(detail => {
        setStockDetail(detail);
        if (detail.alertThreshold) setAlertInput(String(detail.alertThreshold));
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [initialStock]);

  if (!initialStock) return null;

  const stock = stockDetail || initialStock;
  const isPositive = (stock.changeSinceLast ?? stock.changeToday ?? 0) >= 0;
  const cleanT = stock.ticker.replace(".NS", "");

  const handleSaveAlert = async () => {
    try {
      setSavingAlert(true);
      const val = alertInput ? parseFloat(alertInput) : null;
      await setStockAlertThreshold(stock.ticker, val);
      setSavingAlert(false);
      setAlertSaved(true);
      setTimeout(() => setAlertSaved(false), 2000);
    } catch (err) {
      console.error(err);
      setSavingAlert(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 100, padding: 24,
    }} onClick={onClose}>
      <div
        className="glass"
        style={{
          width: "100%", maxWidth: 680, maxHeight: "90vh",
          overflowY: "auto", borderRadius: 16, padding: 28,
          position: "relative", border: "1px solid rgba(255,255,255,0.1)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 20, right: 20,
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(255,255,255,0.06)", border: "none",
            color: "var(--text-muted)", cursor: "pointer", fontSize: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          ✕
        </button>

        {/* Top Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.05)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 700, color: "var(--teal)", fontFamily: "var(--font-data)",
          }}>
            {cleanT.slice(0, 3)}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{stock.name}</h2>
              <span className="font-data" style={{ fontSize: 12, color: "var(--text-muted)", background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: 4 }}>
                {cleanT}
              </span>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{stock.sector || "Equity"} · {stock.exchange || "NSE"} · {stock.dataStatus || "MARKET CLOSED"}</p>
          </div>
        </div>

        {/* Price Hero & Sparkline */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 180px", gap: 20,
          background: "rgba(255,255,255,0.02)", padding: 20, borderRadius: 12,
          marginBottom: 20, border: "1px solid var(--border)",
        }}>
          <div>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>CURRENT PRICE</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
              <span className="font-data" style={{ fontSize: 32, fontWeight: 700, color: "var(--text-primary)" }}>
                ₹{stock.price ? stock.price.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "0.00"}
              </span>
              <span className="font-data" style={{ fontSize: 16, fontWeight: 600, color: isPositive ? "var(--positive)" : "var(--negative)" }}>
                {isPositive ? "+" : ""}{stock.changeSinceLast ?? stock.changeToday}%
              </span>
            </div>
            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Today: {stock.changeToday >= 0 ? "+" : ""}{stock.changeToday}% · Prev Close: ₹{stock.prevClose ? stock.prevClose.toLocaleString("en-IN") : "N/A"}
            </p>
          </div>
          <div>
            <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 6, textAlign: "right" }}>PRICE TREND</p>
            <Sparkline data={stock.sparkline || [stock.price]} positive={isPositive} width={180} height={56} strokeWidth={2} showArea={true} />
          </div>
        </div>

        {/* Why changed & Why matters */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          <div style={{ background: "rgba(255,255,255,0.03)", padding: 14, borderRadius: 10, borderLeft: "3px solid var(--teal)" }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
              WHY IT CHANGED
            </p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              {stock.whyChanged || "No confirmed catalyst identified."}
            </p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", padding: 14, borderRadius: 10, borderLeft: "3px solid var(--amber)" }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
              WHY IT MATTERS
            </p>
            <p style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.5 }}>
              {stock.whyMatters || "Tracking normally."}
            </p>
          </div>
        </div>

        {/* Target Alert Editor */}
        <div style={{ background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 10, border: "1px solid var(--border)", marginBottom: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>Target Alert Threshold</p>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              type="number"
              value={alertInput}
              onChange={e => setAlertInput(e.target.value)}
              placeholder="e.g. 1700"
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 8,
                background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
                color: "var(--text-primary)", fontSize: 12, outline: "none",
              }}
            />
            <button
              onClick={handleSaveAlert}
              disabled={savingAlert}
              style={{
                padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: alertSaved ? "var(--positive)" : "var(--teal)", color: "#000",
                border: "none", cursor: "pointer",
              }}
            >
              {alertSaved ? "Saved ✓" : savingAlert ? "Saving..." : "Set Alert"}
            </button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>Key Financial Metrics</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { label: "52W High", val: `₹${stock.high52w ? stock.high52w.toLocaleString("en-IN") : "N/A"}` },
            { label: "52W Low", val: `₹${stock.low52w ? stock.low52w.toLocaleString("en-IN") : "N/A"}` },
            { label: "Volume Ratio", val: `${stock.volumeRatio || 1.0}×` },
            { label: "Avg Volume", val: stock.avgVolume ? (stock.avgVolume / 1e6).toFixed(1) + "M" : "N/A" },
            { label: "Market Cap", val: stock.marketCap || "N/A" },
            { label: "P/E Ratio", val: stock.pe || "N/A" },
          ].map(m => (
            <div key={m.label} className="glass" style={{ padding: "10px 12px" }}>
              <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>{m.label}</p>
              <p className="font-data" style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{m.val}</p>
            </div>
          ))}
        </div>

        {/* News & Catalysts */}
        {stock.news && stock.news.length > 0 && (
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>Market News & Catalysts</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {stock.news.map((item: any, idx: number) => (
                <a
                  key={idx}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--border)", textDecoration: "none", display: "block",
                  }}
                >
                  <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{item.title}</p>
                  <p style={{ fontSize: 10, color: "var(--text-muted)" }}>{item.publisher || "Yahoo Finance"}</p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
