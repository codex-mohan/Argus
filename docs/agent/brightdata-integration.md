# Bright Data Integration

## Tools at Our Disposal

### MCP Server (60+ tools)
**Connection**: `@brightdata/mcp` — local via `npx @brightdata/mcp` or hosted at `https://mcp.brightdata.com/mcp?token=...`
**Free tier**: 5,000 requests/month. Pro mode unlocks all 60+ tools.
**Hackathon credits**: $250 per participant (`unlocked` promo code)

#### Rapid (Free) Tools
| Tool | What it does |
|------|-------------|
| `search_engine` | Google/Bing/Yandex SERP results |
| `scrape_as_markdown` | Single page → clean markdown, bypasses CAPTCHA |
| `discover` | AI-ranked web search with intent matching |
| `search_engine_batch` | 10 parallel search queries |
| `scrape_batch` | 10 parallel page scrapes |

#### Pro Tools — Structured Extractors
| Category | Tools |
|----------|-------|
| **E-commerce** | Amazon product/reviews/search, Walmart product/seller, eBay, Home Depot, Zara, Etsy, Best Buy, Google Shopping |
| **Social** | LinkedIn person/company/jobs/posts/search, Instagram profiles/posts/reels/comments, Facebook posts/marketplace/reviews/events, TikTok profiles/posts/shop/comments, X posts/profile, YouTube videos/profiles/comments, Reddit posts |
| **Business** | Crunchbase, ZoomInfo, Google Maps reviews, Zillow, Booking.com |
| **Finance** | Yahoo Finance business profiles |
| **Code** | GitHub repository files, npm packages, PyPI packages |
| **App Stores** | Google Play Store, Apple App Store |
| **GEO/LLM** | ChatGPT insights, Grok insights, Perplexity insights |
| **Browser** | 17 scraping browser commands: navigate, snapshot, click, type, screenshot, scroll, network requests, etc. |

#### Integration Mode: MCP Client in TypeScript
```typescript
// Spectra tool wrapping a Bright Data MCP call
import { defineTool } from "@mohanscodex/spectra-agent";
import { z } from "zod";

// MCP client talks to Bright Data's MCP server
const linkedinProfileTool = defineTool({
  name: "brightdata_linkedin_profile",
  description: "Get structured LinkedIn profile data",
  parameters: z.object({ profileUrl: z.string().url() }),
  execute: async ({ profileUrl }) => {
    const result = await mcpClient.callTool("web_data_linkedin_person_profile", {
      url: profileUrl,
    });
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  },
});
```

### JS SDK (`@brightdata/sdk`)
**Connection**: `import { bdclient } from "@brightdata/sdk"`
**Use for**: Raw scraping, SERP queries, screenshot capture — simpler than MCP for primitive operations

```typescript
import { bdclient } from "@brightdata/sdk";

const client = new bdclient({ apiKey: process.env.BRIGHTDATA_API_KEY });

// Raw scrape
const html = await client.scrape("https://example.com", {
  format: "json",
  dataFormat: "markdown",
  country: "us",
});

// SERP
const serp = await client.scrape("https://www.google.com/search?q=...", {
  format: "json",
  dataFormat: "markdown",
});
```

### Hybrid Strategy
| Operation | Use | Why |
|-----------|-----|-----|
| LinkedIn profile lookup | MCP `web_data_linkedin_person_profile` | Structured JSON, no parsing needed |
| Amazon product/price | MCP `web_data_amazon_product` | Pre-built extractor, faster than scraping |
| SEC EDGAR filings | MCP `search_engine` + `scrape_as_markdown` | Search for filing URL, then scrape it |
| Unknown/custom websites | SDK `client.scrape()` | Raw markdown extraction for arbitrary pages |
| JS-heavy sites | MCP `scraping_browser_*` | Full browser automation when markdown scrape fails |
| Bulk news scanning | MCP `search_engine_batch` | 10 parallel queries for fast coverage |

## Key Links
- MCP Server docs: https://docs.brightdata.com/ai/mcp-server/overview
- MCP tools reference: https://docs.brightdata.com/ai/mcp-server/tools
- JS SDK: https://github.com/brightdata/sdk-js
- Starter pack: https://github.com/anil-bd/scraper-studio-for-web-data-unlocked-may-2026-hackathon
- MCP Quickstart: https://github.com/brightdata/brightdata-mcp
- AI Playground: https://brightdata.com/ai/playground-chat
