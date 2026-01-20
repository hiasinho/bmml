# BMCLang

A markup format for describing business models, based on Alexander Osterwalder's work.

## Build & Run

```bash
# Validate a .bmc file
bin/validate examples/coffee_shop.bmc

# Convert to other formats
bin/convert examples/coffee_shop.bmc --format json
```

## Validation

```bash
# Run tests
bin/test

# Lint
bin/lint
```

## Patterns

- Study @STYLE.md for code style
- Study specs/*.md for format requirements
- Examples in examples/*.bmc are the source of truth

## Architecture

- YAML-based format with `.bmc` extension
- Schema validation via JSON Schema
- Relationships are first-class citizens (not just the 9 blocks)
