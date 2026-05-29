/// <reference types="bun" />

/**
 * Collection Agents v2 — Event-driven, cache-first, step-emitting
 *
 * Each agent subscribes to MonitorTick events and independently collects
 * evidence. No sequential coupling. No direct agent calls.
 */

import { checkStaleness, smartScrape, smartSearch } from "../../cache.ts";
import {
  type EvidenceCollected,
  emit,
  emitStep,
  type MonitorTick,
  on,
} from "../../events.ts";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── MarketDataBot ─────────────────────────────────────────────────────────

on("monitor_tick", async (event: MonitorTick) => {
  if (event.mode === "replay") {
    return;
  }

  const { runId, company } = event;
  const query = `${company} stock price today market data`;
  console.log(`[market-data-bot] Searching: "${query}"`);
  emitStep(
    runId,
    "market-data-bot",
    1,
    "Search",
    `Searching: "${query}"`,
    "running",
    20
  );

  const search = await smartSearch(query, "price");
  console.log(`[market-data-bot] Results: ${search.results.slice(0, 300)}`);

  emitStep(
    runId,
    "market-data-bot",
    2,
    "Parse",
    `Parsing search results for ${company}...`,
    "running",
    50
  );

  // Extract URLs from search results
  const urlMatches = search.results.match(/https?:\/\/[^\s\)\]>"]+/g) ?? [];
  const urls = urlMatches
    .slice(0, 2)
    .filter((u: string) => !(u.includes("google.com") || u.includes("bing.com")));

  console.log(`[market-data-bot] Found ${urls.length} URLs: ${urls.join(", ")}`);

  let scrapedContent = search.results;
  let scrapedUrl = urls[0] ?? `https://finance.search?q=${encodeURIComponent(company)}`;
  let wasScraped = false;

  if (urls.length > 0) {
    // Use scraping_browser for financial sites that block scriptless scrapers
    const isFinanceSite = urls[0]!.includes("yahoo") || urls[0]!.includes("cnbc") || urls[0]!.includes("bloomberg") || urls[0]!.includes("wsj");
    console.log(`[market-data-bot] Scraping: ${urls[0]}${isFinanceSite ? " (browser)" : ""}`);
    emitStep(runId, "market-data-bot", 3, "Scrape", `Scraping ${urls[0]}...`, "running", 70);
    const scrape = await smartScrape({ url: urls[0]!, dataType: "price", preferredMethod: isFinanceSite ? "browser" : "structured" });
    scrapedContent = scrape.content;
    scrapedUrl = urls[0]!;
    wasScraped = !scrape.fromCache;
    console.log(`[market-data-bot] Scraped ${scrapedContent.length} chars from ${urls[0]}${scrape.fromCache ? " (cached)" : ""}`);
    if (scrape.fromCache) {
      const stale = checkStaleness(
        {
          url: scrapedUrl,
          dataType: "price",
          scrapedAt: scrape.receipt.durationMs.toString(),
          content: scrape.content,
          receipt: scrape.receipt,
        },
        "price"
      );
      if (stale.recommendation === "flag_stale") {
        emitStep(
          runId,
          "market-data-bot",
          3,
          "Stale",
          `Cached price data is ${stale.ageMinutes.toFixed(0)} min old — using but flagging`,
          "running",
          70
        );
      }
    }
  }

  emitStep(
    runId,
    "market-data-bot",
    4,
    "Store",
    `Storing market data for ${company}...`,
    "running",
    90
  );

  const evidence: EvidenceCollected = {
    type: "evidence_collected",
    runId,
    agentId: "market-data-bot",
    company,
    dataType: "price",
    sourceUrl: scrapedUrl,
    receipt: {
      raw: scrapedContent,
      method: wasScraped ? "scrape" : search.fromCache ? "cache" : "search",
      costTier: wasScraped ? 1 : 0,
      durationMs: 0,
      url: scrapedUrl,
    },
    scrapedAt: new Date().toISOString(),
    fromCache: search.fromCache,
  };

  emit(evidence);

  emitStep(
    runId,
    "market-data-bot",
    5,
    "Complete",
    `Market data collected for ${company} (${search.fromCache ? "cached" : "live"})`,
    "success",
    100
  );
});

// ─── NewsDataBot ───────────────────────────────────────────────────────────

on("monitor_tick", async (event: MonitorTick) => {
  if (event.mode === "replay") {
    return;
  }

  const { runId, company } = event;
  emitStep(
    runId,
    "news-data-bot",
    1,
    "Search",
    `Bright Data SERP: "${company} news today"...`,
    "running",
    20
  );

  const search = await smartSearch(`${company} news today finance`, "news");

  emitStep(
    runId,
    "news-data-bot",
    2,
    "Parse",
    `Parsing news results for ${company}...`,
    "running",
    40
  );

  const urlMatches = search.results.match(/https?:\/\/[^\s)\]>]+/g) ?? [];
  const urls = urlMatches
    .slice(0, 3)
    .filter(
      (u: string) => !(u.includes("google.com") || u.includes("bing.com"))
    );

  let detail = "";
  let scrapedUrl =
    urls[0] ?? `https://news.search?q=${encodeURIComponent(company)}`;

  if (urls.length > 0) {
    const isFinanceSite = urls[0]!.includes("yahoo") || urls[0]!.includes("cnbc") || urls[0]!.includes("bloomberg");
    emitStep(runId, "news-data-bot", 3, "Scrape", `Scraping ${urls[0]}${isFinanceSite ? " (browser)" : ""}...`, "running", 60);
    const scrape = await smartScrape({ url: urls[0]!, dataType: "news", preferredMethod: isFinanceSite ? "browser" : undefined });
    detail = scrape.content;
    scrapedUrl = urls[0]!;
    console.log(`[news-data-bot] Scraped ${detail.length} chars from ${urls[0]}${scrape.fromCache ? " (cached)" : ""}`);
    if (scrape.fromCache) {
      const stale = checkStaleness(
        {
          url: scrapedUrl,
          dataType: "news",
          scrapedAt: scrape.receipt.durationMs.toString(),
          content: detail,
          receipt: scrape.receipt,
        },
        "news"
      );
      if (stale.recommendation === "flag_stale") {
        emitStep(
          runId,
          "news-data-bot",
          3,
          "Stale",
          `Cached news is ${stale.ageMinutes.toFixed(0)} min old — flagging`,
          "running",
          60
        );
      }
    }
  }

  emitStep(
    runId,
    "news-data-bot",
    4,
    "Store",
    `Storing ${company} news evidence...`,
    "running",
    85
  );

  const evidence: EvidenceCollected = {
    type: "evidence_collected",
    runId,
    agentId: "news-data-bot",
    company,
    dataType: "news",
    sourceUrl: scrapedUrl,
    receipt: {
      raw: detail,
      method: "scrape",
      costTier: 1,
      durationMs: 0,
      url: scrapedUrl,
    },
    scrapedAt: new Date().toISOString(),
    fromCache: search.fromCache,
  };

  emit(evidence);

  emitStep(
    runId,
    "news-data-bot",
    5,
    "Complete",
    `NewsDataBot: ${urls.length} sources for ${company}`,
    "success",
    100
  );
});

// ─── SocialDataBot ─────────────────────────────────────────────────────────

on("monitor_tick", async (event: MonitorTick) => {
  if (event.mode === "replay") {
    return;
  }

  const { runId, company } = event;
  emitStep(
    runId,
    "social-data-bot",
    1,
    "Search",
    `Searching social signals for ${company}...`,
    "running",
    25
  );

  const search = await smartSearch(
    `${company} LinkedIn hiring jobs 2026`,
    "social"
  );

  emitStep(
    runId,
    "social-data-bot",
    2,
    "Store",
    `Storing social signals for ${company}...`,
    "running",
    75
  );

  const evidence: EvidenceCollected = {
    type: "evidence_collected",
    runId,
    agentId: "social-data-bot",
    company,
    dataType: "social",
    sourceUrl: `https://social.search?q=${encodeURIComponent(company)}`,
    receipt: search.receipt,
    scrapedAt: new Date().toISOString(),
    fromCache: search.fromCache,
  };

  emit(evidence);

  emitStep(
    runId,
    "social-data-bot",
    3,
    "Complete",
    `SocialDataBot: ${search.fromCache ? "cached" : "live"} data for ${company}`,
    "success",
    100
  );
});

// ─── SupplierDataBot ───────────────────────────────────────────────────────

on("monitor_tick", async (event: MonitorTick) => {
  if (event.mode === "replay") {
    return;
  }

  const { runId, company } = event;
  emitStep(
    runId,
    "supplier-data-bot",
    1,
    "Search",
    `Searching supplier data for ${company}...`,
    "running",
    25
  );

  const search = await smartSearch(
    `${company} supply chain supplier TSMC Samsung Intel 2026`,
    "supplier"
  );

  emitStep(
    runId,
    "supplier-data-bot",
    2,
    "Store",
    `Storing supplier signals for ${company}...`,
    "running",
    75
  );

  const evidence: EvidenceCollected = {
    type: "evidence_collected",
    runId,
    agentId: "supplier-data-bot",
    company,
    dataType: "supplier",
    sourceUrl: `https://supplier.search?q=${encodeURIComponent(company)}`,
    receipt: search.receipt,
    scrapedAt: new Date().toISOString(),
    fromCache: search.fromCache,
  };

  emit(evidence);

  emitStep(
    runId,
    "supplier-data-bot",
    3,
    "Complete",
    `SupplierDataBot: ${search.fromCache ? "cached" : "live"} data for ${company}`,
    "success",
    100
  );
});

// ─── FilingDataBot ─────────────────────────────────────────────────────────

on("monitor_tick", async (event: MonitorTick) => {
  if (event.mode === "replay") {
    return;
  }

  const { runId, company } = event;
  emitStep(
    runId,
    "filing-data-bot",
    1,
    "Search",
    `Searching SEC filings for ${company}...`,
    "running",
    25
  );

  const search = await smartSearch(
    `site:sec.gov ${company} 8-K filing 2026`,
    "filing"
  );

  emitStep(
    runId,
    "filing-data-bot",
    2,
    "Store",
    `Storing filing data for ${company}...`,
    "running",
    75
  );

  const evidence: EvidenceCollected = {
    type: "evidence_collected",
    runId,
    agentId: "filing-data-bot",
    company,
    dataType: "filing",
    sourceUrl: `https://sec.search?q=${encodeURIComponent(company)}`,
    receipt: search.receipt,
    scrapedAt: new Date().toISOString(),
    fromCache: search.fromCache,
  };

  emit(evidence);

  emitStep(
    runId,
    "filing-data-bot",
    3,
    "Complete",
    `FilingDataBot: ${search.fromCache ? "cached" : "live"} data for ${company}`,
    "success",
    100
  );
});

console.log(
  "[agents/collection] 5 collection agents registered as event subscribers"
);
