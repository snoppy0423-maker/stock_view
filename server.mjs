import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchQuote } from "./src/quote-service.mjs";
import { readWatchlist, writeWatchlist } from "./src/watchlist-store.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 8787);

function json(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  let body = "";
  for await (const chunk of request) body += chunk;
  return body ? JSON.parse(body) : {};
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  try {
    if (url.pathname === "/" || url.pathname === "/index.html" || url.pathname === "/stock-close-tracker.html") {
      const html = await readFile(join(__dirname, "public", "index.html"));
      response.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store"
      });
      response.end(html);
      return;
    }

    if (url.pathname === "/api/quote") {
      json(response, 200, await fetchQuote(url.searchParams.get("symbol")));
      return;
    }

    if (url.pathname === "/api/watchlist" && request.method === "OPTIONS") {
      response.writeHead(204, {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, PUT, POST, OPTIONS",
        "access-control-allow-headers": "content-type"
      });
      response.end();
      return;
    }

    if (url.pathname === "/api/watchlist" && request.method === "GET") {
      json(response, 200, { stocks: await readWatchlist() });
      return;
    }

    if (url.pathname === "/api/watchlist" && (request.method === "PUT" || request.method === "POST")) {
      const body = await readJsonBody(request);
      json(response, 200, { stocks: await writeWatchlist(body.stocks || body) });
      return;
    }

    json(response, 404, { error: "Not found" });
  } catch (error) {
    json(response, 500, { error: error.message });
  }
});

server.listen(port, () => {
  console.log(`Stock tracker: http://localhost:${port}`);
});
