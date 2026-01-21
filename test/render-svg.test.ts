/**
 * Tests for SVG generation
 * Tests the SVG rendering logic for BMC visualization
 */

import { describe, it, expect } from 'vitest';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  SEGMENT_COLORS,
  ORPHAN_COLOR,
  getSegmentColor,
  getElementColors,
  escapeXml,
  wrapText,
  generateDefs,
  generateBackground,
  generateHeader,
  generateFooter,
  generateBlockLabels,
  getBlockConfigs,
  generateStickyNote,
  calculateStickyPositions,
  generateBlockStickies,
  extractElements,
  generateSvg,
} from '../src/render-svg';
import { buildConnectionGraph, getSegmentOrder } from '../src/render-graph';
import type { BMCDocumentV2 } from '../src/types';

const baseMeta = {
  name: 'Test Business',
  portfolio: 'explore' as const,
  stage: 'ideation' as const,
};

describe('constants', () => {
  it('defines canvas dimensions', () => {
    expect(CANVAS_WIDTH).toBe(1600);
    expect(CANVAS_HEIGHT).toBe(1000);
  });

  it('defines 8 segment colors', () => {
    expect(SEGMENT_COLORS).toHaveLength(8);
    expect(SEGMENT_COLORS[0]).toBe('#FFE066'); // yellow
    expect(SEGMENT_COLORS[1]).toBe('#7EC8E3'); // blue
  });

  it('defines orphan color', () => {
    expect(ORPHAN_COLOR).toBe('#CCCCCC');
  });
});

describe('getSegmentColor', () => {
  it('returns correct colors for valid indices', () => {
    expect(getSegmentColor(0)).toBe('#FFE066');
    expect(getSegmentColor(1)).toBe('#7EC8E3');
    expect(getSegmentColor(7)).toBe('#DEB887');
  });

  it('wraps around for indices beyond palette size', () => {
    expect(getSegmentColor(8)).toBe('#FFE066'); // wraps to 0
    expect(getSegmentColor(9)).toBe('#7EC8E3'); // wraps to 1
  });

  it('handles negative indices by wrapping', () => {
    // Negative modulo behavior
    expect(getSegmentColor(-1)).toBe(SEGMENT_COLORS[7]); // -1 % 8 = -1, but we handle it
  });
});

describe('getElementColors', () => {
  it('returns orphan color for elements not in graph', () => {
    const graph = new Map<string, Set<string>>();
    const segmentOrder = ['cs-a', 'cs-b'];

    const colors = getElementColors('unknown-id', graph, segmentOrder);

    expect(colors).toEqual([ORPHAN_COLOR]);
  });

  it('returns orphan color for elements with empty connections', () => {
    const graph = new Map<string, Set<string>>([['vp-orphan', new Set()]]);
    const segmentOrder = ['cs-a', 'cs-b'];

    const colors = getElementColors('vp-orphan', graph, segmentOrder);

    expect(colors).toEqual([ORPHAN_COLOR]);
  });

  it('returns single color for single segment connection', () => {
    const graph = new Map<string, Set<string>>([['vp-test', new Set(['cs-a'])]]);
    const segmentOrder = ['cs-a', 'cs-b'];

    const colors = getElementColors('vp-test', graph, segmentOrder);

    expect(colors).toEqual([SEGMENT_COLORS[0]]);
  });

  it('returns multiple colors in segment order', () => {
    const graph = new Map<string, Set<string>>([
      ['kr-shared', new Set(['cs-b', 'cs-a'])], // Note: reversed order
    ]);
    const segmentOrder = ['cs-a', 'cs-b'];

    const colors = getElementColors('kr-shared', graph, segmentOrder);

    // Should be in segment definition order, not set order
    expect(colors).toEqual([SEGMENT_COLORS[0], SEGMENT_COLORS[1]]);
  });

  it('respects segment definition order', () => {
    const graph = new Map<string, Set<string>>([
      ['kr-shared', new Set(['cs-second', 'cs-first'])],
    ]);
    // cs-first is defined first, so it gets color 0
    const segmentOrder = ['cs-first', 'cs-second'];

    const colors = getElementColors('kr-shared', graph, segmentOrder);

    expect(colors).toEqual([SEGMENT_COLORS[0], SEGMENT_COLORS[1]]);
  });
});

describe('escapeXml', () => {
  it('escapes ampersand', () => {
    expect(escapeXml('A & B')).toBe('A &amp; B');
  });

  it('escapes less than', () => {
    expect(escapeXml('a < b')).toBe('a &lt; b');
  });

  it('escapes greater than', () => {
    expect(escapeXml('a > b')).toBe('a &gt; b');
  });

  it('escapes quotes', () => {
    expect(escapeXml('say "hello"')).toBe('say &quot;hello&quot;');
  });

  it('escapes apostrophe', () => {
    expect(escapeXml("it's")).toBe('it&apos;s');
  });

  it('handles multiple special characters', () => {
    expect(escapeXml('<a & b>')).toBe('&lt;a &amp; b&gt;');
  });

  it('returns plain text unchanged', () => {
    expect(escapeXml('Hello World')).toBe('Hello World');
  });
});

describe('wrapText', () => {
  it('does not wrap short text', () => {
    expect(wrapText('Hello', 14)).toEqual(['Hello']);
  });

  it('wraps long text into multiple lines', () => {
    const result = wrapText('This is a longer piece of text', 14);
    expect(result.length).toBeGreaterThan(1);
    result.forEach((line) => {
      expect(line.length).toBeLessThanOrEqual(14);
    });
  });

  it('limits to 3 lines maximum', () => {
    const longText =
      'This is a very long piece of text that should be wrapped into many lines but we only want three';
    const result = wrapText(longText, 14);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('handles single long word', () => {
    const result = wrapText('Supercalifragilisticexpialidocious', 14);
    expect(result.length).toBe(1);
    expect(result[0]).toBe('Supercalifragilisticexpialidocious');
  });
});

describe('generateDefs', () => {
  it('generates defs section with shadow filter', () => {
    const defs = generateDefs();

    expect(defs).toContain('<defs>');
    expect(defs).toContain('</defs>');
    expect(defs).toContain('filter id="shadow"');
    expect(defs).toContain('feDropShadow');
  });
});

describe('generateBackground', () => {
  it('generates background rectangle', () => {
    const bg = generateBackground();

    expect(bg).toContain('<rect');
    expect(bg).toContain('fill="#ffffff"');
  });

  it('generates grid lines', () => {
    const bg = generateBackground();

    expect(bg).toContain('<line');
    expect(bg).toContain('stroke="#333333"');
  });
});

describe('generateHeader', () => {
  it('includes canvas title', () => {
    const doc: BMCDocumentV2 = {
      version: '2.0',
      meta: baseMeta,
    };

    const header = generateHeader(doc);

    expect(header).toContain('The Business Model Canvas');
  });

  it('includes business name', () => {
    const doc: BMCDocumentV2 = {
      version: '2.0',
      meta: { ...baseMeta, name: 'Acme Corp' },
    };

    const header = generateHeader(doc);

    expect(header).toContain('Acme Corp');
  });

  it('escapes special characters in name', () => {
    const doc: BMCDocumentV2 = {
      version: '2.0',
      meta: { ...baseMeta, name: 'Smith & Jones' },
    };

    const header = generateHeader(doc);

    expect(header).toContain('Smith &amp; Jones');
  });

  it('includes date if provided', () => {
    const doc: BMCDocumentV2 = {
      version: '2.0',
      meta: { ...baseMeta, updated: '2024-01-15' },
    };

    const header = generateHeader(doc);

    expect(header).toContain('2024-01-15');
  });
});

describe('generateFooter', () => {
  it('includes Strategyzer attribution', () => {
    const footer = generateFooter();

    expect(footer).toContain('Strategyzer');
    expect(footer).toContain('CC BY-SA 3.0');
    expect(footer).toContain('strategyzer.com');
  });
});

describe('getBlockConfigs', () => {
  it('returns configurations for all 9 blocks', () => {
    const configs = getBlockConfigs();

    expect(Object.keys(configs)).toHaveLength(9);
    expect(configs).toHaveProperty('key_partnerships');
    expect(configs).toHaveProperty('key_activities');
    expect(configs).toHaveProperty('key_resources');
    expect(configs).toHaveProperty('value_propositions');
    expect(configs).toHaveProperty('customer_relationships');
    expect(configs).toHaveProperty('channels');
    expect(configs).toHaveProperty('customer_segments');
    expect(configs).toHaveProperty('costs');
    expect(configs).toHaveProperty('revenue_streams');
  });

  it('has correct names for each block', () => {
    const configs = getBlockConfigs();

    expect(configs.key_partnerships.name).toBe('Key Partnerships');
    expect(configs.value_propositions.name).toBe('Value Propositions');
    expect(configs.customer_segments.name).toBe('Customer Segments');
    expect(configs.costs.name).toBe('Cost Structure');
    expect(configs.revenue_streams.name).toBe('Revenue Streams');
  });

  it('positions blocks correctly within canvas', () => {
    const configs = getBlockConfigs();

    // All blocks should be within canvas bounds
    Object.values(configs).forEach((config) => {
      expect(config.x).toBeGreaterThanOrEqual(0);
      expect(config.y).toBeGreaterThanOrEqual(0);
      expect(config.x + config.width).toBeLessThanOrEqual(CANVAS_WIDTH);
      expect(config.y + config.height).toBeLessThanOrEqual(CANVAS_HEIGHT);
    });
  });
});

describe('generateBlockLabels', () => {
  it('generates labels for all blocks', () => {
    const labels = generateBlockLabels();

    expect(labels).toContain('Key Partnerships');
    expect(labels).toContain('Key Activities');
    expect(labels).toContain('Key Resources');
    expect(labels).toContain('Value Propositions');
    expect(labels).toContain('Customer Relationships');
    expect(labels).toContain('Channels');
    expect(labels).toContain('Customer Segments');
    expect(labels).toContain('Cost Structure');
    expect(labels).toContain('Revenue Streams');
  });
});

describe('generateStickyNote', () => {
  it('generates rect and text elements', () => {
    const sticky = generateStickyNote(100, 100, 'Test Note', ['#FFE066']);

    expect(sticky).toContain('<rect');
    expect(sticky).toContain('<text');
    expect(sticky).toContain('Test Note');
  });

  it('applies specified color', () => {
    const sticky = generateStickyNote(100, 100, 'Test', ['#7EC8E3']);

    expect(sticky).toContain('fill="#7EC8E3"');
  });

  it('generates stacked rects for multiple colors', () => {
    const sticky = generateStickyNote(100, 100, 'Test', ['#FFE066', '#7EC8E3']);

    // Should have 2 rect elements
    const rectMatches = sticky.match(/<rect/g);
    expect(rectMatches).toHaveLength(2);
  });

  it('applies shadow filter', () => {
    const sticky = generateStickyNote(100, 100, 'Test', ['#FFE066']);

    expect(sticky).toContain('filter="url(#shadow)"');
  });
});

describe('calculateStickyPositions', () => {
  it('returns positions within block bounds', () => {
    const config = {
      name: 'Test',
      x: 100,
      y: 100,
      width: 300,
      height: 500,
    };

    const positions = calculateStickyPositions(config, 5);

    positions.forEach((pos) => {
      expect(pos.x).toBeGreaterThanOrEqual(config.x);
      expect(pos.y).toBeGreaterThanOrEqual(config.y);
    });
  });

  it('returns empty array for count of 0', () => {
    const config = {
      name: 'Test',
      x: 0,
      y: 0,
      width: 300,
      height: 500,
    };

    const positions = calculateStickyPositions(config, 0);

    expect(positions).toEqual([]);
  });
});

describe('generateBlockStickies', () => {
  it('generates stickies for elements', () => {
    const elements = [
      { id: 'cs-a', name: 'Segment A' },
      { id: 'cs-b', name: 'Segment B' },
    ];
    const graph = new Map<string, Set<string>>([
      ['cs-a', new Set(['cs-a'])],
      ['cs-b', new Set(['cs-b'])],
    ]);
    const segmentOrder = ['cs-a', 'cs-b'];

    const stickies = generateBlockStickies(
      'customer_segments',
      elements,
      graph,
      segmentOrder
    );

    expect(stickies).toContain('Segment A');
    expect(stickies).toContain('Segment B');
    expect(stickies).toContain('Customer Segments Stickies');
  });

  it('returns empty string for empty elements', () => {
    const stickies = generateBlockStickies('customer_segments', [], new Map(), []);

    expect(stickies).toBe('');
  });

  it('returns empty string for unknown block key', () => {
    const stickies = generateBlockStickies(
      'unknown_block',
      [{ id: 'x', name: 'X' }],
      new Map(),
      []
    );

    expect(stickies).toBe('');
  });
});

describe('extractElements', () => {
  it('extracts customer segments', () => {
    const doc: BMCDocumentV2 = {
      version: '2.0',
      meta: baseMeta,
      customer_segments: [
        { id: 'cs-a', name: 'Segment A' },
        { id: 'cs-b', name: 'Segment B' },
      ],
    };

    const elements = extractElements(doc);

    expect(elements.customer_segments).toEqual([
      { id: 'cs-a', name: 'Segment A' },
      { id: 'cs-b', name: 'Segment B' },
    ]);
  });

  it('extracts value propositions', () => {
    const doc: BMCDocumentV2 = {
      version: '2.0',
      meta: baseMeta,
      value_propositions: [{ id: 'vp-test', name: 'Test VP' }],
    };

    const elements = extractElements(doc);

    expect(elements.value_propositions).toEqual([{ id: 'vp-test', name: 'Test VP' }]);
  });

  it('returns empty arrays for missing sections', () => {
    const doc: BMCDocumentV2 = {
      version: '2.0',
      meta: baseMeta,
    };

    const elements = extractElements(doc);

    expect(elements.customer_segments).toEqual([]);
    expect(elements.value_propositions).toEqual([]);
    expect(elements.channels).toEqual([]);
    expect(elements.costs).toEqual([]);
  });

  it('extracts all block types', () => {
    const doc: BMCDocumentV2 = {
      version: '2.0',
      meta: baseMeta,
      customer_segments: [{ id: 'cs-test', name: 'CS' }],
      value_propositions: [{ id: 'vp-test', name: 'VP' }],
      channels: [{ id: 'ch-test', name: 'CH' }],
      customer_relationships: [{ id: 'cr-test', name: 'CR' }],
      revenue_streams: [{ id: 'rs-test', name: 'RS' }],
      key_resources: [{ id: 'kr-test', name: 'KR' }],
      key_activities: [{ id: 'ka-test', name: 'KA' }],
      key_partnerships: [{ id: 'kp-test', name: 'KP' }],
      costs: [{ id: 'cost-test', name: 'Cost' }],
    };

    const elements = extractElements(doc);

    expect(elements.customer_segments).toHaveLength(1);
    expect(elements.value_propositions).toHaveLength(1);
    expect(elements.channels).toHaveLength(1);
    expect(elements.customer_relationships).toHaveLength(1);
    expect(elements.revenue_streams).toHaveLength(1);
    expect(elements.key_resources).toHaveLength(1);
    expect(elements.key_activities).toHaveLength(1);
    expect(elements.key_partnerships).toHaveLength(1);
    expect(elements.costs).toHaveLength(1);
  });
});

describe('generateSvg', () => {
  it('generates valid SVG structure', () => {
    const doc: BMCDocumentV2 = {
      version: '2.0',
      meta: baseMeta,
    };
    const graph = buildConnectionGraph(doc);
    const segmentOrder = getSegmentOrder(doc);

    const svg = generateSvg(doc, graph, segmentOrder);

    expect(svg).toMatch(/^<svg/);
    expect(svg).toMatch(/<\/svg>$/);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('includes correct viewBox dimensions', () => {
    const doc: BMCDocumentV2 = {
      version: '2.0',
      meta: baseMeta,
    };
    const graph = buildConnectionGraph(doc);
    const segmentOrder = getSegmentOrder(doc);

    const svg = generateSvg(doc, graph, segmentOrder);

    expect(svg).toContain(`viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}"`);
  });

  it('includes defs section', () => {
    const doc: BMCDocumentV2 = {
      version: '2.0',
      meta: baseMeta,
    };
    const graph = buildConnectionGraph(doc);
    const segmentOrder = getSegmentOrder(doc);

    const svg = generateSvg(doc, graph, segmentOrder);

    expect(svg).toContain('<defs>');
    expect(svg).toContain('</defs>');
  });

  it('includes header', () => {
    const doc: BMCDocumentV2 = {
      version: '2.0',
      meta: { ...baseMeta, name: 'My Business' },
    };
    const graph = buildConnectionGraph(doc);
    const segmentOrder = getSegmentOrder(doc);

    const svg = generateSvg(doc, graph, segmentOrder);

    expect(svg).toContain('The Business Model Canvas');
    expect(svg).toContain('My Business');
  });

  it('includes footer', () => {
    const doc: BMCDocumentV2 = {
      version: '2.0',
      meta: baseMeta,
    };
    const graph = buildConnectionGraph(doc);
    const segmentOrder = getSegmentOrder(doc);

    const svg = generateSvg(doc, graph, segmentOrder);

    expect(svg).toContain('Strategyzer');
  });

  it('includes block labels', () => {
    const doc: BMCDocumentV2 = {
      version: '2.0',
      meta: baseMeta,
    };
    const graph = buildConnectionGraph(doc);
    const segmentOrder = getSegmentOrder(doc);

    const svg = generateSvg(doc, graph, segmentOrder);

    expect(svg).toContain('Key Partnerships');
    expect(svg).toContain('Customer Segments');
  });

  it('includes XML declaration when requested', () => {
    const doc: BMCDocumentV2 = {
      version: '2.0',
      meta: baseMeta,
    };
    const graph = buildConnectionGraph(doc);
    const segmentOrder = getSegmentOrder(doc);

    const svg = generateSvg(doc, graph, segmentOrder, {
      includeXmlDeclaration: true,
    });

    expect(svg).toMatch(/^<\?xml/);
  });

  it('excludes XML declaration by default', () => {
    const doc: BMCDocumentV2 = {
      version: '2.0',
      meta: baseMeta,
    };
    const graph = buildConnectionGraph(doc);
    const segmentOrder = getSegmentOrder(doc);

    const svg = generateSvg(doc, graph, segmentOrder);

    expect(svg).not.toMatch(/^<\?xml/);
  });

  it('renders customer segments with correct colors', () => {
    const doc: BMCDocumentV2 = {
      version: '2.0',
      meta: baseMeta,
      customer_segments: [
        { id: 'cs-a', name: 'Segment A' },
        { id: 'cs-b', name: 'Segment B' },
      ],
    };
    const graph = buildConnectionGraph(doc);
    const segmentOrder = getSegmentOrder(doc);

    const svg = generateSvg(doc, graph, segmentOrder);

    // First segment gets first color, second gets second
    expect(svg).toContain(`fill="${SEGMENT_COLORS[0]}"`);
    expect(svg).toContain(`fill="${SEGMENT_COLORS[1]}"`);
    expect(svg).toContain('Segment A');
    expect(svg).toContain('Segment B');
  });

  it('renders orphaned elements in gray', () => {
    const doc: BMCDocumentV2 = {
      version: '2.0',
      meta: baseMeta,
      value_propositions: [{ id: 'vp-orphan', name: 'Orphan VP' }],
    };
    const graph = buildConnectionGraph(doc);
    const segmentOrder = getSegmentOrder(doc);

    const svg = generateSvg(doc, graph, segmentOrder);

    expect(svg).toContain(`fill="${ORPHAN_COLOR}"`);
    expect(svg).toContain('Orphan VP');
  });

  it('renders complete two-sided marketplace', () => {
    const doc: BMCDocumentV2 = {
      version: '2.0',
      meta: { ...baseMeta, name: 'Marketplace' },
      customer_segments: [
        { id: 'cs-buyers', name: 'Buyers' },
        { id: 'cs-sellers', name: 'Sellers' },
      ],
      value_propositions: [
        { id: 'vp-buyers', name: 'Easy Shopping' },
        { id: 'vp-sellers', name: 'Reach Customers' },
      ],
      fits: [
        {
          id: 'fit-buyers',
          for: { value_propositions: ['vp-buyers'], customer_segments: ['cs-buyers'] },
        },
        {
          id: 'fit-sellers',
          for: {
            value_propositions: ['vp-sellers'],
            customer_segments: ['cs-sellers'],
          },
        },
      ],
      channels: [
        { id: 'ch-website', name: 'Website', for: { customer_segments: ['cs-buyers'] } },
        { id: 'ch-api', name: 'Seller API', for: { customer_segments: ['cs-sellers'] } },
      ],
      key_resources: [
        {
          id: 'kr-platform',
          name: 'Platform',
          for: { value_propositions: ['vp-buyers', 'vp-sellers'] },
        },
      ],
    };
    const graph = buildConnectionGraph(doc);
    const segmentOrder = getSegmentOrder(doc);

    const svg = generateSvg(doc, graph, segmentOrder);

    // Check all elements are rendered
    expect(svg).toContain('Buyers');
    expect(svg).toContain('Sellers');
    expect(svg).toContain('Easy Shopping');
    // "Reach Customers" may be wrapped to multiple lines
    expect(svg).toContain('Reach');
    expect(svg).toContain('Customers');
    expect(svg).toContain('Website');
    expect(svg).toContain('Seller API');
    expect(svg).toContain('Platform');

    // Platform connects to both segments, should have both colors
    // (stacked sticky notes)
    expect(svg).toContain(SEGMENT_COLORS[0]);
    expect(svg).toContain(SEGMENT_COLORS[1]);
  });
});
