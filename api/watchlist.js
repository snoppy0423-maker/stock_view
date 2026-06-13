import { readWatchlist, writeWatchlist } from "../src/watchlist-store.mjs";

export default async function handler(request, response) {
  response.setHeader("cache-control", "no-store");

  try {
    if (request.method === "GET") {
      response.status(200).json({ stocks: await readWatchlist() });
      return;
    }

    if (request.method === "PUT" || request.method === "POST") {
      const body = typeof request.body === "string" ? JSON.parse(request.body || "{}") : request.body;
      response.status(200).json({ stocks: await writeWatchlist(body?.stocks || body) });
      return;
    }

    response.setHeader("allow", "GET, PUT, POST");
    response.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
}
