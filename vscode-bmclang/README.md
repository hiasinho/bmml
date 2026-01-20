# BMCLang VS Code Extension

Language support for BMCLang business model files (`.bmml`).

## Features

- Syntax highlighting for BMCLang constructs
- JSON Schema validation via YAML extension integration
- Auto-completion for enum values (portfolio, stage, types, etc.)
- Folding based on YAML indentation
- Comment toggling with `#`

## Installation

### From VSIX (Local Install)

1. Package the extension: `cd vscode-bmclang && npx vsce package`
2. In VS Code: Extensions > ... > Install from VSIX
3. Select the generated `.vsix` file

### Development

1. Open the `vscode-bmclang` folder in VS Code
2. Press F5 to launch the Extension Development Host
3. Open a `.bmml` file to test

## Alternative: YAML Extension Integration

If you prefer not to install the extension, you can use the Red Hat YAML extension with schema validation.

1. Install the [YAML extension](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml)
2. Add to your VS Code settings:

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

Or for local development:

```json
{
  "yaml.schemas": {
    "./schemas/bmclang.schema.json": "*.bmml"
  }
}
```

## Syntax Highlighting

The extension provides semantic highlighting for:

- **Top-level keys** (`meta`, `customer_segments`, `value_propositions`, etc.)
- **ID definitions** (`id: cs-busy-professionals`)
- **ID references** (`customer_segment: cs-busy-professionals`)
- **Enum values** (`portfolio: explore`, `stage: validation`, `type: functional`)
- **Version** (`version: "1.0"`)

### ID Prefixes

| Prefix | Entity |
|--------|--------|
| `cs-` | Customer Segment |
| `vp-` | Value Proposition |
| `ps-` | Product/Service |
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

## Requirements

- VS Code 1.75.0 or later
- For schema validation: [YAML extension](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml)

## License

MIT
