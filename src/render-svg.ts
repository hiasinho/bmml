/**
 * SVG Generation for BMC Renderer
 *
 * Generates SVG strings for Business Model Canvas visualization.
 * Uses color-coded sticky notes to show customer segment connections.
 *
 * Based on the official Strategyzer BMC layout with 9 blocks:
 * - Key Partnerships (KP)
 * - Key Activities (KA) / Key Resources (KR)
 * - Value Propositions (VP)
 * - Customer Relationships (CR) / Channels (CH)
 * - Customer Segments (CS)
 * - Cost Structure
 * - Revenue Streams
 */

import type { BMCDocumentV2 } from './types.js';
import type { ConnectionGraph } from './render-graph.js';

// ============================================================================
// Constants
// ============================================================================

/** Canvas dimensions (official BMC aspect ratio ~1.6:1) */
export const CANVAS_WIDTH = 1600;
export const CANVAS_HEIGHT = 1000;

/** Header height for title and meta */
export const HEADER_HEIGHT = 60;

/** Footer height for Strategyzer attribution */
export const FOOTER_HEIGHT = 30;

/** Main content area dimensions */
export const CONTENT_TOP = HEADER_HEIGHT;
export const CONTENT_HEIGHT = CANVAS_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT;

/** Main blocks height (75% of content) */
export const MAIN_BLOCKS_HEIGHT = CONTENT_HEIGHT * 0.75;

/** Bottom row height (25% of content) */
export const BOTTOM_ROW_HEIGHT = CONTENT_HEIGHT * 0.25;

/** Column widths (5 equal columns for main area) */
export const COLUMN_WIDTH = CANVAS_WIDTH / 5;

/** Sticky note dimensions */
export const STICKY_WIDTH = 120;
export const STICKY_HEIGHT = 60;
export const STICKY_PADDING = 8;
export const STICKY_GAP = 10;
export const STICKY_RADIUS = 3;

/** Multi-segment stack offset */
export const STACK_OFFSET_X = 4;
export const STACK_OFFSET_Y = 4;

/** Label area reserved at top of each block */
export const BLOCK_LABEL_HEIGHT = 30;

// ============================================================================
// Color Palette
// ============================================================================

/** Segment colors - ordered by segment definition order in document */
export const SEGMENT_COLORS: readonly string[] = [
  '#FFE066', // yellow
  '#7EC8E3', // blue
  '#98D8AA', // green
  '#FFB366', // orange
  '#DDA0DD', // plum
  '#87CEEB', // sky blue
  '#F0E68C', // khaki
  '#DEB887', // burlywood
] as const;

/** Color for orphaned elements (no segment connection) */
export const ORPHAN_COLOR = '#CCCCCC';

/** Get the color for a given segment index (0-based) */
export function getSegmentColor(index: number): string {
  // Handle negative indices and wrap around for indices >= palette size
  const len = SEGMENT_COLORS.length;
  const normalizedIndex = ((index % len) + len) % len;
  return SEGMENT_COLORS[normalizedIndex];
}

/**
 * Get colors for an element based on its connected segments.
 * Returns array of colors in segment definition order.
 * Returns [ORPHAN_COLOR] if element has no connections.
 */
export function getElementColors(
  elementId: string,
  graph: ConnectionGraph,
  segmentOrder: string[]
): string[] {
  const connectedSegments = graph.get(elementId);

  if (!connectedSegments || connectedSegments.size === 0) {
    return [ORPHAN_COLOR];
  }

  // Return colors in segment definition order
  const colors: string[] = [];
  for (let i = 0; i < segmentOrder.length; i++) {
    if (connectedSegments.has(segmentOrder[i])) {
      colors.push(getSegmentColor(i));
    }
  }

  return colors.length > 0 ? colors : [ORPHAN_COLOR];
}

// ============================================================================
// SVG Primitives
// ============================================================================

/** Escape special XML characters */
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Wrap text to fit within maxWidth (approximate) */
export function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  // Limit to 3 lines and truncate last line if needed
  if (lines.length > 3) {
    lines.length = 3;
    const last = lines[2];
    if (last.length > maxCharsPerLine - 3) {
      lines[2] = last.slice(0, maxCharsPerLine - 3) + '...';
    }
  }

  return lines;
}

// ============================================================================
// SVG Building Blocks
// ============================================================================

/** Generate SVG defs section with shadow filter */
export function generateDefs(): string {
  return `  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="1" dy="1" stdDeviation="1" flood-opacity="0.2"/>
    </filter>
  </defs>`;
}

/** Generate canvas background and grid lines */
export function generateBackground(): string {
  const mainBottom = CONTENT_TOP + MAIN_BLOCKS_HEIGHT;

  // Grid line positions
  const col1 = COLUMN_WIDTH;
  const col2 = COLUMN_WIDTH * 2;
  const col3 = COLUMN_WIDTH * 3;
  const col4 = COLUMN_WIDTH * 4;
  const midRow = CONTENT_TOP + MAIN_BLOCKS_HEIGHT / 2;
  const costRevenueDiv = CANVAS_WIDTH / 2;

  return `  <!-- Background -->
  <rect x="0" y="0" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="#ffffff"/>

  <!-- Grid lines -->
  <g stroke="#333333" stroke-width="1" fill="none">
    <!-- Outer border -->
    <rect x="0" y="${CONTENT_TOP}" width="${CANVAS_WIDTH}" height="${CONTENT_HEIGHT}"/>

    <!-- Vertical lines for main blocks -->
    <line x1="${col1}" y1="${CONTENT_TOP}" x2="${col1}" y2="${mainBottom}"/>
    <line x1="${col2}" y1="${CONTENT_TOP}" x2="${col2}" y2="${mainBottom}"/>
    <line x1="${col3}" y1="${CONTENT_TOP}" x2="${col3}" y2="${mainBottom}"/>
    <line x1="${col4}" y1="${CONTENT_TOP}" x2="${col4}" y2="${mainBottom}"/>

    <!-- Horizontal dividers for split blocks (KA/KR and CR/CH) -->
    <line x1="${col1}" y1="${midRow}" x2="${col2}" y2="${midRow}"/>
    <line x1="${col3}" y1="${midRow}" x2="${col4}" y2="${midRow}"/>

    <!-- Bottom row divider -->
    <line x1="0" y1="${mainBottom}" x2="${CANVAS_WIDTH}" y2="${mainBottom}"/>
    <line x1="${costRevenueDiv}" y1="${mainBottom}" x2="${costRevenueDiv}" y2="${CANVAS_HEIGHT - FOOTER_HEIGHT}"/>
  </g>`;
}

/** Generate header with title and meta fields */
export function generateHeader(doc: BMCDocumentV2): string {
  const name = escapeXml(doc.meta.name);
  const date = doc.meta.updated || doc.meta.created || '';

  return `  <!-- Header -->
  <text x="20" y="40" font-family="Georgia, serif" font-size="24" font-weight="bold" fill="#333333">The Business Model Canvas</text>
  <g font-family="Arial, sans-serif" font-size="10" fill="#666666">
    <text x="${CANVAS_WIDTH - 350}" y="25">Designed for:</text>
    <text x="${CANVAS_WIDTH - 350}" y="45" font-weight="bold" fill="#333333">${name}</text>
    <text x="${CANVAS_WIDTH - 150}" y="25">Date:</text>
    <text x="${CANVAS_WIDTH - 150}" y="45" fill="#333333">${escapeXml(date)}</text>
  </g>`;
}

/** Generate Strategyzer attribution footer */
export function generateFooter(): string {
  const footerY = CANVAS_HEIGHT - FOOTER_HEIGHT / 2 + 4;

  return `  <!-- Footer - Strategyzer Attribution -->
  <text x="${CANVAS_WIDTH / 2}" y="${footerY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#999999">
    Copyright Strategyzer AG | The Business Model Canvas | strategyzer.com | CC BY-SA 3.0
  </text>`;
}

/** Block label configuration */
interface BlockConfig {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Get block configurations for the 9 BMC blocks */
export function getBlockConfigs(): Record<string, BlockConfig> {
  const mainBottom = CONTENT_TOP + MAIN_BLOCKS_HEIGHT;
  const halfMainHeight = MAIN_BLOCKS_HEIGHT / 2;

  return {
    key_partnerships: {
      name: 'Key Partnerships',
      x: 0,
      y: CONTENT_TOP,
      width: COLUMN_WIDTH,
      height: MAIN_BLOCKS_HEIGHT,
    },
    key_activities: {
      name: 'Key Activities',
      x: COLUMN_WIDTH,
      y: CONTENT_TOP,
      width: COLUMN_WIDTH,
      height: halfMainHeight,
    },
    key_resources: {
      name: 'Key Resources',
      x: COLUMN_WIDTH,
      y: CONTENT_TOP + halfMainHeight,
      width: COLUMN_WIDTH,
      height: halfMainHeight,
    },
    value_propositions: {
      name: 'Value Propositions',
      x: COLUMN_WIDTH * 2,
      y: CONTENT_TOP,
      width: COLUMN_WIDTH,
      height: MAIN_BLOCKS_HEIGHT,
    },
    customer_relationships: {
      name: 'Customer Relationships',
      x: COLUMN_WIDTH * 3,
      y: CONTENT_TOP,
      width: COLUMN_WIDTH,
      height: halfMainHeight,
    },
    channels: {
      name: 'Channels',
      x: COLUMN_WIDTH * 3,
      y: CONTENT_TOP + halfMainHeight,
      width: COLUMN_WIDTH,
      height: halfMainHeight,
    },
    customer_segments: {
      name: 'Customer Segments',
      x: COLUMN_WIDTH * 4,
      y: CONTENT_TOP,
      width: COLUMN_WIDTH,
      height: MAIN_BLOCKS_HEIGHT,
    },
    costs: {
      name: 'Cost Structure',
      x: 0,
      y: mainBottom,
      width: CANVAS_WIDTH / 2,
      height: BOTTOM_ROW_HEIGHT,
    },
    revenue_streams: {
      name: 'Revenue Streams',
      x: CANVAS_WIDTH / 2,
      y: mainBottom,
      width: CANVAS_WIDTH / 2,
      height: BOTTOM_ROW_HEIGHT,
    },
  };
}

/** Generate a block label */
export function generateBlockLabel(config: BlockConfig): string {
  const labelX = config.x + 10;
  const labelY = config.y + 20;

  return `    <text x="${labelX}" y="${labelY}" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#333333">${escapeXml(config.name)}</text>`;
}

/** Generate all block labels */
export function generateBlockLabels(): string {
  const configs = getBlockConfigs();
  const labels = Object.values(configs).map(generateBlockLabel);

  return `  <!-- Block Labels -->
  <g>
${labels.join('\n')}
  </g>`;
}

// ============================================================================
// Sticky Note Rendering
// ============================================================================

/** Element info for rendering */
export interface ElementInfo {
  id: string;
  name: string;
}

/**
 * Generate a single sticky note (possibly stacked for multi-segment).
 * Colors array should be in order from bottom to top (first color on top).
 */
export function generateStickyNote(
  x: number,
  y: number,
  name: string,
  colors: string[]
): string {
  const lines: string[] = [];
  const wrappedText = wrapText(name, 14);

  // Generate stacked rectangles (colors in reverse order so first appears on top)
  for (let i = colors.length - 1; i >= 0; i--) {
    const offsetX = i * STACK_OFFSET_X;
    const offsetY = i * STACK_OFFSET_Y;
    lines.push(
      `      <rect x="${x + offsetX}" y="${y + offsetY}" width="${STICKY_WIDTH}" height="${STICKY_HEIGHT}" rx="${STICKY_RADIUS}" fill="${colors[i]}" filter="url(#shadow)"/>`
    );
  }

  // Text on top sticky (no offset)
  const textX = x + STICKY_PADDING;
  const textY = y + STICKY_PADDING + 12; // baseline offset

  for (let i = 0; i < wrappedText.length; i++) {
    lines.push(
      `      <text x="${textX}" y="${textY + i * 14}" font-family="Arial, sans-serif" font-size="10" fill="#333333">${escapeXml(wrappedText[i])}</text>`
    );
  }

  return lines.join('\n');
}

/**
 * Calculate positions for sticky notes within a block.
 * Returns array of {x, y} positions.
 */
export function calculateStickyPositions(
  config: BlockConfig,
  count: number
): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];

  // Available area (after label)
  const startX = config.x + STICKY_GAP;
  const startY = config.y + BLOCK_LABEL_HEIGHT;
  const availableWidth = config.width - STICKY_GAP * 2;

  // Calculate how many stickies fit per row
  const stickiesPerRow = Math.max(
    1,
    Math.floor((availableWidth + STICKY_GAP) / (STICKY_WIDTH + STICKY_GAP))
  );

  // Place stickies
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / stickiesPerRow);
    const col = i % stickiesPerRow;

    const x = startX + col * (STICKY_WIDTH + STICKY_GAP);
    const y = startY + row * (STICKY_HEIGHT + STICKY_GAP);

    // Only add if it fits within the block
    if (y + STICKY_HEIGHT <= config.y + config.height) {
      positions.push({ x, y });
    }
  }

  return positions;
}

/**
 * Generate sticky notes for a block.
 */
export function generateBlockStickies(
  blockKey: string,
  elements: ElementInfo[],
  graph: ConnectionGraph,
  segmentOrder: string[]
): string {
  if (elements.length === 0) {
    return '';
  }

  const configs = getBlockConfigs();
  const config = configs[blockKey];
  if (!config) {
    return '';
  }

  const positions = calculateStickyPositions(config, elements.length);
  const stickies: string[] = [];

  for (let i = 0; i < elements.length && i < positions.length; i++) {
    const element = elements[i];
    const pos = positions[i];
    const colors = getElementColors(element.id, graph, segmentOrder);

    stickies.push(generateStickyNote(pos.x, pos.y, element.name, colors));
  }

  return `    <!-- ${config.name} Stickies -->
    <g class="block-${blockKey}">
${stickies.join('\n')}
    </g>`;
}

// ============================================================================
// Main SVG Generation
// ============================================================================

/** Options for SVG generation */
export interface RenderOptions {
  /** Include XML declaration */
  includeXmlDeclaration?: boolean;
}

/**
 * Extract elements from document for each block.
 */
export function extractElements(doc: BMCDocumentV2): Record<string, ElementInfo[]> {
  return {
    customer_segments: (doc.customer_segments ?? []).map((cs) => ({
      id: cs.id,
      name: cs.name,
    })),
    value_propositions: (doc.value_propositions ?? []).map((vp) => ({
      id: vp.id,
      name: vp.name,
    })),
    channels: (doc.channels ?? []).map((ch) => ({
      id: ch.id,
      name: ch.name,
    })),
    customer_relationships: (doc.customer_relationships ?? []).map((cr) => ({
      id: cr.id,
      name: cr.name,
    })),
    revenue_streams: (doc.revenue_streams ?? []).map((rs) => ({
      id: rs.id,
      name: rs.name,
    })),
    key_resources: (doc.key_resources ?? []).map((kr) => ({
      id: kr.id,
      name: kr.name,
    })),
    key_activities: (doc.key_activities ?? []).map((ka) => ({
      id: ka.id,
      name: ka.name,
    })),
    key_partnerships: (doc.key_partnerships ?? []).map((kp) => ({
      id: kp.id,
      name: kp.name,
    })),
    costs: (doc.costs ?? []).map((cost) => ({
      id: cost.id,
      name: cost.name,
    })),
  };
}

/**
 * Generate complete SVG for a BMC document.
 */
export function generateSvg(
  doc: BMCDocumentV2,
  graph: ConnectionGraph,
  segmentOrder: string[],
  options: RenderOptions = {}
): string {
  const { includeXmlDeclaration = false } = options;

  const elements = extractElements(doc);

  // Generate all block stickies
  const blockStickies = Object.entries(elements)
    .map(([key, elems]) => generateBlockStickies(key, elems, graph, segmentOrder))
    .filter((s) => s.length > 0)
    .join('\n\n');

  const xmlDecl = includeXmlDeclaration
    ? '<?xml version="1.0" encoding="UTF-8"?>\n'
    : '';

  return `${xmlDecl}<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}">
${generateDefs()}

${generateBackground()}

${generateHeader(doc)}

${generateBlockLabels()}

  <!-- Sticky Notes -->
  <g>
${blockStickies}
  </g>

${generateFooter()}
</svg>`;
}
