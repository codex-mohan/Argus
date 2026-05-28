# AI/ML API — Model Gateway

## What It Provides

A single OpenAI-compatible endpoint giving access to 400+ models. One API key, one billing account, one integration point.

**Base URL**: `https://api.aimlapi.com/v1`
**Hackathon credits**: $10 per person (up to 500 participants)

## Model Selection Strategy

Argus uses different models for different agent tasks — matching capability to cost and latency:

| Agent Type | Model | Why |
|-----------|-------|-----|
| **Extraction agents** (PriceBot, FilingWatcher, ProfileBot) | Gemini 3 Flash | Fast, cheap ($0.65/M), good at structured extraction |
| **Analysis agents** (CompetitorBot, EarningsBot, MacroBot) | Claude Opus 4.7 | Best reasoning for complex analysis, 1M context |
| **Synthesis agents** (Orchestrator, ReportWriter) | DeepSeek R1 or GPT-5.5 | Chain-of-thought reasoning for multi-source synthesis |
| **Classification agents** (SignalRouter, PriorityBot) | Gemini 3 Flash | Simple classification, lowest cost |
| **Cross-check agents** (FactChecker, CorroborationBot) | Claude Opus 4.7 | Needs high accuracy for verification |

## Integration with Spectra

Spectra's OpenAI provider maps directly to AI/ML API:

```typescript
import { Agent, defineTool } from "@mohanscodex/spectra-agent";
import { z } from "zod";

// Spectra's OpenAI provider works with AI/ML API by setting base URL:
process.env.OPENAI_BASE_URL = "https://api.aimlapi.com/v1";
process.env.OPENAI_API_KEY = process.env.AIMLAPI_KEY;

// Or configure per-agent model selection:
const agent = new Agent({
  model: {
    id: "deepseek/deepseek-r1",        // AI/ML API model path
    provider: "openai-completions",     // Spectra provider
    api: "chat-completions",            // API endpoint type
  },
  systemPrompt: "...",
  tools: [...],
});
```

## Cost Awareness
- Flash models (Gemini, Grok): $0.15-0.65 per million tokens
- Pro models (Claude Opus, GPT-5.5): $3.25-6.50 per million tokens
- Reasoning models (DeepSeek R1): ~$0.55 per million tokens
- Always use flash for extraction, pro for synthesis. Track cost per agent run.

## Integration Check
Spectra requires the OPENAI_API_KEY and OPENAI_BASE_URL environment variables. AI/ML API fills both:
```
OPENAI_BASE_URL=https://api.aimlapi.com/v1
OPENAI_API_KEY=<your_aimlapi_key>
```

## Key Links
- Website: https://aimlapi.com/
- Docs: https://docs.aimlapi.com/
- Discord: https://discord.com/invite/j5QggeZJgY
- Claim credits: https://lablab.ai/redeem-coupon/ai-ml-api-coupon-brightdata-hackathon
