import { useEffect, useState } from "react";
import { clearActivityHistory, fetchActivities, fetchStockDetail } from "../api";
import type { Activity, StockData } from "../data";

interface Props {
  onViewDetail?: (stock: StockData) => void;
}

type ActFilter = "all" | "alert" | "visited" | "added" | "dismissed";

function typeIcon(type: Activity["type"]) {
  switch (type) {
    case "alert": return "🔔";
    case "visited": return "👁";
    case "threshold": return "⚡";
    case "added": return "+";
    case "dismissed": return "✕";
    default: return "⏱";
  }
}

function typeBadgeClass(type: Activity["type"]) {
  switch (type) {
    case "alert": return "badge-amber";
    case "threshold": return "badge-indigo";
    case "added": return "badge-teal";
    case "dismissed": return "badge-muted";
    case "visited": return "badge-muted";
    default: return "badge-muted";
  }
}

export default function ActivityView({ onViewDetail }: Props) {
  const [activitiesList, setActivitiesList] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ActFilter>("all");

  const loadData = () => {
    setLoading(true);
    fetchActivities()
      .then(res => {
        setActivitiesList(res || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClearHistory = async () => {
    try {
      await clearActivityHistory();
      setActivitiesList([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRowClick = async (ticker?: string) => {
    if (!ticker || !onViewDetail) return;
    try {
      const stock = await fetchStockDetail(ticker);
      onViewDetail(stock);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = activitiesList.filter(item => {
    if (filter === "all") return true;
    if (filter === "alert") return item.type === "alert" || item.type === "threshold";
    return item.type === filter;
  });

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 4 }}>Activity</h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Recent history of actions and triggered alerts</p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.03)", padding: 3, borderRadius: 8, border: "1px solid var(--border)" }}>
            {[
              { id: "all", label: "All" },
              { id: "alert", label: "Alerts" },
              { id: "visited", label: "Visited" },
              { id: "added", label: "Added" },
              { id: "dismissed", label: "Dismissed" },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as ActFilter)}
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

          <button
            onClick={handleClearHistory}
            style={{
              padding: "7px 12px", borderRadius: 8, fontSize: 11, fontWeight: 500,
              background: "rgba(255,77,106,0.1)", color: "var(--negative)", border: "1px solid rgba(255,77,106,0.2)", cursor: "pointer",
            }}
          >
            Clear History
          </button>
        </div>
      </div>

      <div className="glass" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Loading activity log...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No activities match this category filter.</p>
          </div>
        ) : (
          filtered.map((item, idx) => {
            const cleanT = item.ticker ? item.ticker.replace(".NS", "") : undefined;
            return (
              <div
                key={item.id || idx}
                className="table-row"
                style={{
                  display: "flex", alignItems: "center", padding: "16px 20px", gap: 14,
                  cursor: item.ticker ? "pointer" : "default",
                }}
                onClick={() => handleRowClick(item.ticker)}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 8, background: "rgba(255,255,255,0.04)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0,
                }}>
                  {typeIcon(item.type)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    {cleanT && (
                      <span className="font-data" style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>
                        {cleanT}
                      </span>
                    )}
                    <span className={`badge ${typeBadgeClass(item.type)}`} style={{ fontSize: 9 }}>
                      {item.type}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{item.description}</p>
                </div>

                <span className="font-data" style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.time}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
