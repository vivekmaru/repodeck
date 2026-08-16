# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: Individual developer, prolific open-source contributor, and maintainer managing 20–500+ personal repositories and forks.
Situation: Navigating an overwhelming GitHub dashboard, triaging upstream fork drift, discovering forgotten code across repos, and auditing stale repository disk footprint and lifecycle states.
Job to be done:
- Instantly search, filter, and inspect repositories with zero loading lag and sub-millisecond keyword/semantic query response.
- Monitor upstream fork sync telemetry (behind/ahead commits) and perform fast-forward batch merges.
- Audit portfolio lifecycle health (Active, Warm, Quiet, Stale, Dormant) and safely reclaim unused workspace footprint.

## Product Purpose

RepoDeck is a high-performance, data-dense GitHub repository management and fork synchronization workstation. It exists to replace slow, pagination-heavy web interfaces with an offline-first, sub-millisecond local desktop-grade console for managing personal GitHub portfolios.

Success means developers can find any repo instantly, keep forks synchronized with zero drift friction, and maintain a lean, clean repository lifecycle.

## Positioning

Unlike cloud SaaS dashboards or slow paginated GitHub web views, RepoDeck runs locally on native Node.js SQLite (WAL mode) with embedded private ONNX vector embeddings (`all-MiniLM-L6-v2`) and FTS5 BM25 hybrid search (Reciprocal Rank Fusion). It requires zero external cloud API subscriptions and delivers sub-millisecond cold queries with zero rate-limit depletion via ETag and single-roundtrip GraphQL ingestion.

## Operating Context

- Local development workstation running on port 3000 (Vite + Node.js/Express).
- Authentication via GitHub OAuth 2.0 or Classic Personal Access Token (PAT) with granular token scope diagnostics (`delete_repo`, `repo`, `workflow`).
- Realistic sandbox preview environment for offline and unauthenticated exploration.
- Integrated keyboard-first navigation (`/` for search, `1-4` for navigation tabs, `↑`/`↓` for table rows, `Space` for multi-selection, `Enter` for inspector drawer).

## Capabilities and Constraints

- **Local Persistence & Caching Engine**: Native `node:sqlite` in WAL mode with HTTP ETag 304 fast-paths and single-roundtrip GraphQL ingestion.
- **AI Hybrid Search Engine**: SQLite FTS5 (BM25 token search) combined with local ONNX 384-dimensional dense embeddings via Reciprocal Rank Fusion (RRF).
- **Data-Dense Virtualized Table**: 60 FPS table virtualization (`@tanstack/react-virtual`) handling 500+ repositories with interactive sort headers and batch action bar.
- **Upstream Fork Sync Hub**: Real-time fork drift telemetry (commits behind/ahead) with 1-click and batch fast-forward upstream merges.
- **Portfolio Lifecycle Auditor**: Automatic categorization (Active, Warm, Quiet, Stale, Dormant) and reclaimable disk footprint analysis with typed-confirmation safe deletion modals.
- **Starred Library Hub**: Tag, language, and topic filtering with one-click unstar management.

## Brand Commitments

- **Name**: RepoDeck.
- **Identity**: Neo-Brutalist Technical Data Console & GitHub Developer Power-Hub.
- **Aesthetic**: Dual-mode support (High-contrast GitHub Pro Dark and Warm Editorial Neo-Brutalist Cream) with sharp borders, dense tabular typography (`Space Mono` for metrics/hashes, `Plus Jakarta Sans` for headers, `Inter` for UI body), and rich telemetry badges.

## Evidence on Hand

- Native runnable code repository with TypeScript React frontend and Express backend.
- High-coverage PRD ([PRD.md](PRD.md)) and Architecture reference ([ARCHITECTURE.md](ARCHITECTURE.md)).
- Live running sandbox environment with seeded sample portfolio data.

## Product Principles

1. **Sub-Millisecond Speed**: Everything from keystrokes to table sorting and hybrid search must feel instant (<1ms SQLite lookups, zero UI jank).
2. **High Data Density, Zero Slop**: Present rich repository telemetry (drift, disk usage, languages, releases) compactly without visual fluff.
3. **Safety First**: Destructive operations (repository deletion, bulk archiving) require explicit safeguards, scope verification, and typed confirmations.
4. **Keyboard-Native Flow**: Every core action can be executed without leaving the keyboard.
5. **Private & Local-First**: Private ONNX inference and local SQLite storage—no user repo data is sent to third-party AI cloud vendors.

## Accessibility & Inclusion

- High-contrast text and border tokens meeting WCAG AA standards in both Dark and Light themes.
- Full keyboard navigation across data tables, drawers, tabs, and modals.
- Explicit ARIA attributes and descriptive button titles for screen-reader usability.
