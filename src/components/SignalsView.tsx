import { useEffect, useState } from "react";
import { fetchSignals, fetchStockDetail } from "../api";
import type { Signal, StockData } from "../data";
import Sparkline from "./Sparkline";

interface SignalsViewProps {
  onViewDetail?: (stock: StockData) => void;
}

function StrengthBar({ value }: { value: number }) {
  const color = value >= 85 ? "#F5A623" : value >= 65 ? "#7C6FFF" : "#00C896";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 2 }} />
      </div>
      <span className="font-data" style={{ fontSize: 11, fontWeight: 600, color, width: 28, textAlign: "right" }}>{value}</span>
    </div>
  );
}

const iconMap: Record<string, string> = {
  volume_spike: "⚡",
  breakout: "↗",
  threshold: "🔔",
  earnings: "📊",
  support: "⚠",
  reversal: "↩",
  neutral: "·",
};

const typeStyle: Record<string, string> = {
  volume_spike: "badge-amber",
  breakout: "badge-teal",
  threshold: "badge-indigo",
  earnings: "badge-teal",
  support: "badge-negative",
  reversal: "badge-indigo",
  neutral: "badge-muted",
};

type StrengthFilter = "all" | "critical" | "strong" | "moderate";

export default function SignalsView({ onViewDetail }: SignalsViewProps) {
  const [signalsList, setSignalsList] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StrengthFilter>("all");
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [sensitivityVal, setSensitivityVal] = useState("60");

  useEffect(() => {
    fetchSignals()
      .then(res => {
        setSignalsList(res || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSignalClick = async (ticker: string) => {
    if (!onViewDetail) return;
    try {
      const stock = await fetchStockDetail(ticker);
      onViewDetail(stock);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = signalsList.filter(s => {
    if (filter === "critical") return s.strength >= 85;
    if (filter === "strong") return s.strength >= 65 && s.strength < 85;
    if (filter === "moderate") return s.strength >= 40 && s.strength < 65;
    return true;
  });

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 4 }}>Signals</h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Intelligent alerts ranked by signal strength · {filtered.length} active signals
          </p>
        </div>

        {/* Filter buttons */}
        <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.03)", padding: 3, borderRadius: 8, border: "1px solid var(--border)" }}>
          {[
            { id: "all", label: "All" },
            { id: "critical", label: "Critical (≥85)" },
            { id: "strong", label: "Strong (65–84)" },
            { id: "moderate", label: "Moderate (40–64)" },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as StrengthFilter)}
              style={{
                padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: "pointer",
                background: filter === f.id ? "rgba(255,255,255,0.08)" : "transparent",
                color: filter === f.id ? "var(--text-primary)" : "var(--text-muted)",
                border: "none",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Signal strength legend */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Critical", color: "#F5A623", range: "85–100" },
          { label: "Strong", color: "#7C6FFF", range: "65–84" },
          { label: "Moderate", color: "#00C896", range: "40–64" },
        ].map(item => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color }} />
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.label}</span>
            <span className="font-data" style={{ fontSize: 10, color: "var(--text-muted)" }}>({item.range})</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Analyzing market signals...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>No signals match this filter strength.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }} className="stagger">
          {filtered.map((sig, i) => {
            const isPositive = sig.change >= 0;
            const cleanT = sig.ticker.replace(".NS", "");

            return (
              <div
                key={sig.id}
                className="glass"
                style={{
                  padding: "20px 22px",
                  animationDelay: `${i * 0.07}s`,
                  cursor: onViewDetail ? "pointer" : "default",
                  borderLeft: sig.strength >= 85
                    ? "2px solid var(--amber)"
                    : sig.strength >= 65
                    ? "2px solid var(--indigo)"
                    : "2px solid var(--teal)",
                }}
                onClick={() => handleSignalClick(sig.ticker)}
              >
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                    background: sig.strength >= 85 ? "var(--amber-dim)" : sig.strength >= 65 ? "var(--indigo-dim)" : "var(--teal-dim)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                  }}>
                    {iconMap[sig.type] || "⚡"}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span className={`badge ${typeStyle[sig.type] || "badge-indigo"}`}>{sig.type.replace("_", " ")}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-data)" }}>{sig.time}</span>
                      {sig.strength >= 85 && (
                        <span className="badge badge-amber" style={{ marginLeft: "auto" }}>⚡ Critical</span>
                      )}
                    </div>

                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                      {cleanT} · {sig.title}
                    </h3>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55, marginBottom: 12 }}>
                      {sig.description}
                    </p>

                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>Signal Strength</p>
                        <StrengthBar value={sig.strength} />
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p className="font-data" style={{ fontSize: 16, fontWeight: 500, color: "var(--text-primary)" }}>
                          ₹{sig.price ? sig.price.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "0.00"}
                        </p>
                        <p className="font-data" style={{ fontSize: 12, color: isPositive ? "var(--positive)" : "var(--negative)", fontWeight: 500 }}>
                          {isPositive ? "+" : ""}{sig.change}%
                        </p>
                      </div>
                      {(sig as any).sparkline && (
                        <Sparkline data={(sig as any).sparkline} positive={isPositive} width={72} height={36} strokeWidth={1.5} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Market scan note */}
      <div style={{ marginTop: 24, padding: "14px 16px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", display: "flex", gap: 10, alignItems: "center" }}>
        <span style={{ fontSize: 14 }}>🔍</span>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          MarketPulse scans for anomalies dynamically on live market quotes. Signals refresh automatically based on data activity.{" "}
          <span style={{ color: "var(--teal)", cursor: "pointer", textDecoration: "underline" }} onClick={() => setShowConfigModal(true)}>
            Configure scan sensitivity →
          </span>
        </p>
      </div>

      {/* Sensitivity Config Modal */}
      {showConfigModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
        }}>
          <div className="glass" style={{ width: 400, padding: 24, borderRadius: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>Scan Sensitivity Settings</h2>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>Set the minimum Attention Score required to flag a critical signal.</p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>ATTENTION SCORE THRESHOLD ({sensitivityVal}/100)</label>
              <input
                type="range"
                min="30"
                max="90"
                step="5"
                value={sensitivityVal}
                onChange={e => setSensitivityVal(e.target.value)}
                style={{ width: "100%", accentColor: "var(--teal)" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
                <span>30 (Sensitive)</span>
                <span>60 (Default)</span>
                <span>90 (Strict)</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setShowConfigModal(false)}
                style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12, background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowConfigModal(false)}
                style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "var(--teal)", color: "#000", border: "none", cursor: "pointer" }}
              >
                Save Preference
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
