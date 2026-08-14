# Product Requirements Document (PRD)

## Product Name: RepoDeck
**Purpose**: High-performance, data-dense GitHub repository management, fork upstream synchronization, and lifecycle cleanup console.

### Key Objectives
1. **Repository Lifecycle Management & Auditing**:
   - Classify repositories by activity tiers (Active, Warm, Quiet, Stale, Dormant) calculated from creation and push timestamps.
   - Surface disk space footprint and reclaimable volume.
   - Archive and delete repositories directly with double-confirmation safeguards.
2. **Upstream Fork Synchronization**:
   - Compare forked repositories against upstream parent default branches.
   - Quantify drift (commits behind / ahead / diverged).
   - Provide 1-click fast-forward synchronization using GitHub's `POST /repos/{owner}/{repo}/merge-upstream` API endpoint.
   - Provide batch synchronization across all outdated forks.
3. **Curated Starred Collection**:
   - Search, filter by language and topic, and unstar unused libraries.
4. **Data-Dense Developer UI & Deep Inspection**:
   - Dual-mode view: High-density Table View and Card Grid View.
   - **Keyboard Navigation**: Full arrow key (`↑` / `↓`) row highlighting with automatic smooth scrolling, `Space` for toggling repository selection, and `Enter` for opening the Slide-over Inspector Drawer.
   - **API Rate Limit Diagnostics**: Real-time quota status in the navbar button pill and an expanded gauge breakdown inside the profile dropdown (remaining requests, total limit, health badge, visual progress capacity bar, and minutes until the 60-minute window resets).
   - Interactive Expandable Rows: Inline accordion unfolding with primary language percentage breakdown (segmented multi-color meter and byte counts), recent top contributors with avatars, quick clone copy, and quick actions.
   - Slide-over Inspector Drawer: Comprehensive drawer panel with smooth motion transitions, dedicated tabs for Languages & Tech Stack, Contributor team roster, Recent Commit Stream, and Lifecycle Telemetry.
   - Batch selection, batch archive, batch fork sync, batch repository deletion with confirmation safeguards, and JSON/CSV metadata export.
   - Responsive Batch Action Bar: Adapts on mobile screens (< 640px) using upward dropdown menus and compact stacks when > 3 actions are present to prevent viewport overflow, and compact single-row design on larger screens to minimise horizontal scroll.
   - Monospace telemetry pills, clear status dots, and hotkeys (`/` for search, `1-4` for navigation tabs, `R` for refresh, `Esc` for drawer/modal close, `↑`/`↓` for row navigation, `Space` for select, `Enter` for inspect).
   - Crisp, professional typography (Plus Jakarta Sans display headings, Space Mono data telemetry, Inter body text) without cartoonish fonts or generic gradient slop.
5. **Token Permissions & Scope Diagnostics**:
   - Proactive verification of `delete_repo` scope on connected tokens.
   - Descriptive diagnostics differentiating Classic PATs, Fine-Grained tokens, and OAuth permissions.
   - Safe response parsing across proxy gateways preventing raw HTML parsing syntax errors.
