# Spec: BMCLang Format Design

## Problem

Business models are complex, interconnected systems. The Business Model Canvas popularized a 9-block view, but Osterwalder's full framework includes:

- **Business Model Canvas** - 9 building blocks
- **Value Proposition Canvas** - Jobs, Pains, Gains mapped to solutions
- **Environment Map** - Market forces, trends, macro factors
- **Patterns** - Freemium, Platform, Razor & Blade, etc.

Current tools treat these as separate artifacts. We need ONE format that:
1. Captures all elements in a single file
2. Makes relationships explicit (not implied)
3. Is human-readable AND machine-parseable
4. Supports AI-driven analysis and optimization

## Design Decision: Why YAML?

Evaluated options:
- **JSON** - Universal but verbose, poor human readability
- **TOML** - Clean but weak at deep nesting
- **Custom DSL** - Maximum expressiveness but requires parser
- **YAML** - Best balance of readability + structure + tooling

Starting with YAML allows rapid iteration. Can create a custom syntax later that compiles to YAML.

File extension: `.bmc` (Business Model Canvas)

## Core Structure

```yaml
version: "1.0"
meta:
  name: "Company Name"
  created: 2024-01-15
  updated: 2024-01-20
  stage: ideation | validation | scaling

# The 9 building blocks
canvas:
  customer_segments: []
  value_propositions: []
  channels: []
  customer_relationships: []
  revenue_streams: []
  key_resources: []
  key_activities: []
  key_partnerships: []
  cost_structure: []

# Deep dive on value propositions
value_propositions_detail: []

# External factors
environment:
  market_forces: []
  industry_forces: []
  key_trends: []
  macro_economic: []

# Identified patterns
patterns: []

# Hypotheses to test
hypotheses: []

# Evidence and learnings
evidence: []
```

## Key Design Principles

### 1. IDs Enable Relationships

Every element has an ID. Relationships are explicit references.

```yaml
customer_segments:
  - id: cs-busy-professionals
    name: Busy Professionals
    jobs:
      - id: job-save-time
        description: Save time on meals

value_propositions:
  - id: vp-meal-kit
    name: 15-Minute Meal Kits
    targets: [cs-busy-professionals]  # explicit link
    addresses_jobs: [job-save-time]   # explicit link
```

### 2. Confidence Scores

AI optimization needs to know what's validated vs assumed.

```yaml
customer_segments:
  - id: cs-busy-professionals
    confidence: 0.8  # validated through interviews
    evidence: [ev-interview-batch-1]
```

### 3. Hypotheses Are First-Class

Business models are hypotheses until validated.

```yaml
hypotheses:
  - id: hyp-price-sensitivity
    statement: "Customers will pay $15/meal for convenience"
    status: testing | validated | invalidated
    evidence: [ev-pricing-test-1]
```

### 4. Temporal Awareness

Business models evolve. Track versions and pivots.

```yaml
meta:
  stage: validation
  pivot_history:
    - date: 2024-01-10
      from: "Restaurant delivery"
      to: "Meal kit subscription"
      reason: "Unit economics unsustainable"
```

## Acceptance Criteria

- [ ] Define complete YAML schema
- [ ] Create JSON Schema for validation
- [ ] Build 3+ real-world examples
- [ ] Document all element types and relationships
- [ ] Create validation tooling

## Files to Investigate

- Osterwalder's original PhD thesis structure
- Strategyzer's data models (if public)
- Existing business model tools (Canvanizer, Strategyzer, Miro templates)

## Open Questions

1. How granular should Jobs-to-be-Done be? (functional, emotional, social)
2. Should we embed financial projections or keep separate?
3. How to handle multi-sided platforms (multiple canvases)?
4. Version control friendly - one file or directory structure?
