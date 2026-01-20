# Spec: BMCLang MVP Structure

## Overview

BMCLang is a YAML-based format for describing business models, designed to be:
- **AI-analyzable**: Structured for machine parsing and analysis
- **Version-controllable**: Git-friendly with meaningful diffs
- **Validatable**: Schema-enforced consistency and relationship checking
- **Human-readable**: Familiar structure for technical users

Primary users: Technical users and AI agents working with business models.

## Core Concepts

### The Business Model Canvas (9 Blocks)
1. Customer Segments
2. Value Propositions
3. Channels
4. Customer Relationships
5. Revenue Streams
6. Key Resources
7. Key Activities
8. Key Partnerships
9. Cost Structure

### The Value Proposition Canvas (Fit)
- **Customer Profile** (detailed view of Customer Segment): Jobs, Pains, Gains
- **Value Map** (detailed view of Value Proposition): Products/Services
- **Fit**: First-class entity connecting Value Map elements to Customer Profile elements

### The Business Model Portfolio (Explore/Exploit)

From Osterwalder's "The Invincible Company": companies need to manage two portfolios simultaneously.

**Explore Portfolio** (high uncertainty, searching for new value):
| Stage | Focus |
|-------|-------|
| `ideation` | New ideas around market opportunities or technologies |
| `discovery` | First evidence of customer interest and market potential |
| `validation` | Proof that customers will pay (strong desirability + viability evidence) |
| `acceleration` | Investing in customer acquisition, robust MVPs |

**Exploit Portfolio** (low uncertainty, managing existing business):
| Stage | Focus |
|-------|-------|
| `improve` | Sustaining innovation, efficiency gains |
| `grow` | Scaling successful models to new markets |
| `sustain` | Mature, profitable, stable business |
| `retire` | Declining business, needs renovation or end-of-life |

The **transfer** stage marks the shift from Explore → Exploit when a validated business model is ready for scaling.

## Key Design Decisions

### 1. Fit as First-Class Entity

The fit between a Value Proposition and Customer Segment is explicit, not implicit.

**Rationale**:
- One VP can fit multiple Customer Segments differently
- One Customer Segment can have multiple VPs targeting it
- Pain relievers and gain creators can come from combinations of products/services

### 2. Computed Properties Are Not Stored

The file captures facts and relationships. Scores, coverage metrics, and fit strength are computed by tooling, not stored in the data.

**Rationale**: Single source of truth, no stale computed values.

### 3. Single File Per Business Model

One `.bmc` file contains the complete business model.

**Rationale**: Business models are inherently interconnected. Splitting creates artificial boundaries and complicates tooling.

### 4. YAML Format

File extension: `.bmc` (YAML syntax)

**Rationale**: Best balance of human readability, tooling ecosystem, and expressiveness for nested structures.

### 5. Portfolio-Stage Coupling

The `stage` field is constrained by the `portfolio` field:

| Portfolio | Valid Stages |
|-----------|--------------|
| `explore` | `ideation`, `discovery`, `validation`, `acceleration` |
| `exploit` | `improve`, `grow`, `sustain`, `retire` |

The `transfer` stage is valid for either portfolio (transitional).

**Rationale**: Enforces Osterwalder's framework. An ideation-stage business can't be in the exploit portfolio.

### 6. Lineage via Parent Reference

A business model can reference its parent via `derived_from`:

```yaml
meta:
  derived_from: ./meal-kit-v1.bmc
```

**Rationale**:
- Minimal - just the reference, no duplication of "why" or "what changed"
- Git handles the history, commit messages capture the reason
- Tooling can traverse lineage to show evolution
- Supports pivots, iterations, and forks

## File Structure

```yaml
version: "1.0"

meta:
  name: "Company Name"
  tagline: "One-liner description"
  created: 2024-01-15
  updated: 2024-01-20

  # Portfolio position (Osterwalder's Invincible Company)
  portfolio: explore | exploit
  stage: ideation | discovery | validation | acceleration | transfer | improve | grow | sustain | retire

  # Lineage (optional) - reference to parent business model
  derived_from: ./previous-version.bmc  # relative path to parent

# === CUSTOMER SIDE ===

customer_segments:
  - id: cs-[slug]
    name: "Segment Name"
    description: "Who they are"

    # Customer Profile (Value Proposition Canvas)
    jobs:
      - id: job-[slug]
        type: functional | emotional | social
        description: "What they're trying to accomplish"
        importance: low | medium | high

    pains:
      - id: pain-[slug]
        description: "What frustrates them or blocks them"
        severity: low | medium | high

    gains:
      - id: gain-[slug]
        description: "What they want to achieve or experience"
        importance: low | medium | high

# === VALUE SIDE ===

value_propositions:
  - id: vp-[slug]
    name: "Value Proposition Name"
    description: "What you offer"

    # Value Map (Value Proposition Canvas)
    products_services:
      - id: ps-[slug]
        type: product | service | digital | financial
        description: "What it is"

# === FIT (connects Value Map to Customer Profile) ===

fits:
  - id: fit-[slug]
    value_proposition: vp-[ref]
    customer_segment: cs-[ref]

    pain_relievers:
      - pain: pain-[ref]
        through: [ps-[ref], ...]  # one or more products/services
        description: "How it relieves the pain"

    gain_creators:
      - gain: gain-[ref]
        through: [ps-[ref], ...]
        description: "How it creates the gain"

    job_addressers:
      - job: job-[ref]
        through: [ps-[ref], ...]
        description: "How it addresses the job"

# === DELIVERY ===

channels:
  - id: ch-[slug]
    name: "Channel Name"
    type: direct | indirect | owned | partner
    segments: [cs-[ref], ...]  # which segments reached
    phases: [awareness, evaluation, purchase, delivery, after_sales]

customer_relationships:
  - id: cr-[slug]
    segment: cs-[ref]
    type: personal_assistance | dedicated | self_service | automated | community | co_creation
    description: "How you interact with this segment"

# === FINANCES ===

revenue_streams:
  - id: rs-[slug]
    name: "Revenue Stream Name"
    type: transaction | recurring | licensing | subscription | usage | advertising
    from_segments: [cs-[ref], ...]
    for_value: vp-[ref]  # which value proposition
    pricing: fixed_menu | dynamic | negotiation | auction | market_dependent | volume_dependent

cost_structure:
  type: cost_driven | value_driven
  characteristics: [fixed_costs_heavy, variable_costs_heavy, economies_of_scale, economies_of_scope]
  major_costs:
    - name: "Cost Name"
      type: fixed | variable
      linked_to: [kr-[ref], ka-[ref], ...]  # which resources/activities

# === INFRASTRUCTURE ===

key_resources:
  - id: kr-[slug]
    name: "Resource Name"
    type: physical | intellectual | human | financial
    for_value: [vp-[ref], ...]  # which value propositions need this

key_activities:
  - id: ka-[slug]
    name: "Activity Name"
    type: production | problem_solving | platform
    for_value: [vp-[ref], ...]  # which value propositions require this

key_partnerships:
  - id: kp-[slug]
    name: "Partner Name"
    type: strategic_alliance | coopetition | joint_venture | supplier
    motivation: optimization | risk_reduction | resource_acquisition
    provides: [kr-[ref], ka-[ref], ...]  # what they provide
```

## ID Conventions

All elements use prefixed IDs for clarity:
- `cs-` Customer Segment
- `vp-` Value Proposition
- `ps-` Product/Service
- `job-` Job to be Done
- `pain-` Pain
- `gain-` Gain
- `fit-` Fit
- `ch-` Channel
- `cr-` Customer Relationship
- `rs-` Revenue Stream
- `kr-` Key Resource
- `ka-` Key Activity
- `kp-` Key Partnership

## Relationships Summary

| From | To | Via |
|------|-----|-----|
| Value Proposition | Customer Segment | `fits[].value_proposition` + `fits[].customer_segment` |
| Pain Reliever | Pain | `fits[].pain_relievers[].pain` |
| Pain Reliever | Products/Services | `fits[].pain_relievers[].through` |
| Gain Creator | Gain | `fits[].gain_creators[].gain` |
| Gain Creator | Products/Services | `fits[].gain_creators[].through` |
| Job Addresser | Job | `fits[].job_addressers[].job` |
| Job Addresser | Products/Services | `fits[].job_addressers[].through` |
| Channel | Customer Segment | `channels[].segments` |
| Customer Relationship | Customer Segment | `customer_relationships[].segment` |
| Revenue Stream | Customer Segment | `revenue_streams[].from_segments` |
| Revenue Stream | Value Proposition | `revenue_streams[].for_value` |
| Key Resource | Value Proposition | `key_resources[].for_value` |
| Key Activity | Value Proposition | `key_activities[].for_value` |
| Key Partnership | Resources/Activities | `key_partnerships[].provides` |
| Cost | Resources/Activities | `cost_structure.major_costs[].linked_to` |

## Acceptance Criteria

- [ ] Update JSON Schema to match this structure
- [ ] Create example `.bmc` file using the meal kit example
- [ ] Validate schema works with example
- [ ] Document all relationship types
- [ ] Create validation rules for relationship integrity

## Out of Scope (for later phases)

- Environment Map (market forces, trends, macro factors)
- Hypotheses and Evidence tracking
- Patterns (Freemium, Platform, etc.)
- Confidence scores
- Rich pivot history (beyond `derived_from` lineage)
- Multi-canvas support (multi-sided platforms)

## Open Questions

1. Should `fits` be nested under `value_propositions` or top-level? (Currently: top-level)
2. How to handle jobs that span functional/emotional/social categories?
3. Should channels have explicit links to value propositions (awareness of what)?
