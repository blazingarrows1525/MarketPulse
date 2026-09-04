import { useState } from "react";
import type { StockData } from "../data";
import Sparkline from "./Sparkline";

interface ChangeCardProps {
  stock: StockData;
  onViewDetail: (stock: StockData) => void;
  onDismiss?: () => void;
  style?: React.CSSProperties;
}

function AttentionRing({ score }: { score: number }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const color = score >= 80 ? "#F5A623" : score >= 60 ? "#7C6FFF" : "#00C896";
  const strokeDash = (score / 100) * circ;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 52, height: 52 }}>
      <svg width={52} height={52} viewBox="0 0 52 52" style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}>
        <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
        <circle
          cx="26" cy="26" r={r} fill="none"
          stroke={color} strokeWidth="2.5"
          strokeDasharray={`${strokeDash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <span className="font-data font-medium" style={{ fontSize: 13, color, zIndex: 1 }}>{score}</span>
    </div>
  );
}

function ChangeLevelBadge({ level }: { level: StockData["changeLevel"] }) {
  const map: Record<string, string> = {
    significant: "badge-amber",
    notable: "badge-indigo",
    minor: "badge-muted",
    none: "badge-muted",
  };
  const labels: Record<string, string> = {
    significant: "Significant Change",
    notable: "Notable Change",
    minor: "Minor Change",
    none: "No Change",
  };
  return <span className={`badge ${map[level]}`}>{labels[level]}</span>;
}

function SignalIcon({ type }: { type: StockData["signalType"] }) {
  const icons: Record<string, string> = {
    volume_spike: "⚡",
    breakout: "↗",
    threshold: "🔔",
    earnings: "📊",
    support: "⚠",
    reversal: "↩",
    neutral: "·",
  };
  return <span style={{ fontSize: 12 }}>{icons[type] || "·"}</span>;
}

export default function ChangeCard({ stock, onViewDetail, onDismiss, style }: ChangeCardProps) {
  const [dismissed, setDismissed] = useState(false);
  const isPositive = stock.changeSinceLast >= 0;

  if (dismissed) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  const glowClass = stock.attentionScore >= 80 ? "glow-amber" : "";
  const cleanTicker = stock.ticker.replace(".NS", "");

  return (
    <div
      className={`glass fade-up ${glowClass}`}
      style={{
        padding: "20px 22px",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.2s ease",
        ...style,
      }}
      onClick={() => onViewDetail(stock)}
    >
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", borderRadius: "var(--card-radius)",
        background: isPositive
          ? "linear-gradient(135deg, rgba(16,201,122,0.04) 0%, transparent 60%)"
          : "linear-gradient(135deg, rgba(255,77,106,0.04) 0%, transparent 60%)",
      }} />

      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, position: "relative" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-data)" }}>
              {stock.name}
            </span>
            <span style={{ fontSize: 10, color: "var(--text-muted)", background: "rgba(255,255,255,0.05)", padding: "1px 6px", borderRadius: 4, fontFamily: "var(--font-data)" }}>
              {cleanTicker}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span className="font-data" style={{ fontSize: 24, fontWeight: 500, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              ₹{stock.price ? stock.price.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "0.00"}
            </span>
            <span className="font-data" style={{
              fontSize: 14, fontWeight: 500,
              color: isPositive ? "var(--positive)" : "var(--negative)",
            }}>
              {isPositive ? "+" : ""}{stock.changeSinceLast}% since last visit
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <Sparkline data={stock.sparkline || [stock.price]} positive={isPositive} width={80} height={40} />
          <AttentionRing score={stock.attentionScore} />
        </div>
      </div>

      {/* Badge row */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, alignItems: "center" }}>
        <ChangeLevelBadge level={stock.changeLevel} />
        <span className="badge badge-muted">
          <SignalIcon type={stock.signalType} />
          {stock.signalType.replace("_", " ")}
        </span>
        <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-data)" }}>
          Since {stock.lastChecked || "last visit"}
        </span>
      </div>

      {/* Why it changed */}
      <div style={{
        background: "rgba(255,255,255,0.03)", borderRadius: 8,
        padding: "12px 14px", marginBottom: 12,
        borderLeft: "2px solid rgba(255,255,255,0.1)",
      }}>
        <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
          Why it changed
        </p>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55 }}>
          {stock.whyChanged}
        </p>
      </div>

      {/* Why it matters */}
      <div style={{
        background: "rgba(255,255,255,0.02)", borderRadius: 8,
        padding: "12px 14px", marginBottom: 16,
        borderLeft: stock.attentionScore >= 70 ? "2px solid rgba(245,166,35,0.4)" : "2px solid rgba(124,111,255,0.3)",
      }}>
        <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
          Why it matters
        </p>
        <p style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.55 }}>
          {stock.whyMatters}
        </p>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onViewDetail(stock); }}
            style={{
              padding: "7px 16px", borderRadius: 7, fontSize: 12, fontWeight: 600,
              background: "var(--teal-dim)", color: "var(--teal)",
              border: "1px solid rgba(0,200,150,0.2)", cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            View Details
          </button>
          <button
            onClick={handleDismiss}
            style={{
              padding: "7px 16px", borderRadius: 7, fontSize: 12, fontWeight: 500,
              background: "transparent", color: "var(--text-muted)",
              border: "1px solid var(--border)", cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            Dismiss
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-data)" }}>
            Attention Score
          </span>
          <span className="font-data" style={{
            fontSize: 12, fontWeight: 600,
            color: stock.attentionScore >= 80 ? "var(--amber)" : stock.attentionScore >= 60 ? "var(--indigo)" : "var(--text-secondary)",
          }}>
            {stock.attentionScore}/100
          </span>
        </div>
      </div>
    </div>
  );
}
