# RepoDeck — Impeccable Design System & Context

## 1. Product Identity & Design Archetype
- **Archetype**: Neo-Brutalist Technical Data Console & GitHub Developer Power-Hub.
- **Tone**: Dense, authoritative, snappy, and developer-crafted.
- **Dual Visual Modes**:
  - **Dark Mode**: High-contrast GitHub Pro Dark (`#0d1117`, `#161b22`, `#30363d`) with crisp neon telemetry accents.
  - **Light Mode**: Warm editorial cream (`#fffef2`, `#1a1a1a`) with hard 2px neo-brutalist drop borders and punchy pastel tags.

---

## 2. Core Design Principles

1. **Information Density with Zero Clutter**
   - High information density (52px virtualized table rows, tight badges, compact telemetry pills).
   - Clean spacing with no wasted margins; container scales seamlessly up to `1840px`.

2. **Sub-Millisecond Feel & Micro-Feedback**
   - Instant visual response to keyboard commands (`/` search, `1-4` tabs, `↑`/`↓` rows, `Space` select, `Enter` drawer).
   - Real-time search latency telemetry (`⚡ 0.8ms` / `🧠 12.4ms`).

3. **Strict Color Semantics & Accessibility**
   - **Active (<30d)**: Emerald green (`#39d353` / `#2da44e`).
   - **Recent (<4m)**: Electric cyan/blue (`#58a6ff` / `#0969da`).
   - **Quiet (<1y)**: Amber gold (`#d29922` / `#bf8700`).
   - **Stale (>1y)**: Pumpkin orange (`#f0883e` / `#bc4c00`).
   - **Dormant (>2y)**: Coral danger (`#ff7b72` / `#cf222e`).

4. **Engineered Typography Scale**
   - **Brand / Headings**: `Plus Jakarta Sans` for modern geometric punch.
   - **Body / Controls**: `Inter` for high legibility at 12px–14px sizes.
   - **Hashes / Telemetry / Metrics**: `Space Mono` for monospace tabular numbers and commit SHAs.

---

## 3. UI Component Specifications

### 2-Tier Filter & Search Matrix
- **Tier 1 (Top)**: Full-width search bar paired with segmented search engine selector pills (`Hybrid RRF`, `FTS5 BM25`, `AI Match`).
- **Tier 2 (Bottom)**: 5 compact dropdown filters (Sources, Visibility, Activity, Language, Sort) + View toggle buttons (`Table`, `Grid`).

### Virtualized Data Table (`@tanstack/react-virtual`)
- Dynamic 60 FPS virtualization capable of rendering 500+ repositories with zero scroll lag.
- Clickable column headers with live sort direction arrows (`REPOSITORY`, `LAST PUSH`, `CREATED`, `STATS`).
- Checkbox multi-select row actions tied to sticky `BatchActionBar`.

### Slide-Over Inspector Drawer
- Smooth entrance animation via Motion.
- Deep-dive telemetry tabs:
  1. **Branches & Drift**: Default branch, protected branches, ahead/behind drift.
  2. **Releases & Tags**: Latest semver releases and asset downloads.
  3. **Pull Requests & Issues**: Open count and activity summary.
  4. **Languages**: Byte breakdown bar with exact percentage distribution.

### Audit & Reclaimable Footprint Console
- Storage footprint bar chart and cleanup candidates (dormant repos, abandoned forks).
- Safe action verification with typed confirmation name modals.

---

## 4. Impeccable Design Audit & Next Steps
- [x] Initialized `.impeccable/design-system.json` tokens.
- [x] Documented color ramp, typography, and component specs in `.impeccable/context.md`.
- [x] Verified dual-theme (Light/Dark) contrast and responsiveness up to 1840px viewports.
- [ ] Maintain consistent focus rings and ARIA accessibility roles across all interactive controls.
