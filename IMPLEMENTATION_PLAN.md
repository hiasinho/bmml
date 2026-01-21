# Implementation Plan

## Overview

BMML (Business Model Markup Language) is a YAML-based markup format for describing business models, based on Alexander Osterwalder's Business Model Canvas and Value Proposition Canvas frameworks.

## Current State

| Component | Status | Location |
|-----------|--------|----------|
| Types | Complete | `src/types.ts` (v2 types primary, v1 retained for migration) |
| Validator | Complete | `src/validator.ts` (v2 only) |
| Linter | Complete | `src/linter.ts` (v2 only, 12+ rules) |
| Schema | Complete | `schemas/bmclang-v2.schema.json` |
| CLI | Complete | `src/cli.ts` (validate/lint/migrate commands) |
| Migration | Complete | `src/migrate.ts` (v1→v2 conversion) |
| Test coverage | Complete | 424 tests, all passing |
| Website | Complete | `docs/index.html` |
| Examples | Complete | `examples/` with progressive detail |
| Documentation | Complete | README, MIGRATION.md, CONTRIBUTING.md, EDITOR_SETUP.md |

---

## Critical - BMC Renderer

New feature per `specs/bmc-renderer.md`. Renders BMML files as SVG Business Model Canvas diagrams with color-coded sticky notes.

### Phase 1: Connection Graph (Complete)

- [x] Create `src/render-graph.ts` with `buildConnectionGraph()` function
  - Input: `BMCDocumentV2`, Output: `Map<string, Set<string>>` (element ID → segment IDs)
  - AC: Returns correct segment connections for all entity types
- [x] Implement direct segment connections
  - Customer segments: trivial (each connects to itself)
  - Channels: via `for.customer_segments`
  - Customer relationships: via `for.customer_segments`
  - Revenue streams: via `from.customer_segments`
  - AC: Direct refs correctly resolved
- [x] Implement fit-based connections
  - Fits: via `for.customer_segments` (links VPs to segments)
  - Value propositions: via fits that reference them
  - AC: VPs connected to segments through fits
- [x] Implement transitive connections
  - Key resources/activities: via VPs → fits → segments
  - Key partnerships: via KR/KA → VPs → fits → segments
  - Costs: via KR/KA → VPs → fits → segments
  - AC: Full chain traversal works correctly
- [x] Add tests for connection graph (`test/render-graph.test.ts`)
  - Test direct connections, fit-based, transitive, multi-segment, orphaned elements
  - 31 tests covering all entity types including Airbnb two-sided marketplace pattern
  - AC: All connection scenarios covered

### Phase 2: SVG Generation (Complete)

- [x] Create `src/render-svg.ts` with SVG string generation
  - ViewBox: 1600x1000 with header (60px), footer (30px), main content area
  - 8 segment colors + gray for orphaned elements
  - 58 tests covering all SVG generation functions
  - AC: Generates valid SVG string
- [x] Implement BMC grid layout
  - 5 columns: KP | KA/KR | VP | CR/CH | CS
  - 2 rows: main blocks (75%) + Cost/Revenue (25%)
  - Block proportions per spec
  - AC: Grid matches official Strategyzer layout
- [x] Implement block labels and icons
  - Labels: "Key Partnerships", "Key Activities", etc.
  - Note: Icons deferred - keeping minimal for now
  - AC: All 9 blocks labeled
- [x] Implement sticky note rendering
  - Rectangle with rounded corners (3px), shadow filter
  - Color from connection graph (segment color or gray)
  - Text wrapping (2-3 lines max, 14 chars per line)
  - AC: Sticky notes display entity names with correct colors
- [x] Implement multi-segment stacking
  - Offset stacked stickies (4px right, 4px down per layer)
  - First segment on top, subsequent below
  - AC: Multi-segment elements show stacked notes
- [x] Add canvas header
  - Title: "The Business Model Canvas"
  - Meta fields: name, date
  - AC: Header displays BMML meta info
- [x] Add Strategyzer attribution footer
  - "Copyright Strategyzer AG | The Business Model Canvas | strategyzer.com | CC BY-SA 3.0"
  - AC: Attribution present for CC compliance

### Phase 3: Main Renderer (Complete)

- [x] Create `src/render.ts` with main `render()` function
  - Input: `BMCDocumentV2`, Output: SVG string
  - Coordinates graph building and SVG generation
  - Re-exports useful types/functions for advanced usage
  - AC: End-to-end rendering works
- [x] Add tests for renderer (`test/render.test.ts`)
  - 20 tests covering: minimal, full, marketplace (multi-segment)
  - Tests basic rendering, options, colors, edge cases
  - AC: Renderer produces valid, correct SVGs

### Phase 4: CLI Integration (Complete)

- [x] Add `bmml render <file>` command to CLI
  - Output SVG to stdout by default
  - AC: `bmml render model.bmml` outputs SVG
- [x] Add `--output <path>` / `-o <path>` flag
  - Write SVG to specified file
  - AC: `bmml render model.bmml -o canvas.svg` creates file
- [x] Add CLI tests for render command
  - Test stdout output, file output, error handling
  - 11 tests covering all render scenarios
  - AC: CLI render command fully tested
- [x] Export `render` function from `src/index.ts`
  - AC: Programmatic API available

### Phase 5: Website Integration (Complete)

- [x] Render example SVGs for website
  - Airbnb (two-sided marketplace): `docs/airbnb-canvas.svg`
  - Meal kit (multiple segments): `docs/meal-kit-canvas.svg`
  - AC: Pre-rendered SVGs created
- [x] Add SVG examples to `docs/index.html`
  - New "Visualize" section with rendered canvases
  - Tab switching between Airbnb and FreshBox examples
  - Color-coded legends for each canvas
  - Navigation updated to include Visualize link
  - AC: Website shows rendered BMC examples

---

## High Priority - GitHub Repo Housekeeping

Final polish items for public release.

- [ ] Update GitHub repo description (manual step)
  - Change to: "BMML - Business Model Markup Language"
  - AC: Repo description updated on GitHub
- [x] Add LICENSE file if missing
  - MIT License with Strategyzer attribution in `LICENSE.md`
  - AC: LICENSE file present
- [x] Review and update README.md
  - Added badges (tests, license, node version)
  - Added installation, CLI commands, programmatic API sections
  - Added examples table and links to other docs
  - AC: README reflects current state

---

## Medium Priority - Enhanced Examples

Demonstrate format's power with more real-world examples.

- [x] Create `examples/saas-platform.bmml`
  - TaskFlow SaaS project management platform
  - Two segments: SMB teams and enterprise organizations
  - Different VPs per segment (Team Productivity vs Enterprise Work Management)
  - Full VPC detail with fits and mappings
  - AC: Valid example showing SaaS patterns
- [x] Create `examples/subscription-box.bmml`
  - BeautyBox subscription business model example
  - Shows recurring revenue patterns (monthly, annual, gift subscriptions)
  - Two segments: beauty enthusiasts and gift givers
  - Full VPC detail with fits and mappings
  - AC: Valid example showing subscription model
- [x] Create `examples/freemium.bmml`
  - CloudVault cloud storage freemium model
  - Two segments: free users (5GB) and premium subscribers (2TB)
  - Different VPs per tier with conversion-focused elements
  - Full VPC detail with fits and mappings
  - AC: Valid example showing freemium pattern

---

## Low Priority - Developer Experience

Nice-to-have improvements.

- [x] Add JSON Schema to schemastore.org
  - Submitted PR #5301 to SchemaStore/schemastore: https://github.com/SchemaStore/schemastore/pull/5301
  - Schema copied to `docs/bmclang-v2.schema.json` for GitHub Pages hosting
  - FileMatch patterns: `*.bmml`, `*.bmml.yaml`, `*.bmml.yml`
  - AC: BMML schema available in common editors automatically (pending PR merge)
- [ ] Publish npm package
  - `npm publish` to make CLI globally installable
  - **BLOCKED**: Requires npm account login and publish command
  - **Prep done**: package.json updated with proper dependencies, repository info, and files field
  - AC: `npm install -g bmml` works from npm registry
- [x] Create GitHub Action for BMML validation
  - Created `action.yml` as composite action using Node.js 22 + pnpm
  - Supports glob patterns, validate/lint modes, fail-on-warning option
  - Outputs: valid, files-checked, errors, warnings
  - Added CI workflow (`.github/workflows/ci.yml`) for this repo
  - Documented usage in README.md
  - AC: Reusable action available via `uses: hiasinho/bmml@main`

---

## Backlog - Future Phases

Explicitly out of scope per spec. Track for future consideration.

| Feature | Notes |
|---------|-------|
| Environment Map | Market forces, trends, macro factors |
| Hypotheses & Evidence | Testing assumptions with data |
| Patterns | Freemium, Platform, Marketplace templates |
| Market type classification | B2B, B2C, C2C, B2G |
| Confidence scores | Computed from evidence |
| Rich pivot history | Beyond `derived_from` lineage |
| Multi-canvas support | Multi-sided platforms |
| Job addressers in v2 | Consider `ja-*` prefix for jobs |
| VPC visualization | Separate Value Proposition Canvas SVG |
| Fit visualization | Mapping lines between profile and map |
| Interactive features | Clickable SVG elements |
| Export formats | HTML, JPG, PDF output |
| Custom themes | User-defined color palettes |

---

## Reference

### ID Prefix Reference

| Prefix | Entity | New in v2? |
|--------|--------|------------|
| `cs-` | Customer Segment | |
| `vp-` | Value Proposition | |
| `ps-` | Product/Service | |
| `pr-` | Pain Reliever | Yes |
| `gc-` | Gain Creator | Yes |
| `job-` | Job to be Done | |
| `pain-` | Pain | |
| `gain-` | Gain | |
| `fit-` | Fit | |
| `ch-` | Channel | |
| `cr-` | Customer Relationship | |
| `rs-` | Revenue Stream | |
| `kr-` | Key Resource | |
| `ka-` | Key Activity | |
| `kp-` | Key Partnership | |
| `cost-` | Cost | Yes |

### v2 Relationship Summary

| Entity | `for:` sub-keys | `from:` sub-keys |
|--------|-----------------|------------------|
| fits | value_propositions, customer_segments | - |
| channels | value_propositions, customer_segments | - |
| customer_relationships | customer_segments | - |
| revenue_streams | value_propositions | customer_segments |
| key_resources | value_propositions | - |
| key_activities | value_propositions | - |
| key_partnerships | key_resources, key_activities | - |
| costs | key_resources, key_activities | - |

### Renderer Color Palette

| Segment | Color |
|---------|-------|
| 1 | #FFE066 (yellow) |
| 2 | #7EC8E3 (blue) |
| 3 | #98D8AA (green) |
| 4 | #FFB366 (orange) |
| 5 | #DDA0DD (plum) |
| 6 | #87CEEB (sky blue) |
| 7 | #F0E68C (khaki) |
| 8 | #DEB887 (burlywood) |
| Orphaned | #CCCCCC (gray) |

### Implementation Order

```
Current State (Complete)
         │
         ▼
┌─────────────────┐
│  BMC Renderer   │ ← Critical (5 phases)
│  (src/render*)  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌───▼───┐
│GitHub │ │ More  │
│Housekp│ │Examples│
└───────┘ └───────┘
```

---

## Notes

### Discoveries from Codebase Exploration

1. **v2 Migration Complete**: All core v2 work (schema, types, validator, linter, migration, CLI) is done with 304 passing tests.

2. **Website Live**: `docs/index.html` has a polished design with FAQ, examples, and installation instructions.

3. **No Renderer Yet**: `src/render*.ts` files don't exist - this is the main new feature to build.

4. **Progressive Examples**: `examples/progressive/` demonstrates the optional VPC detail concept well.

5. **v1 Types Retained**: v1 types kept in `src/types.ts` because migration tool needs them to parse v1 input.

6. **npm Package Prep Complete**: package.json now ready for publish - runtime deps (ajv, ajv-formats, js-yaml) moved from devDependencies to dependencies, added repository/homepage/bugs URLs, files field, and author.

### Open Questions

1. Should block labels include element count? (e.g., "Key Partners (3)")
2. Include block icons or keep minimal?
3. Slight sticky note rotation for organic feel, or perfectly aligned?
4. Should orphaned elements be rendered at all, or flagged as warnings?
