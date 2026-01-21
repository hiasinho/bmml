# BMML - Business Model Markup Language

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE.md)
[![Tests](https://img.shields.io/badge/tests-424%20passing-brightgreen.svg)]()
[![Node](https://img.shields.io/badge/node-%E2%89%A522-green.svg)]()

A YAML-based markup format for describing business models, based on Alexander Osterwalder's Business Model Canvas and Value Proposition Canvas frameworks.

## What is BMML?

BMML (`.bmml` files) provides a structured, machine-readable way to capture business models. It's designed to be:

- **AI-analyzable** - Structured for machine parsing and analysis
- **Version-controllable** - Git-friendly with meaningful diffs
- **Validatable** - Schema-enforced consistency and relationship checking
- **Human-readable** - Familiar YAML syntax for technical users
- **Visualizable** - Render as SVG Business Model Canvas diagrams

## Installation

```bash
# Clone and install
git clone https://github.com/hiasinho/bmml.git
cd bmml
pnpm install
pnpm build
```

## Quick Start

Create a file called `my-model.bmml`:

```yaml
version: "2.0"

meta:
  name: "My Startup"
  stage: exploration

customer_segments:
  - id: cs-main
    name: Target Customer
    description: Our primary customer segment

value_propositions:
  - id: vp-core
    name: Core Value
    description: What value we deliver

channels:
  - id: ch-web
    name: Website
    for:
      value_propositions: [vp-core]
      customer_segments: [cs-main]
```

Then validate it:

```bash
bmml validate my-model.bmml
```

## CLI Commands

### Validate

Check a file against the BMML schema:

```bash
bmml validate model.bmml
bmml validate model.bmml --json
```

### Lint

Run validation plus semantic checks (reference integrity, completeness, etc.):

```bash
bmml lint model.bmml
bmml lint model.bmml --json
```

### Render

Generate an SVG Business Model Canvas from a BMML file:

```bash
bmml render model.bmml              # Output to stdout
bmml render model.bmml -o canvas.svg  # Write to file
```

### Migrate

Convert v1 files to v2 format:

```bash
bmml migrate old-model.bmml           # Preview (dry-run)
bmml migrate --in-place old-model.bmml  # Update file
```

See [MIGRATION.md](MIGRATION.md) for a complete migration guide.

## Programmatic API

```typescript
import { validateDocument, lint, render } from 'bmml';
import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';

// Parse and validate
const content = readFileSync('model.bmml', 'utf-8');
const doc = yaml.load(content);
const validation = validateDocument(doc);

if (validation.valid) {
  // Lint for semantic issues
  const issues = lint(doc);

  // Render to SVG
  const svg = render(doc);
}
```

## Examples

The `examples/` directory contains real-world business model examples:

| File | Description |
|------|-------------|
| `meal-kit-minimal.bmml` | Meal kit delivery (minimal BMC) |
| `meal-kit-full.bmml` | Meal kit with full VPC detail |
| `airbnb.bmml` | Two-sided marketplace model |
| `saas-platform.bmml` | SaaS platform model |
| `photo-sharing-pivot.bmml` | Pivot tracking example |

The `examples/progressive/` directory shows how to incrementally add detail.

## Specification

See `specs/bmclang-mvp.md` for the complete BMML specification, including:

- All entity types (customer segments, value propositions, channels, etc.)
- ID prefix conventions
- Relationship patterns
- Value Proposition Canvas integration

## Editor Setup

See [EDITOR_SETUP.md](EDITOR_SETUP.md) for JSON Schema configuration in VS Code, JetBrains IDEs, and other editors.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and contribution guidelines.

## License

MIT License - see [LICENSE.md](LICENSE.md) for details.

**Note:** This license applies to the BMML code and specification only. The Business Model Canvas and Value Proposition Canvas are intellectual property of Strategyzer AG. See the license file for attribution details.
