import { defineTool } from "@mohanscodex/spectra-agent";
import { z } from "zod";
import { getBrightDataClient } from "../mcp/brightdata-client";
import { getCogneeClient } from "../mcp/cognee-client";
import { MemoryEntry } from "@argus/shared";

const bd = getBrightDataClient;
const cog = getCogneeClient;

// ---------------------------------------------------------------------------
// Scraping tools
// ---------------------------------------------------------------------------

export const scrapePageTool = defineTool({
  name: "scrape_page",
  description: "Scrape any webpage as clean markdown via Bright Data",
  parameters: z.object({ url: z.string().url() }),
  execute: async ({ url }) => {
    const client = bd();
    const result = await client.scrapeAsMarkdown(url);
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  },
});

export const searchWebTool = defineTool({
  name: "search_web",
  description: "Search the web using Bright Data SERP API",
  parameters: z.object({ query: z.string() }),
  execute: async ({ query }) => {
    const client = bd();
    const result = await client.search(query);
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  },
});

export const getLinkedInProfileTool = defineTool({
  name: "get_linkedin_profile",
  description: "Get structured LinkedIn person profile data",
  parameters: z.object({ profileUrl: z.string().url() }),
  execute: async ({ profileUrl }) => {
    const client = bd();
    const result = await client.structuredScrape("web_data_linkedin_person_profile", { url: profileUrl });
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  },
});

export const getLinkedInCompanyTool = defineTool({
  name: "get_linkedin_company",
  description: "Get structured LinkedIn company profile data",
  parameters: z.object({ companyUrl: z.string().url() }),
  execute: async ({ companyUrl }) => {
    const client = bd();
    const result = await client.structuredScrape("web_data_linkedin_company_profile", { url: companyUrl });
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  },
});

export const getAmazonProductTool = defineTool({
  name: "get_amazon_product",
  description: "Get structured Amazon product data including current price",
  parameters: z.object({ productUrl: z.string().url() }),
  execute: async ({ productUrl }) => {
    const client = bd();
    const result = await client.structuredScrape("web_data_amazon_product", { url: productUrl });
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  },
});

// ---------------------------------------------------------------------------
// Cognee memory tools
// ---------------------------------------------------------------------------

export const rememberFindingTool = defineTool({
  name: "remember_finding",
  description: "Store a finding in Cognee persistent memory",
  parameters: MemoryEntry.extend({ dataset: z.string().default("lens_findings") }),
  execute: async (entry) => {
    const client = cog();
    await client.remember({
      data: JSON.stringify(entry),
      dataset_name: entry.dataset,
    });
    return { content: [{ type: "text", text: "Finding stored in memory" }] };
  },
});

export const recallContextTool = defineTool({
  name: "recall_context",
  description: "Recall relevant context from Cognee memory",
  parameters: z.object({ query: z.string(), datasets: z.string().optional(), top_k: z.number().default(5) }),
  execute: async ({ query, datasets, top_k }) => {
    const client = cog();
    const results = await client.recall({ query, datasets, top_k });
    return { content: [{ type: "text", text: JSON.stringify(results) }] };
  },
});
