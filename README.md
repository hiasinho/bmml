# BMML - Business Model Markup Language

A YAML-based markup format for describing business models, based on Alexander Osterwalder's Business Model Canvas and Value Proposition Canvas frameworks.

## What is BMML?

BMML (`.bmml` files) provides a structured, machine-readable way to capture business models. It's designed to be:

- **AI-analyzable** - Structured for machine parsing and analysis
- **Version-controllable** - Git-friendly with meaningful diffs
- **Validatable** - Schema-enforced consistency and relationship checking
- **Human-readable** - Familiar YAML syntax for technical users

## Quick Start

```bash
pnpm install
pnpm test
```

## Migrating from v1

If you have existing v1 `.bmml` files, migrate them to v2:

```bash
bmml migrate --in-place yourfile.bmml
```

See [MIGRATION.md](MIGRATION.md) for a complete migration guide.

## Learn More

See `specs/bmclang-mvp.md` for the full specification (file retains historical name).
