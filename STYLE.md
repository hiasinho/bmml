# Style Guide

## YAML Conventions

### Indentation
- 2 spaces, no tabs
- Consistent nesting depth

### Keys
- Use snake_case for all keys
- Prefer descriptive names over abbreviations

```yaml
# Good
customer_segments:
  - id: cs-remote-workers

# Bad
custSegs:
  - id: cs1
```

### IDs
- Prefix with element type abbreviation
- Use kebab-case after prefix
- Keep concise but meaningful

```yaml
# Prefixes
cs-   # customer_segment
vp-   # value_proposition
ch-   # channel
cr-   # customer_relationship
rs-   # revenue_stream
kr-   # key_resource
ka-   # key_activity
kp-   # key_partnership
job-  # job_to_be_done
pain- # pain
gain- # gain
hyp-  # hypothesis
ev-   # evidence
```

### Lists
- Use block style for multi-item lists
- Use flow style only for simple ID references

```yaml
# Block style for objects
customer_segments:
  - id: cs-one
    name: Segment One
  - id: cs-two
    name: Segment Two

# Flow style for ID references
targets: [cs-one, cs-two]
```

### Strings
- Use quotes for strings with special characters
- No quotes needed for simple strings

```yaml
name: Simple Name           # no quotes
tagline: "We're #1!"        # quotes for special chars
description: |              # multiline
  A longer description
  that spans multiple lines.
```

## Schema Conventions

### Required vs Optional
- `id` is always required
- `name` is required for user-facing elements
- Everything else is optional with sensible defaults

### Confidence Scores
- Range: 0.0 to 1.0
- Default: 0.5 (neutral/unknown)
- Only include when meaningfully different from default

### Relationships
- Always use ID references, never embed objects
- Use arrays even for single relationships (consistency)

```yaml
# Good
targets: [cs-remote-workers]

# Bad
target: cs-remote-workers
```

## File Organization

### .bmc Files
- One business model per file
- Sections in order: meta, canvas blocks, environment, patterns, hypotheses, evidence
- Use YAML comments to separate major sections

### Examples
- Each example should demonstrate specific features
- Include comments explaining notable patterns
- Keep realistic but concise

## Code Conventions

### Validation Scripts
- Ruby or shell scripts in `bin/`
- Exit 0 on success, non-zero on failure
- Output errors to stderr

### Tests
- One test file per feature
- Descriptive test names
- Test both valid and invalid cases
