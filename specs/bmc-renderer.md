# Spec: BMC Renderer

## Overview

Render BMML files as SVG Business Model Canvas diagrams with color-coded sticky notes that visualize customer segment connections.

## Problem

Users have structured BMML data but no way to visualize it as a traditional BMC diagram. The 9-block canvas format is the standard way to communicate business models. Color-coding by customer segment helps show how all elements connect back to the customers being served.

## Acceptance Criteria

### CLI Command

- [ ] `bmml render <file>` outputs SVG to stdout
- [ ] `bmml render <file> --output <path>` writes to file
- [ ] `bmml render <file> -o <path>` shorthand for output
- [ ] Default behavior: output to stdout (pipeable)
- [ ] Exit code 0 on success, 1 on error

### SVG Output

- [ ] Self-contained SVG (no external dependencies)
- [ ] Standard 9-block BMC layout
- [ ] Sticky notes color-coded by customer segment connection
- [ ] Multi-segment elements shown as stacked sticky notes
- [ ] Strategyzer attribution in footer
- [ ] Fixed viewBox dimensions

### BMC Layout (Official Strategyzer Proportions)

Based on the official Strategyzer canvas template:

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  The Business Model Canvas            │ Designed for: │ Designed by: │ Date: │ Ver: │
├────────────┬────────────┬─────────────┬────────────┬─────────────────────────────────┤
│            │            │             │            │                                 │
│    Key     │    Key     │             │  Customer  │                                 │
│ Partnerships│ Activities │   Value    │Relationships│       Customer                 │
│    [icon]  │   [icon]   │Propositions │   [icon]   │       Segments                  │
│            │            │   [icon]    │            │         [icon]                  │
│            ├────────────┤             ├────────────┤                                 │
│            │            │             │            │                                 │
│            │    Key     │             │  Channels  │                                 │
│            │ Resources  │             │   [icon]   │                                 │
│            │   [icon]   │             │            │                                 │
│            │            │             │            │                                 │
├────────────┴────────────┴──────┬──────┴────────────┴─────────────────────────────────┤
│                                │                                                     │
│       Cost Structure [icon]    │              Revenue Streams [icon]                 │
│                                │                                                     │
├────────────────────────────────┴─────────────────────────────────────────────────────┤
│  [Strategyzer logo]  The Business Model Canvas - strategyzer.com  CC BY-SA 3.0      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

**Grid Proportions (based on official template):**

| Section | Width | Height |
|---------|-------|--------|
| Key Partnerships | 20% | 75% (full main) |
| Key Activities | 20% | 37.5% (top half) |
| Key Resources | 20% | 37.5% (bottom half) |
| Value Propositions | 20% | 75% (full main) |
| Customer Relationships | 20% | 37.5% (top half) |
| Channels | 20% | 37.5% (bottom half) |
| Customer Segments | 20% | 75% (full main) |
| Cost Structure | 50% | 25% (bottom row) |
| Revenue Streams | 50% | 25% (bottom row) |

**Block Icons (simple SVG icons):**
- Key Partnerships: chain links
- Key Activities: lightning bolt
- Key Resources: factory/building
- Value Propositions: gift box
- Customer Relationships: heart
- Channels: delivery truck
- Customer Segments: smiley face
- Cost Structure: price tag
- Revenue Streams: dollar sign

## Color-Coding System

### Customer Segment Colors

Each customer segment gets a unique color from a predefined palette (6-8 colors):

```
Segment 1: #FFE066 (yellow)
Segment 2: #7EC8E3 (blue)
Segment 3: #98D8AA (green)
Segment 4: #FFB366 (orange)
Segment 5: #DDA0DD (plum)
Segment 6: #87CEEB (sky blue)
Segment 7: #F0E68C (khaki)
Segment 8: #DEB887 (burlywood)
```

### Connection Traversal (Full Chain)

Elements inherit color from connected customer segments via full relationship traversal:

```
Customer Segments ← direct color assignment

Fits → for.customer_segments (direct)
     → for.value_propositions (links VP to CS)

Value Propositions → via fits that reference them

Channels → for.customer_segments (direct)

Customer Relationships → for.customer_segments (direct)

Revenue Streams → from.customer_segments (direct)
               → for.value_propositions → VP → Fits → CS

Key Resources → for.value_propositions → VP → Fits → CS

Key Activities → for.value_propositions → VP → Fits → CS

Key Partnerships → for.key_resources → KR → VP → Fits → CS
                → for.key_activities → KA → VP → Fits → CS

Costs → for.key_resources → KR → VP → Fits → CS
      → for.key_activities → KA → VP → Fits → CS
```

### Multi-Segment Stacking

When an element connects to multiple customer segments:
- Render as stacked sticky notes (one per segment)
- Each sticky in the stack has its segment's color
- Stack is offset slightly (e.g., 4px right, 4px down per layer)
- **Top sticky**: first customer segment (by definition order in BMML)
- **Bottom stickies**: subsequent segments, visible as offset edges

Visual example (element connected to 3 segments):
```
    ┌─────────┐
   ┌┴────────┐│  ← Segment 3 color (bottom)
  ┌┴────────┐││  ← Segment 2 color (middle)
  │ Element │┘│  ← Segment 1 color (top, first defined)
  │  Name   │─┘
  └─────────┘
```

### Orphaned Elements (No Connection)

Elements with no path to any customer segment:
- Rendered in **gray** (#CCCCCC)
- Indicates incomplete model / missing relationships

## Canvas Header

The top of the canvas includes:
- **Title**: "The Business Model Canvas" (left side, large serif-style font)
- **Meta fields** (right side, small boxes):
  - "Designed for:" → `meta.name` from BMML
  - "Designed by:" → leave empty or configurable
  - "Date:" → `meta.updated` or `meta.created` from BMML
  - "Version:" → derive from filename or leave empty

## Sticky Note Design

### Single Sticky
- Rectangle with slightly rounded corners (2-3px radius)
- Subtle drop shadow (small offset, light gray)
- Light background color (segment-specific)
- Padding: ~6-8px
- Font: sans-serif, ~9-11px
- Text color: dark gray (#333)
- Word wrap for long names (2-3 lines max)
- Slight rotation for "hand-placed" feel (optional: ±1-2°)

### Layout Within Blocks
- Grid arrangement within available space
- Leave room for block label (top-left) and icon (top-right)
- Sticky notes placed in the remaining area
- Flow left-to-right, top-to-bottom
- Consistent spacing (~8-10px gap)
- Start stickies below the label line

### Block Labels
- Black text, sans-serif font
- Title case (e.g., "Key Partnerships")
- Positioned at top-left of each block
- Icon at top-right of each block

## Strategyzer Attribution

Footer area (required for CC BY-SA compliance):
```
Copyright Strategyzer AG | The Business Model Canvas | strategyzer.com | CC BY-SA 3.0
```

Keep it simple - single line at the bottom of the SVG.

## Website Integration

- [ ] Render example BMML files as SVG
- [ ] Add SVG examples to `docs/index.html`
- [ ] Examples gallery showing color-coded canvases

### Examples to Render
- `examples/airbnb.bmml` - Two-sided marketplace (guests vs hosts colors)
- `examples/meal-kit-delivery.bmml` - Multiple segments
- `examples/marketplace.bmml` - Platform example

## Technical Approach

### File Structure

```
src/
  render.ts        # Main rendering logic
  render-svg.ts    # SVG generation
  render-graph.ts  # Connection graph traversal
```

### Connection Graph Algorithm

```typescript
interface ConnectionGraph {
  // Map element ID → set of connected customer segment IDs
  elementToSegments: Map<string, Set<string>>;
}

function buildConnectionGraph(doc: BMCDocumentV2): ConnectionGraph {
  // 1. Start with customer segments (trivial: each connects to itself)
  // 2. Process fits: link VPs to segments
  // 3. Process channels, relationships: direct segment refs
  // 4. Process revenue streams: from.customer_segments + for.value_propositions
  // 5. Process key_resources, key_activities: via VP connections
  // 6. Process key_partnerships, costs: via KR/KA connections
}
```

### SVG Structure

```svg
<svg viewBox="0 0 1200 800">
  <defs>
    <filter id="shadow">...</filter>
  </defs>

  <!-- Background and grid -->
  <rect class="canvas-bg" .../>
  <path class="grid-lines" .../>

  <!-- Block labels -->
  <text class="block-label">Key Partners</text>
  ...

  <!-- Sticky notes per block -->
  <g class="block-key-partners">
    <g class="sticky" transform="...">
      <!-- Stacked rects for multi-segment -->
      <rect fill="#color3" x="8" y="8" .../>
      <rect fill="#color2" x="4" y="4" .../>
      <rect fill="#color1" .../>
      <text>Partner Name</text>
    </g>
  </g>

  <!-- Attribution -->
  <text class="attribution">The Business Model Canvas - strategyzer.com</text>
</svg>
```

## Out of Scope

- Value Proposition Canvas visualization
- Fit visualization (mapping lines)
- Interactive features
- HTML/JPG/PDF output
- Custom color themes
- Animation

## Dependencies

No new dependencies - pure SVG string generation.

## Files to Investigate

- `src/cli.ts` - Add render command
- `src/types.ts` - BMCDocumentV2 type for structure reference
- `examples/*.bmml` - Test files
- `docs/index.html` - Website integration

## Design Decisions

**SVG Dimensions:** ~1600x1000 (matches official BMC aspect ratio ~1.6:1)

**Fonts:** System fonts (Arial/Helvetica fallback) - no embedding needed for SVG

## Open Questions

1. Should block labels include element count? (e.g., "Key Partners (3)")
2. Include the small block icons or keep it minimal?
3. Slight sticky note rotation for organic feel, or keep perfectly aligned?
