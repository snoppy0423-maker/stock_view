import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");
const dataFile = join(dataDir, "watchlist.json");

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

export async function readWatchlist() {
  try {
    const raw = await readFile(dataFile, "utf8");
    const parsed = JSON.parse(raw);
    return normalizeItems(parsed.stocks || parsed);
  } catch {
    return [];
  }
}

export async function writeWatchlist(items) {
  const stocks = normalizeItems(items);
  await mkdir(dataDir, { recursive: true });
  await writeFile(
    dataFile,
    JSON.stringify({ updatedAt: new Date().toISOString(), stocks }, null, 2),
    "utf8"
  );
  return stocks;
}
