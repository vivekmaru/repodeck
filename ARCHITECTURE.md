# Architecture & System Design

## Architecture Overview
RepoDeck is built as a full-stack developer utility running Express + React 19 + Tailwind CSS.

```
 ┌──────────────────────────────────────────────────────────────────────────┐
 │                        CLIENT (React 19 + Vite)                         │
 │  ┌─────────────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
 │  │ SWR / Optimistic Cache  │  │ @tanstack/react │  │ Hybrid Search UI │  │
 │  │ & Rate Limit Telemetry  │  │ -virtual (DOM)  │  │ (FTS5 + MiniLM)  │  │
 │  └────────────┬────────────┘  └────────┬────────┘  └────────┬─────────┘  │
 └───────────────┼────────────────────────┼────────────────────┼────────────┘
                 │ HTTP (ETags + 304)     │                    │
 ┌───────────────▼────────────────────────┴────────────────────▼────────────┐
 │                         EXPRESS BACKEND SERVER                           │
 │  ┌────────────────────────────────────────────────────────────────────┐  │
 │  │ Hybrid Search Router (RRF: BM25 FTS5 + Xenova MiniLM Embeddings)   │  │
 │  └──────────────────────────────────┬─────────────────────────────────┘  │
 │  ┌──────────────────────────────────▼─────────────────────────────────┐  │
 │  │ SQLite Database (WAL Mode + 64MB Cache + mmap + FTS5 + Embeddings) │  │
 │  │  • repositories (metadata, languages, drift)                       │  │
 │  │  • repos_fts (FTS5 BM25 index over name, desc, topics, language)   │  │
 │  │  • vector_embeddings (384-dim dense vectors from all-MiniLM-L6-v2) │  │
 │  │  • http_cache (ETag, serialized response payload, expiration)      │  │
 │  └──────────────────────────────────┬─────────────────────────────────┘  │
 └─────────────────────────────────────┼────────────────────────────────────┘
                                       │ Async Background Sync & Polling
 ┌─────────────────────────────────────▼────────────────────────────────────┐
 │                         GITHUB API (v3 REST & v4 GraphQL)                │
 │  • GraphQL Single-Roundtrip Batching (Repos + Forks + Languages + Commits│
 │  • Conditional HTTP (ETags -> 304 Not Modified = 0 Rate Limit Cost)     │
 └──────────────────────────────────────────────────────────────────────────┘
```

### 1. Server Architecture (`server.ts`)
- **Authentication**:
  - OAuth 2.0 popup authorization with `/auth/callback` handshake and window messaging.
  - Personal Access Token (PAT) bearer authentication with in-memory session store.
  - Interactive Demo Sandbox session seeded with realistic multi-tiered repositories.
- **GitHub API Proxy (`/api/github/*`)**:
  - `GET /api/github/repos`: Lists authenticated user's repositories with language, size, visibility, fork parent, and timestamps.
  - `GET /api/github/forks/:owner/:repo/compare`: Computes git commit drift against parent branch.
  - `POST /api/github/forks/:owner/:repo/sync`: Dispatches fast-forward merge via upstream API.
  - `GET /api/github/repos/:owner/:repo/details`: Aggregates language byte breakdowns, contributor rosters with commit volume, and recent commit history logs.
  - `PATCH /api/github/repos/:owner/:repo`: Toggles repository archived status.
  - `DELETE /api/github/repos/:owner/:repo`: Issues hard deletion requiring double confirmation.
  - `GET /api/github/starred` & `DELETE /api/github/starred/:owner/:repo`: Manages starred repositories.
  - Rate limit extraction: Proxies GitHub `x-ratelimit-limit`, `x-ratelimit-remaining`, `x-ratelimit-reset`, and `x-ratelimit-used` headers to the client session.

### 2. High-Performance Database & Search Engine (`server/db/` & `server/services/`)
- **SQLite Engine (`server/db/database.ts`)**:
  - Native `node:sqlite` in WAL (Write-Ahead Logging) mode with `PRAGMA synchronous = NORMAL` and 64MB in-memory cache for sub-millisecond local reads (<1ms).
  - Normalized schemas for repositories, starred libraries, branch metadata, and HTTP conditional caching.
  - Transparent HTTP ETag caching layer: GitHub `304 Not Modified` responses serve SQLite cached data with **0 rate limit cost**.
- **FTS5 Full-Text Engine**:
  - Tokenized virtual table `repos_fts` with `porter unicode61` stemming and automated synchronization triggers.
  - Column-weighted BM25 ranked scoring for exact prefix/keyword repository discovery.
- **Local Vector Embeddings & Hybrid Search (`server/services/embeddings.ts` & `hybridSearch.ts`)**:
  - Local ONNX inference via `@xenova/transformers` with `all-MiniLM-L6-v2` generating 384-dimensional dense vectors stored in SQLite.
  - Reciprocal Rank Fusion (RRF) combining FTS5 keyword relevance and semantic cosine similarity:
    $$\text{RRF Score}(d) = \frac{1.0}{60 + \text{rank}_{\text{fts}}(d)} + \frac{1.25}{60 + \text{rank}_{\text{vec}}(d)}$$
  - Multi-mode search router (`/api/search`) supporting `hybrid`, `fts`, and `semantic` modes with live sub-15ms execution latency telemetry.
- **GitHub GraphQL Ingestion (`server/utils/githubApi.ts`)**:
  - Consolidates repository lists, fork parent hierarchies, language byte breakdowns, and primary commit authors into **1 single round-trip HTTP request** (replacing 50+ N+1 REST queries).

### 3. Client Architecture (`src/`)
- `App.tsx`: Main orchestrator managing session, repository state, active views, batch selections, keyboard hotkeys, drawer inspection, server-backed search debouncing, and modals.
- `components/Navbar.tsx`: Header navigation with tab switcher, fast refresh trigger, profile avatar, live rate limit pill, and rich profile dropdown with an API rate limit telemetry card (remaining/limit counts, gauge bar, reset timer, token scopes list, and account switcher).
- `components/RepoTableView.tsx`: High-performance virtualized table powered by `@tanstack/react-virtual` rendering 60 FPS smooth scrolling with 500+ repositories, dynamic accordion row measurement, multi-select checkboxes, arrow key keyboard navigation (`↑`/`↓` row focus, `Space` toggle selection, `Enter` inspect drawer), and hybrid relevance match badges.
- `components/RepoDetailDrawer.tsx`: Slide-over inspector drawer with smooth spring animations, tabbed breakdown for Languages (segmented progress meter + bytes/%), Contributors (avatars, roles, commits), Recent Commit stream, and Lifecycle metadata.
- `components/RepoCard.tsx`: Compact card layout with telemetry badges, inspect details button, and quick actions.
- `components/BatchActionBar.tsx`: Floating bulk operations bar for selected repositories (batch archiving, batch fork synchronization, batch repository deletion, and JSON/CSV metadata export). Features a responsive mobile layout with upward dropdown menu when > 3 actions are present to prevent viewport overflow, and a compact single-row design on larger screens to minimise horizontal scroll.
- `components/BatchDeleteModal.tsx`: Destructive multi-repository batch deletion confirmation dialog with target summary roster, permission diagnostics, and progress tracking.
- `components/FilterBar.tsx`: Multi-dimensional filtering (Source, Visibility, Activity, Language, Sort) with Hybrid/FTS5/AI search mode switcher, live query latency badge, and Table/Grid view selector.
- `components/ForkManager.tsx` & `ForkCard.tsx`: Upstream drift monitoring, branch comparison diff links, and 1-click sync.
- `components/AuditView.tsx`: Portfolio activity breakdown bar, stale and dormant candidate lists, and reclaimable footprint meter.
- `components/StarredRepos.tsx`: Searchable starred library catalog with Table and Card views.
- `components/DeleteRepoModal.tsx`: Destructive deletion safeguard dialog with typed repository name confirmation, live scope verification, and direct token creation guidance.
- `Design System & Typography`: Neo-brutalist tech developer UI pairing Plus Jakarta Sans headings with Space Mono data telemetry and Inter body text, ensuring zero cartoonish handwriting fonts or purple/pink gradient slop.
- `Security & Scopes Model`: Validates `x-oauth-scopes` for the critical `delete_repo` permission and provides robust response parsing against HTML proxy errors.
