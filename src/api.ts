import type { Activity, Signal, StockData } from "./data";

const API_BASE = "/api";

export async function fetchMarketOverview() {
  try {
    const res = await fetch(`${API_BASE}/market/overview`);
    if (!res.ok) throw new Error("Failed to fetch market overview");
    return await res.json();
  } catch (err) {
    console.error("Market overview API error:", err);
    return {
      status: { isOpen: false, statusText: "Market Closed", exchange: "NSE", nextSession: "Opens in 17h 42m" },
      indices: [
        { name: "NIFTY 50", value: "24,677.80", change: "+0.34%", pos: true },
        { name: "SENSEX", value: "81,224.75", change: "+0.29%", pos: true },
        { name: "NIFTY BANK", value: "52,301.45", change: "-0.12%", pos: false },
        { name: "NIFTY IT", value: "39,854.20", change: "+1.47%", pos: true },
      ],
      sectors: [
        { name: "Information Technology", change: "+1.47%", pos: true },
        { name: "Energy", change: "+1.12%", pos: true },
        { name: "Auto", change: "+0.87%", pos: true },
        { name: "Banking", change: "-0.12%", pos: false },
        { name: "NBFC", change: "-1.23%", pos: false },
        { name: "Consumer Tech", change: "+2.31%", pos: true },
      ],
    };
  }
}

export async function fetchWatchlist(): Promise<{ stocks: StockData[]; lastCheckedTime: string; formattedLastChecked: string }> {
  const res = await fetch(`${API_BASE}/watchlist`);
  if (!res.ok) throw new Error("Failed to fetch watchlist");
  return await res.json();
}

export async function addStockToWatchlist(ticker: string, name?: string, sector?: string, alertThreshold?: number) {
  const res = await fetch(`${API_BASE}/watchlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker, name, sector, alertThreshold }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to add stock");
  return data;
}

export async function removeStockFromWatchlist(ticker: string) {
  const res = await fetch(`${API_BASE}/watchlist/${encodeURIComponent(ticker)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to remove stock");
  return await res.json();
}

export async function setStockAlertThreshold(ticker: string, alertThreshold: number | null) {
  const res = await fetch(`${API_BASE}/watchlist/${encodeURIComponent(ticker)}/alert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ alertThreshold }),
  });
  if (!res.ok) throw new Error("Failed to set alert threshold");
  return await res.json();
}

export async function fetchDetectedChanges() {
  const res = await fetch(`${API_BASE}/changes`);
  if (!res.ok) throw new Error("Failed to fetch changes");
  return await res.json();
}

export async function dismissChangeAlert(changeId: string) {
  const res = await fetch(`${API_BASE}/changes/${encodeURIComponent(changeId)}/dismiss`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to dismiss change");
  return await res.json();
}

export async function fetchSignals(): Promise<Signal[]> {
  const res = await fetch(`${API_BASE}/signals`);
  if (!res.ok) throw new Error("Failed to fetch signals");
  return await res.json();
}

export async function fetchActivities(): Promise<Activity[]> {
  const res = await fetch(`${API_BASE}/activity`);
  if (!res.ok) throw new Error("Failed to fetch activity");
  return await res.json();
}

export async function clearActivityHistory() {
  const res = await fetch(`${API_BASE}/activity/clear`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to clear activity history");
  return await res.json();
}

export async function fetchStockDetail(ticker: string) {
  const res = await fetch(`${API_BASE}/stocks/${encodeURIComponent(ticker)}`);
  if (!res.ok) throw new Error("Failed to fetch stock detail");
  return await res.json();
}

export async function searchStocksAPI(query: string) {
  if (!query || query.trim().length === 0) return [];
  const res = await fetch(`${API_BASE}/stocks/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  return await res.json();
}

export async function updateSessionCheckpoint() {
  const res = await fetch(`${API_BASE}/session/checkpoint`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to update checkpoint");
  return await res.json();
}

export async function resetSessionCheckpoint() {
  const res = await fetch(`${API_BASE}/session/reset`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to reset checkpoint");
  return await res.json();
}

export async function fetchUserSettings() {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) throw new Error("Failed to fetch settings");
  return await res.json();
}

export async function saveUserSettings(settings: Record<string, any>) {
  const res = await fetch(`${API_BASE}/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error("Failed to save settings");
  return await res.json();
}

export function exportWatchlistCSV() {
  window.open(`${API_BASE}/watchlist/export`, "_blank");
}
