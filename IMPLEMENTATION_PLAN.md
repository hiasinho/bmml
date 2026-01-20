# Implementation Plan

## Overview

BMCLang (to be renamed **BMML** - Business Model Markup Language) is a YAML-based markup format for describing business models. This plan covers the v2 migration and enhancements.

## Current State (v2 - ACTIVE)

| Component | Status | Location |
|-----------|--------|----------|
| Types | Complete | `src/types.ts` (v2 types primary, v1 retained for migration) |
| Validator | Complete | `src/validator.ts` (v2 only) |
| Linter | Complete | `src/linter.ts` (v2 only, 12+ rules) |
| Schema | Complete | `schemas/bmclang-v2.schema.json` |
| CLI | Complete | `src/cli.ts` (validate/lint v2 only, migrate v1→v2) |
| Migration | Complete | `src/migrate.ts` (v1→v2 conversion) |
| Test fixtures | v2 fixtures in `test/fixtures/`, migration fixtures in `test/fixtures/migrate/` |
| Examples | v2 examples in `examples/` |
| VS Code extension | Removed | Use YAML extension with JSON Schema (see EDITOR_SETUP.md) |
| Test coverage | 304 tests, all passing |

---

## Critical - Renaming (BMCLang → BMML)

Per v2 spec: rename the project from BMCLang to BMML.

- [x] Update `package.json` name field to "bmml"
  - AC: `npm pack` produces `bmml-x.x.x.tgz`
  - Done: package.json name changed from "bmclang" to "bmml", verified with pnpm pack
- [x] Update CLI binary name from `bmclang` to `bmml`
  - AC: `npx bmml validate file.bmml` works
  - Done: Updated package.json bin field, CLI usage/help messages, and test assertions
- [x] Update all README and documentation references
  - AC: No references to "BMCLang" remain (except historical notes)
  - Done: Updated AGENTS.md, EDITOR_SETUP.md, README.md, STYLE.md, vscode-bmml/README.md
- [x] Update VS Code extension name and ID
  - AC: Extension marketplace ID becomes `bmml`
  - Done: Renamed extension to bmml (name, displayName, publisher, language ID, scopeName), renamed folder to vscode-bmml, renamed grammar to bmml.tmLanguage.json, renamed icon to bmml.svg, updated all documentation references
- [ ] Update GitHub repo description (manual step)

---

## Critical - v2 Schema Foundation

Foundation for all v2 work. Must complete before types/validator/linter.

### Phase 1: Base Schema Setup

- [x] Create `schemas/bmclang-v2.schema.json` with meta and version
  - Copy base structure from v1 schema
  - Set `$id`: `https://bmclang.dev/schemas/bmclang-v2.schema.json`
  - AC: Empty document (just version + meta) validates, missing meta fails
  - Done: Created full v2 schema with all entity definitions, `for:`/`from:` patterns, tuple mappings for fits, and costs array. Updated validator to support version parameter. Added 28 comprehensive tests covering all phases.

### Phase 2: Customer Side Schema

- [x] Define `customer_segments` with optional nested profile
  - `jobs`, `pains`, `gains` arrays as optional properties
  - AC: Segment without profile validates, segment with profile validates
  - Done: Included in Phase 1 schema creation
- [x] Add ID pattern definitions for profile elements
  - `job-[a-z0-9-]+`, `pain-[a-z0-9-]+`, `gain-[a-z0-9-]+`
  - AC: `job-healthy` valid, `job_healthy` invalid
  - Done: Included in Phase 1 schema creation, tests verify patterns

### Phase 3: Value Side Schema

- [x] Define `value_propositions` with full Value Map
  - `products_services`, `pain_relievers`, `gain_creators` as optional nested arrays
  - AC: VP without value map validates, VP with full map validates
  - Done: Included in Phase 1 schema creation
- [x] Add new ID patterns for v2 entities
  - `pr-[a-z0-9-]+` (pain reliever), `gc-[a-z0-9-]+` (gain creator)
  - AC: `pr-time-saver` valid, `reliever-time` invalid
  - Done: Included in Phase 1 schema creation, tests verify patterns

### Phase 4: Fit Schema (v2 Pattern)

- [x] Define `fits` with `for:` typed sub-keys pattern
  - `for: { value_propositions: [], customer_segments: [] }`
  - AC: v1 fit structure (with `value_proposition: vp-x`) rejected
  - Done: Included in Phase 1 schema creation, tests verify rejection of v1 pattern
- [x] Add tuple array mappings definition
  - `mappings: [[string, string], ...]`
  - AC: `mappings: [[pr-x, pain-y]]` valid, `mappings: [pr-x, pain-y]` invalid
  - Done: Included in Phase 1 schema creation, tests verify tuple format

### Phase 5: Delivery Schema (Channels, Relationships)

- [x] Define `channels` with dual `for:` sub-keys
  - `for: { value_propositions: [], customer_segments: [] }`
  - AC: Channel referencing both VP and CS validates
  - Done: Included in Phase 1 schema creation
- [x] Define `customer_relationships` with `for:` pattern
  - `for: { customer_segments: [] }`
  - AC: Consistent with other v2 entities
  - Done: Included in Phase 1 schema creation

### Phase 6: Capture Schema (Revenue)

- [x] Define `revenue_streams` with `for:` and `from:` patterns
  - `from: { customer_segments: [] }` (who pays)
  - `for: { value_propositions: [] }` (what for)
  - AC: Bidirectional relationship correctly expressed
  - Done: Included in Phase 1 schema creation

### Phase 7: Infrastructure Schema

- [x] Define `key_resources` with `for:` pattern
  - `for: { value_propositions: [] }`
  - AC: Resources linked to VPs validate
  - Done: Included in Phase 1 schema creation
- [x] Define `key_activities` with `for:` pattern
  - `for: { value_propositions: [] }`
  - AC: Activities linked to VPs validate
  - Done: Included in Phase 1 schema creation
- [x] Define `key_partnerships` with `for:` pattern
  - `for: { key_resources: [], key_activities: [] }`
  - AC: Partnerships linked to resources/activities validate
  - Done: Included in Phase 1 schema creation
- [x] Define `costs` array (replaces `cost_structure`)
  - New `cost-[a-z0-9-]+` ID prefix
  - `for: { key_resources: [], key_activities: [] }`
  - AC: v1 `cost_structure` object rejected, v2 `costs` array accepted
  - Done: Included in Phase 1 schema creation, tests verify rejection of v1 cost_structure

### Phase 8: Schema Cleanup

- [x] Remove all `type` field requirements from entities
  - No `type` on jobs, products_services, channels, etc.
  - AC: Files without type fields validate successfully
  - Done: v2 schema has no type fields on any entities (unlike v1)
- [x] Final schema review and ID pattern consistency check
  - AC: All 17 ID prefixes validated consistently
  - Done: All ID patterns defined in v2 schema, tests verify patterns work

---

## Critical - v2 TypeScript Types

Depends on: v2 Schema Phases 1-8 complete

### New Type Definitions

- [x] Add `PainReliever` interface (v2)
  - `{ id: PainRelieverId; name: string; }`
  - AC: Interface exported from `src/types.ts`
  - Done: Added as `PainRelieverV2` interface to avoid conflict with v1 interface
- [x] Add `GainCreator` interface (v2)
  - `{ id: GainCreatorId; name: string; }`
  - AC: Interface exported from `src/types.ts`
  - Done: Added as `GainCreatorV2` interface to avoid conflict with v1 interface
- [x] Add `ForRelation` generic interface
  ```typescript
  interface ForRelation {
    value_propositions?: ValuePropositionId[];
    customer_segments?: CustomerSegmentId[];
    key_resources?: KeyResourceId[];
    key_activities?: KeyActivityId[];
  }
  ```
  - AC: Compiles, used by updated entity interfaces
  - Done: Added to src/types.ts
- [x] Add `FromRelation` interface
  ```typescript
  interface FromRelation {
    customer_segments?: CustomerSegmentId[];
  }
  ```
  - AC: Compiles, used by RevenueStream interface
  - Done: Added to src/types.ts
- [x] Add `Cost` interface (v2, replaces MajorCost)
  - `{ id: CostId; name: string; for: ForRelation; }`
  - AC: Interface exported, MajorCost marked deprecated
  - Done: Added `Cost` interface. v1 `MajorCost` retained for backwards compatibility.

### Type ID Aliases and Guards

- [x] Add `PainRelieverId` type alias with `pr-` pattern
  - AC: `isPainRelieverId('pr-time')` returns true
  - Done: Added type alias and type guard function with tests
- [x] Add `GainCreatorId` type alias with `gc-` pattern
  - AC: `isGainCreatorId('gc-variety')` returns true
  - Done: Added type alias and type guard function with tests
- [x] Add `CostId` type alias with `cost-` pattern
  - AC: `isCostId('cost-ingredients')` returns true
  - Done: Added type alias and type guard function with tests

### Updated Entity Interfaces

- [x] Update `ValueProposition` interface
  - Add optional `pain_relievers: PainReliever[]`
  - Add optional `gain_creators: GainCreator[]`
  - AC: VP with value map compiles correctly
  - Done: Added `ValuePropositionV2` with pain_relievers and gain_creators
- [x] Update `Fit` interface for v2 pattern
  - Replace `value_proposition` + `customer_segment` with `for: ForRelation`
  - Add `mappings: [string, string][]` tuple array
  - AC: v2 fit structure type-checks correctly
  - Done: Added `FitV2` with `for` pattern and `FitMapping` tuple type
- [x] Update `Channel` interface for v2 pattern
  - Replace `segments` with `for: ForRelation`
  - AC: Channel with dual refs compiles
  - Done: Added `ChannelV2` with `for` pattern
- [x] Update `CustomerRelationship` interface
  - Replace `segment` with `for: ForRelation`
  - AC: Consistent with v2 pattern
  - Done: Added `CustomerRelationshipV2` with `for` pattern
- [x] Update `RevenueStream` interface
  - Replace `from_segments` with `from: FromRelation`
  - Replace `for_value` with `for: ForRelation`
  - AC: Bidirectional refs compile
  - Done: Added `RevenueStreamV2` with both `for` and `from` patterns
- [x] Update `KeyResource` interface
  - Replace `for_value` with `for: ForRelation`
  - AC: Consistent pattern
  - Done: Added `KeyResourceV2` with `for` pattern
- [x] Update `KeyActivity` interface
  - Replace `for_value` with `for: ForRelation`
  - AC: Consistent pattern
  - Done: Added `KeyActivityV2` with `for` pattern
- [x] Update `KeyPartnership` interface
  - Replace `provides` with `for: ForRelation`
  - AC: Partners ref resources/activities via `for`
  - Done: Added `KeyPartnershipV2` with `for` pattern

### Type Cleanup

- [x] Remove or deprecate v1-only type enums (if type fields removed)
  - AC: No compilation errors, deprecated enums marked
  - Done: v1 types retained for backwards compatibility; v2 types added alongside (JobV2, PainV2, GainV2, ProductServiceV2, etc. without type/level fields)
- [x] Export all v2 types from `src/index.ts`
  - AC: All new types importable from package
  - Done: All v2 types auto-exported via `export * from './types.js'`

---

## Critical - v2 Validator

Depends on: v2 Schema + v2 Types complete

- [x] Add version/structure detection logic
  - Detect v1 vs v2 by presence of `for:`/`from:` patterns
  - AC: v1 file detected as v1, v2 file detected as v2
  - Done: Added `detectVersion()` function that checks explicit version field first, then falls back to structural detection (checks fits, channels, customer_relationships, revenue_streams, key_resources, key_partnerships, costs patterns). Also added `validateAuto()`, `validateDocumentAuto()`, and `validateFileAuto()` functions that auto-detect and validate.
- [x] Load appropriate schema based on detected version
  - v1 files use `bmclang.schema.json`
  - v2 files use `bmclang-v2.schema.json`
  - AC: Both v1 and v2 files validate against correct schemas
  - Done: Auto-validation functions use detected version to load appropriate schema. Added 44 tests covering version detection and auto-validation.
- [x] Add tuple mapping format validation
  - Each tuple must be `[string, string]` with valid prefixes
  - AC: `[[pr-x, pain-y]]` valid, `[pr-x, pain-y]` invalid (missing nesting)
  - Done: Already enforced by v2 JSON Schema (`mappings` array of arrays with minItems/maxItems: 2). Prefix semantic validation (e.g., pr-* must pair with pain-*) is a linter concern covered in v2 Linter section.
- [x] Add `for:`/`from:` structural validation
  - Sub-keys must match allowed entity types
  - AC: `for: { invalid_key: [] }` rejected
  - Done: Already enforced by v2 JSON Schema with `additionalProperties: false` on ForRelation and FromRelation definitions.

---

## Critical - v2 Linter

Depends on: v2 Types complete

### Updated Reference Rules

- [x] Update `fit-value-proposition-ref` for `for:` pattern
  - Check `fits[].for.value_propositions[]` refs exist
  - AC: Missing VP ref produces error
  - Done: lintV2 checks for.value_propositions with proper path reporting
- [x] Update `fit-customer-segment-ref` for `for:` pattern
  - Check `fits[].for.customer_segments[]` refs exist
  - AC: Missing CS ref produces error
  - Done: lintV2 checks for.customer_segments with proper path reporting
- [x] Update fit mapping validation for tuple format
  - Each tuple `[left, right]` where prefixes must be compatible
  - AC: `[pr-x, pain-y]` valid, `[pr-x, gain-y]` produces type mismatch error
  - Done: lintV2 validates tuple format and type matching with fit-mapping-type-mismatch rule
- [x] Update `channel-segment-ref` for `for:` pattern
  - Check `channels[].for.customer_segments[]` exist
  - AC: Missing segment ref produces error
  - Done: lintV2 checks for.customer_segments
- [x] Update `channel-value-ref` (new) for ternary pattern
  - Check `channels[].for.value_propositions[]` exist
  - AC: Missing VP ref produces error
  - Done: Added new channel-value-ref rule for v2 ternary channel pattern
- [x] Update `customer-relationship-segment-ref` for `for:` pattern
  - AC: Consistent error messages
  - Done: lintV2 checks for.customer_segments
- [x] Update `revenue-stream-segment-ref` for `from:` pattern
  - Check `revenue_streams[].from.customer_segments[]` exist
  - Done: lintV2 checks from.customer_segments
- [x] Update `revenue-stream-value-ref` for `for:` pattern
  - Check `revenue_streams[].for.value_propositions[]` exist
  - Done: lintV2 checks for.value_propositions
- [x] Update `key-resource-value-ref` for `for:` pattern
  - Done: lintV2 checks for.value_propositions
- [x] Update `key-activity-value-ref` for `for:` pattern
  - Done: lintV2 checks for.value_propositions
- [x] Update `key-partnership-provides-ref` for `for:` pattern
  - Check `key_partnerships[].for.key_resources[]` and `key_activities[]`
  - Done: lintV2 checks for.key_resources and for.key_activities separately
- [x] Update `cost-linked-to-ref` for v2 `costs` array
  - Check `costs[].for.key_resources[]` and `key_activities[]`
  - Done: lintV2 validates costs array with for.key_resources and for.key_activities

### New Reference Rules (v2 Specific)

- [x] Add `pain-reliever-scope-ref` rule
  - `pr-*` refs in fit mappings must exist in linked VP's value map
  - AC: `pr-time` in fit must exist in `vp-convenience.pain_relievers`
  - Done: lintV2 validates pain reliever scope within linked VP's value map
- [x] Add `gain-creator-scope-ref` rule
  - `gc-*` refs in fit mappings must exist in linked VP's value map
  - AC: `gc-variety` in fit must exist in `vp-convenience.gain_creators`
  - Done: lintV2 validates gain creator scope within linked VP's value map
- [x] Add `fit-mapping-type-inference` validation
  - `[pr-*, pain-*]` = pain relief (valid)
  - `[gc-*, gain-*]` = gain creation (valid)
  - `[pr-*, gain-*]` = error (type mismatch)
  - AC: Mismatched tuple types produce clear error message
  - Done: lintV2 validates type inference with fit-mapping-type-mismatch rule and clear error messages

---

## High Priority - v2 Test Fixtures

Depends on: v2 Schema complete

- [x] Create `test/fixtures/valid-v2-minimal.bmml`
  - BMC only, no VPC detail (no jobs/pains/gains/fits)
  - All 9 blocks with `for:`/`from:` patterns
  - AC: Validates against v2 schema, linter passes
  - Done: Created complete BMC with all 9 blocks demonstrating v2 patterns
- [x] Create `test/fixtures/valid-v2-complete.bmml`
  - Full BMC + VPC with customer profiles, value maps, and fits
  - Tuple mappings demonstrating pain relief and gain creation
  - AC: Validates, linter passes, demonstrates all v2 features
  - Done: Created full example with 2 customer segments, 2 VPs, tuple mappings, and all BMC blocks
- [x] Create `test/fixtures/invalid-v2-tuple-format.bmml`
  - Invalid tuple structures: missing nesting, wrong array depth
  - AC: Validator rejects with clear error
  - Done: Flat array instead of nested tuples, schema rejects
- [x] Create `test/fixtures/invalid-v2-scope-refs.bmml`
  - Pain reliever/gain creator refs outside their VP scope
  - AC: Linter produces scope reference errors
  - Done: References pr-other/gc-other from a different VP, linter catches scope errors
- [x] Create `test/fixtures/invalid-v2-type-mismatch.bmml`
  - Fit mapping with `[pr-*, gain-*]` (type mismatch)
  - AC: Linter produces type mismatch error
  - Done: pr-* mapped to gain-*, gc-* mapped to pain-*, linter catches both
- [x] Update test suite to run both v1 and v2 fixtures
  - AC: All existing v1 tests still pass, all new v2 tests pass
  - Done: Updated test/fixtures.test.ts with comprehensive tests for all v1 and v2 fixtures (214 total tests)

---

## High Priority - Migration Tooling

Depends on: v2 Validator complete

### Core Migration Logic

- [x] Create `src/migrate.ts` with `migrateV1toV2()` function
  - Input: v1 YAML string, Output: v2 YAML string
  - AC: Function exported, basic structure in place
  - Done: Created migrateV1toV2() and migrateDocumentV1toV2() functions, exported from src/index.ts
- [x] Implement relationship pattern conversion
  - `for_value` → `for: { value_propositions: [] }`
  - `from_segments` → `from: { customer_segments: [] }`
  - `segments` → `for: { customer_segments: [] }`
  - `provides` → `for: { key_resources: [], key_activities: [] }`
  - AC: All v1 relationship patterns converted
  - Done: All relationship patterns converted for channels, customer_relationships, revenue_streams, key_resources, key_activities, key_partnerships
- [x] Implement pain_relievers/gain_creators migration
  - Move from `fits[].pain_relievers` to `value_propositions[].pain_relievers`
  - Group by VP reference in fit
  - Generate new `pr-*` and `gc-*` IDs
  - AC: Pain relievers correctly grouped under their VPs
  - Done: Pain relievers and gain creators extracted from fits, grouped by VP, with generated pr-* and gc-* IDs
- [x] Implement fit mapping transformation
  - Convert verbose objects `{ pain: pain-x, through: [ps-y] }` to tuple `[pr-generated, pain-x]`
  - Link to newly created pain_relievers
  - AC: Fit mappings are valid tuples referencing valid entities
  - Done: Fit mappings transformed to tuple format [pr-*, pain-*] and [gc-*, gain-*]
- [x] Implement `cost_structure` → `costs` conversion
  - Convert `major_costs` array to top-level `costs` array
  - Generate `cost-*` IDs
  - Convert `linked_to` to `for:` pattern
  - AC: v1 cost_structure becomes valid v2 costs array
  - Done: cost_structure.major_costs converted to costs array with cost-* IDs and for: pattern
- [x] Implement `type` field removal
  - Strip all `type` fields from all entities
  - AC: No type fields in output
  - Done: type/importance/severity fields stripped from jobs, pains, gains; type field stripped from products_services (description used as name)

### CLI Integration

- [x] Add `bmml migrate <file>` command to CLI
  - AC: `bmml migrate example.bmml` outputs migrated content
  - Done: Added migrate command with full CLI integration
- [x] Add `--dry-run` flag (output to stdout, don't modify)
  - AC: Original file unchanged, migrated content printed
  - Done: Default behavior outputs to stdout without modifying file
- [x] Add `--in-place` flag (modify file directly)
  - AC: File updated in place
  - Done: --in-place flag modifies file directly
- [x] Add migration validation (run v2 validator on output)
  - AC: Invalid migration output produces error, not silent corruption
  - Done: Validates migrated output against v2 schema before outputting/writing

### Migration Tests

- [x] Create test/migrate.test.ts with comprehensive tests
  - 29 tests covering all migration paths
  - Done: Tests for basic functionality, version field, customer segments, value propositions, fits, channels, customer_relationships, revenue_streams, key_resources, key_activities, key_partnerships, cost_structure, and round-trip validation
- [x] Create `test/fixtures/migrate/` directory structure
  - Done: Created directory with before/after file pairs for each migration scenario
- [x] Add before/after pairs for relationship pattern migration
  - Done: relationships-v1.bmml → relationships-v2.bmml testing segments, for_value, from_segments, provides patterns
- [x] Add before/after pairs for pain_relievers/gain_creators migration
  - Done: valuemap-v1.bmml → valuemap-v2.bmml testing extraction from fits to value propositions
- [x] Add before/after pairs for fit mapping migration
  - Done: fitmappings-v1.bmml → fitmappings-v2.bmml testing tuple mapping transformation
- [x] Add before/after pairs for cost_structure migration
  - Done: costs-v1.bmml → costs-v2.bmml testing cost_structure to costs array conversion
- [x] Add test: round-trip validation (v1 → migrate → v2 validate)
  - AC: All existing v1 examples can be migrated and validate as v2
  - Done: Tests verify that valid-minimal.bmml and valid-complete.bmml migrate and validate as v2
- [x] Add fixture-based tests to migrate.test.ts
  - Done: 36 new tests using fixture files covering all migration transformations

---

## High Priority - Example Updates

Depends on: v2 Schema + Migration Tooling

- [x] Create `examples/v2/meal-kit-minimal.bmml`
  - BMC without VPC detail
  - Demonstrates progressive detail (start simple)
  - AC: Validates as v2, serves as minimal example
  - Done: Created FreshBox minimal example with all 9 BMC blocks using v2 patterns. Also fixed CLI to auto-detect v1/v2 schemas.
- [x] Create `examples/v2/meal-kit-full.bmml`
  - Full BMC + VPC with fits and tuple mappings
  - Same business as minimal, more detail
  - AC: Validates as v2, demonstrates all features
  - Done: FreshBox with 2 customer segments (jobs/pains/gains), 2 VPs (products/pain_relievers/gain_creators), 4 fits with tuple mappings, cross-fits demonstrating VP flexibility
- [x] Create `examples/v2/marketplace.bmml`
  - Two-sided marketplace demonstrating multi-segment channels
  - AC: Shows ternary relationship pattern
  - Done: FoodRunner marketplace with consumers and restaurants, different VPs per side, ternary channels, dual revenue streams, full VPC detail with fits
- [x] Migrate existing v1 examples to v2
  - Option: Move v1 to `examples/v1/`, create fresh v2 in `examples/`
  - AC: Clear distinction between v1 and v2 examples
  - Done: Moved 5 original v1 examples to `examples/v1/`, migrated all to v2 format in `examples/` using `bmml migrate`. SkillBridge marketplace renamed to `skillbridge.bmml` to avoid collision with FoodRunner `marketplace.bmml`. All v2 examples validate and lint cleanly.
- [x] Add progressive detail example set
  - 4 files showing same business: minimal → +profiles → +valuemaps → +fits
  - AC: Demonstrates optional VPC detail concept
  - Done: Created `examples/progressive/` with 01-minimal.bmml, 02-profiles.bmml, 03-valuemaps.bmml, 04-fits.bmml showing FreshBox at increasing VPC detail levels. Each file includes header comments explaining progression. All validate and lint cleanly.

---

## High Priority - Website Redesign

It's important to have this website very soon

### Design & Layout

- [x] Study `ghuntley/cursed-website` for design patterns (via GitHub MCP)
  - Done: Studied the full index.html, extracted design patterns for gradient backgrounds, fixed headers, FAQ accordion, mobile responsive layout, code preview animations
- [x] Create new `docs/index.html` with bold gradient design
  - Done: Blue gradient theme (#1e3a5f to #3a7ca5), floating code preview with glow animation
- [x] Fixed navigation header
  - Done: Sticky header with blur backdrop, mobile hamburger menu
- [x] Mobile responsive layout
  - Done: Breakpoints at 900px, 768px, 480px with stacking and hidden elements

### Content Sections

- [x] Hero section: BMML name, tagline, CTA buttons (GitHub, Get Started)
  - Done: "Work in Progress" badge, gradient text title, dual CTA buttons
- [x] AirBnB example: Create an example business model for AirBnB. Study AirBnB's business model before doing that.
  - Done: Created comprehensive examples/airbnb.bmml with two-sided marketplace (guests and hosts), full VPC detail with jobs/pains/gains, pain_relievers/gain_creators, and complete fit mappings. Website examples updated to showcase Airbnb.
- [x] Code example: v2 syntax highlighted (minimal + full)
  - Done: Tabbed examples showing Airbnb minimal and full VPC with fits
- [x] What is BMC/VPC: Visual block representation
  - Done: Canvas section with 9 blocks, VPC section with Customer Profile and Value Map sides
- [x] Examples gallery: Links to example files
  - Done: Links to GitHub examples and progressive detail examples
- [x] Installation: CLI commands, VS Code extension link
  - Done: Two-card layout for CLI (npm install -g bmml, validate command) and VS Code extension
- [x] Roadmap/WIP status: Clear progress indicator
  - Done: Yellow "Work in Progress" badge in hero section
- [x] FAQ accordion with all required questions
  - Done: 6 FAQ items with expand/collapse animation
- [x] Footer: GitHub, spec link, license, Made by Hiasinho
  - Done: Three links plus credit line

### Required FAQ Content (All Implemented)

- [x] What is BMML?
- [x] Who made this? (Hiasinho, https://hia.sh)
- [x] Is this official/approved by Osterwalder? (No - independent project)
- [x] What's the goal?
- [x] How can I contribute?
- [x] Is this a commercial project? (No - open source)

---

## Medium Priority - Enhanced Linter Rules

Quality-of-life improvements. Lower priority than core v2 migration.

### Coverage Warnings (Non-blocking)

- [x] Warning: Customer segment has no fits defined
  - AC: Warning produced, validation still passes
  - Done: Added 'segment-no-fits' rule to both v1 and v2 linters. 11 tests added covering warning generation, mixed scenarios, and validation pass-through.
- [x] Warning: Value proposition has no fits defined
  - AC: Warning produced, validation still passes
  - Done: Added 'vp-no-fits' rule to both v1 and v2 linters. 12 tests added covering warning generation, suppression when fit exists, multiple VPs per fit (v2), mixed scenarios, and validation pass-through.
- [x] Warning: Pain defined but never relieved (no mapping references it)
  - AC: Warning produced, validation still passes
  - Done: Added 'pain-never-relieved' rule to both v1 and v2 linters. v1 checks fits[].pain_relievers[].pain, v2 checks tuple mappings where second element starts with 'pain-'. 14 tests added covering warning generation, suppression when relieved, multiple pains, multiple segments, mixed scenarios, and validation pass-through.
- [x] Warning: Gain defined but never created (no mapping references it)
  - AC: Warning produced, validation still passes
  - Done: Added 'gain-never-created' rule to both v1 and v2 linters. v1 checks fits[].gain_creators[].gain, v2 checks tuple mappings where second element starts with 'gain-'. 13 tests added covering warning generation, suppression when created, multiple gains, multiple segments, mixed scenarios, different fits, and validation pass-through.
- [x] Warning: Job defined but never addressed (no mapping references it)
  - AC: Warning produced, validation still passes
  - Done: Added 'job-never-addressed' rule to both v1 and v2 linters. v1 checks fits[].job_addressers[].job, v2 checks tuple mappings where second element starts with 'job-' (forward-compatible with planned ja-* prefix). 14 tests added covering warning generation, suppression when addressed, multiple jobs, multiple segments, mixed scenarios, different fits, and validation pass-through.
- [x] Warning: Product/service defined but never used in fit mapping
  - AC: Warning produced, validation still passes
  - Done: Added 'product-service-never-used' rule to v1 linter only. In v1, products/services are used via the `through` field in pain_relievers, gain_creators, and job_addressers within fits. In v2, products/services are NOT directly used in fit mappings by design (mappings only connect pr-* to pain-* and gc-* to gain-*). 10 tests added for v1 covering warning generation, suppression when used via pain_relievers/gain_creators/job_addressers through field, multiple products, mixed scenarios, different fits, multiple VPs, and validation pass-through. 1 test added for v2 documenting the intentional omission.

### Portfolio Hints

- [x] Info: Explore portfolio should have fits to validate desirability
  - Done: Added 'explore-no-fits' info rule to both v1 and v2 linters. Triggers when meta.portfolio='explore' and no fits are defined. 10 tests added covering v1 and v2, all explore stages, exploit portfolio suppression, and validation pass-through.
- [x] Info: Exploit portfolio should have revenue streams defined
  - Done: Added 'exploit-no-revenue' info rule to both v1 and v2 linters. Triggers when meta.portfolio='exploit' and no revenue_streams are defined. 10 tests added covering v1 and v2, all exploit stages, explore portfolio suppression, and validation pass-through.

### Data Quality

- [x] Warning: Duplicate ID detected (same ID used twice across sections)
  - AC: `cs-busy` used twice produces warning
  - Done: Added 'duplicate-id' warning rule to both v1 and v2 linters. Collects all IDs across all entity types (including nested entities like jobs, pains, gains, products_services, pain_relievers, gain_creators) and reports warnings when any ID appears more than once. Each duplicate occurrence includes a list of other locations where the same ID appears. 15 tests added covering cross-section duplicates, nested entity duplicates, Value Map duplicates (v2), multiple occurrences, and validation pass-through.

---

## Medium Priority - v1 Deprecation

v1 schema is deprecated. Only v2 is supported for validation and linting. Migration tool still accepts v1 input.

- [x] Remove `schemas/bmclang.schema.json` (v1 schema)
  - Done: Deleted v1 schema file. Validator now only loads v2 schema.
- [x] Remove v1 validation code paths from `src/validator.ts`
  - Done: validate(), validateDocument(), validateFile() no longer take version parameter. Auto-detect functions return error for v1 documents with migration hint.
- [x] Remove v1 linting code paths from `src/linter.ts`
  - Done: Removed collectAllIds (v1), buildIdMaps (v1), lintV1 functions. lint() now only accepts BMCDocumentV2.
- [ ] Remove v1 types from `src/types.ts` (keep only v2 types)
  - Note: v1 types retained because migration tool (src/migrate.ts) needs them to parse v1 input. Could be moved to internal-only exports in future.
- [x] Remove `test/fixtures/valid-*.bmml` and `invalid-*.bmml` (v1 fixtures)
  - Done: Removed valid-minimal.bmml, valid-complete.bmml, invalid-missing-meta.bmml, invalid-portfolio-stage.bmml, invalid-references.bmml. Migration fixtures in test/fixtures/migrate/ retained for migration tests.
- [x] Remove `examples/v1/` directory
  - Done: Deleted examples/v1/ directory with 5 archived v1 examples.
- [x] Update tests to remove v1-specific test cases
  - Done: Updated fixtures.test.ts, validator.test.ts, cli.test.ts, linter.test.ts, types.test.ts, migrate.test.ts. All 304 tests pass.
- [x] Simplify CLI to only support v2 (remove version detection for v1)
  - Done: validate and lint commands work only with v2. Auto-detect returns migration error for v1. migrate command still works with v1 input. Updated VS Code extension to use v2 schema.

---

## Low Priority - Developer Experience

VS Code plugin is not needed. Neovim/Vim plugin would be useful but is low priority.

- [x] Remove `vscode-bmml/` extension directory
  - Done: Removed vscode-bmml/ directory, updated EDITOR_SETUP.md to promote YAML extension with JSON Schema, updated docs/index.html to link to editor setup guide
- [x] Create Neovim TreeSitter grammar for BMML v2
  - Done: Created tree-sitter-bmml/ package with highlight queries that extend tree-sitter-yaml. Includes queries for BMC sections, VPC elements, ID prefixes, relationship patterns, and portfolio/stage values. Updated EDITOR_SETUP.md with TreeSitter setup instructions for Neovim.
- [x] Add Vim syntax highlighting file (simpler alternative to TreeSitter)
  - Done: Created vim/syntax/bmml.vim with YAML base + BMML-specific highlighting for sections, ID prefixes, relationship patterns, and portfolio/stage values. Added vim/ftdetect/bmml.vim for automatic filetype detection. Updated EDITOR_SETUP.md with installation instructions for vim-plug, lazy.nvim, and manual installation.

---

## Low Priority - Documentation

- [x] Create CONTRIBUTING.md with development setup
  - Done: Added comprehensive guide covering prerequisites (Node 22+, pnpm 10+, mise), project structure, development commands, CLI usage during development, testing patterns with Vitest, commit format, code style, and ID prefix reference.
- [x] Document v1→v2 migration process
  - Done: Created MIGRATION.md with comprehensive migration guide covering quick start CLI commands, all relationship pattern changes, type field removals, cost structure refactoring, pain reliever/gain creator extraction, fit mapping tuples, entity-by-entity reference, CLI usage, and troubleshooting. Updated README.md to reference the guide.
- [x] Add inline comments to v2 schema explaining design decisions
  - Done: Added $comment fields throughout bmclang-v2.schema.json explaining key design decisions: v2's three principles (symmetry/consistency/optionality), fits as first-class entities, costs array structure, portfolio/stage framework, value map placement, ID prefix type inference, for:/from: semantics, ternary channel relationships, bidirectional revenue streams, and infrastructure linking patterns.
- [x] Create v1 vs v2 comparison table
  - Done: Added comprehensive comparison table to MIGRATION.md summarizing all v1 vs v2 differences at a glance: version field, relationship patterns, type fields, importance/severity, pain relievers/gain creators location, fit mappings, cost structure, channel/relationship/revenue refs, and new ID prefixes.

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
