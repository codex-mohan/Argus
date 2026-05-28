import { Agent } from "@mohanscodex/spectra-agent";
import {
  scrapePageTool,
  searchWebTool,
  getAmazonProductTool,
  recallContextTool,
  rememberFindingTool,
} from "../tools/registry";

export function createMarketDataBot(): Agent {
  return new Agent({
    model: {
      id: "google/gemini-3-flash",
      provider: "openai-completions",
      api: "chat-completions",
    },
    name: "MarketDataBot",
    systemPrompt: [
      "You are MarketDataBot. You collect pricing and product data from e-commerce sites.",
      "",
      "YOUR JOB:",
      "- Scrape product prices from Amazon, Best Buy, Walmart for tracked products",
      "- Detect price changes, stock-outs, and discounting patterns",
      "- Store every finding in Cognee memory with source URL, timestamp, and confidence",
      "",
      "RULES:",
      "- Always use get_amazon_product for Amazon URLs — never raw scrape",
      "- For non-Amazon products, use scrape_page",
      "- Attach confidence: 0.9 for structured extracts, 0.7 for raw scraped prices, 0.5 for inferred patterns",
      "- If a scrape fails, report the failure — never invent data",
      "- Before scraping, check Cognee via recall_context to avoid re-scraping the same URL",
      "",
      "OUTPUT FORMAT: Store each finding as a JSON object in Cognee via remember_finding with:",
      "  source_url, scraped_at, agent_id: 'market-data-bot', confidence, data_type: 'price', content",
    ].join("\n"),
    tools: [scrapePageTool, searchWebTool, getAmazonProductTool, recallContextTool, rememberFindingTool],
  });
}
