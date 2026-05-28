# Architecture Decision Record

## ADR-1: TypeScript End-to-End
**Decision**: Use TypeScript for both backend agents and frontend dashboard.
**Rationale**: Shared types between agents and UI eliminate serialization bugs. Spectra is TypeScript-native. Bright Data JS SDK is TypeScript. MCP clients work in Node.js. One language means one build tool (Bun), one package manager, one CI pipeline.
**Rejected**: Python backend (would require separate Cognee integration layer), Go backend (Spectra doesn't have Go bindings).

## ADR-2: Spectra Over CrewAI
**Decision**: Use `@mohanscodex/spectra-agent` as the agent framework instead of CrewAI.
**Rationale**: Spectra is TypeScript-native (same language as frontend). It ships `defineTool()` with Zod validation, production utilities (rate limiting, circuit breaker, session engine), and is maintained by our team. CrewAI is Python-only and would fracture the codebase.
**Risk**: Spectra is v0.2.x. If critical bugs are found, we can fix them directly since we own the code.

## ADR-3: MCP Protocol for Provider Integration
**Decision**: Connect to Bright Data and Cognee via MCP protocol, not direct SDK calls.
**Rationale**: MCP is the hackathon's preferred integration pattern for Bright Data. Both providers expose MCP servers. MCP gives our agents a unified tool interface — every external capability is `callTool(name, args)`. The MCP client is provider-agnostic.
**Risk**: MCP is HTTP/SSE-based, adding latency vs direct SDK calls. Mitigated by caching scrape results in Cognee memory.

## ADR-4: Cognee via Docker, Not Python Sidecar
**Decision**: Run Cognee MCP in a Docker container, not as a Python sidecar process.
**Rationale**: Cognee MCP is a Python application. Docker packages the Python runtime + Cognee into one container. `docker-compose up` starts the full stack. No Python installation required on the host. No dependency conflicts with the TypeScript project.
**Rejected**: Python sidecar (requires Python on host), native Node.js memory (loses Cognee prize eligibility, no graph database).

## ADR-5: Hybrid Bright Data Integration
**Decision**: Use MCP for structured extractors, JS SDK for raw scraping and SERP.
**Rationale**: MCP has 60+ pre-built extractors that return structured JSON — no parsing needed for LinkedIn, Amazon, etc. JS SDK is simpler for ad-hoc scraping of unknown sites. Both use the same API key. Agents choose based on the target URL.

## ADR-6: Provider Availability Pattern
**Decision**: Every external provider client must implement `isAvailable()` and degrade gracefully.
**Rationale**: Hackathon demos fail when an API key is missing or a service is down. Mandatory providers (Bright Data, AI/ML API) report errors. Optional providers (Speechmatics, TriggerWare) disable the feature without crashing. Pattern: check availability → log degradation → continue with reduced capability.

## ADR-7: Monorepo with Turborepo
**Decision**: Use Turborepo + Bun workspaces for the monorepo.
**Rationale**: Shared types package between backend and frontend. Turborepo caches builds and parallelizes tasks. Bun is fast. Matches Spectra's own monorepo pattern.
