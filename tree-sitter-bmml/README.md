# tree-sitter-bmml

Tree-sitter grammar and syntax highlighting for BMML (Business Model Markup Language).

## Overview

BMML files are YAML-based, so this package provides:

1. **Highlight queries** for use with `tree-sitter-yaml` - adds BMML-specific highlighting on top of YAML parsing
2. **Filetype detection** configuration for Neovim

The queries highlight:
- BMC building blocks (customer_segments, value_propositions, etc.)
- VPC elements (jobs, pains, gains, fits)
- Relationship patterns (for:, from:)
- Entity ID prefixes (cs-, vp-, pr-, gc-, etc.)
- Portfolio and stage values

## Installation

### Neovim (nvim-treesitter)

Since BMML is YAML-based, the recommended approach is to use the YAML parser with custom queries.

#### 1. Configure filetype detection

Add to your Neovim config (`~/.config/nvim/init.lua` or equivalent):

```lua
vim.filetype.add({
  extension = {
    bmml = 'yaml',  -- Use YAML parser
  },
})
```

#### 2. Install highlight queries

Copy the `queries/highlights.scm` file to your Neovim config:

```bash
mkdir -p ~/.config/nvim/after/queries/yaml
cp queries/highlights.scm ~/.config/nvim/after/queries/yaml/bmml.scm
```

#### 3. Configure nvim-treesitter (optional)

If you want BMML files to use a specific subset of queries, add this to your config:

```lua
-- Ensure yaml parser is installed
require('nvim-treesitter.configs').setup({
  ensure_installed = { 'yaml' },
  highlight = {
    enable = true,
  },
})
```

### Alternative: Using lazy.nvim

```lua
return {
  'nvim-treesitter/nvim-treesitter',
  build = ':TSUpdate',
  config = function()
    require('nvim-treesitter.configs').setup({
      ensure_installed = { 'yaml' },
      highlight = { enable = true },
    })

    -- Register .bmml files as YAML
    vim.filetype.add({
      extension = { bmml = 'yaml' },
    })
  end,
}
```

## Highlight Groups

The queries use these highlight groups:

| Pattern | Highlight Group | Description |
|---------|----------------|-------------|
| `customer_segments`, `value_propositions`, etc. | `@keyword` | BMC sections |
| `version`, `meta` | `@keyword.directive` | Metadata |
| `jobs`, `pains`, `gains` | `@type` | Customer profile |
| `products_services`, `pain_relievers`, `gain_creators` | `@type` | Value map |
| `for`, `from`, `mappings` | `@keyword.operator` | Relationship patterns |
| `cs-*` | `@constant` | Customer segment IDs |
| `vp-*` | `@type.definition` | Value proposition IDs |
| `job-*` | `@string` | Job IDs |
| `pain-*` | `@string.special` | Pain IDs |
| `gain-*` | `@number` | Gain IDs |
| `ps-*` | `@function` | Product/service IDs |
| `pr-*` | `@string` | Pain reliever IDs |
| `gc-*` | `@number` | Gain creator IDs |
| `fit-*` | `@keyword.function` | Fit IDs |
| `ch-*` | `@function.method` | Channel IDs |
| `cr-*` | `@attribute` | Customer relationship IDs |
| `rs-*` | `@variable.builtin` | Revenue stream IDs |
| `kr-*`, `ka-*`, `kp-*` | `@comment` | Infrastructure IDs |
| `cost-*` | `@exception` | Cost IDs |
| `explore`, `exploit` | `@boolean` | Portfolio values |
| Stage names | `@constant` | Stage values |

## Development

```bash
# Install dependencies
npm install

# Generate parser (if grammar.js exists)
npm run generate

# Test in playground
npm start
```

## License

MIT
