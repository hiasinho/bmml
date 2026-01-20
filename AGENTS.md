# BMCLang

A markup format for describing business models, based on Alexander Osterwalder's work.

## Quick Start

```bash
pnpm install
pnpm test
```

## Project Structure

```
src/
  index.ts      # exports
  types.ts      # minimal types (expand per spec)
  validator.ts  # stub - implement this
  linter.ts     # stub - implement this
test/
  fixtures/     # example .bmc files (valid and invalid)
specs/
  bmclang-mvp.md  # THE SPEC - read this first
```

## What Needs Building

1. **Validator** - Schema validation per spec
2. **Linter** - Lint rules (reference checking, completeness, etc.)
3. **CLI** - Command line interface
4. **Full Types** - Expand types.ts to match spec

## Patterns

- Study `specs/bmclang-mvp.md` for the full specification
- Test fixtures in `test/fixtures/*.bmc` show valid/invalid examples
- `valid-*.bmc` should pass validation
- `invalid-*.bmc` should fail with specific errors
