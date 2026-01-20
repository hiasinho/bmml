# Editor Setup for BMML

This guide explains how to set up editor support for `.bmml` files.

## VS Code

Use the [Red Hat YAML extension](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) with JSON Schema:

1. Install the [Red Hat YAML extension](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml)

2. Add to your workspace `.vscode/settings.json`:

```json
{
  "files.associations": {
    "*.bmml": "yaml"
  },
  "yaml.schemas": {
    "./schemas/bmclang-v2.schema.json": "*.bmml"
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
    "https://raw.githubusercontent.com/bmclang/bmclang/main/schemas/bmclang-v2.schema.json": "*.bmml"
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
   - Schema file or URL: `schemas/bmclang-v2.schema.json` (or the raw GitHub URL)
   - File path pattern: `*.bmml`

## Vim/Neovim

### Syntax Highlighting

BMML includes a Vim syntax file that provides highlighting for BMML-specific elements on top of YAML. To install:

**Using vim-plug:**
```vim
Plug 'bmclang/bmclang', { 'rtp': 'vim' }
```

**Using lazy.nvim:**
```lua
{ "bmclang/bmclang", config = function()
  vim.opt.rtp:append(vim.fn.stdpath("data") .. "/lazy/bmclang/vim")
end }
```

**Manual installation:**
```bash
# Copy to your Vim runtime path
cp -r vim/syntax vim/ftdetect ~/.vim/
# Or for Neovim
cp -r vim/syntax vim/ftdetect ~/.config/nvim/
```

The syntax file highlights:
- BMC building blocks (customer_segments, value_propositions, etc.)
- VPC elements (jobs, pains, gains, pain_relievers, gain_creators)
- ID prefixes (cs-, vp-, job-, pain-, pr-, gc-, etc.)
- v2 relationship patterns (for:, from:, mappings:)
- Portfolio/stage values

### Schema Validation with LSP

For schema validation and auto-completion, configure a YAML language server.

**With coc.nvim:**

Add to your `coc-settings.json`:

```json
{
  "yaml.schemas": {
    "./schemas/bmclang-v2.schema.json": "*.bmml"
  }
}
```

**With nvim-lspconfig:**

Configure yamlls:

```lua
require('lspconfig').yamlls.setup {
  settings = {
    yaml = {
      schemas = {
        ["./schemas/bmclang-v2.schema.json"] = "*.bmml"
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
      "./schemas/bmclang-v2.schema.json": "*.bmml"
    }
  }
}
```

## Schema URL

The JSON Schema is available at:
- Local: `schemas/bmclang-v2.schema.json`
- GitHub (once published): `https://raw.githubusercontent.com/bmclang/bmclang/main/schemas/bmclang-v2.schema.json`

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
