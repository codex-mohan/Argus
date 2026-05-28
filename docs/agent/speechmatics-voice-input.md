# Speechmatics — Voice Input Layer

## What It Provides

Real-time and batch speech-to-text with 55+ languages. Allows Argus to accept voice commands — an operator can speak a query ("Show me competitor price changes on NVIDIA GPUs in the last 24 hours") and the system transcribes and routes it.

## Hackathon Access
- **Credits**: $200 API credits (first 100 participants)
- **Promo code**: `WEBDATAHACK200`
- **Validity**: 1 month
- **Setup guide**: https://drive.google.com/file/d/1qElLOCVGYUPWrHprfjA5LB4sdzS3cZpi/view
- **Status**: Optional. May not be available if registered late. Feature must degrade gracefully.

## Fallback Behavior
If `SPEECHMATICS_API_KEY` is not set or the health check fails:
- Voice endpoint returns `{ available: false, reason: "Speechmatics not configured" }`
- Frontend hides the voice input button
- Text input remains the primary and only interface
- No errors, no crashes, no console noise — silent graceful degradation

## Integration Options

### REST API (Batch)
Send audio file → get transcription back. Good for pre-recorded voice notes.

### WebSocket (Real-time Streaming)
Open a WebSocket connection, stream audio chunks, receive transcription as it happens. Good for live voice commands.

## How Argus Uses It

Voice commands flow through a lightweight pipeline:
```
Microphone → Speechmatics WebSocket → Transcribed text → Orchestrator Agent → Route to specialist agents
```

The Orchestrator already handles text queries. Voice input is just another entry point — same routing logic, different input modality.

## Minimal Integration

```typescript
// Real-time streaming via WebSocket
const ws = new WebSocket("wss://asr.api.speechmatics.com/v2/en");

ws.onopen = () => {
  // Send config
  ws.send(JSON.stringify({
    message: "StartRecognition",
    audio_format: { type: "raw", encoding: "pcm_s16le", sample_rate: 16000 },
    transcription_config: { language: "en", max_delay: 2 },
  }));
};

ws.onmessage = (event) => {
  const result = JSON.parse(event.data);
  if (result.message === "AddTranscript") {
    const text = result.metadata.transcript;
    // Route to Argus orchestrator
    orchestrator.processCommand(text);
  }
};
```

## When to Use
- Demo: voice commands make a strong impression on judges
- Production: operators monitoring signals can query verbally while multitasking
- Not required: text input through the Next.js dashboard is the primary interface

## Key Links
- Platform: https://portal.speechmatics.com/
- Docs: https://docs.speechmatics.com/
- Setup guide: https://drive.google.com/file/d/1qElLOCVGYUPWrHprfjA5LB4sdzS3cZpi/view
