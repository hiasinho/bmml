# Implementation Plan

## Overview

BMCLang is a YAML-based markup format for describing business models. This plan prioritizes building the format specification and validation tooling before any application code.

## Current State

- **Types**: Complete TypeScript types matching JSON Schema (src/types.ts, ~480 lines)
- **Validator**: Complete - parses YAML and validates against JSON Schema (src/validator.ts)
- **Linter**: Stub that throws "Not implemented"
- **Schema**: Complete JSON Schema at `schemas/bmclang.schema.json` (702 lines)
- **CLI**: Referenced in package.json but not implemented
- **Test fixtures**: 4 fixtures exist (2 valid, 2 invalid) - all validate correctly against schema

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

- [ ] Implement `lint()` function skeleton (src/linter.ts)
- [ ] Rule: All ID references must exist (e.g., `fit.customer_segment` references valid `cs-*`)
- [ ] Rule: `fits[].pain` must reference pain in the referenced customer_segment
- [ ] Rule: `fits[].gain` must reference gain in the referenced customer_segment
- [ ] Rule: `fits[].job` must reference job in the referenced customer_segment
- [ ] Rule: `fits[].through[]` must reference products_services in the referenced value_proposition
- [ ] Rule: `channels[].segments` must reference existing customer_segments
- [ ] Rule: `customer_relationships[].segment` must reference existing customer_segment
- [ ] Rule: `revenue_streams[].from_segments` must reference existing customer_segments
- [ ] Rule: `revenue_streams[].for_value` must reference existing value_proposition
- [ ] Rule: `key_resources[].for_value` must reference existing value_propositions
- [ ] Rule: `key_activities[].for_value` must reference existing value_propositions
- [ ] Rule: `key_partnerships[].provides` must reference existing resources or activities
- [ ] Rule: `cost_structure.major_costs[].linked_to` must reference existing resources or activities
- [ ] Add test fixtures for reference integrity violations

---

## Medium Priority - CLI Tool

Basic command-line interface for validation.

- [ ] Create `src/cli.ts` with argument parsing
- [ ] Implement `validate` command that loads .bmml file and runs validator
- [ ] Implement `lint` command that runs linter after validation
- [ ] Pretty-print errors with file location
- [ ] Exit with non-zero code on errors
- [ ] Add `--json` flag for machine-readable output

---

## Low Priority - Example Files

Comprehensive examples demonstrating format capabilities.

- [ ] Create `examples/meal-kit-delivery.bmml` (from spec mentions)
- [ ] Create `examples/saas-platform.bmml` (exploit portfolio example)
- [ ] Create `examples/marketplace.bmml` (two-sided market with multiple segments)
- [ ] Add example showing `derived_from` lineage

---

## Low Priority - Developer Experience

Tools for working with .bmml files.

- [ ] Create VS Code extension manifest for syntax highlighting
- [ ] Add JSON Schema to VS Code YAML extension settings example
- [ ] Document how to set up editor support

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
