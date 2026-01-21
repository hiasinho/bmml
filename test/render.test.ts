/**
 * Tests for main render function
 * Tests end-to-end rendering of BMC documents to SVG
 */

import { describe, it, expect } from 'vitest';
import { render, buildConnectionGraph, getSegmentOrder, SEGMENT_COLORS, ORPHAN_COLOR } from '../src/render';
import type { BMCDocumentV2 } from '../src/types';
import type { RenderOptions } from '../src/render';

const baseMeta = {
  name: 'Test Business',
  portfolio: 'explore' as const,
  stage: 'ideation' as const,
};

describe('render', () => {
  describe('basic rendering', () => {
    it('renders minimal document to valid SVG', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
      };

      const svg = render(doc);

      expect(svg).toMatch(/^<svg/);
      expect(svg).toMatch(/<\/svg>$/);
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it('includes business name in header', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: { ...baseMeta, name: 'Acme Corporation' },
      };

      const svg = render(doc);

      expect(svg).toContain('Acme Corporation');
    });

    it('includes all 9 block labels', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
      };

      const svg = render(doc);

      expect(svg).toContain('Key Partnerships');
      expect(svg).toContain('Key Activities');
      expect(svg).toContain('Key Resources');
      expect(svg).toContain('Value Propositions');
      expect(svg).toContain('Customer Relationships');
      expect(svg).toContain('Channels');
      expect(svg).toContain('Customer Segments');
      expect(svg).toContain('Cost Structure');
      expect(svg).toContain('Revenue Streams');
    });

    it('includes Strategyzer attribution', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
      };

      const svg = render(doc);

      expect(svg).toContain('Strategyzer');
      expect(svg).toContain('CC BY-SA 3.0');
    });
  });

  describe('render options', () => {
    it('includes XML declaration when requested', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
      };

      const svg = render(doc, { includeXmlDeclaration: true });

      expect(svg).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>/);
    });

    it('excludes XML declaration by default', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
      };

      const svg = render(doc);

      expect(svg).not.toContain('<?xml');
    });
  });

  describe('customer segment coloring', () => {
    it('renders customer segments with distinct colors', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
        customer_segments: [
          { id: 'cs-first', name: 'First Segment' },
          { id: 'cs-second', name: 'Second Segment' },
        ],
      };

      const svg = render(doc);

      expect(svg).toContain('First Segment');
      expect(svg).toContain('Second Segment');
      expect(svg).toContain(`fill="${SEGMENT_COLORS[0]}"`);
      expect(svg).toContain(`fill="${SEGMENT_COLORS[1]}"`);
    });

    it('renders orphaned elements in gray', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
        value_propositions: [{ id: 'vp-orphan', name: 'Orphan VP' }],
      };

      const svg = render(doc);

      expect(svg).toContain('Orphan VP');
      expect(svg).toContain(`fill="${ORPHAN_COLOR}"`);
    });
  });

  describe('connected elements', () => {
    it('renders value propositions with segment colors via fits', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
        customer_segments: [{ id: 'cs-main', name: 'Main Segment' }],
        value_propositions: [{ id: 'vp-main', name: 'Main VP' }],
        fits: [
          {
            id: 'fit-main',
            for: {
              value_propositions: ['vp-main'],
              customer_segments: ['cs-main'],
            },
          },
        ],
      };

      const svg = render(doc);

      // VP should have the same color as its connected segment
      const segmentColor = SEGMENT_COLORS[0];
      expect(svg).toContain(`fill="${segmentColor}"`);
      expect(svg).toContain('Main VP');
    });

    it('renders multi-segment elements with stacked stickies', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
        customer_segments: [
          { id: 'cs-a', name: 'Segment A' },
          { id: 'cs-b', name: 'Segment B' },
        ],
        value_propositions: [{ id: 'vp-shared', name: 'Shared VP' }],
        fits: [
          {
            id: 'fit-shared',
            for: {
              value_propositions: ['vp-shared'],
              customer_segments: ['cs-a', 'cs-b'],
            },
          },
        ],
      };

      const svg = render(doc);

      // VP should have both segment colors (stacked notes)
      expect(svg).toContain(SEGMENT_COLORS[0]);
      expect(svg).toContain(SEGMENT_COLORS[1]);
    });
  });

  describe('full model rendering', () => {
    it('renders a complete minimal business model', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: {
          name: 'FreshBox',
          tagline: 'Chef-designed meals delivered',
          portfolio: 'explore',
          stage: 'ideation',
          created: '2024-03-01',
        },
        customer_segments: [
          { id: 'cs-busy', name: 'Busy Professionals' },
          { id: 'cs-cooks', name: 'Home Cooks' },
        ],
        value_propositions: [
          { id: 'vp-convenience', name: 'Effortless Meal Planning' },
          { id: 'vp-quality', name: 'Chef-Quality Cooking' },
        ],
        fits: [
          {
            id: 'fit-busy',
            for: {
              value_propositions: ['vp-convenience'],
              customer_segments: ['cs-busy'],
            },
          },
          {
            id: 'fit-cooks',
            for: {
              value_propositions: ['vp-quality'],
              customer_segments: ['cs-cooks'],
            },
          },
        ],
        channels: [
          {
            id: 'ch-app',
            name: 'Mobile App',
            for: { customer_segments: ['cs-busy', 'cs-cooks'] },
          },
        ],
        customer_relationships: [
          {
            id: 'cr-self',
            name: 'Self-Service',
            for: { customer_segments: ['cs-busy', 'cs-cooks'] },
          },
        ],
        revenue_streams: [
          {
            id: 'rs-sub',
            name: 'Weekly Subscription',
            from: { customer_segments: ['cs-busy', 'cs-cooks'] },
          },
        ],
        key_resources: [
          {
            id: 'kr-supply',
            name: 'Supply Chain',
            for: { value_propositions: ['vp-convenience', 'vp-quality'] },
          },
        ],
        key_activities: [
          {
            id: 'ka-fulfill',
            name: 'Order Fulfillment',
            for: { value_propositions: ['vp-convenience'] },
          },
        ],
        key_partnerships: [
          {
            id: 'kp-farms',
            name: 'Local Farms',
            for: { key_resources: ['kr-supply'] },
          },
        ],
        costs: [
          {
            id: 'cost-ingredients',
            name: 'Ingredient Sourcing',
            for: { key_resources: ['kr-supply'] },
          },
        ],
      };

      const svg = render(doc);

      // Check all elements are present
      // Note: text wrapping may split names across lines
      expect(svg).toContain('FreshBox');
      expect(svg).toContain('Busy'); // "Busy Professionals" wrapped
      expect(svg).toContain('Professionals');
      expect(svg).toContain('Home Cooks');
      expect(svg).toContain('Effortless'); // "Effortless Meal Planning" wrapped
      expect(svg).toContain('Mobile App');
      expect(svg).toContain('Self-Service');
      expect(svg).toContain('Weekly'); // "Weekly Subscription" wrapped
      expect(svg).toContain('Supply Chain');
      expect(svg).toContain('Order'); // "Order Fulfillment" wrapped
      expect(svg).toContain('Local Farms');
      expect(svg).toContain('Ingredient');

      // Check it's valid SVG
      expect(svg).toMatch(/^<svg/);
      expect(svg).toMatch(/<\/svg>$/);
    });

    it('renders two-sided marketplace with distinct segment colors', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: {
          name: 'Marketplace',
          portfolio: 'exploit',
          stage: 'grow',
        },
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
            for: {
              value_propositions: ['vp-buyers'],
              customer_segments: ['cs-buyers'],
            },
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
          {
            id: 'ch-web',
            name: 'Website',
            for: { customer_segments: ['cs-buyers'] },
          },
          {
            id: 'ch-api',
            name: 'Seller API',
            for: { customer_segments: ['cs-sellers'] },
          },
        ],
        key_resources: [
          {
            id: 'kr-platform',
            name: 'Platform',
            for: { value_propositions: ['vp-buyers', 'vp-sellers'] },
          },
        ],
      };

      const svg = render(doc);

      // Check segments rendered
      expect(svg).toContain('Buyers');
      expect(svg).toContain('Sellers');

      // Check both segment colors are used
      expect(svg).toContain(SEGMENT_COLORS[0]);
      expect(svg).toContain(SEGMENT_COLORS[1]);

      // Platform connects to both segments via both VPs
      // so it should have stacked notes with both colors
      expect(svg).toContain('Platform');
    });
  });

  describe('re-exports', () => {
    it('exports buildConnectionGraph', () => {
      expect(typeof buildConnectionGraph).toBe('function');
    });

    it('exports getSegmentOrder', () => {
      expect(typeof getSegmentOrder).toBe('function');
    });

    it('exports SEGMENT_COLORS array', () => {
      expect(Array.isArray(SEGMENT_COLORS)).toBe(true);
      expect(SEGMENT_COLORS.length).toBe(8);
    });

    it('exports ORPHAN_COLOR', () => {
      expect(ORPHAN_COLOR).toBe('#CCCCCC');
    });
  });

  describe('edge cases', () => {
    it('handles empty arrays gracefully', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
        customer_segments: [],
        value_propositions: [],
        fits: [],
        channels: [],
        customer_relationships: [],
        revenue_streams: [],
        key_resources: [],
        key_activities: [],
        key_partnerships: [],
        costs: [],
      };

      const svg = render(doc);

      expect(svg).toMatch(/^<svg/);
      expect(svg).toMatch(/<\/svg>$/);
    });

    it('escapes special characters in names', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: { ...baseMeta, name: 'Smith & Jones' },
        customer_segments: [
          { id: 'cs-test', name: 'Test <Segment>' },
        ],
      };

      const svg = render(doc);

      expect(svg).toContain('Smith &amp; Jones');
      expect(svg).toContain('Test &lt;Segment&gt;');
    });

    it('handles long element names with text wrapping', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
        customer_segments: [
          {
            id: 'cs-long',
            name: 'Enterprise Software Development Teams',
          },
        ],
      };

      const svg = render(doc);

      // Name should be present (possibly wrapped across lines)
      expect(svg).toContain('Enterprise');
      expect(svg).toContain('Software');
    });

    it('handles many segments (color cycling)', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
        customer_segments: [
          { id: 'cs-1', name: 'Segment 1' },
          { id: 'cs-2', name: 'Segment 2' },
          { id: 'cs-3', name: 'Segment 3' },
          { id: 'cs-4', name: 'Segment 4' },
          { id: 'cs-5', name: 'Segment 5' },
          { id: 'cs-6', name: 'Segment 6' },
          { id: 'cs-7', name: 'Segment 7' },
          { id: 'cs-8', name: 'Segment 8' },
          { id: 'cs-9', name: 'Segment 9' },
        ],
      };

      const svg = render(doc);

      // Should contain all segments
      for (let i = 1; i <= 9; i++) {
        expect(svg).toContain(`Segment ${i}`);
      }

      // 9th segment should cycle back to first color
      expect(svg).toContain(SEGMENT_COLORS[0]);
    });
  });
});
