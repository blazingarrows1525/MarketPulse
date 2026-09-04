import { getNews, getQuote } from "./marketService.js";

/**
 * Calculate Attention Score (0-100) and change signals for a quote
 */
export async function evaluateChange(quote, alertThreshold = null, lastVisitPrice = null) {
  const price = quote.price;
  const changeSinceLast = lastVisitPrice
    ? parseFloat((((price - lastVisitPrice) / lastVisitPrice) * 100).toFixed(1))
    : quote.changeToday;

  const absChange = Math.abs(changeSinceLast);
  const volRatio = quote.volumeRatio || 1.0;
  const high52w = quote.high52w || price;
  const low52w = quote.low52w || price;

  // 1. Price Score (max 40)
  let priceScore = 0;
  if (absChange >= 5.0) priceScore = 40;
  else if (absChange >= 3.0) priceScore = 30;
  else if (absChange >= 1.5) priceScore = 20;
  else if (absChange >= 0.5) priceScore = 10;

  // 2. Volume Score (max 35)
  let volumeScore = 0;
  if (volRatio >= 4.0) volumeScore = 35;
  else if (volRatio >= 2.5) volumeScore = 25;
  else if (volRatio >= 1.5) volumeScore = 15;

  // 3. 52-Week Range Score (max 15)
  let rangeScore = 0;
  const distHighPct = Math.abs(((high52w - price) / high52w) * 100);
  const distLowPct = Math.abs(((price - low52w) / low52w) * 100);
  if (distHighPct <= 1.5 || distLowPct <= 1.5) {
    rangeScore = 15;
  }

  // 4. Custom User Alert Score (max 25)
  let alertScore = 0;
  let alertTriggered = false;
  if (alertThreshold && alertThreshold > 0) {
    if ((lastVisitPrice && lastVisitPrice < alertThreshold && price >= alertThreshold) ||
        (lastVisitPrice && lastVisitPrice > alertThreshold && price <= alertThreshold) ||
        Math.abs(price - alertThreshold) / alertThreshold <= 0.01) {
      alertScore = 25;
      alertTriggered = true;
    }
  }

  // 5. News / Catalyst Score (max 15)
  const newsList = await getNews(quote.ticker);
  const hasNews = newsList && newsList.length > 0;
  const newsScore = hasNews ? 15 : 0;

  // Compute Total Attention Score (0-100)
  const totalScore = Math.min(100, priceScore + volumeScore + rangeScore + alertScore + newsScore);

  // Determine Change Level
  let changeLevel = "none";
  if (totalScore >= 75) changeLevel = "significant";
  else if (totalScore >= 50) changeLevel = "notable";
  else if (totalScore >= 25) changeLevel = "minor";

  // Determine Signal Type
  let signalType = "neutral";
  if (alertTriggered) {
    signalType = "threshold";
  } else if (hasNews && newsList.some(n => /earnings|revenue|profit|q1|q2|q3|q4|result/i.test(n.title))) {
    signalType = "earnings";
  } else if (volRatio >= 2.2) {
    signalType = "volume_spike";
  } else if (changeSinceLast <= -3.0 || distLowPct <= 1.5) {
    signalType = "support";
  } else if (changeSinceLast >= 3.0 || distHighPct <= 1.5) {
    signalType = "breakout";
  }

  // Build Factual "Why it changed" & "Why it matters"
  const cleanTicker = quote.ticker.replace(".NS", "");

  let whyChanged = "";
  if (hasNews) {
    whyChanged = `${cleanTicker} updated following recent development: "${newsList[0].title}".`;
  } else if (volRatio >= 2.0) {
    whyChanged = `Volume is ${volRatio}× its 20-day average and price moved ${changeSinceLast >= 0 ? "+" : ""}${changeSinceLast}% since your last visit. No confirmed catalyst identified.`;
  } else if (distHighPct <= 1.5) {
    whyChanged = `Price is within ${distHighPct.toFixed(1)}% of its 52-week high (₹${high52w.toLocaleString()}).`;
  } else if (distLowPct <= 1.5) {
    whyChanged = `Price is approaching its 52-week low zone (₹${low52w.toLocaleString()}) with ${changeSinceLast}% move.`;
  } else if (alertTriggered) {
    whyChanged = `Price crossed your set alert target of ₹${alertThreshold.toLocaleString()}.`;
  } else {
    whyChanged = `Moved ${changeSinceLast >= 0 ? "+" : ""}${changeSinceLast}% within normal daily trading bounds. No confirmed catalyst identified.`;
  }

  let whyMatters = "";
  if (volRatio >= 2.5) {
    whyMatters = `Unusually high volume (${volRatio}× avg) indicates elevated institutional interest and participation.`;
  } else if (alertTriggered) {
    whyMatters = `Price touched your target threshold of ₹${alertThreshold.toLocaleString()}. Re-evaluate position target.`;
  } else if (changeLevel === "significant") {
    whyMatters = `This level of volatility combined with trading activity ranks in the top decile of recent sessions.`;
  } else if (changeLevel === "notable") {
    whyMatters = `Notable trend movement requiring monitoring relative to sector peers.`;
  } else {
    whyMatters = `Tracking normally. No critical intervention required.`;
  }

  return {
    ticker: quote.ticker,
    name: quote.name,
    price: quote.price,
    changeToday: quote.changeToday,
    changeSinceLast,
    volumeRatio: volRatio,
    attentionScore: totalScore,
    signalType,
    changeLevel,
    whyChanged,
    whyMatters,
    alertTriggered,
    news: newsList,
  };
}
