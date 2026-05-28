# Cognee — Agent Memory Layer

## What It Provides

Cognee gives Argus agents persistent, graph-backed memory. Every agent can store findings and retrieve context from other agents across sessions, enabling cross-agent intelligence that outlasts a single request.

## Deployment: Docker Container

Cognee runs as a Docker service — no Python sidecar, no pip install. TypeScript agents connect via MCP protocol over HTTP.

```yaml
# docker-compose.yml entry
cognee-mcp:
  image: cognee/cognee-mcp:main
  container_name: cognee-mcp
  ports:
    - "8000:8000"
  environment:
    TRANSPORT_MODE: "http"
    LLM_API_KEY: "${COGNEE_LLM_API_KEY}"
    LLM_PROVIDER: "openai"
    LLM_MODEL: "gpt-4o-mini"
  volumes:
    - cognee_data:/app/data  # persist memory across restarts
```

Start standalone (without compose):
```bash
docker run -e TRANSPORT_MODE=http -e LLM_API_KEY=$OPENAI_API_KEY -p 8000:8000 --rm -it cognee/cognee-mcp:main
```

## 14 MCP Tools

### Primary (use these first)

| Tool | Parameters | Purpose |
|------|-----------|---------|
| `remember` | `data`, `dataset_name?`, `session_id?`, `custom_prompt?` | Store text as permanent graph memory or session cache |
| `recall` | `query`, `search_type?`, `datasets?`, `session_id?`, `top_k?` | Retrieve memory with auto-routing |
| `forget` | `dataset?`, `everything?` | Delete a dataset or all user memory |
| `improve` | `dataset_name?`, `session_ids?` | Enrich graph and bridge session → permanent |

### Legacy (fine-grained control)

| Tool | Purpose |
|------|---------|
| `cognify` | Transform ingested data into knowledge graph |
| `search` | Low-level explicit search (graph, RAG, chunks, summaries, cypher) |
| `prune` | Reset local MCP store |

### Retrieval Helpers

| Tool | Purpose |
|------|---------|
| `get_document` | Fetch source document + all chunks |
| `get_chunk_neighbors` | Get nearby chunks for context expansion |

### Data Management

| Tool | Purpose |
|------|---------|
| `save_interaction` | Store user-assistant exchange |
| `list_data` | List datasets and data items |
| `delete` | Remove a data item from dataset |
| `delete_dataset` | Delete entire dataset by name |
| `cognify_status` | Check pipeline indexing status |

## How Argus Uses Cognee

### Dataset Strategy
```
gtm_intel      → PriceBot, LeadBot, CompetitorBot findings
finance_intel  → FilingWatcher, EarningsBot, MacroBot findings
security_intel → ThreatBot, VendorRiskBot, BrandWatchBot findings
shared_context → Cross-track correlations discovered by Orchestrator
```

### Agent Pattern
```typescript
// After scraping and analyzing, every agent remembers
await mcpClient.callTool("remember", {
  data: JSON.stringify({
    signal_type: "price_change",
    source_url: "https://amazon.com/dp/B0DHTYW7P5",
    finding: "Samsung Galaxy S25 Ultra dropped from $1299 to $1099",
    confidence: 0.92,
    agent: "pricebot-001",
    timestamp: new Date().toISOString(),
  }),
  dataset_name: "gtm_intel",
});

// Before analyzing, every agent recalls for context
const context = await mcpClient.callTool("recall", {
  query: "Samsung Galaxy S25 recent price changes competitor moves",
  datasets: "gtm_intel",
  top_k: 5,
});
```

## Key Links
- MCP Overview: https://docs.cognee.ai/cognee-mcp/mcp-overview
- MCP Tools Reference: https://docs.cognee.ai/cognee-mcp/mcp-tools
- Quickstart: https://docs.cognee.ai/cognee-mcp/mcp-quickstart
- Integrations: https://docs.cognee.ai/cognee-mcp/integrations
