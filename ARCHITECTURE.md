# Architecture & System Design

## Architecture Overview
RepoDeck is built as a full-stack developer utility running Express + React 19 + Tailwind CSS.

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

### 2. Client Architecture (`src/`)
- `App.tsx`: Main orchestrator managing session, repository state, active views, batch selections, keyboard hotkeys, drawer inspection, and modals.
- `components/Navbar.tsx`: Header navigation with tab switcher, fast refresh trigger, profile avatar, live rate limit pill, and rich profile dropdown with an API rate limit telemetry card (remaining/limit counts, gauge bar, reset timer, token scopes list, and account switcher).
- `components/RepoTableView.tsx`: Data-dense table layout with multi-select checkboxes, arrow key keyboard navigation (`↑`/`↓` row focus, `Space` toggle selection, `Enter` inspect drawer), interactive expandable accordion rows with language percentage bars, recent contributors, and slide-over launcher. Optimized column sizing and padding to eliminate horizontal scroll on standard laptop and desktop screens.
- `components/RepoDetailDrawer.tsx`: Slide-over inspector drawer with smooth spring animations, tabbed breakdown for Languages (segmented progress meter + bytes/%), Contributors (avatars, roles, commits), Recent Commit stream, and Lifecycle metadata.
- `components/RepoCard.tsx`: Compact card layout with telemetry badges, inspect details button, and quick actions.
- `components/BatchActionBar.tsx`: Floating bulk operations bar for selected repositories (batch archiving, batch fork synchronization, batch repository deletion, and JSON/CSV metadata export). Features a responsive mobile layout with upward dropdown menu when > 3 actions are present to prevent viewport overflow, and a compact single-row design on larger screens to minimise horizontal scroll.
- `components/BatchDeleteModal.tsx`: Destructive multi-repository batch deletion confirmation dialog with target summary roster, permission diagnostics, and progress tracking.
- `components/FilterBar.tsx`: Multi-dimensional filtering (Source, Visibility, Activity, Language, Sort) and Table/Grid switcher.
- `components/ForkManager.tsx` & `ForkCard.tsx`: Upstream drift monitoring, branch comparison diff links, and 1-click sync.
- `components/AuditView.tsx`: Portfolio activity breakdown bar, stale and dormant candidate lists, and reclaimable footprint meter.
- `components/StarredRepos.tsx`: Searchable starred library catalog with Table and Card views.
- `components/DeleteRepoModal.tsx`: Destructive deletion safeguard dialog with typed repository name confirmation, live scope verification, and direct token creation guidance.
- `Design System & Typography`: Neo-brutalist tech developer UI pairing Plus Jakarta Sans headings with Space Mono data telemetry and Inter body text, ensuring zero cartoonish handwriting fonts or purple/pink gradient slop.
- `Security & Scopes Model`: Validates `x-oauth-scopes` for the critical `delete_repo` permission and provides robust response parsing against HTML proxy errors.
