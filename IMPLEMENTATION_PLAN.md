# Implementation Plan

## Overview

BMCLang (to be renamed **BMML** - Business Model Markup Language) is a YAML-based markup format for describing business models. This plan covers the v2 migration and enhancements.

## Current State (v1 MVP - COMPLETE)

| Component | Status | Location |
|-----------|--------|----------|
| Types | Complete | `src/types.ts` (~480 lines) |
| Validator | Complete | `src/validator.ts` |
| Linter | Complete | `src/linter.ts` (12 rules) |
| Schema | Complete | `schemas/bmclang.schema.json` (702 lines) |
| CLI | Complete | `src/cli.ts` |
| Test fixtures | 5 fixtures (2 valid, 3 invalid) |
| Examples | 5 comprehensive examples |
| VS Code extension | Complete | `vscode-bmclang/` |
| Test coverage | 95 tests, all passing |

---

## Critical - Renaming (BMCLang → BMML)

Per v2 spec: rename the project from BMCLang to BMML.

- [x] Update `package.json` name field to "bmml"
  - AC: `npm pack` produces `bmml-x.x.x.tgz`
  - Done: package.json name changed from "bmclang" to "bmml", verified with pnpm pack
- [x] Update CLI binary name from `bmclang` to `bmml`
  - AC: `npx bmml validate file.bmml` works
  - Done: Updated package.json bin field, CLI usage/help messages, and test assertions
- [ ] Update all README and documentation references
  - AC: No references to "BMCLang" remain (except historical notes)
- [ ] Update VS Code extension name and ID
  - AC: Extension marketplace ID becomes `bmml`
- [ ] Update GitHub repo description (manual step)

---

## Critical - v2 Schema Foundation

Foundation for all v2 work. Must complete before types/validator/linter.

### Phase 1: Base Schema Setup

- [ ] Create `schemas/bmclang-v2.schema.json` with meta and version
  - Copy base structure from v1 schema
  - Set `$id`: `https://bmclang.dev/schemas/bmclang-v2.schema.json`
  - AC: Empty document (just version + meta) validates, missing meta fails

### Phase 2: Customer Side Schema

- [ ] Define `customer_segments` with optional nested profile
  - `jobs`, `pains`, `gains` arrays as optional properties
  - AC: Segment without profile validates, segment with profile validates
- [ ] Add ID pattern definitions for profile elements
  - `job-[a-z0-9-]+`, `pain-[a-z0-9-]+`, `gain-[a-z0-9-]+`
  - AC: `job-healthy` valid, `job_healthy` invalid

### Phase 3: Value Side Schema

- [ ] Define `value_propositions` with full Value Map
  - `products_services`, `pain_relievers`, `gain_creators` as optional nested arrays
  - AC: VP without value map validates, VP with full map validates
- [ ] Add new ID patterns for v2 entities
  - `pr-[a-z0-9-]+` (pain reliever), `gc-[a-z0-9-]+` (gain creator)
  - AC: `pr-time-saver` valid, `reliever-time` invalid

### Phase 4: Fit Schema (v2 Pattern)

- [ ] Define `fits` with `for:` typed sub-keys pattern
  - `for: { value_propositions: [], customer_segments: [] }`
  - AC: v1 fit structure (with `value_proposition: vp-x`) rejected
- [ ] Add tuple array mappings definition
  - `mappings: [[string, string], ...]`
  - AC: `mappings: [[pr-x, pain-y]]` valid, `mappings: [pr-x, pain-y]` invalid

### Phase 5: Delivery Schema (Channels, Relationships)

- [ ] Define `channels` with dual `for:` sub-keys
  - `for: { value_propositions: [], customer_segments: [] }`
  - AC: Channel referencing both VP and CS validates
- [ ] Define `customer_relationships` with `for:` pattern
  - `for: { customer_segments: [] }`
  - AC: Consistent with other v2 entities

### Phase 6: Capture Schema (Revenue)

- [ ] Define `revenue_streams` with `for:` and `from:` patterns
  - `from: { customer_segments: [] }` (who pays)
  - `for: { value_propositions: [] }` (what for)
  - AC: Bidirectional relationship correctly expressed

### Phase 7: Infrastructure Schema

- [ ] Define `key_resources` with `for:` pattern
  - `for: { value_propositions: [] }`
  - AC: Resources linked to VPs validate
- [ ] Define `key_activities` with `for:` pattern
  - `for: { value_propositions: [] }`
  - AC: Activities linked to VPs validate
- [ ] Define `key_partnerships` with `for:` pattern
  - `for: { key_resources: [], key_activities: [] }`
  - AC: Partnerships linked to resources/activities validate
- [ ] Define `costs` array (replaces `cost_structure`)
  - New `cost-[a-z0-9-]+` ID prefix
  - `for: { key_resources: [], key_activities: [] }`
  - AC: v1 `cost_structure` object rejected, v2 `costs` array accepted

### Phase 8: Schema Cleanup

- [ ] Remove all `type` field requirements from entities
  - No `type` on jobs, products_services, channels, etc.
  - AC: Files without type fields validate successfully
- [ ] Final schema review and ID pattern consistency check
  - AC: All 17 ID prefixes validated consistently

---

## Critical - v2 TypeScript Types

Depends on: v2 Schema Phases 1-8 complete

### New Type Definitions

- [ ] Add `PainReliever` interface (v2)
  - `{ id: PainRelieverId; name: string; }`
  - AC: Interface exported from `src/types.ts`
- [ ] Add `GainCreator` interface (v2)
  - `{ id: GainCreatorId; name: string; }`
  - AC: Interface exported from `src/types.ts`
- [ ] Add `ForRelation` generic interface
  ```typescript
  interface ForRelation {
    value_propositions?: ValuePropositionId[];
    customer_segments?: CustomerSegmentId[];
    key_resources?: KeyResourceId[];
    key_activities?: KeyActivityId[];
  }
  ```
  - AC: Compiles, used by updated entity interfaces
- [ ] Add `FromRelation` interface
  ```typescript
  interface FromRelation {
    customer_segments?: CustomerSegmentId[];
  }
  ```
  - AC: Compiles, used by RevenueStream interface
- [ ] Add `Cost` interface (v2, replaces MajorCost)
  - `{ id: CostId; name: string; for: ForRelation; }`
  - AC: Interface exported, MajorCost marked deprecated

### Type ID Aliases and Guards

- [ ] Add `PainRelieverId` type alias with `pr-` pattern
  - AC: `isPainRelieverId('pr-time')` returns true
- [ ] Add `GainCreatorId` type alias with `gc-` pattern
  - AC: `isGainCreatorId('gc-variety')` returns true
- [ ] Add `CostId` type alias with `cost-` pattern
  - AC: `isCostId('cost-ingredients')` returns true

### Updated Entity Interfaces

- [ ] Update `ValueProposition` interface
  - Add optional `pain_relievers: PainReliever[]`
  - Add optional `gain_creators: GainCreator[]`
  - AC: VP with value map compiles correctly
- [ ] Update `Fit` interface for v2 pattern
  - Replace `value_proposition` + `customer_segment` with `for: ForRelation`
  - Add `mappings: [string, string][]` tuple array
  - AC: v2 fit structure type-checks correctly
- [ ] Update `Channel` interface for v2 pattern
  - Replace `segments` with `for: ForRelation`
  - AC: Channel with dual refs compiles
- [ ] Update `CustomerRelationship` interface
  - Replace `segment` with `for: ForRelation`
  - AC: Consistent with v2 pattern
- [ ] Update `RevenueStream` interface
  - Replace `from_segments` with `from: FromRelation`
  - Replace `for_value` with `for: ForRelation`
  - AC: Bidirectional refs compile
- [ ] Update `KeyResource` interface
  - Replace `for_value` with `for: ForRelation`
  - AC: Consistent pattern
- [ ] Update `KeyActivity` interface
  - Replace `for_value` with `for: ForRelation`
  - AC: Consistent pattern
- [ ] Update `KeyPartnership` interface
  - Replace `provides` with `for: ForRelation`
  - AC: Partners ref resources/activities via `for`

### Type Cleanup

- [ ] Remove or deprecate v1-only type enums (if type fields removed)
  - AC: No compilation errors, deprecated enums marked
- [ ] Export all v2 types from `src/index.ts`
  - AC: All new types importable from package

---

## Critical - v2 Validator

Depends on: v2 Schema + v2 Types complete

- [ ] Add version/structure detection logic
  - Detect v1 vs v2 by presence of `for:`/`from:` patterns
  - AC: v1 file detected as v1, v2 file detected as v2
- [ ] Load appropriate schema based on detected version
  - v1 files use `bmclang.schema.json`
  - v2 files use `bmclang-v2.schema.json`
  - AC: Both v1 and v2 files validate against correct schemas
- [ ] Add tuple mapping format validation
  - Each tuple must be `[string, string]` with valid prefixes
  - AC: `[[pr-x, pain-y]]` valid, `[pr-x, pain-y]` invalid (missing nesting)
- [ ] Add `for:`/`from:` structural validation
  - Sub-keys must match allowed entity types
  - AC: `for: { invalid_key: [] }` rejected

---

## Critical - v2 Linter

Depends on: v2 Types complete

### Updated Reference Rules

- [ ] Update `fit-value-proposition-ref` for `for:` pattern
  - Check `fits[].for.value_propositions[]` refs exist
  - AC: Missing VP ref produces error
- [ ] Update `fit-customer-segment-ref` for `for:` pattern
  - Check `fits[].for.customer_segments[]` refs exist
  - AC: Missing CS ref produces error
- [ ] Update fit mapping validation for tuple format
  - Each tuple `[left, right]` where prefixes must be compatible
  - AC: `[pr-x, pain-y]` valid, `[pr-x, gain-y]` produces type mismatch error
- [ ] Update `channel-segment-ref` for `for:` pattern
  - Check `channels[].for.customer_segments[]` exist
  - AC: Missing segment ref produces error
- [ ] Update `channel-value-ref` (new) for ternary pattern
  - Check `channels[].for.value_propositions[]` exist
  - AC: Missing VP ref produces error
- [ ] Update `customer-relationship-segment-ref` for `for:` pattern
  - AC: Consistent error messages
- [ ] Update `revenue-stream-segment-ref` for `from:` pattern
  - Check `revenue_streams[].from.customer_segments[]` exist
- [ ] Update `revenue-stream-value-ref` for `for:` pattern
  - Check `revenue_streams[].for.value_propositions[]` exist
- [ ] Update `key-resource-value-ref` for `for:` pattern
- [ ] Update `key-activity-value-ref` for `for:` pattern
- [ ] Update `key-partnership-provides-ref` for `for:` pattern
  - Check `key_partnerships[].for.key_resources[]` and `key_activities[]`
- [ ] Update `cost-linked-to-ref` for v2 `costs` array
  - Check `costs[].for.key_resources[]` and `key_activities[]`

### New Reference Rules (v2 Specific)

- [ ] Add `pain-reliever-scope-ref` rule
  - `pr-*` refs in fit mappings must exist in linked VP's value map
  - AC: `pr-time` in fit must exist in `vp-convenience.pain_relievers`
- [ ] Add `gain-creator-scope-ref` rule
  - `gc-*` refs in fit mappings must exist in linked VP's value map
  - AC: `gc-variety` in fit must exist in `vp-convenience.gain_creators`
- [ ] Add `fit-mapping-type-inference` validation
  - `[pr-*, pain-*]` = pain relief (valid)
  - `[gc-*, gain-*]` = gain creation (valid)
  - `[pr-*, gain-*]` = error (type mismatch)
  - AC: Mismatched tuple types produce clear error message

---

## High Priority - v2 Test Fixtures

Depends on: v2 Schema complete

- [ ] Create `test/fixtures/valid-v2-minimal.bmml`
  - BMC only, no VPC detail (no jobs/pains/gains/fits)
  - All 9 blocks with `for:`/`from:` patterns
  - AC: Validates against v2 schema, linter passes
- [ ] Create `test/fixtures/valid-v2-complete.bmml`
  - Full BMC + VPC with customer profiles, value maps, and fits
  - Tuple mappings demonstrating pain relief and gain creation
  - AC: Validates, linter passes, demonstrates all v2 features
- [ ] Create `test/fixtures/invalid-v2-tuple-format.bmml`
  - Invalid tuple structures: missing nesting, wrong array depth
  - AC: Validator rejects with clear error
- [ ] Create `test/fixtures/invalid-v2-scope-refs.bmml`
  - Pain reliever/gain creator refs outside their VP scope
  - AC: Linter produces scope reference errors
- [ ] Create `test/fixtures/invalid-v2-type-mismatch.bmml`
  - Fit mapping with `[pr-*, gain-*]` (type mismatch)
  - AC: Linter produces type mismatch error
- [ ] Update test suite to run both v1 and v2 fixtures
  - AC: All existing v1 tests still pass, all new v2 tests pass

---

## High Priority - Migration Tooling

Depends on: v2 Validator complete

### Core Migration Logic

- [ ] Create `src/migrate.ts` with `migrateV1toV2()` function
  - Input: v1 YAML string, Output: v2 YAML string
  - AC: Function exported, basic structure in place
- [ ] Implement relationship pattern conversion
  - `for_value` → `for: { value_propositions: [] }`
  - `from_segments` → `from: { customer_segments: [] }`
  - `segments` → `for: { customer_segments: [] }`
  - `provides` → `for: { key_resources: [], key_activities: [] }`
  - AC: All v1 relationship patterns converted
- [ ] Implement pain_relievers/gain_creators migration
  - Move from `fits[].pain_relievers` to `value_propositions[].pain_relievers`
  - Group by VP reference in fit
  - Generate new `pr-*` and `gc-*` IDs
  - AC: Pain relievers correctly grouped under their VPs
- [ ] Implement fit mapping transformation
  - Convert verbose objects `{ pain: pain-x, through: [ps-y] }` to tuple `[pr-generated, pain-x]`
  - Link to newly created pain_relievers
  - AC: Fit mappings are valid tuples referencing valid entities
- [ ] Implement `cost_structure` → `costs` conversion
  - Convert `major_costs` array to top-level `costs` array
  - Generate `cost-*` IDs
  - Convert `linked_to` to `for:` pattern
  - AC: v1 cost_structure becomes valid v2 costs array
- [ ] Implement `type` field removal
  - Strip all `type` fields from all entities
  - AC: No type fields in output

### CLI Integration

- [ ] Add `bmml migrate <file>` command to CLI
  - AC: `bmml migrate example.bmml` outputs migrated content
- [ ] Add `--dry-run` flag (output to stdout, don't modify)
  - AC: Original file unchanged, migrated content printed
- [ ] Add `--in-place` flag (modify file directly)
  - AC: File updated in place
- [ ] Add migration validation (run v2 validator on output)
  - AC: Invalid migration output produces error, not silent corruption

### Migration Tests

- [ ] Create `test/fixtures/migrate/` directory structure
- [ ] Add before/after pairs for relationship pattern migration
- [ ] Add before/after pairs for pain_relievers/gain_creators migration
- [ ] Add before/after pairs for fit mapping migration
- [ ] Add before/after pairs for cost_structure migration
- [ ] Add test: round-trip validation (v1 → migrate → v2 validate)
  - AC: All existing v1 examples can be migrated and validate as v2

---

## High Priority - Example Updates

Depends on: v2 Schema + Migration Tooling

- [ ] Create `examples/v2/meal-kit-minimal.bmml`
  - BMC without VPC detail
  - Demonstrates progressive detail (start simple)
  - AC: Validates as v2, serves as minimal example
- [ ] Create `examples/v2/meal-kit-full.bmml`
  - Full BMC + VPC with fits and tuple mappings
  - Same business as minimal, more detail
  - AC: Validates as v2, demonstrates all features
- [ ] Create `examples/v2/marketplace.bmml`
  - Two-sided marketplace demonstrating multi-segment channels
  - AC: Shows ternary relationship pattern
- [ ] Migrate existing v1 examples to v2
  - Option: Move v1 to `examples/v1/`, create fresh v2 in `examples/`
  - AC: Clear distinction between v1 and v2 examples
- [ ] Add progressive detail example set
  - 4 files showing same business: minimal → +profiles → +valuemaps → +fits
  - AC: Demonstrates optional VPC detail concept

---

## Medium Priority - Enhanced Linter Rules

Quality-of-life improvements. Lower priority than core v2 migration.

### Coverage Warnings (Non-blocking)

- [ ] Warning: Customer segment has no fits defined
  - AC: Warning produced, validation still passes
- [ ] Warning: Value proposition has no fits defined
- [ ] Warning: Pain defined but never relieved (no mapping references it)
- [ ] Warning: Gain defined but never created (no mapping references it)
- [ ] Warning: Job defined but never addressed (no mapping references it)
- [ ] Warning: Product/service defined but never used in fit mapping

### Portfolio Hints

- [ ] Info: Explore portfolio should have fits to validate desirability
- [ ] Info: Exploit portfolio should have revenue streams defined

### Data Quality

- [ ] Warning: Duplicate ID detected (same ID used twice across sections)
  - AC: `cs-busy` used twice produces warning

---

## Medium Priority - Website Redesign

Can be done in parallel with other work.

### Design & Layout

- [ ] Study `ghuntley/cursed-website` for design patterns (via GitHub MCP)
- [ ] Create new `docs/index.html` with bold gradient design
- [ ] Fixed navigation header
- [ ] Mobile responsive layout

### Content Sections

- [ ] Hero section: BMML name, tagline, CTA buttons (GitHub, Get Started)
- [ ] Code example: v2 syntax highlighted (minimal + full)
- [ ] What is BMC/VPC: Visual block representation
- [ ] Examples gallery: Links to example files
- [ ] Installation: CLI commands, VS Code extension link
- [ ] Roadmap/WIP status: Clear progress indicator
- [ ] FAQ accordion with all required questions
- [ ] Footer: GitHub, spec link, license, Made by Hiasinho

### Required FAQ Content

- What is BMML?
- Who made this? (Hiasinho, https://hia.sh)
- Is this official/approved by Osterwalder? (No - independent project)
- What's the goal?
- How can I contribute?
- Is this a commercial project? (No - open source)

---

## Low Priority - Developer Experience

- [ ] Update VS Code extension for v2 keywords (`for:`, `from:`, `pr-*`, `gc-*`, `cost-*`)
- [ ] Add TextMate grammar rules for tuple syntax highlighting
- [ ] Create Neovim TreeSitter grammar
- [ ] Add autocomplete snippets for common v2 patterns

---

## Low Priority - Documentation

- [ ] Create CONTRIBUTING.md with development setup
- [ ] Document v1→v2 migration process
- [ ] Add inline comments to v2 schema explaining design decisions
- [ ] Create v1 vs v2 comparison table

---

## Backlog - Future Phases

Explicitly out of scope per spec.

| Feature | Notes |
|---------|-------|
| Environment Map | Market forces, trends, macro factors |
| Hypotheses & Evidence | Testing assumptions with data |
| Patterns | Freemium, Platform, Marketplace templates |
| Market type classification | B2B, B2C, C2C, B2G |
| Confidence scores | Computed from evidence |
| Rich pivot history | Beyond `derived_from` lineage |
| Multi-canvas support | Multi-sided platforms |
| Job addressers in v2 | Consider `ja-*` prefix for jobs (currently pain/gain only) |

---

## Reference

### v2 Design Principles

1. **Symmetry** - Customer Profile in segments, full Value Map in propositions
2. **Consistency** - All relationships use `for:` and `from:` with typed sub-keys
3. **Optionality** - VPC detail optional; BMC works standalone

### v2 Tuple Mapping Rules

```yaml
mappings:
  - [pr-time, pain-time]      # pain reliever → pain
  - [gc-variety, gain-variety] # gain creator → gain
```

Type inference from ID prefixes:
- `pr-*` with `pain-*` = pain relief
- `gc-*` with `gain-*` = gain creation
- `ja-*` with `job-*` = job addressing (if added)

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

### Relationship Summary (v2)

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

### Open Questions

1. Should job addressers (`ja-*`) be included in v2 value map?
2. How to handle mixed v1/v2 files during migration period?
3. Should we support explicit `version: "2.0"` field or detect structure automatically?

### Implementation Order

```
┌─────────────────┐
│    Renaming     │ ← First (branding)
└────────┬────────┘
         │
┌────────▼────────┐
│   v2 Schema     │ ← Foundation (8 phases)
└────────┬────────┘
         │
┌────────▼────────┐
│   v2 Types      │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌───▼───┐
│Valid- │ │Linter │
│ator   │ │       │
└───┬───┘ └───┬───┘
    │         │
    └────┬────┘
         │
┌────────▼────────┐
│  Test Fixtures  │
└────────┬────────┘
         │
┌────────▼────────┐
│ Migration Tool  │
└────────┬────────┘
         │
┌────────▼────────┐
│    Examples     │
└─────────────────┘
```

Website and enhanced linting can be done in parallel with any phase.
