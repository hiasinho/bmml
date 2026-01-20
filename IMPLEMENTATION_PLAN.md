# Implementation Plan

## Overview

BMCLang is a YAML-based markup format for describing business models. This plan prioritizes building the format specification and validation tooling before any application code.

## Current State

- **Types**: Complete TypeScript types matching JSON Schema (src/types.ts, ~480 lines)
- **Validator**: Complete - parses YAML and validates against JSON Schema (src/validator.ts)
- **Linter**: Complete - validates reference integrity rules (src/linter.ts)
- **Schema**: Complete JSON Schema at `schemas/bmclang.schema.json` (702 lines)
- **CLI**: Complete - validate and lint commands with --json output (src/cli.ts)
- **Test fixtures**: 5 fixtures exist (2 valid, 3 invalid) - all validate correctly

---

## Critical - JSON Schema Foundation

The JSON Schema is the source of truth for the format. Everything else derives from it.

- [x] Create `schemas/bmclang.schema.json` with root structure (`version`, `meta`)
- [x] Add `meta` object schema with required fields (`name`, `portfolio`, `stage`)
- [x] Add `meta` optional fields (`tagline`, `created`, `updated`, `derived_from`)
- [x] Implement portfolio-stage constraint (explore→ideation/discovery/validation/acceleration, exploit→improve/grow/sustain/retire, transfer→both)
- [x] Add `customer_segments` array schema with full Customer Profile (jobs, pains, gains)
- [x] Add `value_propositions` array schema with Value Map (products_services)
- [x] Add `fits` array schema with pain_relievers, gain_creators, job_addressers
- [x] Add `channels` array schema
- [x] Add `customer_relationships` array schema
- [x] Add `revenue_streams` array schema
- [x] Add `cost_structure` object schema
- [x] Add `key_resources` array schema
- [x] Add `key_activities` array schema
- [x] Add `key_partnerships` array schema

**Completed**: Full schema created in single implementation. Uses JSON Schema draft-07 for ajv compatibility. All test fixtures validate correctly.

---

## High Priority - Core Type System

TypeScript types should match the JSON Schema exactly.

- [x] Expand `BMCDocument` interface with all top-level fields (src/types.ts)
- [x] Add `CustomerSegment` interface with jobs, pains, gains
- [x] Add `Job`, `Pain`, `Gain` interfaces with their type/severity/importance enums
- [x] Add `ValueProposition` interface with products_services
- [x] Add `ProductService` interface with type enum
- [x] Add `Fit` interface with pain_relievers, gain_creators, job_addressers
- [x] Add `Channel` interface with type enum and phases
- [x] Add `CustomerRelationship` interface with type enum
- [x] Add `RevenueStream` interface with type and pricing enums
- [x] Add `CostStructure` interface with type enum and characteristics
- [x] Add `KeyResource` interface with type enum
- [x] Add `KeyActivity` interface with type enum
- [x] Add `KeyPartnership` interface with type and motivation enums
- [x] Add ID prefix type guards (`isCustomerSegmentId`, `isValuePropositionId`, etc.)

**Completed**: All interfaces implemented with JSDoc comments. Type aliases for all enums. ID type guards with regex validation matching JSON Schema patterns. Tests verify type guards and fixture compatibility.

---

## High Priority - Validator Implementation

Schema validation using the JSON Schema.

- [x] Implement `validate()` function to parse YAML and validate against schema (src/validator.ts)
- [x] Return structured errors with JSON path and message
- [x] Add helper to load schema from file
- [x] Add test: valid-minimal.bmml passes validation
- [x] Add test: valid-complete.bmml passes validation
- [x] Add test: invalid-missing-meta.bmml fails with correct error
- [x] Add test: invalid-portfolio-stage.bmml fails with portfolio-stage constraint error

**Completed**: Validator uses ajv for JSON Schema validation with ajv-formats for date validation. Exports `validate()` for YAML strings, `validateDocument()` for parsed objects, `validateFile()` for files, and `loadSchema()` helper. Error messages enhanced for common validation failures. Tests in `test/validator.test.ts` cover all fixtures plus edge cases.

---

## Medium Priority - Linter (Reference Integrity)

The linter checks semantic rules that JSON Schema cannot express.

- [x] Implement `lint()` function skeleton (src/linter.ts)
- [x] Rule: All ID references must exist (e.g., `fit.customer_segment` references valid `cs-*`)
- [x] Rule: `fits[].pain` must reference pain in the referenced customer_segment
- [x] Rule: `fits[].gain` must reference gain in the referenced customer_segment
- [x] Rule: `fits[].job` must reference job in the referenced customer_segment
- [x] Rule: `fits[].through[]` must reference products_services in the referenced value_proposition
- [x] Rule: `channels[].segments` must reference existing customer_segments
- [x] Rule: `customer_relationships[].segment` must reference existing customer_segment
- [x] Rule: `revenue_streams[].from_segments` must reference existing customer_segments
- [x] Rule: `revenue_streams[].for_value` must reference existing value_proposition
- [x] Rule: `key_resources[].for_value` must reference existing value_propositions
- [x] Rule: `key_activities[].for_value` must reference existing value_propositions
- [x] Rule: `key_partnerships[].provides` must reference existing resources or activities
- [x] Rule: `cost_structure.major_costs[].linked_to` must reference existing resources or activities
- [x] Add test fixtures for reference integrity violations

**Completed**: Linter validates all cross-references between entities. Builds ID maps to track customer segments (with nested jobs/pains/gains), value propositions (with products_services), key resources, and key activities. Returns structured errors with rule name, severity, JSON path, and message. Test fixture `invalid-references.bmml` exercises all rules. 21 tests in `test/linter.test.ts`.

---

## Medium Priority - CLI Tool

Basic command-line interface for validation.

- [x] Create `src/cli.ts` with argument parsing
- [x] Implement `validate` command that loads .bmml file and runs validator
- [x] Implement `lint` command that runs linter after validation
- [x] Pretty-print errors with file location
- [x] Exit with non-zero code on errors
- [x] Add `--json` flag for machine-readable output

**Completed**: CLI implemented with validate and lint commands. Pretty-printed error messages with file paths and lint rule icons. JSON output mode for CI integration. 21 tests in `test/cli.test.ts`. Usage: `bmclang validate|lint [--json] <file>`.

---

## Low Priority - Example Files

Comprehensive examples demonstrating format capabilities.

- [x] Create `examples/meal-kit-delivery.bmml` (from spec mentions)
- [x] Create `examples/saas-platform.bmml` (exploit portfolio example)
- [x] Create `examples/marketplace.bmml` (two-sided market with multiple segments)
- [x] Add example showing `derived_from` lineage

**Completed**:
- meal-kit-delivery.bmml demonstrates a meal kit delivery business (like HelloFresh) with two customer segments (busy professionals, aspiring home cooks), two value propositions (convenience, culinary experience), full fits, channels, relationships, revenue streams, and infrastructure. 346 lines. Validates and lints cleanly. Portfolio: explore/validation.
- saas-platform.bmml demonstrates a B2B project management SaaS (TaskFlow) in the exploit portfolio at grow stage. Two customer segments (SMB Teams, Enterprise Organizations), two value propositions (Team Productivity, Enterprise Scale), comprehensive fits, channels including partner networks, dedicated and self-service relationships, subscription and professional services revenue, and full infrastructure. 421 lines. Validates and lints cleanly.
- marketplace.bmml demonstrates a two-sided freelance marketplace (SkillBridge) with four customer segments: two on demand side (Startups & SMBs, Enterprise Clients) and two on supply side (Independent Freelancers, Boutique Agencies). Four distinct value propositions target each segment. Comprehensive fits show how platform features address both sides of the market. Full infrastructure including trust & safety operations critical for marketplace businesses. 484 lines. Validates and lints cleanly. Portfolio: exploit/grow.
- photo-sharing-v1.bmml and photo-sharing-pivot.bmml demonstrate the derived_from lineage feature. The v1 file models a location-based check-in app (Burbn-style) with photo attachment as a secondary feature. The pivot file models the evolution to a photo-first platform (Instagram-style) with filters and visual community, using `derived_from: ./photo-sharing-v1.bmml` to establish lineage. Together they show how pivots can be tracked while letting git handle the detailed change history. Portfolio: explore/discovery → explore/validation. 533 total lines across both files.

---

## Low Priority - Developer Experience

Tools for working with .bmml files.

- [x] Create VS Code extension manifest for syntax highlighting
- [x] Add JSON Schema to VS Code YAML extension settings example
- [x] Document how to set up editor support

**Completed**:
- vscode-bmclang/ extension with TextMate grammar for BMCLang-specific syntax highlighting (IDs, references, enums, top-level keys)
- Language configuration for comments, brackets, folding
- JSON Schema bundled in extension for validation via YAML extension integration
- EDITOR_SETUP.md documenting setup for VS Code, JetBrains, Vim/Neovim, and Sublime Text
- .vscode/settings.json example (gitignored) for local development

---

## Backlog - Future Phases

Items explicitly out of scope per spec, tracked for future reference.

- [ ] Environment Map (market forces, trends, macro factors)
- [ ] Hypotheses and Evidence tracking
- [ ] Patterns (Freemium, Platform, Marketplace, etc.)
- [ ] Market type classification (B2B, B2C, etc.)
- [ ] Confidence scores
- [ ] Rich pivot history (beyond `derived_from` lineage)
- [ ] Multi-canvas support (multi-sided platforms)

---

## Notes

### Discoveries

1. **Test fixtures already exist** - 4 fixtures in `test/fixtures/` ready to use
2. **Dependencies ready** - `ajv` (JSON Schema validator) and `js-yaml` already in package.json
3. **Portfolio-stage constraint is key** - This is the most complex validation rule
4. **Reference integrity is critical** - Many cross-references between entities need validation
5. **JSON Schema draft-07 required** - ajv doesn't support draft-2020-12 out of the box without additional packages
6. **bin/ scripts don't exist** - validation commands should use `pnpm test` and `pnpm lint` instead

### Open Questions (from spec)

1. Should `fits` be nested under `value_propositions` or top-level? (Currently: top-level)
2. How to handle jobs that span functional/emotional/social categories?
3. Should channels have explicit links to value propositions (awareness of what)?

### ID Prefix Reference

| Prefix | Entity |
|--------|--------|
| `cs-` | Customer Segment |
| `vp-` | Value Proposition |
| `ps-` | Product/Service |
| `job-` | Job to be Done |
| `pain-` | Pain |
| `gain-` | Gain |
| `fit-` | Fit |
| `ch-` | Channel |
| `cr-` | Customer Relationship |
| `rs-` | Revenue Stream |
| `kr-` | Key Resource |
| `ka-` | Key Activity |
| `kp-` | Key Partnership |
