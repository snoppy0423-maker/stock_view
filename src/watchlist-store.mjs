import { mkdir, readFile, writeFile } from "node:fs/promises";
import { Buffer } from "node:buffer";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");
const dataFile = join(dataDir, "watchlist.json");
const githubToken = process.env.GITHUB_TOKEN || process.env.WATCHLIST_GITHUB_TOKEN || "";
const githubRepo = process.env.WATCHLIST_GITHUB_REPO || process.env.GITHUB_REPOSITORY || "";
const githubBranch = process.env.WATCHLIST_GITHUB_BRANCH || "main";
const githubPath = process.env.WATCHLIST_GITHUB_PATH || "data/watchlist.json";

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

function useGitHubStorage() {
  return Boolean(githubToken && githubRepo);
}

function githubHeaders() {
  return {
    "accept": "application/vnd.github+json",
    "authorization": `Bearer ${githubToken}`,
    "content-type": "application/json",
    "user-agent": "stock-tracker",
    "x-github-api-version": "2022-11-28"
  };
}

async function fetchGitHubFile() {
  const url = `https://api.github.com/repos/${githubRepo}/contents/${encodeURIComponent(githubPath).replace(/%2F/g, "/")}?ref=${encodeURIComponent(githubBranch)}`;
  const response = await fetch(url, { headers: githubHeaders() });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub storage read failed: HTTP ${response.status}`);
  return response.json();
}

async function readGitHubWatchlist() {
  const file = await fetchGitHubFile();
  if (!file?.content) return [];
  const raw = Buffer.from(file.content, "base64").toString("utf8");
  const parsed = JSON.parse(raw);
  return normalizeItems(parsed.stocks || parsed);
}

async function writeGitHubWatchlist(items) {
  const stocks = normalizeItems(items);
  const current = await fetchGitHubFile();
  const body = {
    message: "Update stock watchlist",
    content: Buffer.from(JSON.stringify({ updatedAt: new Date().toISOString(), stocks }, null, 2), "utf8").toString("base64"),
    branch: githubBranch
  };

  if (current?.sha) body.sha = current.sha;

  const url = `https://api.github.com/repos/${githubRepo}/contents/${encodeURIComponent(githubPath).replace(/%2F/g, "/")}`;
  const response = await fetch(url, {
    method: "PUT",
    headers: githubHeaders(),
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`GitHub storage write failed: HTTP ${response.status}`);
  return stocks;
}

export async function readWatchlist() {
  if (useGitHubStorage()) {
    try {
      return await readGitHubWatchlist();
    } catch (error) {
      console.error(error.message);
    }
  }

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
  if (useGitHubStorage()) {
    try {
      return await writeGitHubWatchlist(stocks);
    } catch (error) {
      console.error(error.message);
    }
  }

  await mkdir(dataDir, { recursive: true });
  await writeFile(
    dataFile,
    JSON.stringify({ updatedAt: new Date().toISOString(), stocks }, null, 2),
    "utf8"
  );
  return stocks;
}
