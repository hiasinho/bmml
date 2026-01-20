# Migrating from v1 to v2

This guide explains how to migrate your BMML files from version 1 to version 2.

## v1 vs v2 Comparison Table

| Feature | v1 | v2 |
|---------|----|----|
| **Version field** | `version: "1.0"` | `version: "2.0"` |
| **Relationship pattern** | Mixed: `segments`, `segment`, `for_value`, `from_segments`, `provides`, `linked_to` | Uniform: `for:` and `from:` with typed sub-keys |
| **Type fields** | Required on jobs, pains, gains, products/services, channels, relationships, resources, activities, partnerships | Removed from all entities |
| **Importance/severity** | `importance:` on jobs/gains, `severity:` on pains | Removed |
| **Pain relievers** | Inline in `fits[].pain_relievers[]` with `pain:`, `through:`, `description:` | In `value_propositions[].pain_relievers[]` with `id:`, `name:` |
| **Gain creators** | Inline in `fits[].gain_creators[]` with `gain:`, `through:`, `description:` | In `value_propositions[].gain_creators[]` with `id:`, `name:` |
| **Fit mappings** | Implicit via inline pain_relievers/gain_creators | Explicit tuples: `mappings: [[pr-*, pain-*], [gc-*, gain-*]]` |
| **Fit references** | `value_proposition:` + `customer_segment:` (singular) | `for: { value_propositions: [], customer_segments: [] }` (arrays) |
| **Cost structure** | `cost_structure: { type:, major_costs: [] }` | `costs: []` array with `id:`, `name:`, `for:` |
| **Channel refs** | `segments: []` | `for: { customer_segments: [], value_propositions: [] }` |
| **Relationship refs** | `segment:` (singular) | `for: { customer_segments: [] }` |
| **Revenue refs** | `from_segments: []`, `for_value:` | `from: { customer_segments: [] }`, `for: { value_propositions: [] }` |
| **Resource/activity refs** | `for_value: []` | `for: { value_propositions: [] }` |
| **Partnership refs** | `provides: []` | `for: { key_resources: [], key_activities: [] }` |
| **Product/service** | `type:` + `description:` | `name:` only |
| **New ID prefixes** | - | `pr-`, `gc-`, `cost-` |

## Quick Start

```bash
# Preview migration (output to stdout)
bmml migrate myfile.bmml

# Migrate file in place
bmml migrate --in-place myfile.bmml
```

The CLI automatically validates the migrated output against the v2 schema before writing.

## What Changed in v2

Version 2 introduces a more consistent structure with clearer relationship patterns. Here's a summary of the changes:

### Relationship Pattern Changes

All entity relationships now use a consistent `for:` and `from:` pattern with typed sub-keys:

| v1 Pattern | v2 Pattern |
|------------|------------|
| `segments: [cs-a]` | `for: { customer_segments: [cs-a] }` |
| `segment: cs-a` | `for: { customer_segments: [cs-a] }` |
| `for_value: [vp-a]` | `for: { value_propositions: [vp-a] }` |
| `from_segments: [cs-a]` | `from: { customer_segments: [cs-a] }` |
| `provides: [kr-a]` | `for: { key_resources: [kr-a] }` |
| `linked_to: [kr-a]` | `for: { key_resources: [kr-a] }` |

### Type Field Removal

v2 removes `type` fields from most entities. The `description` field becomes `name`:

**v1:**
```yaml
products_services:
  - id: ps-app
    type: product
    description: Mobile application
```

**v2:**
```yaml
products_services:
  - id: ps-app
    name: Mobile application
```

Similarly, `type`, `importance`, and `severity` fields are removed from `jobs`, `pains`, and `gains`.

### Cost Structure Refactoring

The `cost_structure` object is replaced with a top-level `costs` array:

**v1:**
```yaml
cost_structure:
  type: value_driven
  characteristics: [fixed_costs_heavy]
  major_costs:
    - name: Server Hosting
      type: fixed
      linked_to: [kr-servers]
```

**v2:**
```yaml
costs:
  - id: cost-server-hosting
    name: Server Hosting
    for:
      key_resources: [kr-servers]
```

The migration tool generates `cost-*` IDs from the cost name (slugified).

### Pain Relievers and Gain Creators

In v1, pain relievers and gain creators are defined inline within fits. In v2, they move to the value proposition's Value Map:

**v1:**
```yaml
value_propositions:
  - id: vp-main
    name: Main Product

fits:
  - id: fit-main
    value_proposition: vp-main
    customer_segment: cs-users
    pain_relievers:
      - pain: pain-slow
        through: [ps-engine]
        description: Automates the slow parts
    gain_creators:
      - gain: gain-speed
        through: [ps-engine]
        description: 10x faster execution
```

**v2:**
```yaml
value_propositions:
  - id: vp-main
    name: Main Product
    pain_relievers:
      - id: pr-slow-automation
        name: Automates the slow parts
    gain_creators:
      - id: gc-speed-boost
        name: 10x faster execution

fits:
  - id: fit-main
    for:
      value_propositions: [vp-main]
      customer_segments: [cs-users]
    mappings:
      - [pr-slow-automation, pain-slow]
      - [gc-speed-boost, gain-speed]
```

The migration tool:
1. Extracts pain_relievers/gain_creators from fits
2. Groups them by their value proposition
3. Generates new `pr-*` and `gc-*` IDs
4. Creates tuple mappings in the fit

### Fit Mappings

v1 fits use verbose objects, v2 uses compact tuples:

**v1:**
```yaml
fits:
  - id: fit-main
    value_proposition: vp-main
    customer_segment: cs-users
    pain_relievers:
      - pain: pain-slow
        through: [ps-workflow]
```

**v2:**
```yaml
fits:
  - id: fit-main
    for:
      value_propositions: [vp-main]
      customer_segments: [cs-users]
    mappings:
      - [pr-slow-automation, pain-slow]   # pain reliever -> pain
      - [gc-speed-boost, gain-speed]       # gain creator -> gain
```

Tuple format: `[solution-id, problem-id]` where:
- `[pr-*, pain-*]` = pain relief mapping
- `[gc-*, gain-*]` = gain creation mapping

## Entity-by-Entity Changes

### Channels

```yaml
# v1
channels:
  - id: ch-web
    name: Website
    type: owned
    segments: [cs-users]

# v2
channels:
  - id: ch-web
    name: Website
    for:
      customer_segments: [cs-users]
```

The `type` field is removed.

### Customer Relationships

```yaml
# v1
customer_relationships:
  - id: cr-support
    segment: cs-users
    type: dedicated
    description: Premium support

# v2
customer_relationships:
  - id: cr-support
    name: Premium support
    for:
      customer_segments: [cs-users]
```

The `type` field is removed. `description` becomes `name`.

### Revenue Streams

```yaml
# v1
revenue_streams:
  - id: rs-subscription
    name: Monthly Subscription
    type: recurring
    from_segments: [cs-users]
    for_value: vp-main

# v2
revenue_streams:
  - id: rs-subscription
    name: Monthly Subscription
    from:
      customer_segments: [cs-users]
    for:
      value_propositions: [vp-main]
```

Note: `for_value` (string or array) becomes `for.value_propositions` (always array).

### Key Resources

```yaml
# v1
key_resources:
  - id: kr-platform
    name: Platform
    type: intellectual
    for_value: [vp-main]

# v2
key_resources:
  - id: kr-platform
    name: Platform
    for:
      value_propositions: [vp-main]
```

The `type` field is removed.

### Key Activities

```yaml
# v1
key_activities:
  - id: ka-development
    name: Product Development
    type: production
    for_value: [vp-main]

# v2
key_activities:
  - id: ka-development
    name: Product Development
    for:
      value_propositions: [vp-main]
```

The `type` field is removed.

### Key Partnerships

```yaml
# v1
key_partnerships:
  - id: kp-vendor
    name: Tech Vendor
    type: supplier
    motivation: resource_acquisition
    provides: [kr-platform]

# v2
key_partnerships:
  - id: kp-vendor
    name: Tech Vendor
    for:
      key_resources: [kr-platform]
```

The `type` and `motivation` fields are removed. `provides` becomes `for.key_resources` or `for.key_activities`.

### Jobs, Pains, Gains

```yaml
# v1
jobs:
  - id: job-productivity
    type: functional
    description: Be more productive
    importance: high

pains:
  - id: pain-slow
    description: Current process is slow
    severity: high

gains:
  - id: gain-speed
    description: Complete tasks faster
    importance: high

# v2
jobs:
  - id: job-productivity
    description: Be more productive

pains:
  - id: pain-slow
    description: Current process is slow

gains:
  - id: gain-speed
    description: Complete tasks faster
```

The `type`, `importance`, and `severity` fields are removed.

## CLI Reference

```bash
# Basic usage - preview migration
bmml migrate file.bmml

# Migrate in place
bmml migrate --in-place file.bmml
bmml migrate -i file.bmml

# Output as JSON
bmml migrate --json file.bmml
```

### Validation

The migrate command automatically validates the output against the v2 schema. If the migration produces invalid output, the command will fail with an error message.

### Dry Run

By default, `bmml migrate` outputs to stdout without modifying the original file. Use `--in-place` to update the file directly.

## Troubleshooting

### "Document is v1 format. Run 'bmml migrate' to convert to v2."

This error appears when trying to validate or lint a v1 file. The CLI only supports v2 files for validation/linting. Migrate your file first:

```bash
bmml migrate --in-place yourfile.bmml
bmml validate yourfile.bmml
```

### Generated IDs

The migration tool generates IDs for new entities:

- **Pain relievers**: `pr-{slugified-description}` (e.g., `pr-automates-slow-parts`)
- **Gain creators**: `gc-{slugified-description}` (e.g., `gc-faster-execution`)
- **Costs**: `cost-{slugified-name}` (e.g., `cost-server-hosting`)

If you need specific IDs, manually edit the migrated file.

### Empty costs Array

If your v1 file has no `cost_structure`, the migrated v2 file will have an empty `costs: []` array. This is valid and can be populated later.

### Job Addressers

v1 `job_addressers` in fits are not migrated to v2, as v2 does not currently include a job addressing pattern. This is intentional - the v2 format focuses on pain/gain mappings. Job addressing may be added in a future version.

## Version Detection

The CLI auto-detects file version by examining the structure:

- **v2 indicators**: `for:` or `from:` patterns in fits, channels, relationships, revenue streams, resources, partnerships, or costs
- **v1 indicators**: `segments`, `segment`, `for_value`, `from_segments`, `provides`, `linked_to`, or `cost_structure`
- **Explicit version**: `version: "2.0"` field

If version cannot be detected, the CLI assumes v2.
