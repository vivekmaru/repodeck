# Product Requirements Document (PRD)

## Product Name: RepoDeck
**Purpose**: High-performance, data-dense GitHub repository management, fork upstream synchronization, AI hybrid search, and workspace lifecycle cleanup console.

---

### Key Objectives & Feature Matrix

#### 1. High-Performance Database, Persistence & Caching Engine
- **Sub-Millisecond Local Persistence**: Native Node.js `node:sqlite` in WAL (Write-Ahead Logging) mode (`PRAGMA synchronous = NORMAL`, 64MB memory cache) providing **<1ms** cold-start repository retrieval and seamless offline capabilities.
- **Zero Rate Limit HTTP ETag Pipeline**: Automatic caching of GitHub ETags with `304 Not Modified` fast-paths, preventing rate limit quota depletion on application reloads and refreshes.
- **Single-Roundtrip GraphQL Ingestion**: Consolidates repositories, fork parent hierarchies, language byte breakdowns, and primary commit authors into **1 single GraphQL query** (replacing 50+ N+1 REST queries).

#### 2. Local Vector Embeddings & AI Hybrid Search (RRF Engine)
- **Tokenized SQLite FTS5 Engine**: Column-weighted BM25 ranked scoring for exact prefix/keyword discovery with automated trigger synchronization (`repos_ai`, `repos_ad`, `repos_au`).
- **Private Local Vector Embeddings**: Local ONNX inference via `@xenova/transformers` with `all-MiniLM-L6-v2` generating 384-dimensional dense vectors stored in SQLite. Zero external cloud API calls or paid subscriptions required.
- **Reciprocal Rank Fusion (RRF)**: Combines keyword precision and semantic concept search:
  $$\text{RRF Score}(d) = \frac{1.0}{60 + \text{rank}_{\text{fts}}(d)} + \frac{1.25}{60 + \text{rank}_{\text{vec}}(d)}$$
- **Multi-Engine Search Selector**:
  - ⚡ **Hybrid**: Blended RRF rank.
  - ⚡ **FTS5**: Exact BM25 token match (<1ms).
  - 🧠 **AI Match**: Dense vector cosine similarity search.
- **Live Search Execution Telemetry**: Real-time latency pill (e.g. `⚡ 0.8ms` / `🧠 15.0ms`).

#### 3. Data-Dense Developer UI & Table Virtualization
- **60 FPS Table Virtualization (`@tanstack/react-virtual`)**: Smooth, performant rendering of 500+ repositories with dynamic row measurement, eliminating DOM bloat and scroll jank.
- **Interactive Clickable Column Headers**: Direct sort toggling on `REPOSITORY` (Name A-Z / Z-A), `LAST PUSH` (Recent / Stale), `CREATED` (Newest / Oldest), and `STATS` (Most Stars / Least Stars) with live `↑`/`↓` indicators.
- **2-Tier Responsive Filter Bar**: Full-width search bar paired with non-colliding segmented mode pills on the top row, and multi-dimensional filter selects (Sources, Visibility, Activity, Language, Sort) on the bottom row.
- **Full-Width Modern Container**: Expands to `max-w-[1720px] 2xl:max-w-[1840px]`, eliminating empty black margins and zero horizontal scroll on standard laptop and desktop screens.
- **Comprehensive Keyboard Navigation**: Arrow keys (`↑`/`↓`) for row focus, `Space` for multi-select checkboxes, `Enter` for slide-over inspector drawer, `/` for search, and `1-4` for navigation tabs.

#### 4. Upstream Fork Synchronization Hub
- **Drift Telemetry**: Instant identification of commits behind / ahead / diverged against upstream parent default branches.
- **Cached Drift Checks**: SQLite cached drift status (<30 min TTL) prevents redundant GitHub compare calls.
- **1-Click Fast-Forward Merge**: Dispatches GitHub's `merge-upstream` API with batch sync capability across all outdated forks.

#### 5. Portfolio Lifecycle Auditor & Reclaimable Footprint
- **Lifecycle Classification**: Categorizes repositories into Active (<30d), Warm (<4m), Quiet (<1y), Stale (>1y), and Dormant (>2y).
- **Disk Storage Breakdown**: Highlights storage footprint in MB/KB and calculates reclaimable space.
- **Safe Archiving & Deletion Safeguards**: Modal safeguards with typed repository name confirmation and permission scope diagnostics.

#### 6. Starred Repositories Hub
- **Curated Library Catalog**: Filter by language and topic, sort by stars/last push/name, and unstar unused repositories in 1-click.

#### 7. Authentication & Token Diagnostics
- **OAuth 2.0 Popup Handshake**: 1-click login with automatic window messaging.
- **Classic Personal Access Token (PAT)**: Token bearer authentication with live `x-oauth-scopes` verification for `delete_repo`.
- **Demo Sandbox Mode**: Realistic offline sandbox environment with seeded sample portfolio for rapid previewing.
