# Contributing to BMML

Thank you for your interest in contributing to BMML (Business Model Markup Language).

## Prerequisites

- Node.js 22+
- pnpm 10+

We recommend using [mise](https://mise.jdx.dev/) for version management:

```bash
mise install
```

This will install the correct versions of Node.js and pnpm based on `.mise.toml`.

## Development Setup

1. Clone the repository:

```bash
git clone https://github.com/bmclang/bmclang.git
cd bmclang
```

2. Install dependencies:

```bash
pnpm install
```

3. Run tests to verify setup:

```bash
pnpm test
```

## Project Structure

```
src/
  index.ts      # Package exports
  types.ts      # TypeScript type definitions
  validator.ts  # JSON Schema validation
  linter.ts     # Reference checking and lint rules
  migrate.ts    # v1 to v2 migration tool
  cli.ts        # Command line interface

test/
  *.test.ts     # Test files (Vitest)
  fixtures/     # Example .bmml files for testing

schemas/
  bmclang-v2.schema.json  # JSON Schema for validation

examples/
  *.bmml        # Example business models
  progressive/  # Progressive detail examples

specs/
  bmclang-mvp.md           # Original spec
  bmclang-v2-structure.md  # v2 design document
```

## Development Commands

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type check
pnpm lint

# Build (TypeScript compilation)
pnpm build

# Validate a .bmml file
pnpm validate examples/meal-kit-delivery.bmml
```

## CLI Usage

During development, run the CLI directly with tsx:

```bash
# Validate
node --import tsx src/cli.ts validate examples/meal-kit-delivery.bmml

# Lint
node --import tsx src/cli.ts lint examples/meal-kit-delivery.bmml

# Migrate v1 to v2
node --import tsx src/cli.ts migrate old-v1-file.bmml
```

## Writing Tests

Tests use [Vitest](https://vitest.dev/) with globals enabled:

```typescript
import { describe, it, expect } from 'vitest';
import { validate } from '../src/validator.js';

describe('validate', () => {
  it('accepts valid documents', () => {
    const result = validate(validYaml);
    expect(result.valid).toBe(true);
  });

  it('rejects invalid documents', () => {
    const result = validate(invalidYaml);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining('expected error') })
    );
  });
});
```

Test files should be named `*.test.ts` and placed in the `test/` directory.

## Test Fixtures

Place test fixtures in `test/fixtures/`:

- `valid-v2-*.bmml` - Valid v2 files (should pass validation)
- `invalid-v2-*.bmml` - Invalid v2 files (should fail with specific errors)

## Making Changes

1. Create a branch for your change
2. Make your changes
3. Add tests for new functionality
4. Run `pnpm test` and `pnpm lint` to verify
5. Commit with a descriptive message (see commit format below)
6. Open a pull request

## Commit Message Format

```
<scope>: <summary>

<body - what and why>
```

**Scopes:**
- `schema` - JSON Schema changes
- `validator` - Validation logic
- `linter` - Lint rules
- `types` - TypeScript types
- `cli` - Command line interface
- `examples` - Example files
- `docs` - Documentation
- `test` - Test changes
- `fix` - Bug fixes

**Examples:**

```
validator: add support for v2 fits pattern

The new fits format uses for:/from: sub-keys instead of
direct value_proposition/customer_segment references.
```

```
fix: handle empty revenue_streams array

Previously the linter would crash when revenue_streams
was an empty array. Now it correctly skips validation.
```

## Code Style

- TypeScript strict mode is enabled
- Use ESM imports (`.js` extensions required)
- Follow existing patterns in the codebase
- See `STYLE.md` for YAML/BMML file conventions

## ID Prefixes

When working with BMML files, use these standard prefixes:

| Prefix | Entity |
|--------|--------|
| `cs-` | Customer Segment |
| `vp-` | Value Proposition |
| `ps-` | Product/Service |
| `pr-` | Pain Reliever |
| `gc-` | Gain Creator |
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
| `cost-` | Cost |

## Questions?

- Check existing issues on GitHub
- Open a new issue for questions or discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
