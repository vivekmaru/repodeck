---
name: RepoDeck
description: High-performance, data-dense GitHub repository management and fork synchronization workstation.
colors:
  primary: "#39d353"
  primary-light: "#2da44e"
  accent-coral: "#ff7b72"
  accent-blue: "#58a6ff"
  accent-yellow: "#f0883e"
  accent-purple: "#bc8cff"
  neutral-bg-dark: "#0d1117"
  neutral-surface-dark: "#161b22"
  neutral-surface-elevated: "#21262d"
  neutral-border-dark: "#30363d"
  neutral-text-dark: "#f0f6fc"
  neutral-muted-dark: "#8b949e"
  neutral-bg-light: "#fffef2"
  neutral-surface-light: "#ffffff"
  neutral-border-light: "#1a1a1a"
  neutral-text-light: "#1a1a1a"
  neutral-muted-light: "#555555"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.35
  title:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  subtext:
    fontFamily: "Inter, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Space Mono, monospace"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.02em"
  caption:
    fontFamily: "Space Mono, monospace"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.2
  badge:
    fontFamily: "Space Mono, monospace"
    fontSize: "10px"
    fontWeight: 600
    lineHeight: 1.2
  micro:
    fontFamily: "Space Mono, monospace"
    fontSize: "9px"
    fontWeight: 700
    lineHeight: 1.1
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg-dark}"
    rounded: "{rounded.md}"
    padding: "6px 14px"
  button-primary-hover:
    backgroundColor: "{colors.accent-blue}"
  button-secondary:
    backgroundColor: "{colors.neutral-surface-elevated}"
    textColor: "{colors.neutral-text-dark}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  card:
    backgroundColor: "{colors.neutral-surface-dark}"
    rounded: "{rounded.lg}"
    padding: "16px"
---

# Design System: RepoDeck

## Overview

**Creative North Star: "The Terminal Deck"**

RepoDeck is engineered as a high-density, tactile developer cockpit. It rejects decorative SaaS fluff in favor of razor-sharp data presentation, sub-millisecond tactile feedback, and seamless dual-world theming. Every pixel is calibrated for developers triaging hundreds of repositories without visual fatigue.

**Key Characteristics:**
- **Zero-Latency Telemetry**: Live performance and drift badges displayed directly in the viewport.
- **Dual Visual Worlds**: High-contrast GitHub Pro Dark (`#0d1117`) paired with an editorial warm neo-brutalist light mode (`#fffef2`).
- **Tabular Precision**: Monospaced tabular metrics and commit SHAs (`Space Mono`) coupled with punchy geometric navigation headers (`Plus Jakarta Sans`).

## Colors

The color palette uses high-contrast functional signals layered over deeply grounded dark and warm-light neutral surfaces.

### Primary
- **Terminal Green** (`#39d353` / Light: `#2da44e`): Primary status indicator for synced branches, active repositories, and operational health.

### Secondary
- **Electric Blue** (`#58a6ff` / Light: `#0969da`): Highlights interactive links, active tabs, and primary action buttons.
- **Signal Coral** (`#ff7b72` / Light: `#ff6b6b`): High-stakes destructive alerts, behind-drift warnings, and deletion confirmations.

### Tertiary
- **Amber Orange** (`#f0883e` / Light: `#ffcc5c`): Stale drift warnings, warm lifecycle alerts, and token scope cautions.
- **Neural Purple** (`#bc8cff` / Light: `#8250df`): Local ONNX vector embeddings and AI hybrid search indicators.

### Neutral
- **Deck Dark Background** (`#0d1117`): Deep charcoal base canvas for dark mode.
- **Deck Dark Surface** (`#161b22`): Elevated table rows, filter bars, and card containers.
- **Deck Dark Border** (`#30363d`): Crisp 1px structural dividing lines.
- **Deck Warm Light Canvas** (`#fffef2`): Editorial cream base for light mode.
- **Deck Light Border** (`#1a1a1a`): Hard neo-brutalist 1px solid structural border.

### Named Rules
**The Color-as-Data Rule.** Color is never applied merely for decoration. Every hue communicates explicit semantic state: Green for synced/active, Blue for focus/selection, Orange for stale/caution, Coral for drift/danger, and Purple for AI inference.

## Typography

**Display Font:** `Plus Jakarta Sans` (fallback: `system-ui, sans-serif`)
**Body Font:** `Inter` (fallback: `sans-serif`)
**Label/Mono Font:** `Space Mono` (fallback: `ui-monospace, monospace`)

**Character:** Punchy geometric headers anchor the UI, readable body copy supports dense lists, and rigid monospaced numbers align tables and commit hashes without layout shift.

### Hierarchy
- **Display** (Bold 700, 24px / 1.5rem, line-height 1.25): Top-level logo branding and modal banner titles.
- **Headline** (SemiBold 600, 18px / 1.125rem, line-height 1.35): Section headings, drawer titles, and major stat counters.
- **Title** (SemiBold 600, 15px / 0.9375rem, line-height 1.4): Repository card titles, filter section headers.
- **Body** (Regular 400, 14px / 0.875rem, line-height 1.5): Descriptions, tooltips, list item subtitles.
- **Label** (Medium 500, 12px / 0.75rem, line-height 1.2): Telemetry pills, language badges, commit hashes, latency metrics.

### Named Rules
**The Monospace-for-Numbers Rule.** All numeric counters (stars, forks, commit counts, storage bytes, query latencies) must render in `Space Mono` or `tabular-nums` to guarantee vertical alignment in high-density tables.

## Layout

The application spans a full-width container scaling up to `1840px` (eliminating wasted lateral gutters on high-resolution displays). Spacing follows a tight 4px/8px rhythm (`gap-2`, `p-3`, `px-4`).

- **Sticky Navigation Bar**: 60px fixed header holding logo, mode tabs, theme toggle, and GitHub authentication state.
- **2-Tier Filter Matrix**: Sticky upper bar housing full-width search and engine segmented pills; bottom tier housing dropdown filter selectors and view switches.
- **Virtualized Viewport**: Dynamic 52px table rows virtualized via `@tanstack/react-virtual` for constant 60 FPS scrolling.
- **Slide-Over Inspector**: 480px animated right-hand drawer with nested telemetry tabs.

## Elevation & Depth

RepoDeck relies primarily on crisp tonal layering and high-contrast structural borders (1px solid `#30363d` in dark mode, `#1a1a1a` in light mode).

### Shadow Vocabulary
- **Neo-Brutalist Hard Drop** (`box-shadow: 2px 2px 0px #1a1a1a`): Applied in Light Mode on interactive cards, buttons, and active tabs.
- **Subtle Dark Layering** (`box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4)`): Applied on slide-over drawer and modal backdrops.

### Named Rules
**The Flat-By-Default Rule.** Surfaces remain flat and tonal at rest. Elevation is signaled by 1px border contrast and background tone differentiation rather than diffuse blur shadows.

## Shapes

- **Corners**: Tight 4px (`rounded-sm`) for compact badges and inputs, 6px (`rounded-md`) for buttons, 8px (`rounded-lg`) for cards and drawers, and 9999px (`rounded-full`) for status indicator pills.
- **Borders**: Continuous 1px solid structural definition across all cards, table cells, and navigation headers.

## Components

### Buttons
- **Shape**: 6px radius (`rounded-md`).
- **Primary**: Solid background (`#39d353` / `#58a6ff`), dark text, bold tactile padding (`px-3.5 py-1.5`).
- **Secondary / Ghost**: Tonal background (`#21262d`), border `1px solid #30363d`, hover border brightening.

### Chips & Telemetry Pills
- **Style**: 9999px pill radius, compact padding (`px-2 py-0.5`), monospaced 11px/12px font.
- **Variants**: Status pills (`Active`, `Stale`, `Dormant`), Search latency pills (`⚡ 0.8ms`), Drift pills (`3 behind`).

### Cards & Table Rows
- **Card**: 8px radius, border `1px solid #30363d`, inner padding `16px`.
- **Table Row**: 52px fixed height, alternating hover highlight (`hover:bg-[#1c2128]`), selection checkbox column.

### Inputs & Search Bars
- **Search Bar**: 1px solid `#30363d` border, background `#161b22`, focus ring in Electric Blue (`#58a6ff`), integrated keyboard shortcut indicator (`/`).

### Slide-Over Inspector Drawer
- **Right docked**: 480px width, sticky header with close button, animated enter/exit with Motion.

## Do's and Don'ts

### Do:
- **Do** maintain tabular monospace alignment for all numbers and dates.
- **Do** keep table row heights compact (52px) for maximum visible information density.
- **Do** provide instant keyboard shortcuts for navigation and search.
- **Do** confirm destructive portfolio actions with typed repository name checks.

### Don't:
- **Don't** add soft, blurry gradient drop-shadows that degrade technical scanability.
- **Don't** use slow animations; all transitions must complete in under 150ms.
- **Don't** hide critical repository metrics (drift status, license, languages) behind extra clicks.
