let memoryStocks = [];

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  const seen = new Set();
  const normalized = [];

  for (const item of items) {
    const symbol = String(item?.symbol || item || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9.-]/g, "");
    if (!symbol || seen.has(symbol)) continue;
    seen.add(symbol);
    normalized.push({ symbol });
  }

  return normalized.slice(0, 100);
}

export default async function handler(request, response) {
  response.setHeader("cache-control", "no-store");

  if (request.method === "GET") {
    response.status(200).json({ stocks: memoryStocks });
    return;
  }

  if (request.method === "PUT" || request.method === "POST") {
    const body = typeof request.body === "string" ? JSON.parse(request.body || "{}") : request.body;
    memoryStocks = normalizeItems(body?.stocks || body);
    response.status(200).json({ stocks: memoryStocks });
    return;
  }

  response.setHeader("allow", "GET, PUT, POST");
  response.status(405).json({ error: "Method not allowed" });
}
