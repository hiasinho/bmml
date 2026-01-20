# Editor Setup for BMML

This guide explains how to set up editor support for `.bmml` files.

## VS Code

### Option 1: BMML Extension (Recommended)

The `vscode-bmml` extension provides:
- Full syntax highlighting with BMML-specific tokens
- ID reference highlighting
- Enum value highlighting
- JSON Schema validation

To install locally:

```bash
cd vscode-bmml
npm install
npx vsce package
# Install the .vsix file via VS Code Extensions panel
```

### Option 2: YAML Extension with Schema

For a lightweight setup using only the YAML extension:

1. Install the [Red Hat YAML extension](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml)

2. Add to your workspace `.vscode/settings.json`:

```json
{
  "files.associations": {
    "*.bmml": "yaml"
  },
  "yaml.schemas": {
    "./schemas/bmclang.schema.json": "*.bmml"
  }
}
```

Or for user-wide settings with the published schema:

```json
{
  "files.associations": {
    "*.bmml": "yaml"
  },
  "yaml.schemas": {
    "https://raw.githubusercontent.com/bmclang/bmclang/main/schemas/bmclang.schema.json": "*.bmml"
  }
}
```

This provides:
- YAML syntax highlighting
- Schema validation with error messages
- Auto-completion for property names and enum values
- Hover documentation

## JetBrains IDEs (IntelliJ, WebStorm, etc.)

1. Go to **Settings > Languages & Frameworks > Schemas and DTDs > JSON Schema Mappings**
2. Click **+** to add a new mapping
3. Set:
   - Name: `BMML`
   - Schema file or URL: `schemas/bmclang.schema.json` (or the raw GitHub URL)
   - File path pattern: `*.bmml`

## Vim/Neovim

### With coc.nvim

Add to your `coc-settings.json`:

```json
{
  "yaml.schemas": {
    "./schemas/bmclang.schema.json": "*.bmml"
  }
}
```

### With nvim-lspconfig

Configure yamlls:

```lua
require('lspconfig').yamlls.setup {
  settings = {
    yaml = {
      schemas = {
        ["./schemas/bmclang.schema.json"] = "*.bmml"
      }
    }
  }
}
```

## Sublime Text

1. Install [LSP](https://packagecontrol.io/packages/LSP) and [LSP-yaml](https://packagecontrol.io/packages/LSP-yaml)
2. Add to LSP-yaml settings:

```json
{
  "settings": {
    "yaml.schemas": {
      "./schemas/bmclang.schema.json": "*.bmml"
    }
  }
}
```

## Schema URL

The JSON Schema is available at:
- Local: `schemas/bmclang.schema.json`
- GitHub (once published): `https://raw.githubusercontent.com/bmclang/bmclang/main/schemas/bmclang.schema.json`

## Validation Without Editor Integration

You can validate `.bmml` files from the command line:

```bash
# Validate schema
pnpm validate examples/meal-kit-delivery.bmml

# Or using the CLI directly
node --import tsx src/cli.ts validate examples/meal-kit-delivery.bmml

# Run linter for reference integrity
node --import tsx src/cli.ts lint examples/meal-kit-delivery.bmml
```
