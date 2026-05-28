# TriggerWare — Workflow Automation

## What It Provides

Event-driven workflow automation. Connects agent outputs to actions — when an Argus agent detects a signal, TriggerWare can trigger downstream workflows (Slack alerts, email notifications, CRM updates, webhook calls).

## Hackathon Prizes
- 1st: $300 Amazon + 5,000 tokens/month for 12 months
- 2nd: $150 Amazon + 5,000 tokens/month for 12 months
- 3rd: $50 Amazon + 5,000 tokens/month for 12 months

## How Argus Uses It

Signal detection → automated response:
```
PriceBot detects competitor price drop
  → TriggerWare workflow fires
    → Slack alert to sales team
    → CRM update (competitor field)
    → Email to pricing manager
```

## Integration Pattern

TriggerWare provides REST APIs. Argus agents call them at the end of their analysis cycle:

```typescript
// After detecting a signal, fire workflow
await fetch("https://api.triggerware.com/v1/workflows/run", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.TRIGGERWARE_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    workflow_id: "competitor_price_alert",
    payload: {
      competitor: "Samsung",
      product: "Galaxy S25 Ultra",
      old_price: "$1,299",
      new_price: "$1,099",
      change_pct: -15.4,
      source_url: "https://amazon.com/dp/B0DHTYW7P5",
      detected_by: "pricebot-001",
      timestamp: new Date().toISOString(),
    },
  }),
});
```

## Key Links
- Website: https://triggerware.ai/
- Docs: https://docs.triggerware.com/
