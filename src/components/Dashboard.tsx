import { useCallback, useEffect, useState } from "react";
import { dismissChangeAlert, fetchDetectedChanges, fetchWatchlist, updateSessionCheckpoint } from "../api";
import type { StockData } from "../data";
import ChangeCard from "./ChangeCard";
import Sparkline from "./Sparkline";

interface DashboardProps {
  onViewDetail: (stock: StockData) => void;
  onNavigate?: (page: string) => void;
}

function SummaryTile({ label, value, sub, accent, onClick }: { label: string; value: string | number; sub?: string; accent?: string; onClick?: () => void }) {
  return (
    <div
      className="glass"
      style={{ padding: "16px 18px", cursor: onClick ? "pointer" : "default", transition: "transform 0.15s, border-color 0.15s" }}
      onClick={onClick}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.2)"; }}
      onMouseLeave={e => { if (onClick) (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; }}
    >
      <p style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>{label}</p>
      <p className="font-data" style={{ fontSize: 26, fontWeight: 600, color: accent || "var(--text-primary)", lineHeight: 1, marginBottom: 4 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{sub}</p>}
    </div>
  );
}

function WorthAttentionRow({ stock, onViewDetail }: { stock: StockData; onViewDetail: (s: StockData) => void }) {
  const isPositive = stock.changeSinceLast >= 0;
  const reasonMap: Record<string, string> = {
    volume_spike: "Unusual volume",
    breakout: "Range breakout",
    threshold: "Alert triggered",
    earnings: "Earnings event",
    support: "Support broken",
    reversal: "Reversal signal",
    neutral: "Monitoring",
  };

  return (
    <div
      className="table-row"
      style={{ display: "flex", alignItems: "center", padding: "12px 4px", gap: 12, cursor: "pointer" }}
      onClick={() => onViewDetail(stock)}
    >
      <div style={{ flex: "0 0 36px", textAlign: "center" }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", fontFamily: "var(--font-data)" }}>
            {stock.ticker.replace(".NS", "").slice(0, 3)}
          </span>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{stock.name}</p>
        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{reasonMap[stock.signalType] || "Monitoring"}</p>
      </div>
      <div style={{ textAlign: "right" }}>
        <p className="font-data" style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 2 }}>
          ₹{stock.price ? stock.price.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "0.00"}
        </p>
        <p className="font-data" style={{ fontSize: 11, color: isPositive ? "var(--positive)" : "var(--negative)" }}>
          {isPositive ? "+" : ""}{stock.changeSinceLast}%
        </p>
      </div>
      <div style={{ width: 64 }}>
        <Sparkline data={stock.sparkline || [stock.price]} positive={isPositive} width={64} height={28} strokeWidth={1.5} showArea={false} />
      </div>
      <div style={{ width: 44, textAlign: "right" }}>
        <span style={{
          display: "inline-block", width: 32, height: 32, borderRadius: "50%", lineHeight: "32px",
          textAlign: "center", fontSize: 11, fontWeight: 700, fontFamily: "var(--font-data)",
          background: stock.attentionScore >= 80 ? "rgba(245,166,35,0.12)" : "rgba(124,111,255,0.12)",
          color: stock.attentionScore >= 80 ? "var(--amber)" : "var(--indigo)",
        }}>
          {stock.attentionScore}
        </span>
      </div>
    </div>
  );
}

export default function Dashboard({ onViewDetail, onNavigate }: DashboardProps) {
  const [showAllChanged, setShowAllChanged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [changesData, setChangesData] = useState<any>({
    changes: [],
    significantCount: 0,
    attentionCount: 0,
    formattedLastChecked: "2 hours 14 minutes ago",
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [wlRes, chgRes] = await Promise.all([
        fetchWatchlist(),
        fetchDetectedChanges(),
      ]);
      setWatchlistCount(wlRes.stocks.length);
      setChangesData(chgRes);
    } catch (err) {
      console.error("Dashboard data load error:", err);
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

  const handleDismissCard = async (stock: StockData) => {
    try {
      await dismissChangeAlert(`change_${stock.ticker}`);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetCheckpoint = async () => {
    await updateSessionCheckpoint();
    await loadData();
  };

  const changes: StockData[] = changesData.changes || [];
  const significant = changes.filter(s => s.changeLevel === "significant" || s.changeLevel === "notable").sort((a, b) => b.attentionScore - a.attentionScore);
  const attention = [...changes].sort((a, b) => b.attentionScore - a.attentionScore);
  const missed = [...changes].sort((a, b) => Math.abs(b.changeSinceLast) - Math.abs(a.changeSinceLast));

  const displayedCards = showAllChanged ? significant : significant.slice(0, 3);

  if (loading && changes.length === 0) {
    return (
      <div style={{ padding: "40px 32px", color: "var(--text-muted)", textAlign: "center" }}>
        <p style={{ fontSize: 14 }}>Loading market snapshot and detected changes...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100 }} className="stagger">
      {/* Hero */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8, fontFamily: "var(--font-data)" }}>
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · Live Market Snapshot
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, letterSpacing: "-0.02em" }}>
          Good morning, Sneha 👋
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.5 }}>
          Here's what changed since your last visit,{" "}
          <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{changesData.formattedLastChecked}.</span>
        </p>
      </div>

      {/* Summary tiles - All clickable */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
        <SummaryTile
          label="Stocks Tracked"
          value={watchlistCount}
          sub="In your watchlist (click to view)"
          onClick={() => onNavigate && onNavigate("watchlist")}
        />
        <SummaryTile
          label="Meaningful Changes"
          value={significant.length}
          sub="Require review"
          accent="var(--teal)"
          onClick={() => setShowAllChanged(v => !v)}
        />
        <SummaryTile
          label="Need Attention"
          value={changesData.attentionCount || attention.length}
          sub="High attention score (click for signals)"
          accent="var(--amber)"
          onClick={() => onNavigate && onNavigate("signals")}
        />
        <SummaryTile
          label="Last Checked"
          value={changesData.formattedLastChecked}
          sub="Click to sync checkpoint"
          onClick={handleResetCheckpoint}
        />
      </div>

      {/* What Changed section */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
              What Changed?
            </h2>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              {significant.length} meaningful changes detected since your last visit
            </p>
          </div>
          {significant.length > 3 && (
            <button
              onClick={() => setShowAllChanged(v => !v)}
              style={{
                padding: "7px 14px", borderRadius: 7, fontSize: 12, fontWeight: 500,
                background: "transparent", color: "var(--text-secondary)",
                border: "1px solid var(--border)", cursor: "pointer",
              }}
            >
              {showAllChanged ? "Show less" : `Show all ${significant.length}`}
            </button>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {displayedCards.map((s, i) => (
            <ChangeCard
              key={s.id || s.ticker}
              stock={s}
              onViewDetail={onViewDetail}
              onDismiss={() => handleDismissCard(s)}
              style={{ animationDelay: `${i * 0.08}s` }}
            />
          ))}
        </div>
      </div>

      {/* Two-column section: Worth attention + What did I miss */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
        {/* Worth Your Attention */}
        <div className="glass" style={{ padding: "20px 20px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--amber)" }} className="pulse" />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Worth Your Attention</h3>
          </div>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 16 }}>Prioritized by attention score</p>
          <div>
            {attention.slice(0, 5).map(s => (
              <WorthAttentionRow key={s.id || s.ticker} stock={s} onViewDetail={onViewDetail} />
            ))}
          </div>
        </div>

        {/* What Did I Miss */}
        <div className="glass" style={{ padding: "20px 20px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 14 }}>⏱</span>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>What Did I Miss?</h3>
          </div>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 16 }}>Ordered by magnitude of change</p>
          <div>
            {missed.slice(0, 5).map(s => {
              const isPositive = s.changeSinceLast >= 0;
              const typeLabels: Record<string, string> = {
                volume_spike: "Volume event",
                breakout: "Breakout",
                threshold: "Alert crossed",
                earnings: "Earnings",
                support: "Support break",
                reversal: "Reversal",
                neutral: "Normal move",
              };
              return (
                <div
                  key={s.id || s.ticker}
                  className="table-row"
                  style={{ display: "flex", alignItems: "center", padding: "12px 4px", gap: 10, cursor: "pointer" }}
                  onClick={() => onViewDetail(s)}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{s.ticker.replace(".NS", "")}</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{typeLabels[s.signalType] || "Normal move"}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p className="font-data" style={{ fontSize: 13, fontWeight: 600, color: isPositive ? "var(--positive)" : "var(--negative)" }}>
                      {isPositive ? "+" : ""}{s.changeSinceLast}%
                    </p>
                    <p className="font-data" style={{ fontSize: 10, color: "var(--text-muted)" }}>{s.volumeRatio}× vol</p>
                  </div>
                  <div style={{ width: 4, height: 36, borderRadius: 2, background: isPositive ? "var(--positive-dim)" : "var(--negative-dim)", flexShrink: 0, borderLeft: `2px solid ${isPositive ? "var(--positive)" : "var(--negative)"}` }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* No changes notice */}
      {significant.length === 0 && (
        <div className="glass" style={{ padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🟢</div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>Nothing meaningful changed</h3>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>
            All stocks moved within normal ranges since your last visit. All detected changes have been reviewed.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button
              onClick={handleResetCheckpoint}
              style={{
                padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: "var(--teal-dim)", color: "var(--teal)", border: "1px solid rgba(0,200,150,0.2)", cursor: "pointer",
              }}
            >
              Sync Checkpoint Now
            </button>
            <button
              onClick={() => onNavigate && onNavigate("settings")}
              style={{
                padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)", cursor: "pointer",
              }}
            >
              Configure Sensitivity
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
