const cacheMs = 0;
const googleCache = new Map();

const TEXT = {
  provider: "Google \u8ca1\u7d93",
  tw: "\u53f0\u80a1",
  us: "\u7f8e\u80a1",
  delayed: "\u6458\u8981\u884c\u60c5\u53ef\u80fd\u70ba\u77ed\u5ef6\u9072\u8cc7\u6599",
  source: "\u8cc7\u6599\u4f86\u6e90"
};

export function cleanSymbol(raw) {
  return String(raw || "").trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "");
}

function isTaiwanSymbol(symbol) {
  return /^\d{4,6}[A-Z]?$/.test(symbol);
}

function isUsSymbol(symbol) {
  return /^[A-Z][A-Z0-9.-]{0,10}$/.test(symbol) && !symbol.endsWith(".HK");
}

function decodeHtml(text) {
  return String(text || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTitle(symbol, title) {
  return decodeHtml(title)
    .replace(new RegExp(`\\s*\\(${symbol}\\).*Google.*$`, "u"), "")
    .replace(/\s*-\s*Google Finance.*$/u, "")
    .trim();
}

function parseGoogleNumber(value) {
  if (!value) return null;
  const number = Number(
    decodeHtml(value)
      .replace(/US\$/g, "")
      .replace(/NT\$/g, "")
      .replace(/[,$]/g, "")
      .replace(/[^\d.+-]/g, "")
  );
  return Number.isFinite(number) ? number : null;
}

function formatExchangeTime(parts) {
  const [year, month, day, hour, minute] = parts.map(Number);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

async function fetchText(url, headers) {
  const response = await fetch(url, { cache: "no-store", headers });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

function makeQuote({ symbol, exchange, market, displayName, price, change, changePercent, quoteTime, previousClose, volume }) {
  const marketLabel = market === "TW" ? TEXT.tw : TEXT.us;
  return {
    provider: TEXT.provider,
    exchange,
    displayName: `${displayName || symbol} / ${marketLabel}`,
    market,
    price,
    change,
    changePercent,
    quoteTime,
    open: null,
    previousClose,
    high: null,
    low: null,
    volume,
    note: `${TEXT.source}: ${TEXT.provider} ${symbol}:${exchange}. ${TEXT.delayed}.`
  };
}

function parseGoogleSummary(symbol, exchange, html, displayName, market) {
  const mainEnd = html.indexOf('jsname="MttRe"');
  const mainHtml = mainEnd > 0 ? html.slice(0, mainEnd) : html;
  const timeMatches = [...mainHtml.matchAll(/<div class="jZZ2de">([^<]+?)&nbsp;\s*&middot;\s*&nbsp;\s*(?:USD|TWD|NT\$)<\/div>/g)];
  const timeMatch = timeMatches.at(-1);
  const timeIndex = timeMatch ? timeMatch.index : -1;
  const block = timeIndex >= 0 ? mainHtml.slice(Math.max(0, timeIndex - 2600), timeIndex + timeMatch[0].length) : mainHtml;
  const priceMatches = [...block.matchAll(/<span jsname="Pdsbrc"[^>]*>\s*<span>((?:US\$|NT\$|\$|[\d,.])[^<]+)<\/span>/g)];
  const priceMatch = priceMatches.at(-1);
  const changeMatch = block.match(/<span jsname="xnruHf"[^>]*>\s*<span>([-+]?[\d,.]+)<\/span>/);
  const percentMatch = block.match(/<span jsname="vY9t3b"[^>]*>\s*<span[^>]*>([-+]?[\d,.]+)%<\/span>/);
  const price = parseGoogleNumber(priceMatch?.[1]);

  if (!Number.isFinite(price)) {
    throw new Error("Google Finance did not expose a readable price.");
  }

  const change = parseGoogleNumber(changeMatch?.[1]);
  const changePercent = parseGoogleNumber(percentMatch?.[1]);
  const previousClose = Number.isFinite(change) ? price - change : null;

  return makeQuote({
    symbol,
    exchange,
    market,
    displayName,
    price,
    change,
    changePercent,
    quoteTime: timeMatch ? `${decodeHtml(timeMatch[1]).replace(/\s+/g, " ")}${market === "US" ? " ET" : ""}` : "",
    previousClose,
    volume: null
  });
}

function parseGoogleQuote(symbol, exchange, html, market) {
  const canonical = `quote/${symbol}:${exchange}`;
  if (!html.includes(canonical) && !html.includes(`["${symbol}","${exchange}"]`)) {
    throw new Error("Google Finance returned a different symbol page.");
  }

  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  const rawTitle = decodeHtml(titleMatch?.[1] || "");
  if (!rawTitle.includes(`(${symbol})`)) {
    throw new Error("Google Finance title did not match the requested symbol.");
  }

  const displayName = stripTitle(symbol, rawTitle) || symbol;
  try {
    return parseGoogleSummary(symbol, exchange, html, displayName, market);
  } catch {
    // Fall back to embedded chart rows only when the visible quote block is not available.
  }

  const rowPattern = /\[\[(\d{4}),(\d{1,2}),(\d{1,2}),(\d{1,2}),(\d{1,2}),null,null,\[(-?\d+)\]\],\[(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),2,2,3\],(\d+)\]/g;
  const rows = [...html.matchAll(rowPattern)];

  if (!rows.length) {
    return parseGoogleSummary(symbol, exchange, html, displayName, market);
  }

  const last = rows.reduce((latest, row) => {
    const currentTime = Date.UTC(Number(row[1]), Number(row[2]) - 1, Number(row[3]), Number(row[4]), Number(row[5]));
    const latestTime = Date.UTC(Number(latest[1]), Number(latest[2]) - 1, Number(latest[3]), Number(latest[4]), Number(latest[5]));
    return currentTime > latestTime ? row : latest;
  }, rows[0]);

  const [, year, month, day, hour, minute, , priceText, changeText, changeRatioText, volumeText] = last;
  const price = Number(priceText);
  const change = Number(changeText);
  const changeRatio = Number(changeRatioText);
  const previousClose = Number.isFinite(change) ? price - change : null;

  return makeQuote({
    symbol,
    exchange,
    market,
    displayName,
    price,
    change,
    changePercent: Number.isFinite(changeRatio) ? changeRatio * 100 : null,
    quoteTime: `${formatExchangeTime([year, month, day, hour, minute])}${market === "US" ? " ET" : ""}`,
    previousClose,
    volume: Number(volumeText)
  });
}

async function fetchGoogleQuoteForExchange(symbol, exchange, market) {
  const cacheKey = `${symbol}:${exchange}`;
  const cached = googleCache.get(cacheKey);
  const now = Date.now();
  if (cacheMs > 0 && cached && now - cached.at < cacheMs) return cached.quote;

  const html = await fetchText(`https://www.google.com/finance/beta/quote/${encodeURIComponent(symbol)}:${exchange}?hl=zh-TW&_=${Date.now()}`, {
    "accept": "text/html,application/xhtml+xml",
    "accept-language": "zh-TW,zh;q=0.9,en;q=0.8",
    "user-agent": "Mozilla/5.0 stock-tracker"
  });
  const quote = parseGoogleQuote(symbol, exchange, html, market);
  googleCache.set(cacheKey, { at: now, quote });
  return quote;
}

async function fetchTaiwanQuote(symbol) {
  return fetchGoogleQuoteForExchange(symbol, "TPE", "TW");
}

async function fetchUsQuote(symbol) {
  const exchanges = ["NASDAQ", "NYSE", "NYSEARCA", "AMEX"];
  const errors = [];

  for (const exchange of exchanges) {
    try {
      return await fetchGoogleQuoteForExchange(symbol, exchange, "US");
    } catch (error) {
      errors.push(`${exchange}: ${error.message}`);
    }
  }

  throw new Error(`Google Finance could not find US symbol ${symbol}. ${errors.join(" | ")}`);
}

export async function fetchQuote(rawSymbol) {
  const symbol = cleanSymbol(rawSymbol);
  if (!symbol) throw new Error("Please enter a stock symbol.");
  if (symbol.endsWith(".HK")) throw new Error("Hong Kong stocks are not supported.");
  if (isTaiwanSymbol(symbol)) return fetchTaiwanQuote(symbol);
  if (isUsSymbol(symbol)) return fetchUsQuote(symbol);
  throw new Error("Unsupported symbol. Try Taiwan symbols like 0056 or 2330, or US symbols like AAPL, VT, VOO.");
}
