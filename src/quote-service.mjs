const cacheMs = 25_000;

let wantGooCache = null;
let wantGooCacheAt = 0;
let wantGooCachePromise = null;
const googleCache = new Map();

export function cleanSymbol(raw) {
  return String(raw || "").trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "");
}

function isTaiwanSymbol(symbol) {
  return /^\d{4,6}[A-Z]?$/.test(symbol);
}

function isUsSymbol(symbol) {
  return /^[A-Z][A-Z0-9.-]{0,10}$/.test(symbol) && !symbol.endsWith(".HK");
}

function formatTaipeiTime(timestamp) {
  if (!timestamp) return "";
  const parts = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(new Date(timestamp));
  const part = (type) => parts.find((item) => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")} ${part("hour")}:${part("minute")}`;
}

function formatExchangeTime(parts) {
  const [year, month, day, hour, minute] = parts.map(Number);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function decodeHtml(text) {
  return String(text || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseGoogleNumber(value) {
  if (!value) return null;
  const number = Number(decodeHtml(value).replace(/US\$/g, "").replace(/,/g, "").replace(/[^\d.+-]/g, ""));
  return Number.isFinite(number) ? number : null;
}

async function fetchJson(url, headers) {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function fetchText(url, headers) {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

async function fetchWantGooJson(path) {
  return fetchJson(`https://www.wantgoo.com${path}`, {
    "accept": "application/json, text/plain, */*",
    "accept-language": "zh-TW,zh;q=0.9,en;q=0.8",
    "referer": "https://www.wantgoo.com/stock/2330",
    "x-requested-with": "XMLHttpRequest",
    "user-agent": "Mozilla/5.0 stock-tracker"
  });
}

async function loadWantGooData() {
  const now = Date.now();
  if (wantGooCache && now - wantGooCacheAt < cacheMs) return wantGooCache;
  if (wantGooCachePromise) return wantGooCachePromise;

  wantGooCachePromise = Promise.all([
    fetchWantGooJson("/investrue/all-quote-info"),
    fetchWantGooJson("/investrue/all-alive")
  ]).then(([quotes, alive]) => {
    const instruments = new Map(
      alive
        .filter((item) => item.country === "TW" && ["Stock", "ETF", "ETN"].includes(item.type))
        .map((item) => [String(item.id).toUpperCase(), item])
    );

    wantGooCache = {
      quotes: new Map(quotes.map((item) => [String(item.id).toUpperCase(), item])),
      instruments
    };
    wantGooCacheAt = Date.now();
    wantGooCachePromise = null;
    return wantGooCache;
  }).catch((error) => {
    wantGooCachePromise = null;
    throw error;
  });

  return wantGooCachePromise;
}

async function fetchTaiwanQuote(symbol) {
  const data = await loadWantGooData();
  const quote = data.quotes.get(symbol);
  const instrument = data.instruments.get(symbol);
  if (!quote || !instrument) throw new Error(`玩股網查無台股代號 ${symbol}`);

  const previousClose = quote.previousClose ?? quote.flat;
  const change = Number.isFinite(previousClose) ? quote.close - previousClose : null;
  const changePercent = Number.isFinite(previousClose) ? change / previousClose * 100 : null;

  return {
    provider: "玩股網",
    displayName: instrument.name,
    market: "TW",
    price: quote.close,
    change,
    changePercent,
    quoteTime: formatTaipeiTime(quote.time),
    open: quote.open,
    previousClose,
    high: quote.high,
    low: quote.low,
    volume: quote.volume,
    note: "資料來源：玩股網 all-quote-info 即時行情。休市日時會顯示最近交易日資料。"
  };
}

function parseGoogleFinance(symbol, exchange, html) {
  const canonical = `quote/${symbol}:${exchange}`;
  if (!html.includes(canonical) && !html.includes(`["${symbol}","${exchange}"]`)) {
    throw new Error("頁面不符合指定代號");
  }

  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  const title = titleMatch ? decodeHtml(titleMatch[1]) : "";
  const displayName = title
    .replace(/\s*\([^)]*\)\s*股價與新聞\s*-\s*Google 財經.*/u, "")
    .replace(/\s*\([^)]*\)\s*價格與新聞\s*-\s*Google 財經.*/u, "")
    .replace(/\s*-\s*Google Finance.*/u, "")
    .trim() || `${symbol} / 美股`;

  const rowPattern = /\[\[(\d{4}),(\d{1,2}),(\d{1,2}),(\d{1,2}),(\d{1,2}),null,null,\[(-?\d+)\]\],\[(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),2,2,3\],(\d+)\]/g;
  const rows = [...html.matchAll(rowPattern)];
  if (!rows.length) return parseGoogleSummary(symbol, exchange, html, displayName);

  const last = rows.reduce((latest, row) => {
    const currentTime = Date.UTC(Number(row[1]), Number(row[2]) - 1, Number(row[3]), Number(row[4]), Number(row[5]));
    const latestTime = Date.UTC(Number(latest[1]), Number(latest[2]) - 1, Number(latest[3]), Number(latest[4]), Number(latest[5]));
    return currentTime > latestTime ? row : latest;
  }, rows[0]);

  const [, year, month, day, hour, minute, , price, change, changeRatio, volume] = last;
  const numericPrice = Number(price);
  const numericChange = Number(change);
  const numericRatio = Number(changeRatio);
  const previousClose = Number.isFinite(numericChange) ? numericPrice - numericChange : null;

  return {
    provider: "Google 財經",
    displayName: `${displayName} / 美股`,
    market: "US",
    price: numericPrice,
    change: numericChange,
    changePercent: Number.isFinite(numericRatio) ? numericRatio * 100 : null,
    quoteTime: `${formatExchangeTime([year, month, day, hour, minute])} ET`,
    open: null,
    previousClose,
    high: null,
    low: null,
    volume: Number(volume),
    note: `資料來源：Google 財經 ${symbol}:${exchange}。美股時間顯示為美東時間。`
  };
}

function parseGoogleSummary(symbol, exchange, html, displayName) {
  const timeMatch = html.match(/<div class="jZZ2de">([^<]+?)&nbsp;\s*&middot;\s*&nbsp;\s*USD<\/div>/);
  const timeIndex = timeMatch ? html.indexOf(timeMatch[0]) : -1;
  const block = timeIndex >= 0 ? html.slice(Math.max(0, timeIndex - 1600), timeIndex + timeMatch[0].length) : html;
  const priceMatch = block.match(/<span jsname="Pdsbrc"[^>]*>\s*<span>(US\$[^<]+)<\/span>/);
  const percentMatch = block.match(/<span jsname="vY9t3b"[^>]*>\s*<span[^>]*>([-+]?[\d,.]+)%<\/span>/);
  const changeMatch = block.match(/<span jsname="xnruHf"[^>]*>\s*<span>([-+]?[\d,.]+)<\/span>/);

  const price = parseGoogleNumber(priceMatch?.[1]);
  if (!Number.isFinite(price)) throw new Error("Google 財經頁面沒有可解析的即時行情");

  const change = parseGoogleNumber(changeMatch?.[1]);
  const changePercent = parseGoogleNumber(percentMatch?.[1]);
  const previousClose = Number.isFinite(change) ? price - change : null;

  return {
    provider: "Google 財經",
    displayName: `${displayName} / 美股`,
    market: "US",
    price,
    change,
    changePercent,
    quoteTime: timeMatch ? `${decodeHtml(timeMatch[1]).replace(/\s+/g, " ")} ET` : "",
    open: null,
    previousClose,
    high: null,
    low: null,
    volume: null,
    note: `資料來源：Google 財經 ${symbol}:${exchange}。ETF/基金類商品使用 Google 財經摘要行情。`
  };
}

async function fetchGoogleQuoteForExchange(symbol, exchange) {
  const cacheKey = `${symbol}:${exchange}`;
  const cached = googleCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.at < cacheMs) return cached.quote;

  const html = await fetchText(`https://www.google.com/finance/quote/${encodeURIComponent(symbol)}:${exchange}?hl=zh-TW`, {
    "accept": "text/html,application/xhtml+xml",
    "accept-language": "zh-TW,zh;q=0.9,en;q=0.8",
    "user-agent": "Mozilla/5.0 stock-tracker"
  });
  const quote = parseGoogleFinance(symbol, exchange, html);
  googleCache.set(cacheKey, { at: now, quote });
  return quote;
}

async function fetchUsQuote(symbol) {
  const exchanges = ["NASDAQ", "NYSE", "NYSEARCA", "AMEX"];
  const errors = [];
  for (const exchange of exchanges) {
    try {
      return await fetchGoogleQuoteForExchange(symbol, exchange);
    } catch (error) {
      errors.push(`${exchange}: ${error.message}`);
    }
  }
  throw new Error(`Google 財經查無美股代號 ${symbol}。${errors.join("；")}`);
}

export async function fetchQuote(rawSymbol) {
  const symbol = cleanSymbol(rawSymbol);
  if (!symbol) throw new Error("缺少股票代號");
  if (isTaiwanSymbol(symbol)) return fetchTaiwanQuote(symbol);
  if (isUsSymbol(symbol)) return fetchUsQuote(symbol);
  throw new Error("請輸入台股數字代號或美股代號，例如 2330 或 AAPL；港股不支援。");
}
