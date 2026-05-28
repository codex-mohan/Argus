# Project Plan

## Focus

Unified enterprise intelligence platform. One set of web data, three personas (GTM, Finance, Security), connected through persistent agent memory (Cognee). 10 agents organized as 5 data collectors + 3 analysis lenses + 2 synthesis engines.

## Phase 1: Scaffold (Current)
- [ ] Create monorepo with Turborepo + Bun workspaces
- [ ] Initialize apps/backend with Spectra dependencies
- [ ] Initialize apps/frontend with Next.js 16 + shadcn/ui
- [ ] Create packages/shared with types and Zod schemas
- [ ] Write docker-compose.yml (backend, frontend, Cognee MCP)
- [ ] Run `npx ultracite init --pm bun --linter biome --frameworks next --editors cursor --agents claude opencode --type-aware --integrations lefthook`
- [ ] Verify `bun run dev` starts the full stack

## Phase 2: Bright Data Wiring
- [ ] Create MCP client manager (`apps/backend/src/mcp/brightdata-client.ts`)
- [ ] Create Cognee MCP client (`apps/backend/src/mcp/cognee-client.ts`)
- [ ] Implement `isAvailable()` health checks for both MCP servers
- [ ] Create tool wrappers: scrape, search, yahoo_finance, sec_filing, amazon_product, linkedin_person, linkedin_company, zoominfo_company, crunchbase_company
- [ ] Write smoke test: scrape a real URL, verify non-mock data
- [ ] Implement degradation pattern for all providers

## Phase 3: Data Collection Agents (5 agents)
- [ ] **MarketDataBot** — e-commerce prices, stock levels, product listings. Sources: Bright Data MCP amazon_product, bestbuy_products, walmart_product, google_shopping. Writes to Cognee dataset `raw_market_data`
- [ ] **FilingDataBot** — SEC EDGAR filings, earnings transcripts, regulatory releases. Sources: Bright Data MCP search_engine + scrape_as_markdown. Writes to Cognee dataset `raw_filing_data`
- [ ] **SocialDataBot** — LinkedIn profiles/companies, X/Twitter posts, Reddit threads. Sources: Bright Data MCP linkedin_person_profile, linkedin_company_profile, x_posts, reddit_posts. Writes to Cognee dataset `raw_social_data`
- [ ] **SupplierDataBot** — Vendor financials, credit signals, leadership changes, supplier news. Sources: Bright Data MCP zoominfo_company, crunchbase_company, search_engine. Writes to Cognee dataset `raw_supplier_data`
- [ ] **NewsDataBot** — Financial news, industry publications, press releases, macro indicators. Sources: Bright Data MCP search_engine_batch. Writes to Cognee dataset `raw_news_data`

## Phase 4: Analysis Lenses (3 agents)
- [ ] **GTMLens** — Queries all raw datasets through Cognee recall. Detects competitor moves, hiring signals, buying intent, account enrichment opportunities. Output: GTM brief. Model: Gemini 3 Flash
- [ ] **FinanceLens** — Queries all raw datasets through Cognee recall. Detects alpha signals, supply-chain stress, filing divergence, earnings intelligence. Output: Investor brief. Model: Claude Opus 4.7
- [ ] **SecurityLens** — Queries all raw datasets through Cognee recall. Detects vendor risk indicators, regulatory actions, brand exposure, threat intel. Output: Risk alert. Model: Gemini 3 Flash

## Phase 5: Synthesis (2 agents)
- [ ] **CorrelationEngine** — Central brain. Queries Cognee across ALL raw datasets. Detects when signals from different sources/domains point to the same underlying event. Outputs weighted correlation score + evidence chain. Model: DeepSeek R1
- [ ] **BriefWriter** — Takes output from active lens + CorrelationEngine cross-references. Produces structured brief: headline, synthesis, key signals, evidence trail (source URLs), confidence score. Model: Claude Opus 4.7

## Phase 6: Cognee Memory Integration
- [ ] Wire Cognee `remember` after every collection agent run (raw data)
- [ ] Wire Cognee `remember` after every lens analysis (structured findings)
- [ ] Wire Cognee `recall` before every lens analysis (context for new analysis)
- [ ] Wire Cognee `improve` to bridge session → permanent graph
- [ ] Implement dataset structure: `raw_market_data`, `raw_filing_data`, `raw_social_data`, `raw_supplier_data`, `raw_news_data`, `lens_findings`, `correlation_signals`
- [ ] Implement scrape cache: check Cognee before calling Bright Data for repeat URLs

## Phase 7: Frontend
- [ ] Dark-theme command center with persona switcher (GTM / Finance / Security views)
- [ ] Company search + watchlist — select tracked companies
- [ ] Live signal feed — SSE streaming, color-coded by data source
- [ ] Brief viewer — formatted intelligence briefs per lens
- [ ] Correlation graph — visual connections between related signals across datasets
- [ ] Provider status panel — green/yellow/red for each provider
- [ ] Voice query toggle (degraded gracefully if Speechmatics unavailable)

## Phase 8: Deploy & Demo
- [ ] 5-minute demo: "We're tracking NVIDIA. 5 collectors scraped 47 sources. 3 lenses analyzed. CorrelationEngine found 2 cross-domain connections. Switch between lenses to see how each persona uses the same data differently."
- [ ] Record demo video (if submitting online)
- [ ] Verify `docker-compose up` from scratch
- [ ] Submit on lablab.ai

## Agent Detail

| Agent | Type | Primary Tools | Model | Cognee Dataset |
|-------|------|--------------|-------|----------------|
| MarketDataBot | Collection | amazon_product, bestbuy_products, walmart_product, google_shopping | Gemini 3 Flash | raw_market_data |
| FilingDataBot | Collection | search_engine, scrape_as_markdown | Gemini 3 Flash | raw_filing_data |
| SocialDataBot | Collection | linkedin_person_profile, linkedin_company_profile, x_posts, reddit_posts | Gemini 3 Flash | raw_social_data |
| SupplierDataBot | Collection | zoominfo_company_profile, crunchbase_company, search_engine | Gemini 3 Flash | raw_supplier_data |
| NewsDataBot | Collection | search_engine_batch, scrape_as_markdown | Gemini 3 Flash | raw_news_data |
| GTMLens | Analysis | Cognee recall (all raw datasets) | Gemini 3 Flash | lens_findings |
| FinanceLens | Analysis | Cognee recall (all raw datasets) | Claude Opus 4.7 | lens_findings |
| SecurityLens | Analysis | Cognee recall (all raw datasets) | Gemini 3 Flash | lens_findings |
| CorrelationEngine | Synthesis | Cognee recall (all datasets) | DeepSeek R1 | correlation_signals |
| BriefWriter | Synthesis | Cognee recall + Claude Opus 4.7 | Claude Opus 4.7 | correlation_signals |

## How One Scrape Serves Three Lenses

Example: SocialDataBot scrapes LinkedIn and finds "Sarah Chen changed title from CTO to Advisor at NVIDIA"

| Lens | Analysis | Output |
|------|----------|--------|
| **GTM** | "NVIDIA's CTO just left. They're reorganizing their AI division. Competitor entry opportunity in ML infrastructure." | Competitor alert → CRM |
| **Finance** | "Key technical leader departure before Q3 product launch. Historical pattern: 4.2% stock drop within 30 days of CTO exits at semiconductor firms." | Alpha signal → Investor brief |
| **Security** | "NVIDIA supplier ecosystem affected. CTO oversaw 14 key vendor relationships. 3 suppliers now have no executive sponsor. Supply chain continuity risk." | Vendor risk alert |

One Cognee node → three lenses → three different outputs. This is the moat.

## Schedule

- **Day 1 (now)**: Phases 1-2. Monorepo + Bright Data wired.
- **Day 2**: Phases 3-4. All 8 collection + lens agents built.
- **Day 3**: Phases 5-6. Correlation, synthesis, memory integration.
- **Day 4**: Phases 7-8. Dashboard, polish, demo, submit. Deadline: **May 30, 5:00 PM PDT / May 31, 5:30 AM IST**.
