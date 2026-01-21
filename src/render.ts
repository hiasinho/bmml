/**
 * BMC Renderer - Main Entry Point
 *
 * Renders BMML files as SVG Business Model Canvas diagrams.
 * Coordinates the connection graph building and SVG generation.
 *
 * Usage:
 *   import { render } from './render.js';
 *   const svg = render(document);
 */

import type { BMCDocumentV2 } from './types.js';
import { buildConnectionGraph, getSegmentOrder } from './render-graph.js';
import { generateSvg, type RenderOptions } from './render-svg.js';

export type { RenderOptions } from './render-svg.js';

/**
 * Render a BMCDocumentV2 as an SVG Business Model Canvas.
 *
 * @param doc - A valid BMCDocumentV2 document
 * @param options - Optional rendering options
 * @returns SVG string representing the Business Model Canvas
 *
 * @example
 * ```typescript
 * import { render } from './render.js';
 * import { parse } from 'yaml';
 * import { readFileSync } from 'fs';
 *
 * const content = readFileSync('model.bmml', 'utf8');
 * const doc = parse(content) as BMCDocumentV2;
 * const svg = render(doc);
 * console.log(svg);
 * ```
 */
export function render(doc: BMCDocumentV2, options: RenderOptions = {}): string {
  // Build the connection graph to determine element colors
  const graph = buildConnectionGraph(doc);

  // Get segment order for consistent color assignment
  const segmentOrder = getSegmentOrder(doc);

  // Generate the SVG
  return generateSvg(doc, graph, segmentOrder, options);
}

// Re-export useful types and functions for advanced usage
export { buildConnectionGraph, getSegmentOrder } from './render-graph.js';
export type { ConnectionGraph } from './render-graph.js';
export { generateSvg, SEGMENT_COLORS, ORPHAN_COLOR } from './render-svg.js';
