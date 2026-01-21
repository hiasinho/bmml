/**
 * Tests for connection graph building
 * Tests the traversal logic that maps elements to their connected customer segments
 */

import { describe, it, expect } from 'vitest';
import {
  buildConnectionGraph,
  getSegmentOrder,
  isOrphaned,
} from '../src/render-graph';
import type { BMCDocumentV2 } from '../src/types';

const baseMeta = {
  name: 'Test',
  portfolio: 'explore' as const,
  stage: 'ideation' as const,
};

describe('buildConnectionGraph', () => {
  describe('customer segments (direct)', () => {
    it('connects each customer segment to itself', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
        customer_segments: [
          { id: 'cs-one', name: 'Segment One' },
          { id: 'cs-two', name: 'Segment Two' },
        ],
      };

      const graph = buildConnectionGraph(doc);

      expect(graph.get('cs-one')).toEqual(new Set(['cs-one']));
      expect(graph.get('cs-two')).toEqual(new Set(['cs-two']));
    });

    it('returns empty graph for document with no customer segments', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
      };

      const graph = buildConnectionGraph(doc);
      expect(graph.size).toBe(0);
    });
  });

  describe('channels (direct via for.customer_segments)', () => {
    it('connects channels to their customer segments', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
        customer_segments: [
          { id: 'cs-guests', name: 'Guests' },
          { id: 'cs-hosts', name: 'Hosts' },
        ],
        channels: [
          {
            id: 'ch-app',
            name: 'Mobile App',
            for: { customer_segments: ['cs-guests'] },
          },
          {
            id: 'ch-dashboard',
            name: 'Host Dashboard',
            for: { customer_segments: ['cs-hosts'] },
          },
        ],
      };

      const graph = buildConnectionGraph(doc);

      expect(graph.get('ch-app')).toEqual(new Set(['cs-guests']));
      expect(graph.get('ch-dashboard')).toEqual(new Set(['cs-hosts']));
    });

    it('handles channels with multiple customer segments', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
        customer_segments: [
          { id: 'cs-a', name: 'A' },
          { id: 'cs-b', name: 'B' },
        ],
        channels: [
          {
            id: 'ch-shared',
            name: 'Shared Channel',
            for: { customer_segments: ['cs-a', 'cs-b'] },
          },
        ],
      };

      const graph = buildConnectionGraph(doc);

      expect(graph.get('ch-shared')).toEqual(new Set(['cs-a', 'cs-b']));
    });

    it('handles channels with no for.customer_segments (orphaned)', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
        channels: [{ id: 'ch-orphan', name: 'Orphan Channel' }],
      };

      const graph = buildConnectionGraph(doc);

      expect(graph.get('ch-orphan')).toEqual(new Set());
    });
  });

  describe('customer relationships (direct via for.customer_segments)', () => {
    it('connects customer relationships to their segments', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
        customer_segments: [{ id: 'cs-test', name: 'Test' }],
        customer_relationships: [
          {
            id: 'cr-support',
            name: 'Customer Support',
            for: { customer_segments: ['cs-test'] },
          },
        ],
      };

      const graph = buildConnectionGraph(doc);

      expect(graph.get('cr-support')).toEqual(new Set(['cs-test']));
    });
  });

  describe('revenue streams (direct via from.customer_segments)', () => {
    it('connects revenue streams to their source segments', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
        customer_segments: [
          { id: 'cs-guests', name: 'Guests' },
          { id: 'cs-hosts', name: 'Hosts' },
        ],
        revenue_streams: [
          {
            id: 'rs-guest-fee',
            name: 'Guest Service Fee',
            from: { customer_segments: ['cs-guests'] },
          },
          {
            id: 'rs-host-fee',
            name: 'Host Service Fee',
            from: { customer_segments: ['cs-hosts'] },
          },
        ],
      };

      const graph = buildConnectionGraph(doc);

      expect(graph.get('rs-guest-fee')).toEqual(new Set(['cs-guests']));
      expect(graph.get('rs-host-fee')).toEqual(new Set(['cs-hosts']));
    });

    it('handles revenue streams from multiple segments', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
        customer_segments: [
          { id: 'cs-a', name: 'A' },
          { id: 'cs-b', name: 'B' },
        ],
        revenue_streams: [
          {
            id: 'rs-both',
            name: 'Revenue from Both',
            from: { customer_segments: ['cs-a', 'cs-b'] },
          },
        ],
      };

      const graph = buildConnectionGraph(doc);

      expect(graph.get('rs-both')).toEqual(new Set(['cs-a', 'cs-b']));
    });
  });

  describe('fits (direct via for.customer_segments)', () => {
    it('connects fits to their customer segments', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
        customer_segments: [{ id: 'cs-test', name: 'Test' }],
        value_propositions: [{ id: 'vp-test', name: 'Test VP' }],
        fits: [
          {
            id: 'fit-test',
            for: {
              value_propositions: ['vp-test'],
              customer_segments: ['cs-test'],
            },
          },
        ],
      };

      const graph = buildConnectionGraph(doc);

      expect(graph.get('fit-test')).toEqual(new Set(['cs-test']));
    });

    it('handles fits with multiple customer segments', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
        customer_segments: [
          { id: 'cs-a', name: 'A' },
          { id: 'cs-b', name: 'B' },
        ],
        value_propositions: [{ id: 'vp-test', name: 'Test VP' }],
        fits: [
          {
            id: 'fit-multi',
            for: {
              value_propositions: ['vp-test'],
              customer_segments: ['cs-a', 'cs-b'],
            },
          },
        ],
      };

      const graph = buildConnectionGraph(doc);

      expect(graph.get('fit-multi')).toEqual(new Set(['cs-a', 'cs-b']));
    });
  });

  describe('value propositions (via fits)', () => {
    it('connects VP to segments through fits that reference it', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
        customer_segments: [{ id: 'cs-test', name: 'Test' }],
        value_propositions: [{ id: 'vp-test', name: 'Test VP' }],
        fits: [
          {
            id: 'fit-test',
            for: {
              value_propositions: ['vp-test'],
              customer_segments: ['cs-test'],
            },
          },
        ],
      };

      const graph = buildConnectionGraph(doc);

      expect(graph.get('vp-test')).toEqual(new Set(['cs-test']));
    });

    it('aggregates segments from multiple fits for same VP', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
        customer_segments: [
          { id: 'cs-a', name: 'A' },
          { id: 'cs-b', name: 'B' },
        ],
        value_propositions: [{ id: 'vp-shared', name: 'Shared VP' }],
        fits: [
          {
            id: 'fit-a',
            for: {
              value_propositions: ['vp-shared'],
              customer_segments: ['cs-a'],
            },
          },
          {
            id: 'fit-b',
            for: {
              value_propositions: ['vp-shared'],
              customer_segments: ['cs-b'],
            },
          },
        ],
      };

      const graph = buildConnectionGraph(doc);

      expect(graph.get('vp-shared')).toEqual(new Set(['cs-a', 'cs-b']));
    });

    it('returns empty set for VP with no fits (orphaned)', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
        value_propositions: [{ id: 'vp-orphan', name: 'Orphan VP' }],
      };

      const graph = buildConnectionGraph(doc);

      expect(graph.get('vp-orphan')).toEqual(new Set());
    });

    it('handles different VPs connected to different segments', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
        customer_segments: [
          { id: 'cs-guests', name: 'Guests' },
          { id: 'cs-hosts', name: 'Hosts' },
        ],
        value_propositions: [
          { id: 'vp-guest', name: 'Guest VP' },
          { id: 'vp-host', name: 'Host VP' },
        ],
        fits: [
          {
            id: 'fit-guest',
            for: {
              value_propositions: ['vp-guest'],
              customer_segments: ['cs-guests'],
            },
          },
          {
            id: 'fit-host',
            for: {
              value_propositions: ['vp-host'],
              customer_segments: ['cs-hosts'],
            },
          },
        ],
      };

      const graph = buildConnectionGraph(doc);

      expect(graph.get('vp-guest')).toEqual(new Set(['cs-guests']));
      expect(graph.get('vp-host')).toEqual(new Set(['cs-hosts']));
    });
  });

  describe('key resources (transitive via VP -> fit -> CS)', () => {
    it('connects KR to segments through its VPs', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
        customer_segments: [{ id: 'cs-test', name: 'Test' }],
        value_propositions: [{ id: 'vp-test', name: 'Test VP' }],
        fits: [
          {
            id: 'fit-test',
            for: {
              value_propositions: ['vp-test'],
              customer_segments: ['cs-test'],
            },
          },
        ],
        key_resources: [
          {
            id: 'kr-platform',
            name: 'Platform',
            for: { value_propositions: ['vp-test'] },
          },
        ],
      };

      const graph = buildConnectionGraph(doc);

      expect(graph.get('kr-platform')).toEqual(new Set(['cs-test']));
    });

    it('aggregates segments from multiple VPs', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
        customer_segments: [
          { id: 'cs-a', name: 'A' },
          { id: 'cs-b', name: 'B' },
        ],
        value_propositions: [
          { id: 'vp-a', name: 'VP A' },
          { id: 'vp-b', name: 'VP B' },
        ],
        fits: [
          {
            id: 'fit-a',
            for: { value_propositions: ['vp-a'], customer_segments: ['cs-a'] },
          },
          {
            id: 'fit-b',
            for: { value_propositions: ['vp-b'], customer_segments: ['cs-b'] },
          },
        ],
        key_resources: [
          {
            id: 'kr-shared',
            name: 'Shared Resource',
            for: { value_propositions: ['vp-a', 'vp-b'] },
          },
        ],
      };

      const graph = buildConnectionGraph(doc);

      expect(graph.get('kr-shared')).toEqual(new Set(['cs-a', 'cs-b']));
    });

    it('returns empty set for KR with no VP connections (orphaned)', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
        key_resources: [{ id: 'kr-orphan', name: 'Orphan Resource' }],
      };

      const graph = buildConnectionGraph(doc);

      expect(graph.get('kr-orphan')).toEqual(new Set());
    });
  });

  describe('key activities (transitive via VP -> fit -> CS)', () => {
    it('connects KA to segments through its VPs', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
        customer_segments: [{ id: 'cs-test', name: 'Test' }],
        value_propositions: [{ id: 'vp-test', name: 'Test VP' }],
        fits: [
          {
            id: 'fit-test',
            for: {
              value_propositions: ['vp-test'],
              customer_segments: ['cs-test'],
            },
          },
        ],
        key_activities: [
          {
            id: 'ka-dev',
            name: 'Development',
            for: { value_propositions: ['vp-test'] },
          },
        ],
      };

      const graph = buildConnectionGraph(doc);

      expect(graph.get('ka-dev')).toEqual(new Set(['cs-test']));
    });
  });

  describe('key partnerships (transitive via KR/KA -> VP -> fit -> CS)', () => {
    it('connects KP to segments through its key resources', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
        customer_segments: [{ id: 'cs-test', name: 'Test' }],
        value_propositions: [{ id: 'vp-test', name: 'Test VP' }],
        fits: [
          {
            id: 'fit-test',
            for: {
              value_propositions: ['vp-test'],
              customer_segments: ['cs-test'],
            },
          },
        ],
        key_resources: [
          {
            id: 'kr-platform',
            name: 'Platform',
            for: { value_propositions: ['vp-test'] },
          },
        ],
        key_partnerships: [
          {
            id: 'kp-cloud',
            name: 'Cloud Provider',
            for: { key_resources: ['kr-platform'] },
          },
        ],
      };

      const graph = buildConnectionGraph(doc);

      expect(graph.get('kp-cloud')).toEqual(new Set(['cs-test']));
    });

    it('connects KP to segments through its key activities', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
        customer_segments: [{ id: 'cs-test', name: 'Test' }],
        value_propositions: [{ id: 'vp-test', name: 'Test VP' }],
        fits: [
          {
            id: 'fit-test',
            for: {
              value_propositions: ['vp-test'],
              customer_segments: ['cs-test'],
            },
          },
        ],
        key_activities: [
          {
            id: 'ka-marketing',
            name: 'Marketing',
            for: { value_propositions: ['vp-test'] },
          },
        ],
        key_partnerships: [
          {
            id: 'kp-agency',
            name: 'Marketing Agency',
            for: { key_activities: ['ka-marketing'] },
          },
        ],
      };

      const graph = buildConnectionGraph(doc);

      expect(graph.get('kp-agency')).toEqual(new Set(['cs-test']));
    });

    it('aggregates segments from both KR and KA paths', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
        customer_segments: [
          { id: 'cs-a', name: 'A' },
          { id: 'cs-b', name: 'B' },
        ],
        value_propositions: [
          { id: 'vp-a', name: 'VP A' },
          { id: 'vp-b', name: 'VP B' },
        ],
        fits: [
          {
            id: 'fit-a',
            for: { value_propositions: ['vp-a'], customer_segments: ['cs-a'] },
          },
          {
            id: 'fit-b',
            for: { value_propositions: ['vp-b'], customer_segments: ['cs-b'] },
          },
        ],
        key_resources: [
          {
            id: 'kr-platform',
            name: 'Platform',
            for: { value_propositions: ['vp-a'] },
          },
        ],
        key_activities: [
          {
            id: 'ka-dev',
            name: 'Development',
            for: { value_propositions: ['vp-b'] },
          },
        ],
        key_partnerships: [
          {
            id: 'kp-tech',
            name: 'Tech Partner',
            for: {
              key_resources: ['kr-platform'],
              key_activities: ['ka-dev'],
            },
          },
        ],
      };

      const graph = buildConnectionGraph(doc);

      expect(graph.get('kp-tech')).toEqual(new Set(['cs-a', 'cs-b']));
    });

    it('returns empty set for KP with no KR/KA connections (orphaned)', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
        key_partnerships: [{ id: 'kp-orphan', name: 'Orphan Partner' }],
      };

      const graph = buildConnectionGraph(doc);

      expect(graph.get('kp-orphan')).toEqual(new Set());
    });
  });

  describe('costs (transitive via KR/KA -> VP -> fit -> CS)', () => {
    it('connects cost to segments through its key resources', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
        customer_segments: [{ id: 'cs-test', name: 'Test' }],
        value_propositions: [{ id: 'vp-test', name: 'Test VP' }],
        fits: [
          {
            id: 'fit-test',
            for: {
              value_propositions: ['vp-test'],
              customer_segments: ['cs-test'],
            },
          },
        ],
        key_resources: [
          {
            id: 'kr-platform',
            name: 'Platform',
            for: { value_propositions: ['vp-test'] },
          },
        ],
        costs: [
          {
            id: 'cost-infra',
            name: 'Infrastructure Costs',
            for: { key_resources: ['kr-platform'] },
          },
        ],
      };

      const graph = buildConnectionGraph(doc);

      expect(graph.get('cost-infra')).toEqual(new Set(['cs-test']));
    });

    it('connects cost to segments through its key activities', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
        customer_segments: [{ id: 'cs-test', name: 'Test' }],
        value_propositions: [{ id: 'vp-test', name: 'Test VP' }],
        fits: [
          {
            id: 'fit-test',
            for: {
              value_propositions: ['vp-test'],
              customer_segments: ['cs-test'],
            },
          },
        ],
        key_activities: [
          {
            id: 'ka-marketing',
            name: 'Marketing',
            for: { value_propositions: ['vp-test'] },
          },
        ],
        costs: [
          {
            id: 'cost-marketing',
            name: 'Marketing Costs',
            for: { key_activities: ['ka-marketing'] },
          },
        ],
      };

      const graph = buildConnectionGraph(doc);

      expect(graph.get('cost-marketing')).toEqual(new Set(['cs-test']));
    });

    it('returns empty set for cost with no KR/KA connections (orphaned)', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
        costs: [{ id: 'cost-orphan', name: 'Orphan Cost' }],
      };

      const graph = buildConnectionGraph(doc);

      expect(graph.get('cost-orphan')).toEqual(new Set());
    });
  });

  describe('two-sided marketplace (Airbnb pattern)', () => {
    it('correctly separates guest vs host elements', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: baseMeta,
        customer_segments: [
          { id: 'cs-guests', name: 'Travelers & Guests' },
          { id: 'cs-hosts', name: 'Property Hosts' },
        ],
        value_propositions: [
          { id: 'vp-guest', name: 'Unique Stays' },
          { id: 'vp-host', name: 'Earn Money Hosting' },
        ],
        fits: [
          {
            id: 'fit-guest',
            for: {
              value_propositions: ['vp-guest'],
              customer_segments: ['cs-guests'],
            },
          },
          {
            id: 'fit-host',
            for: {
              value_propositions: ['vp-host'],
              customer_segments: ['cs-hosts'],
            },
          },
        ],
        channels: [
          {
            id: 'ch-guest-app',
            name: 'Guest App',
            for: { customer_segments: ['cs-guests'] },
          },
          {
            id: 'ch-host-app',
            name: 'Host App',
            for: { customer_segments: ['cs-hosts'] },
          },
        ],
        revenue_streams: [
          {
            id: 'rs-guest-fee',
            name: 'Guest Fee',
            from: { customer_segments: ['cs-guests'] },
          },
          {
            id: 'rs-host-fee',
            name: 'Host Fee',
            from: { customer_segments: ['cs-hosts'] },
          },
        ],
        key_resources: [
          {
            id: 'kr-platform',
            name: 'Platform',
            for: { value_propositions: ['vp-guest', 'vp-host'] },
          },
        ],
        key_activities: [
          {
            id: 'ka-host-acquisition',
            name: 'Host Acquisition',
            for: { value_propositions: ['vp-guest'] },
          },
        ],
        key_partnerships: [
          {
            id: 'kp-cloud',
            name: 'Cloud Provider',
            for: { key_resources: ['kr-platform'] },
          },
        ],
        costs: [
          {
            id: 'cost-platform',
            name: 'Platform Costs',
            for: { key_resources: ['kr-platform'] },
          },
        ],
      };

      const graph = buildConnectionGraph(doc);

      // Customer segments connect to themselves
      expect(graph.get('cs-guests')).toEqual(new Set(['cs-guests']));
      expect(graph.get('cs-hosts')).toEqual(new Set(['cs-hosts']));

      // VPs connect through their fits
      expect(graph.get('vp-guest')).toEqual(new Set(['cs-guests']));
      expect(graph.get('vp-host')).toEqual(new Set(['cs-hosts']));

      // Channels connect directly
      expect(graph.get('ch-guest-app')).toEqual(new Set(['cs-guests']));
      expect(graph.get('ch-host-app')).toEqual(new Set(['cs-hosts']));

      // Revenue streams connect directly
      expect(graph.get('rs-guest-fee')).toEqual(new Set(['cs-guests']));
      expect(graph.get('rs-host-fee')).toEqual(new Set(['cs-hosts']));

      // Shared platform resource connects to BOTH segments
      expect(graph.get('kr-platform')).toEqual(
        new Set(['cs-guests', 'cs-hosts'])
      );

      // Host acquisition activity only connects to guests (via vp-guest)
      expect(graph.get('ka-host-acquisition')).toEqual(new Set(['cs-guests']));

      // Cloud provider partnership connects through platform to both
      expect(graph.get('kp-cloud')).toEqual(new Set(['cs-guests', 'cs-hosts']));

      // Platform cost connects through platform to both
      expect(graph.get('cost-platform')).toEqual(
        new Set(['cs-guests', 'cs-hosts'])
      );
    });
  });
});

describe('getSegmentOrder', () => {
  it('returns segment IDs in definition order', () => {
    const doc: BMCDocumentV2 = {
      version: '2.0',
      meta: baseMeta,
      customer_segments: [
        { id: 'cs-second', name: 'Second' },
        { id: 'cs-first', name: 'First' },
        { id: 'cs-third', name: 'Third' },
      ],
    };

    const order = getSegmentOrder(doc);

    expect(order).toEqual(['cs-second', 'cs-first', 'cs-third']);
  });

  it('returns empty array when no segments defined', () => {
    const doc: BMCDocumentV2 = {
      version: '2.0',
      meta: baseMeta,
    };

    const order = getSegmentOrder(doc);

    expect(order).toEqual([]);
  });
});

describe('isOrphaned', () => {
  it('returns true for elements with no segment connections', () => {
    const doc: BMCDocumentV2 = {
      version: '2.0',
      meta: baseMeta,
      value_propositions: [{ id: 'vp-orphan', name: 'Orphan' }],
    };

    const graph = buildConnectionGraph(doc);

    expect(isOrphaned(graph, 'vp-orphan')).toBe(true);
  });

  it('returns false for elements with segment connections', () => {
    const doc: BMCDocumentV2 = {
      version: '2.0',
      meta: baseMeta,
      customer_segments: [{ id: 'cs-test', name: 'Test' }],
      value_propositions: [{ id: 'vp-connected', name: 'Connected' }],
      fits: [
        {
          id: 'fit-test',
          for: {
            value_propositions: ['vp-connected'],
            customer_segments: ['cs-test'],
          },
        },
      ],
    };

    const graph = buildConnectionGraph(doc);

    expect(isOrphaned(graph, 'vp-connected')).toBe(false);
  });

  it('returns true for elements not in the graph', () => {
    const graph = new Map<string, Set<string>>();

    expect(isOrphaned(graph, 'unknown-id')).toBe(true);
  });
});
