# Spec: BMCLang v2 Structure

0. IMPORTANT: Rename BMCLang to BMML (or bmml if lowercase fits better)

## Overview

This spec describes structural improvements to BMCLang based on three goals:
1. **Symmetry** - Customer Profile in segments, full Value Map in propositions
2. **Consistency** - All relationships use `for` and `from` with typed sub-keys
3. **Optionality** - VPC detail (profiles, value maps, fits) is optional; BMC works standalone

## Design Mechanics

This section explains the structural principles behind BMCLang and why these design choices were made.

### Two Conceptual Layers

BMCLang supports two levels of detail:

**Business Model Canvas (BMC)** - High-level view
- 9 building blocks: Customer Segments, Value Propositions, Channels, Customer Relationships, Revenue Streams, Key Resources, Key Activities, Key Partnerships, Cost Structure
- Describes *what* the business model is
- Can be modeled without detailed customer understanding

**Value Proposition Canvas (VPC)** - Detailed view
- Customer Profile: Jobs, Pains, Gains (detailed understanding of a segment)
- Value Map: Products/Services, Pain Relievers, Gain Creators (detailed understanding of a proposition)
- Fit: How the value map addresses the customer profile
- Describes *why* the value proposition works for the customer

**Design choice:** VPC detail is optional. A BMCLang file can describe a complete business model at the BMC level without any VPC detail. This supports progressive refinement - start high-level, add detail as understanding grows.

### Entities and Relationships

BMCLang is structured like a knowledge graph:
- **Entities** are defined in their respective sections (customer_segments, value_propositions, etc.)
- **Relationships** connect entities using `for:` and `from:` with typed sub-keys

This separation keeps entity definitions clean while making relationships explicit and queryable.

### The `for:` / `from:` Pattern

All relationships use two prepositions:
- `for:` - "this entity serves/supports/targets these other entities"
- `from:` - "this entity receives from/is sourced by these other entities"

**Why these words:**
- Short and grammatically natural
- Directionally unambiguous
- Work across all relationship types

**Why typed sub-keys:**
```yaml
for:
  value_propositions: [vp-convenience]
  customer_segments: [cs-busy]
```

Sub-keys match section names exactly (`value_propositions`, not `propositions`). This provides:
- Self-documenting references (you know what type of entity is referenced)
- Validation simplicity (sub-key name = section to validate against)
- Extensibility (add new sub-keys as entity types grow)

### Ternary Relationships

The BMC has relationships that involve more than two entities:
- Channels deliver **value propositions** to **customer segments**
- Revenue comes **from segments** for **value propositions**

These are ternary relationships (involving three entities), not simple binary ones.

**Design choice:** Express ternary relationships using `for:` with multiple sub-keys:
```yaml
channels:
  - id: ch-social
    for:
      value_propositions: [vp-convenience]
      customer_segments: [cs-busy]
```

This is cleaner than creating separate "delivery" or "channel_usage" join entities.

### Fits as First-Class Entities

A fit represents the connection between a Value Proposition and a Customer Segment at the VPC level. It answers: "How does this VP address this CS's needs?"

**Why top-level (not nested under VP):**
- A fit connects two peers (VP and CS) - neither owns the relationship
- One VP can fit multiple segments differently
- One segment can be served by multiple VPs
- The fit itself has properties (the mappings)

**Why optional:**
- Fits are VPC detail - you might have a BMC without them
- Revenue streams and channels can reference VP + CS directly without requiring a fit to exist

### Symmetry Principle

The structure maintains symmetry between customer and value sides:

| Customer Side | Value Side |
|--------------|------------|
| Customer Segment | Value Proposition |
| Customer Profile (jobs, pains, gains) | Value Map (products, relievers, creators) |
| Profile is optional detail in segment | Map is optional detail in proposition |

**Why this matters:**
- Conceptually aligned with Osterwalder's frameworks
- Either side can be modeled at high or low detail independently
- Clear mental model for users

### Tuple Mappings in Fits

Fit mappings use simple tuples instead of verbose objects:
```yaml
mappings:
  - [pr-time, pain-time]      # pain reliever → pain
  - [gc-variety, gain-variety] # gain creator → gain
```

**Why tuples:**
- Concise - reduces file verbosity
- ID prefixes make relationship type inferrable (pr-* with pain-* = pain relief)
- Many-to-many supported (one reliever can map to multiple pains across multiple tuples)

**Cardinality:**
- One pain reliever can address multiple pains
- Multiple pain relievers can address the same pain
- Same for gain creators and gains

### Prefixed IDs

All entity IDs use prefixes (`cs-`, `vp-`, `pr-`, etc.):
- Self-documenting references
- Enables type inference from ID alone
- Prevents ID collisions across entity types
- Supports validation without context

### Progressive Detail

The structure supports modeling at different levels of completeness:

1. **Minimal BMC**: Just segments, propositions, and their connections
2. **Detailed BMC**: Add descriptions, all 9 blocks fully populated
3. **BMC + Profiles**: Add jobs/pains/gains to segments
4. **BMC + Value Maps**: Add products/relievers/creators to propositions
5. **Full VPC**: Add fits with mappings

Each level is valid. The linter can warn about incomplete models but won't reject them.

## Key Changes from v1

### 1. Value Map Moves to Value Proposition

**Problem:** In v1, `pain_relievers` and `gain_creators` lived in `fits`, while `products_services` lived in `value_propositions`. This was asymmetric - Customer Segments had their full profile (jobs/pains/gains), but Value Propositions only had partial value maps.

**Solution:** Move `pain_relievers` and `gain_creators` into `value_propositions` alongside `products_services`. This creates symmetry:
- Customer Segment contains Customer Profile (optional)
- Value Proposition contains Value Map (optional)
- Fit maps between them (optional)

### 2. Consistent Relationship Pattern

**Problem:** v1 used inconsistent patterns: `for_value`, `from_segments`, `provides`, `linked_to`, etc.

**Solution:** All relationships use `for:` and `from:` with typed sub-keys matching section names:
- `for:` - targets/supports/serves (outward relationship)
- `from:` - sourced from/paid by (inward relationship)

Sub-keys match section names exactly:
- `customer_segments`
- `value_propositions`
- `key_resources`
- `key_activities`

### 3. Simplified Fit Mappings

**Problem:** v1 fits were verbose with nested objects for each mapping.

**Solution:** Use tuple arrays for mappings. The validator infers relationship type from ID prefixes:
- `[pr-*, pain-*]` = pain relief
- `[gc-*, gain-*]` = gain creation
- `[ja-*, job-*]` = job addressing (if we add job addressers)

### 4. No Types (for now)

Remove all `type` fields from the structure. Types can be added later as the format matures. This simplifies the initial structure.

## Open Questions Resolved

### Q1: Should fits be nested under value_propositions or top-level?

**Decision:** Top-level. Fit is a first-class entity connecting VP to CS.

### Q2: How to handle jobs that span functional/emotional/social categories?

**Decision:** Single type only. User must choose the dominant category.

### Q3: Should channels have explicit links to value propositions?

**Decision:** Yes. Channels use `for:` with both `value_propositions` and `customer_segments` sub-keys.

## File Structure

```yaml
version: "1.0"

meta:
  name: "Company Name"
  portfolio: explore | exploit
  stage: ideation | discovery | validation | acceleration | transfer | improve | grow | sustain | retire
  derived_from: ./previous.bmml  # optional lineage

# === CUSTOMER SIDE ===

customer_segments:
  - id: cs-[slug]
    name: "Segment Name"
    description: "Who they are"  # optional

    # Customer Profile (optional VPC detail)
    jobs:
      - id: job-[slug]
        description: "What they're trying to accomplish"
    pains:
      - id: pain-[slug]
        description: "What frustrates or blocks them"
    gains:
      - id: gain-[slug]
        description: "What they want to achieve"

# === VALUE SIDE ===

value_propositions:
  - id: vp-[slug]
    name: "Value Proposition Name"
    description: "What you offer"  # optional

    # Value Map (optional VPC detail)
    products_services:
      - id: ps-[slug]
        name: "Product or Service"
    pain_relievers:
      - id: pr-[slug]
        name: "How it relieves pain"
    gain_creators:
      - id: gc-[slug]
        name: "How it creates gain"

# === FIT (optional - VPC detail) ===

fits:
  - id: fit-[slug]
    for:
      value_propositions: [vp-[ref]]
      customer_segments: [cs-[ref]]
    mappings:
      - [pr-[ref], pain-[ref]]  # pain relief
      - [gc-[ref], gain-[ref]]  # gain creation

# === DELIVERY ===

channels:
  - id: ch-[slug]
    name: "Channel Name"
    for:
      value_propositions: [vp-[ref], ...]
      customer_segments: [cs-[ref], ...]

customer_relationships:
  - id: cr-[slug]
    name: "Relationship Type"
    for:
      customer_segments: [cs-[ref], ...]

# === CAPTURE ===

revenue_streams:
  - id: rs-[slug]
    name: "Revenue Stream Name"
    from:
      customer_segments: [cs-[ref], ...]  # who pays
    for:
      value_propositions: [vp-[ref], ...]  # what for

# === INFRASTRUCTURE ===

key_resources:
  - id: kr-[slug]
    name: "Resource Name"
    for:
      value_propositions: [vp-[ref], ...]

key_activities:
  - id: ka-[slug]
    name: "Activity Name"
    for:
      value_propositions: [vp-[ref], ...]

key_partnerships:
  - id: kp-[slug]
    name: "Partner Name"
    for:
      key_resources: [kr-[ref], ...]
      key_activities: [ka-[ref], ...]

costs:
  - id: cost-[slug]
    name: "Cost Name"
    for:
      key_resources: [kr-[ref], ...]
      key_activities: [ka-[ref], ...]
```

## ID Conventions

All elements use prefixed IDs:
- `cs-` Customer Segment
- `vp-` Value Proposition
- `ps-` Product/Service
- `pr-` Pain Reliever
- `gc-` Gain Creator
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
- `cost-` Cost

## Relationship Summary

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

## Example: Minimal BMC (no VPC detail)

```yaml
version: "1.0"

meta:
  name: "Meal Kit Co"
  portfolio: explore
  stage: validation

customer_segments:
  - id: cs-busy
    name: "Busy Professionals"

value_propositions:
  - id: vp-convenience
    name: "Convenient Meal Kit"

channels:
  - id: ch-social
    name: "Social Media"
    for:
      value_propositions: [vp-convenience]
      customer_segments: [cs-busy]

customer_relationships:
  - id: cr-self
    name: "Self-Service"
    for:
      customer_segments: [cs-busy]

revenue_streams:
  - id: rs-subscription
    name: "Weekly Subscription"
    from:
      customer_segments: [cs-busy]
    for:
      value_propositions: [vp-convenience]

key_resources:
  - id: kr-supply
    name: "Supply Chain"
    for:
      value_propositions: [vp-convenience]

key_activities:
  - id: ka-sourcing
    name: "Ingredient Sourcing"
    for:
      value_propositions: [vp-convenience]

key_partnerships:
  - id: kp-farms
    name: "Local Farms"
    for:
      key_resources: [kr-supply]
      key_activities: [ka-sourcing]

costs:
  - id: cost-ingredients
    name: "Ingredients"
    for:
      key_activities: [ka-sourcing]
```

## Example: Full BMC + VPC

```yaml
version: "1.0"

meta:
  name: "Meal Kit Co"
  portfolio: explore
  stage: validation

customer_segments:
  - id: cs-busy
    name: "Busy Professionals"
    description: "Time-poor, money-rich urban dwellers"
    jobs:
      - id: job-healthy
        description: "Eat healthy despite time constraints"
    pains:
      - id: pain-time
        description: "No time to plan, shop, or cook"
      - id: pain-waste
        description: "Food goes bad before using it"
    gains:
      - id: gain-variety
        description: "Explore new cuisines without effort"

value_propositions:
  - id: vp-convenience
    name: "Convenient Meal Kit"
    description: "Pre-portioned ingredients with recipes"
    products_services:
      - id: ps-kit
        name: "Weekly meal kit box"
      - id: ps-recipes
        name: "Chef-designed recipes"
    pain_relievers:
      - id: pr-time
        name: "Eliminates planning and shopping"
      - id: pr-portions
        name: "Pre-portioned eliminates waste"
    gain_creators:
      - id: gc-variety
        name: "Weekly rotating menu"

fits:
  - id: fit-busy-convenience
    for:
      value_propositions: [vp-convenience]
      customer_segments: [cs-busy]
    mappings:
      - [pr-time, pain-time]
      - [pr-portions, pain-waste]
      - [gc-variety, gain-variety]

channels:
  - id: ch-social
    name: "Social Media"
    for:
      value_propositions: [vp-convenience]
      customer_segments: [cs-busy]

customer_relationships:
  - id: cr-self
    name: "Self-Service App"
    for:
      customer_segments: [cs-busy]

revenue_streams:
  - id: rs-subscription
    name: "Weekly Subscription"
    from:
      customer_segments: [cs-busy]
    for:
      value_propositions: [vp-convenience]

key_resources:
  - id: kr-supply
    name: "Supply Chain Network"
    for:
      value_propositions: [vp-convenience]

key_activities:
  - id: ka-sourcing
    name: "Ingredient Sourcing"
    for:
      value_propositions: [vp-convenience]

key_partnerships:
  - id: kp-farms
    name: "Local Organic Farms"
    for:
      key_resources: [kr-supply]
      key_activities: [ka-sourcing]

costs:
  - id: cost-ingredients
    name: "Ingredient Costs"
    for:
      key_activities: [ka-sourcing]
```

## Acceptance Criteria

- [ ] Update JSON Schema to v2 structure
- [ ] Update TypeScript types to match
- [ ] Update validator for new relationship patterns
- [ ] Update linter for `for:`/`from:` reference checking
- [ ] Migrate existing examples to v2 structure
- [ ] Update tests for v2 validation rules
- [ ] Update website (docs/index.html)

---

## Website Update (docs/index.html)

The project website needs a redesign to match the v2 structure and better communicate what BMML is.

### Design Inspiration

Use the GitHub MCP to study `ghuntley/cursed-website` repo (specifically `index.html`) for design patterns:
- Bold gradient background
- Fixed navigation header
- Hero section with code preview
- Stats/metrics section
- Feature showcase grid
- FAQ accordion
- Installation section
- Community links
- Mobile responsive

Adopt a similar playful but informative tone. Choose a fresh color palette (not lime green, but similarly bold).

### Required Sections

#### 1. Hero
- Project name: **BMML** (Business Model Markup Language)
- Tagline explaining what it is
- Brief description: YAML-based format for describing business models
- CTA buttons: GitHub, Get Started

#### 2. Code Example
- Live `.bmml` file preview showing the format
- Syntax highlighted
- Show both minimal BMC and VPC detail to demonstrate flexibility

#### 3. What is BMC/VPC?
- Explain the 9 Business Model Canvas blocks
- Explain Value Proposition Canvas (Jobs, Pains, Gains ↔ Products, Relievers, Creators)
- Visual representation of the blocks (similar to cursed-website's block chips)

#### 4. Examples Gallery
- Link to or show multiple example .bmml files
- meal-kit-delivery, saas-platform, marketplace examples

#### 5. Installation / Get Started
```bash
npm install -g bmclang
bmclang validate example.bmml
bmclang lint example.bmml
```
- Show CLI commands
- Link to VS Code extension setup

#### 6. Roadmap / WIP Status
- Clearly indicate this is a work in progress
- Show what's done (v1 MVP, CLI, validation)
- Show what's planned (v2 structure, more tooling)

#### 7. FAQ Accordion
Include these questions:

**What is BMML?**
A YAML-based markup language for describing business models. It's designed to be AI-analyzable, version-controllable, and human-readable.

**Who made this?**
Created by [Hiasinho](https://hia.sh). Open source project.

**Is this official/approved by Osterwalder?**
No. Alexander Osterwalder and Yves Pigneur were not directly involved in creating BMML. This is an independent open source project inspired by their frameworks (Business Model Canvas, Value Proposition Canvas). The goal is to make working with business model data more AI-friendly. We plan to share this with them for feedback.

**What's the goal?**
Make business model data more AI-friendly. Enable version control, validation, and machine analysis of business models.

**How can I contribute?**
Fork the GitHub repo, submit PRs. See CONTRIBUTING.md (if exists) or open issues.

**Is this a commercial project?**
No. This is a free, open source project.

#### 8. Footer
- GitHub link
- Spec link
- License
- Made by Hiasinho (https://hias.in)

### Technical Requirements

- Single HTML file (self-contained, like cursed-website)
- Mobile responsive
- No build step required
- Minimal/no external dependencies
- Fast loading

### Acceptance Criteria

- [ ] New design inspired by ghuntley/cursed-website
- [ ] All required sections present
- [ ] Code examples show v2 structure
- [ ] FAQ includes Osterwalder disclaimer
- [ ] Mobile responsive
- [ ] WIP status clearly indicated
- [ ] Links work (GitHub, spec, etc.)

---

## Migration Notes

Changes from v1:
1. Move `pain_relievers`, `gain_creators` from `fits` to `value_propositions`
2. Replace `for_value`, `from_segments`, etc. with `for:`/`from:` sub-keys
3. Replace verbose fit mappings with tuple arrays
4. Remove all `type` fields
5. Rename `cost_structure` to `costs` (array)

## Out of Scope

Same as v1 - see bmclang-mvp.md backlog section.
