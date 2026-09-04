export type SignalType = "volume_spike" | "breakout" | "threshold" | "earnings" | "support" | "reversal" | "neutral";
export type ChangeLevel = "significant" | "notable" | "minor" | "none";

export interface StockData {
  id: string;
  name: string;
  ticker: string;
  sector: string;
  price: number;
  changeSinceLast: number;
  changeToday: number;
  volumeRatio: number;
  attentionScore: number;
  signalType: SignalType;
  changeLevel: ChangeLevel;
  whyChanged: string;
  whyMatters: string;
  lastChecked: string;
  lastUpdated: string;
  sparkline: number[];
  high52w: number;
  low52w: number;
  avgVolume: number;
  currentVolume: number;
  marketCap: string;
  pe: number;
  alertThreshold?: number;
  alertTriggered?: boolean;
}

export interface Signal {
  id: string;
  ticker: string;
  name: string;
  type: SignalType;
  title: string;
  description: string;
  strength: number;
  time: string;
  price: number;
  change: number;
}

export interface Activity {
  id: string;
  type: "added" | "dismissed" | "alert" | "threshold" | "visited";
  ticker?: string;
  description: string;
  time: string;
}

function gen(base: number, len: number = 20, trend: number = 0): number[] {
  const pts: number[] = [base];
  for (let i = 1; i < len; i++) {
    const delta = (Math.random() - 0.48 + trend * 0.04) * base * 0.012;
    pts.push(Math.max(base * 0.85, pts[i - 1] + delta));
  }
  return pts;
}

export const stocks: StockData[] = [
  {
    id: "1",
    name: "Reliance Industries",
    ticker: "RELIANCE",
    sector: "Energy",
    price: 1428.5,
    changeSinceLast: 3.8,
    changeToday: 2.1,
    volumeRatio: 2.4,
    attentionScore: 82,
    signalType: "volume_spike",
    changeLevel: "significant",
    whyChanged: "Volume is 2.4× its 20-day average and price moved decisively beyond its recent trading range.",
    whyMatters: "Unusually strong participation suggests institutional interest. This kind of breakout with volume confirmation is rare — it's happened only 3 times in the past year.",
    lastChecked: "2h 14m ago",
    lastUpdated: "4 min ago",
    sparkline: gen(1374, 20, 1),
    high52w: 1490.0,
    low52w: 1178.3,
    avgVolume: 8200000,
    currentVolume: 19680000,
    marketCap: "₹19.3L Cr",
    pe: 28.4,
  },
  {
    id: "2",
    name: "HDFC Bank",
    ticker: "HDFCBANK",
    sector: "Banking",
    price: 1678.15,
    changeSinceLast: 2.3,
    changeToday: 1.4,
    volumeRatio: 1.8,
    attentionScore: 71,
    signalType: "threshold",
    changeLevel: "notable",
    whyChanged: "Price is within 1.2% of its 52-week high. A close above ₹1,700 would mark a new annual high.",
    whyMatters: "You set an alert for ₹1,680. Price touched ₹1,682 intraday before pulling back slightly.",
    lastChecked: "2h 14m ago",
    lastUpdated: "7 min ago",
    sparkline: gen(1640, 20, 0.8),
    high52w: 1699.5,
    low52w: 1363.0,
    avgVolume: 14500000,
    currentVolume: 26100000,
    marketCap: "₹12.7L Cr",
    pe: 19.8,
    alertThreshold: 1680,
    alertTriggered: true,
  },
  {
    id: "3",
    name: "Infosys",
    ticker: "INFY",
    sector: "Technology",
    price: 1842.0,
    changeSinceLast: 5.6,
    changeToday: 5.6,
    volumeRatio: 3.1,
    attentionScore: 91,
    signalType: "earnings",
    changeLevel: "significant",
    whyChanged: "Infosys reported Q2 earnings with revenue beating estimates by 4.2% and raised full-year guidance.",
    whyMatters: "The gap-up opening (₹107) is the largest single-day move in 14 months. Options market is pricing elevated volatility for 3 more sessions.",
    lastChecked: "2h 14m ago",
    lastUpdated: "2 min ago",
    sparkline: gen(1744, 20, 1.5),
    high52w: 1880.0,
    low52w: 1314.25,
    avgVolume: 11200000,
    currentVolume: 34720000,
    marketCap: "₹7.6L Cr",
    pe: 26.1,
  },
  {
    id: "4",
    name: "TCS",
    ticker: "TCS",
    sector: "Technology",
    price: 3924.6,
    changeSinceLast: 0.4,
    changeToday: 0.2,
    volumeRatio: 0.7,
    attentionScore: 18,
    signalType: "neutral",
    changeLevel: "minor",
    whyChanged: "Moved within its normal daily range. No unusual activity detected.",
    whyMatters: "No meaningful changes since your last visit. Tracking normally.",
    lastChecked: "2h 14m ago",
    lastUpdated: "6 min ago",
    sparkline: gen(3908, 20, 0),
    high52w: 4218.75,
    low52w: 3311.0,
    avgVolume: 3800000,
    currentVolume: 2660000,
    marketCap: "₹14.2L Cr",
    pe: 31.2,
  },
  {
    id: "5",
    name: "Bajaj Finance",
    ticker: "BAJFINANCE",
    sector: "NBFC",
    price: 6812.35,
    changeSinceLast: -4.2,
    changeToday: -3.8,
    volumeRatio: 2.9,
    attentionScore: 78,
    signalType: "support",
    changeLevel: "significant",
    whyChanged: "Closed below ₹7,000 — a key support level it held for 6 months. Volume on the breakdown was 2.9× average.",
    whyMatters: "Support breaks with heavy volume often invite follow-through selling. The next meaningful support zone is ₹6,500–₹6,600.",
    lastChecked: "2h 14m ago",
    lastUpdated: "5 min ago",
    sparkline: gen(7100, 20, -1.5),
    high52w: 7640.0,
    low52w: 6012.1,
    avgVolume: 2100000,
    currentVolume: 6090000,
    marketCap: "₹4.2L Cr",
    pe: 34.5,
  },
  {
    id: "6",
    name: "Tata Motors",
    ticker: "TATAMOTORS",
    sector: "Auto",
    price: 918.75,
    changeSinceLast: 2.9,
    changeToday: 2.1,
    volumeRatio: 1.6,
    attentionScore: 56,
    signalType: "breakout",
    changeLevel: "notable",
    whyChanged: "Government announced PLI scheme expansion for EV manufacturers. Tata Motors is a primary beneficiary.",
    whyMatters: "News-driven move with above-average volume. Price broke above a 3-week consolidation range.",
    lastChecked: "2h 14m ago",
    lastUpdated: "9 min ago",
    sparkline: gen(893, 20, 0.9),
    high52w: 1064.35,
    low52w: 772.55,
    avgVolume: 9600000,
    currentVolume: 15360000,
    marketCap: "₹3.3L Cr",
    pe: 11.8,
  },
  {
    id: "7",
    name: "Zomato",
    ticker: "ZOMATO",
    sector: "Consumer Tech",
    price: 247.8,
    changeSinceLast: 6.1,
    changeToday: 4.3,
    volumeRatio: 4.2,
    attentionScore: 88,
    signalType: "volume_spike",
    changeLevel: "significant",
    whyChanged: "Volume is 4.2× the 20-day average — the highest single-day volume in 8 months. No public catalyst identified.",
    whyMatters: "Extreme volume without a clear news trigger often precedes a disclosure or institutional accumulation. This warrants close monitoring.",
    lastChecked: "2h 14m ago",
    lastUpdated: "3 min ago",
    sparkline: gen(234, 20, 1.4),
    high52w: 272.35,
    low52w: 147.5,
    avgVolume: 18400000,
    currentVolume: 77280000,
    marketCap: "₹2.2L Cr",
    pe: 89.4,
  },
  {
    id: "8",
    name: "Wipro",
    ticker: "WIPRO",
    sector: "Technology",
    price: 478.25,
    changeSinceLast: -1.1,
    changeToday: -0.8,
    volumeRatio: 0.9,
    attentionScore: 24,
    signalType: "neutral",
    changeLevel: "minor",
    whyChanged: "Minor pullback within normal daily range. Volume slightly below average.",
    whyMatters: "No meaningful changes detected. Sector sentiment slightly negative.",
    lastChecked: "2h 14m ago",
    lastUpdated: "8 min ago",
    sparkline: gen(483, 20, -0.2),
    high52w: 562.4,
    low52w: 396.5,
    avgVolume: 7100000,
    currentVolume: 6390000,
    marketCap: "₹2.5L Cr",
    pe: 22.1,
  },
];

export const signals: Signal[] = [
  {
    id: "s1",
    ticker: "ZOMATO",
    name: "Zomato",
    type: "volume_spike",
    title: "Extreme Volume Anomaly",
    description: "Trading at 4.2× its 20-day average volume with no public catalyst. Suggests institutional activity or imminent disclosure.",
    strength: 94,
    time: "14 min ago",
    price: 247.8,
    change: 6.1,
  },
  {
    id: "s2",
    ticker: "INFY",
    name: "Infosys",
    type: "earnings",
    title: "Earnings Beat + Guidance Upgrade",
    description: "Q2 revenue beat by 4.2%. Full-year guidance raised by 1.5%. Largest earnings gap-up in 14 months.",
    strength: 91,
    time: "2h 8m ago",
    price: 1842.0,
    change: 5.6,
  },
  {
    id: "s3",
    ticker: "RELIANCE",
    name: "Reliance Industries",
    type: "breakout",
    title: "Range Breakout with Volume",
    description: "Price moved above a 3-week consolidation range on 2.4× average volume — a confirmed breakout setup.",
    strength: 82,
    time: "47 min ago",
    price: 1428.5,
    change: 3.8,
  },
  {
    id: "s4",
    ticker: "BAJFINANCE",
    name: "Bajaj Finance",
    type: "support",
    title: "Key Support Level Broken",
    description: "Broke below ₹7,000 — a level that held for 6 months — with high volume. Potential for further downside.",
    strength: 78,
    time: "1h 22m ago",
    price: 6812.35,
    change: -4.2,
  },
  {
    id: "s5",
    ticker: "HDFCBANK",
    name: "HDFC Bank",
    type: "threshold",
    title: "User Alert Triggered",
    description: "Price touched your alert level of ₹1,680 intraday. Approaching 52-week high of ₹1,699.50.",
    strength: 71,
    time: "38 min ago",
    price: 1678.15,
    change: 2.3,
  },
  {
    id: "s6",
    ticker: "TATAMOTORS",
    name: "Tata Motors",
    type: "reversal",
    title: "News-Driven Breakout",
    description: "PLI scheme expansion announcement triggered a break above 3-week consolidation resistance at ₹900.",
    strength: 56,
    time: "1h 54m ago",
    price: 918.75,
    change: 2.9,
  },
];

export const activities: Activity[] = [
  {
    id: "a1",
    type: "alert",
    ticker: "HDFCBANK",
    description: "Your ₹1,680 price alert for HDFCBANK was triggered.",
    time: "38 min ago",
  },
  {
    id: "a2",
    type: "visited",
    ticker: "INFY",
    description: "You last viewed INFY detail page.",
    time: "2h 14m ago",
  },
  {
    id: "a3",
    type: "threshold",
    ticker: "BAJFINANCE",
    description: "BAJFINANCE broke below your watched level of ₹7,000.",
    time: "1h 22m ago",
  },
  {
    id: "a4",
    type: "added",
    ticker: "ZOMATO",
    description: "You added ZOMATO to your watchlist.",
    time: "3 days ago",
  },
  {
    id: "a5",
    type: "dismissed",
    ticker: "WIPRO",
    description: "You dismissed a volume alert for WIPRO.",
    time: "4 days ago",
  },
  {
    id: "a6",
    type: "added",
    ticker: "TATAMOTORS",
    description: "You added TATAMOTORS to your watchlist.",
    time: "1 week ago",
  },
];
