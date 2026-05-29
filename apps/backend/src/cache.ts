/// <reference types="bun" />

/**
 * Scrape Cache â€” Cognee-backed deduplication with TTL
 *
 * Credit efficiency is survival. Every scrape costs Bright Data credits.
 * This cache ensures:
 *   - Same URL scraped once per TTL period
 *   - Same search query hashed and cached
 *   - Fallback cascade: cache â†’ structured extractor â†’ scrape_as_markdown â†’ scraping_browser â†’ web_unlocker
 *   - Cost tracking per operation tier
 */

import { createHash } from "crypto";
import type { EvidenceReceipt } from "./events.ts";
import { logCredit } from "./events.ts";
import { callMcpTool, getMcpTools } from "./mcp/bridge.ts";

// â”€â”€â”€ TTL Configuration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const TTL_MINUTES: Record<string, number> = {
  price: 60, // 1 hour â€” prices change fast
  filing: 1440, // 24 hours â€” filings don't change
  social: 360, // 6 hours â€” social signals semi-stale
  supplier: 720, // 12 hours â€” supplier data medium
  news: 180, // 3 hours â€” news updates frequently
  default: 360, // 6 hours fallback
};

function getTtl(dataType: string): number {
  return TTL_MINUTES[dataType] ?? TTL_MINUTES.default ?? 360;
}

// â”€â”€â”€ Query Hashing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function hashQuery(query: string): string {
  return createHash("sha256")
    .update(query.trim().toLowerCase())
    .digest("hex")
    .slice(0, 16);
}

// â”€â”€â”€ Cache Interface â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface CacheEntry {
  content: string;
  dataType: string;
  queryHash?: string;
  receipt: EvidenceReceipt;
  scrapedAt: string;
  url: string;
}

// In-memory cache layer (fast check before Cognee)
const memoryCache = new Map<string, CacheEntry>();

function memoryKey(url: string, queryHash?: string): string {
  return queryHash ? `q:${queryHash}` : `u:${url}`;
}

// â”€â”€â”€ Cache Check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface CacheCheckResult {
  ageMinutes: number;
  entry?: CacheEntry;
  hit: boolean;
}

export async function checkCache(
  url: string,
  dataType: string,
  query?: string
): Promise<CacheCheckResult> {
  const queryHash = query ? hashQuery(query) : undefined;
  const key = memoryKey(url, queryHash);
  const ttl = getTtl(dataType);

  // 1. Check memory cache
  const mem = memoryCache.get(key);
  if (mem) {
    const ageMin = (Date.now() - new Date(mem.scrapedAt).getTime()) / 60_000;
    if (ageMin < ttl) {
      return { hit: true, entry: mem, ageMinutes: ageMin };
    }
    // Expired â€” remove
    memoryCache.delete(key);
  }

  // 2. Check Cognee cache (slower but persistent)
  try {
    const result = await callMcpTool("cognee", "recall", {
      query: `cache entry for url:${url} queryHash:${queryHash ?? "none"}`,
      top_k: 1,
    });
    const contents = result.content as
      | Array<{ type: string; text?: string }>
      | undefined;
    const text = contents?.find((c) => c.type === "text")?.text ?? "";

    if (text) {
      try {
        const parsed = JSON.parse(text) as CacheEntry;
        const ageMin =
          (Date.now() - new Date(parsed.scrapedAt).getTime()) / 60_000;
        if (ageMin < ttl) {
          // Promote to memory cache
          memoryCache.set(key, parsed);
          return { hit: true, entry: parsed, ageMinutes: ageMin };
        }
      } catch {
        // Not valid JSON â€” ignore
      }
    }
  } catch {
    // Cognee unavailable â€” degraded mode, proceed without cache
  }

  return { hit: false, ageMinutes: 0 };
}

// â”€â”€â”€ Cache Store â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function storeCache(
  url: string,
  dataType: string,
  content: string,
  receipt: EvidenceReceipt,
  query?: string
): Promise<void> {
  const queryHash = query ? hashQuery(query) : undefined;
  const key = memoryKey(url, queryHash);

  const entry: CacheEntry = {
    url,
    queryHash,
    dataType,
    scrapedAt: new Date().toISOString(),
    content,
    receipt: { ...receipt, costTier: 0, method: "cache" },
  };

  // 1. Store in memory
  memoryCache.set(key, entry);

  // 2. Store in Cognee for persistence
  try {
    await callMcpTool("cognee", "remember", {
      data: JSON.stringify({
        ...entry,
        source_url: url,
        scraped_at: entry.scrapedAt,
        agent_id: "cache-system",
        confidence: 1.0,
        data_type: dataType,
        content: content.slice(0, 2000), // Limit cache content size
      }),
      dataset_name: `raw_${dataType}_data`,
    });
  } catch {
    // Cognee unavailable â€” memory cache still works for this session
  }
}

export interface StalenessReport {
  ageMinutes: number;
  isStale: boolean;
  recommendation: "use" | "re_scrape" | "flag_stale";
  remainingMinutes: number;
  ttlMinutes: number;
}

export function checkStaleness(
  entry: CacheEntry,
  dataType: string
): StalenessReport {
  const ttl = getTtl(dataType);
  const ageMin = (Date.now() - new Date(entry.scrapedAt).getTime()) / 60_000;
  const remaining = Math.max(0, ttl - ageMin);

  // Staleness tiers
  if (ageMin > ttl) {
    return {
      isStale: true,
      ageMinutes: ageMin,
      ttlMinutes: ttl,
      remainingMinutes: 0,
      recommendation: "re_scrape",
    };
  }

  if (ageMin > ttl * 0.75) {
    // Within 25% of expiry â€” flag as potentially stale
    return {
      isStale: false,
      ageMinutes: ageMin,
      ttlMinutes: ttl,
      remainingMinutes: remaining,
      recommendation: "flag_stale",
    };
  }

  return {
    isStale: false,
    ageMinutes: ageMin,
    ttlMinutes: ttl,
    remainingMinutes: remaining,
    recommendation: "use",
  };
}

export function invalidateCache(
  url: string,
  dataType: string,
  query?: string
): boolean {
  const queryHash = query ? hashQuery(query) : undefined;
  const key = memoryKey(url, queryHash);
  const had = memoryCache.has(key);
  memoryCache.delete(key);
  return had;
}

export function invalidateByDataType(dataType: string): number {
  let count = 0;
  for (const [key, entry] of memoryCache) {
    if (entry.dataType === dataType) {
      memoryCache.delete(key);
      count++;
    }
  }
  return count;
}

// â”€â”€â”€ Scheduled Cleanup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

let cleanupInterval: Timer | null = null;

export function startCacheCleanup(intervalMinutes = 15): void {
  if (cleanupInterval) {
    return;
  }

  cleanupInterval = setInterval(
    () => {
      const before = memoryCache.size;
      const now = Date.now();

      for (const [key, entry] of memoryCache) {
        const ttl = getTtl(entry.dataType);
        const ageMin = (now - new Date(entry.scrapedAt).getTime()) / 60_000;
        if (ageMin > ttl) {
          memoryCache.delete(key);
        }
      }

      const removed = before - memoryCache.size;
      if (removed > 0) {
        console.log(
          `[cache] Cleaned ${removed} stale entries. ${memoryCache.size} remaining.`
        );
      }
    },
    intervalMinutes * 60 * 1000
  );

  console.log(`[cache] Scheduled cleanup every ${intervalMinutes} minutes`);
}

export function stopCacheCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

// â”€â”€â”€ Scraping with Fallback Cascade â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface ScrapeOptions {
  dataType: string;
  preferredMethod?: "structured" | "markdown" | "browser";
  query?: string;
  url: string;
}

export interface ScrapeResult {
  content: string;
  fromCache: boolean;
  receipt: EvidenceReceipt;
}

/**
 * Intelligent scrape with cache-first and fallback cascade.
 *
 * Cost tiers:
 *   0 = cache (free)
 *   1 = structured extractor / SERP (cheap)
 *   2 = scrape_as_markdown (medium)
 *   3 = scraping_browser / web_unlocker (expensive)
 */
export async function smartScrape(
  options: ScrapeOptions
): Promise<ScrapeResult> {
  const { url, dataType, query } = options;

  // 1. Check cache
  const cache = await checkCache(url, dataType, query);
  if (cache.hit && cache.entry) {
    logCredit("cache-system", `cache_hit:${dataType}`, 0);
    return {
      content: cache.entry.content,
      receipt: cache.entry.receipt,
      fromCache: true,
    };
  }

  // 2. Try structured extractor if available (cheapest)
  if (options.preferredMethod === "structured") {
    const structured = await tryStructuredExtractor(url, dataType);
    if (structured) {
      await storeCache(url, dataType, structured.content, structured.receipt, query);
      return { ...structured, fromCache: false };
    }
  }

  // 2b. If preferred method is browser, jump straight there
  if (options.preferredMethod === "browser") {
    const browser = await tryScrapingBrowser(url);
    if (browser.status === "success") {
      await storeCache(url, dataType, browser.content, browser.receipt, query);
      return { content: browser.content, receipt: browser.receipt, fromCache: false };
    }
    // Fall through to other methods
  }

  // 3. Try scrape_as_markdown (medium cost)
  const markdown = await tryScrapeAsMarkdown(url);
  if (markdown.status === "success") {
    await storeCache(url, dataType, markdown.content, markdown.receipt, query);
    return {
      content: markdown.content,
      receipt: markdown.receipt,
      fromCache: false,
    };
  }

  // 4. Try scraping_browser (expensive)
  const browser = await tryScrapingBrowser(url);
  if (browser.status === "success") {
    await storeCache(url, dataType, browser.content, browser.receipt, query);
    return {
      content: browser.content,
      receipt: browser.receipt,
      fromCache: false,
    };
  }

  // 5. Try web_unlocker (most expensive)
  const unlocker = await tryWebUnlocker(url);
  if (unlocker.status === "success") {
    await storeCache(url, dataType, unlocker.content, unlocker.receipt, query);
    return {
      content: unlocker.content,
      receipt: unlocker.receipt,
      fromCache: false,
    };
  }

  // 6. All failed â€” return degraded
  logCredit("scrape-system", `all_failed:${dataType}`, 1);
  return {
    content: `[unavailable] All scrape methods failed for ${url}. Last error: ${markdown.error ?? "unknown"}`,
    receipt: {
      raw: "",
      method: "failed",
      costTier: 1,
      durationMs: 0,
      url,
    },
    fromCache: false,
  };
}

// â”€â”€â”€ Individual Scrape Methods â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function tryStructuredExtractor(
  url: string,
  dataType: string
): Promise<{ content: string; receipt: EvidenceReceipt } | null> {
  const tools = getMcpTools("brightdata");

  // Map data type to likely structured extractor
  const extractorMap: Record<string, string[]> = {
    price: [
      "amazon_product",
      "bestbuy_products",
      "walmart_product",
      "google_shopping",
      "ebay_product",
    ],
    filing: ["yahoo_finance_business"],
    social: [
      "linkedin_company_profile",
      "linkedin_job_listings",
      "x_posts",
      "reddit_posts",
    ],
    supplier: [
      "crunchbase_company",
      "zoominfo_company_profile",
      "linkedin_company_profile",
    ],
    news: ["discover"],
  };

  const candidates = extractorMap[dataType] ?? [];
  for (const candidate of candidates) {
    const tool = tools.find(
      (t) => t.name.includes(candidate) && !t.name.includes("batch")
    );
    if (!tool) {
      continue;
    }

    const start = Date.now();
    try {
      const result = await callMcpTool("brightdata", tool.name, { url });
      const text = extractText(result);
      if (text && text.length > 50 && !isBlockedPage(text, url)) {
        logCredit("brightdata", `structured:${tool.name}`, 1);
        return {
          content: text,
          receipt: {
            raw: text,
            method: `structured:${tool.name}`,
            costTier: 1,
            durationMs: Date.now() - start,
            url,
          },
        };
      }
    } catch {
      // Try next extractor
    }
  }

  return null;
}

interface MethodResult {
  content: string;
  error?: string;
  receipt: EvidenceReceipt;
  status: "success" | "failed";
}

async function tryScrapeAsMarkdown(url: string): Promise<MethodResult> {
  const tools = getMcpTools("brightdata");
  const tool = tools.find((t) => t.name.includes("scrape_as_markdown"));
  if (!tool) {
    return {
      status: "failed",
      content: "",
      receipt: {} as EvidenceReceipt,
      error: "Tool not available",
    };
  }

  const start = Date.now();
  try {
    const result = await callMcpTool("brightdata", tool.name, { url });
    const text = extractText(result);
    if (isBlockedPage(text, url)) {
      return { status: "failed", content: "", receipt: {} as EvidenceReceipt, error: "Blocked page detected" };
    }
    logCredit("brightdata", "scrape_as_markdown", 2);
    return {
      status: "success",
      content: text,
      receipt: {
        raw: text,
        method: "scrape_as_markdown",
        costTier: 2,
        durationMs: Date.now() - start,
        url,
      },
    };
  } catch (err) {
    return {
      status: "failed",
      content: "",
      receipt: {} as EvidenceReceipt,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function tryScrapingBrowser(url: string): Promise<MethodResult> {
  const tools = getMcpTools("brightdata");
  const tool = tools.find((t) => t.name.includes("scraping_browser"));
  if (!tool) {
    return {
      status: "failed",
      content: "",
      receipt: {} as EvidenceReceipt,
      error: "Tool not available",
    };
  }

  const start = Date.now();
  try {
    const result = await callMcpTool("brightdata", tool.name, { url });
    const text = extractText(result);
    logCredit("brightdata", "scraping_browser", 3);
    return {
      status: "success",
      content: text,
      receipt: {
        raw: text,
        method: "scraping_browser",
        costTier: 3,
        durationMs: Date.now() - start,
        url,
      },
    };
  } catch (err) {
    return {
      status: "failed",
      content: "",
      receipt: {} as EvidenceReceipt,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function tryWebUnlocker(url: string): Promise<MethodResult> {
  const tools = getMcpTools("brightdata");
  const tool = tools.find((t) => t.name.includes("web_unlocker"));
  if (!tool) {
    return {
      status: "failed",
      content: "",
      receipt: {} as EvidenceReceipt,
      error: "Tool not available",
    };
  }

  const start = Date.now();
  try {
    const result = await callMcpTool("brightdata", tool.name, { url });
    const text = extractText(result);
    logCredit("brightdata", "web_unlocker", 3);
    return {
      status: "success",
      content: text,
      receipt: {
        raw: text,
        method: "web_unlocker",
        costTier: 3,
        durationMs: Date.now() - start,
        url,
      },
    };
  } catch (err) {
    return {
      status: "failed",
      content: "",
      receipt: {} as EvidenceReceipt,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// â”€â”€â”€ Search with Cache â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface SearchResult {
  fromCache: boolean;
  query: string;
  receipt: EvidenceReceipt;
  results: string;
}

export async function smartSearch(
  query: string,
  dataType: string
): Promise<SearchResult> {
  const queryHash = hashQuery(query);
  const cacheKey = `search:${queryHash}`;

  // Check cache
  const cache = await checkCache(cacheKey, dataType, query);
  if (cache.hit && cache.entry) {
    logCredit("cache-system", `search_cache_hit:${dataType}`, 0);
    return {
      query,
      results: cache.entry.content,
      receipt: cache.entry.receipt,
      fromCache: true,
    };
  }

  // Execute search
  const tools = getMcpTools("brightdata");
  const searchTool = tools.find(
    (t) => t.name.includes("search_engine") && !t.name.includes("batch")
  );

  if (!searchTool) {
    return {
      query,
      results: "[degraded] search_engine not available",
      receipt: {
        raw: "",
        method: "failed",
        costTier: 1,
        durationMs: 0,
        url: "",
      },
      fromCache: false,
    };
  }

  const start = Date.now();
  try {
    const result = await callMcpTool("brightdata", searchTool.name, {
      query,
      num_results: 5,
    });
    const text = extractText(result);
    logCredit("brightdata", "search_engine", 1);

    const receipt: EvidenceReceipt = {
      raw: text,
      method: "search_engine",
      costTier: 1,
      durationMs: Date.now() - start,
      url: "",
    };

    // Store in cache
    await storeCache(cacheKey, dataType, text, receipt, query);

    return { query, results: text, receipt, fromCache: false };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logCredit("brightdata", `search_failed:${dataType}`, 1);
    return {
      query,
      results: `[degraded] Search failed: ${msg}`,
      receipt: {
        raw: "",
        method: "failed",
        costTier: 1,
        durationMs: Date.now() - start,
        url: "",
      },
      fromCache: false,
    };
  }
}

function isBlockedPage(text: string, url: string): boolean {
  const lower = text.toLowerCase();
  const blocked = ["please enable javascript", "enable javascript", "javascript is disabled", "please log in", "sign in to continue", "you need to enable"];
  if (blocked.some((p) => lower.includes(p))) return true;
  if (text.length < 500 && (url.includes("yahoo") || url.includes("cnbc") || url.includes("bloomberg") || url.includes("wsj"))) return true;
  return false;
}

function extractText(result: {
  content?: Array<{ type: string; text?: string }>;
}): string {
  const contents = result.content ?? [];
  return contents
    .filter((c) => c.type === "text")
    .map((c) => c.text ?? "")
    .join("\n");
}

// â”€â”€â”€ Cache Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function getCacheStats(): {
  memoryEntries: number;
  ttlConfig: Record<string, number>;
} {
  return {
    memoryEntries: memoryCache.size,
    ttlConfig: { ...TTL_MINUTES },
  };
}

export function clearMemoryCache(): void {
  memoryCache.clear();
}
