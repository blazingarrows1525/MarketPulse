import { useEffect, useState } from "react";
import { exportWatchlistCSV, fetchUserSettings, resetSessionCheckpoint, saveUserSettings } from "../api";

export default function SettingsView() {
  const [settings, setSettings] = useState<Record<string, any>>({
    notifySignificant: "true",
    notifyVolumeSpikes: "true",
    notifyThresholds: "true",
    notifyMarketStatus: "true",
    autoRefreshInterval: "60",
    attentionScoreThreshold: "60",
    userName: "Sneha",
    userEmail: "sneha@marketpulse.io",
  });

  const [savedStatus, setSavedStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserSettings()
      .then(res => {
        if (res) setSettings(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleChangeSetting = async (key: string, val: any) => {
    const updated = { ...settings, [key]: String(val) };
    setSettings(updated);
    try {
      await saveUserSettings({ [key]: String(val) });
      setSavedStatus("Preferences saved ✓");
      setTimeout(() => setSavedStatus(""), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetCheckpoint = async () => {
    try {
      await resetSessionCheckpoint();
      setSavedStatus("Session checkpoint reset to NOW ✓");
      setTimeout(() => setSavedStatus(""), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px 32px", textAlign: "center", color: "var(--text-muted)" }}>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: 800 }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 4 }}>Settings</h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Manage notification rules, data sync, and account options</p>
        </div>
        {savedStatus && (
          <span style={{ fontSize: 12, color: "var(--teal)", fontWeight: 600, background: "rgba(0,200,150,0.1)", padding: "4px 10px", borderRadius: 6 }}>
            {savedStatus}
          </span>
        )}
      </div>

      {/* 1. Notifications */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>Notification Preferences</p>
        <div className="glass" style={{ overflow: "hidden" }}>
          {[
            { key: "notifySignificant", label: "Significant Changes", desc: "Notify when Attention Score exceeds threshold" },
            { key: "notifyVolumeSpikes", label: "Volume Spikes", desc: "Alert when volume exceeds 2.5× average" },
            { key: "notifyThresholds", label: "Target Price Alerts", desc: "Notify when price touches custom target threshold" },
            { key: "notifyMarketStatus", label: "Market Session Alerts", desc: "Notify when market opens or closes" },
          ].map(item => (
            <div key={item.key} className="table-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px" }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{item.label}</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={settings[item.key] === "true"}
                onChange={e => handleChangeSetting(item.key, e.target.checked)}
                style={{ width: 18, height: 18, accentColor: "var(--teal)", cursor: "pointer" }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 2. Data & Sync */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>Data & Sync Controls</p>
        <div className="glass" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Auto-Refresh Interval</p>
              <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Frequency of automatic market data polling</p>
            </div>
            <select
              value={settings.autoRefreshInterval || "60"}
              onChange={e => handleChangeSetting("autoRefreshInterval", e.target.value)}
              style={{
                padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.06)",
                border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 12, outline: "none",
              }}
            >
              <option value="30" style={{ background: "#0E1117" }}>Every 30 seconds</option>
              <option value="60" style={{ background: "#0E1117" }}>Every 60 seconds</option>
              <option value="300" style={{ background: "#0E1117" }}>Every 5 minutes</option>
              <option value="0" style={{ background: "#0E1117" }}>Manual Refresh Only</option>
            </select>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Attention Score Sensitivity</p>
              <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Current threshold: {settings.attentionScoreThreshold || "60"}/100</p>
            </div>
            <input
              type="range"
              min="30"
              max="90"
              step="5"
              value={settings.attentionScoreThreshold || "60"}
              onChange={e => handleChangeSetting("attentionScoreThreshold", e.target.value)}
              style={{ width: 140, accentColor: "var(--teal)" }}
            />
          </div>

          <div style={{ display: "flex", gap: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button
              onClick={exportWatchlistCSV}
              style={{
                padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)",
                color: "var(--text-primary)", cursor: "pointer",
              }}
            >
              Export Watchlist (CSV) ⤓
            </button>
            <button
              onClick={handleResetCheckpoint}
              style={{
                padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: "var(--teal-dim)", color: "var(--teal)", border: "1px solid rgba(0,200,150,0.2)", cursor: "pointer",
              }}
            >
              Reset Session Checkpoint to NOW
            </button>
          </div>
        </div>
      </div>

      {/* 3. Account Profile */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>Account Profile</p>
        <div className="glass" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>FULL NAME</label>
            <input
              value={settings.userName || "Sneha"}
              onChange={e => handleChangeSetting("userName", e.target.value)}
              style={{
                width: "100%", padding: "8px 12px", borderRadius: 8,
                background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
                color: "var(--text-primary)", fontSize: 12, outline: "none",
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>EMAIL ADDRESS</label>
            <input
              value={settings.userEmail || "sneha@marketpulse.io"}
              onChange={e => handleChangeSetting("userEmail", e.target.value)}
              style={{
                width: "100%", padding: "8px 12px", borderRadius: 8,
                background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
                color: "var(--text-primary)", fontSize: 12, outline: "none",
              }}
            />
          </div>
          <div style={{ paddingTop: 8 }}>
            <button
              onClick={() => alert("Sign out simulated. User session preserved.")}
              style={{
                padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                background: "rgba(255,77,106,0.1)", color: "var(--negative)", border: "1px solid rgba(255,77,106,0.2)", cursor: "pointer",
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
