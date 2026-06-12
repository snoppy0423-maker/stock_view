import { fetchQuote } from "../src/quote-service.mjs";

export default async function handler(request, response) {
  try {
    const url = new URL(request.url, `https://${request.headers.host || "localhost"}`);
    const quote = await fetchQuote(url.searchParams.get("symbol"));
    response.setHeader("cache-control", "no-store");
    response.status(200).json(quote);
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
}
