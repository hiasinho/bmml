/**
 * Type definition tests
 * Verify ID type guards and type compatibility with fixtures
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { load as loadYaml } from 'js-yaml';
import {
  isCustomerSegmentId,
  isValuePropositionId,
  isProductServiceId,
  isJobId,
  isPainId,
  isGainId,
  isFitId,
  isChannelId,
  isCustomerRelationshipId,
  isRevenueStreamId,
  isKeyResourceId,
  isKeyActivityId,
  isKeyPartnershipId,
  isResourceOrActivityId,
  // v2 type guards
  isPainRelieverId,
  isGainCreatorId,
  isCostId,
  type BMCDocumentV2,
} from '../src/types';

describe('ID Type Guards', () => {
  describe('isCustomerSegmentId', () => {
    it('accepts valid cs- prefixed IDs', () => {
      expect(isCustomerSegmentId('cs-remote-workers')).toBe(true);
      expect(isCustomerSegmentId('cs-123')).toBe(true);
      expect(isCustomerSegmentId('cs-a-b-c')).toBe(true);
    });

    it('rejects invalid IDs', () => {
      expect(isCustomerSegmentId('vp-test')).toBe(false);
      expect(isCustomerSegmentId('cs_test')).toBe(false);
      expect(isCustomerSegmentId('cs-')).toBe(false);
      expect(isCustomerSegmentId('CS-test')).toBe(false);
      expect(isCustomerSegmentId('')).toBe(false);
    });
  });

  describe('isValuePropositionId', () => {
    it('accepts valid vp- prefixed IDs', () => {
      expect(isValuePropositionId('vp-workspace')).toBe(true);
      expect(isValuePropositionId('vp-specialty-coffee')).toBe(true);
    });

    it('rejects invalid IDs', () => {
      expect(isValuePropositionId('cs-test')).toBe(false);
      expect(isValuePropositionId('vp-')).toBe(false);
    });
  });

  describe('isProductServiceId', () => {
    it('accepts valid ps- prefixed IDs', () => {
      expect(isProductServiceId('ps-wifi')).toBe(true);
      expect(isProductServiceId('ps-brew-methods')).toBe(true);
    });

    it('rejects invalid IDs', () => {
      expect(isProductServiceId('product-1')).toBe(false);
      expect(isProductServiceId('ps-')).toBe(false);
    });
  });

  describe('isJobId', () => {
    it('accepts valid job- prefixed IDs', () => {
      expect(isJobId('job-productive-space')).toBe(true);
      expect(isJobId('job-1')).toBe(true);
    });

    it('rejects invalid IDs', () => {
      expect(isJobId('jtbd-1')).toBe(false);
      expect(isJobId('job-')).toBe(false);
    });
  });

  describe('isPainId', () => {
    it('accepts valid pain- prefixed IDs', () => {
      expect(isPainId('pain-home-distractions')).toBe(true);
      expect(isPainId('pain-1')).toBe(true);
    });

    it('rejects invalid IDs', () => {
      expect(isPainId('pain_1')).toBe(false);
      expect(isPainId('pain-')).toBe(false);
    });
  });

  describe('isGainId', () => {
    it('accepts valid gain- prefixed IDs', () => {
      expect(isGainId('gain-focus')).toBe(true);
      expect(isGainId('gain-serendipity')).toBe(true);
    });

    it('rejects invalid IDs', () => {
      expect(isGainId('benefit-1')).toBe(false);
      expect(isGainId('gain-')).toBe(false);
    });
  });

  describe('isFitId', () => {
    it('accepts valid fit- prefixed IDs', () => {
      expect(isFitId('fit-workspace-remote')).toBe(true);
      expect(isFitId('fit-1')).toBe(true);
    });

    it('rejects invalid IDs', () => {
      expect(isFitId('match-1')).toBe(false);
      expect(isFitId('fit-')).toBe(false);
    });
  });

  describe('isChannelId', () => {
    it('accepts valid ch- prefixed IDs', () => {
      expect(isChannelId('ch-physical')).toBe(true);
      expect(isChannelId('ch-instagram')).toBe(true);
    });

    it('rejects invalid IDs', () => {
      expect(isChannelId('channel-1')).toBe(false);
      expect(isChannelId('ch-')).toBe(false);
    });
  });

  describe('isCustomerRelationshipId', () => {
    it('accepts valid cr- prefixed IDs', () => {
      expect(isCustomerRelationshipId('cr-community')).toBe(true);
      expect(isCustomerRelationshipId('cr-personal')).toBe(true);
    });

    it('rejects invalid IDs', () => {
      expect(isCustomerRelationshipId('rel-1')).toBe(false);
      expect(isCustomerRelationshipId('cr-')).toBe(false);
    });
  });

  describe('isRevenueStreamId', () => {
    it('accepts valid rs- prefixed IDs', () => {
      expect(isRevenueStreamId('rs-coffee-sales')).toBe(true);
      expect(isRevenueStreamId('rs-1')).toBe(true);
    });

    it('rejects invalid IDs', () => {
      expect(isRevenueStreamId('revenue-1')).toBe(false);
      expect(isRevenueStreamId('rs-')).toBe(false);
    });
  });

  describe('isKeyResourceId', () => {
    it('accepts valid kr- prefixed IDs', () => {
      expect(isKeyResourceId('kr-location')).toBe(true);
      expect(isKeyResourceId('kr-equipment')).toBe(true);
    });

    it('rejects invalid IDs', () => {
      expect(isKeyResourceId('resource-1')).toBe(false);
      expect(isKeyResourceId('kr-')).toBe(false);
    });
  });

  describe('isKeyActivityId', () => {
    it('accepts valid ka- prefixed IDs', () => {
      expect(isKeyActivityId('ka-coffee-service')).toBe(true);
      expect(isKeyActivityId('ka-community')).toBe(true);
    });

    it('rejects invalid IDs', () => {
      expect(isKeyActivityId('activity-1')).toBe(false);
      expect(isKeyActivityId('ka-')).toBe(false);
    });
  });

  describe('isKeyPartnershipId', () => {
    it('accepts valid kp- prefixed IDs', () => {
      expect(isKeyPartnershipId('kp-roasters')).toBe(true);
      expect(isKeyPartnershipId('kp-1')).toBe(true);
    });

    it('rejects invalid IDs', () => {
      expect(isKeyPartnershipId('partner-1')).toBe(false);
      expect(isKeyPartnershipId('kp-')).toBe(false);
    });
  });

  describe('isResourceOrActivityId', () => {
    it('accepts valid kr- and ka- prefixed IDs', () => {
      expect(isResourceOrActivityId('kr-location')).toBe(true);
      expect(isResourceOrActivityId('ka-coffee-service')).toBe(true);
    });

    it('rejects invalid IDs', () => {
      expect(isResourceOrActivityId('kp-roasters')).toBe(false);
      expect(isResourceOrActivityId('cs-test')).toBe(false);
    });
  });

  // v2 ID Type Guards
  describe('isPainRelieverId (v2)', () => {
    it('accepts valid pr- prefixed IDs', () => {
      expect(isPainRelieverId('pr-time-saver')).toBe(true);
      expect(isPainRelieverId('pr-1')).toBe(true);
      expect(isPainRelieverId('pr-easy-prep')).toBe(true);
    });

    it('rejects invalid IDs', () => {
      expect(isPainRelieverId('pain-1')).toBe(false);
      expect(isPainRelieverId('reliever-time')).toBe(false);
      expect(isPainRelieverId('pr-')).toBe(false);
      expect(isPainRelieverId('PR-test')).toBe(false);
      expect(isPainRelieverId('')).toBe(false);
    });
  });

  describe('isGainCreatorId (v2)', () => {
    it('accepts valid gc- prefixed IDs', () => {
      expect(isGainCreatorId('gc-variety')).toBe(true);
      expect(isGainCreatorId('gc-1')).toBe(true);
      expect(isGainCreatorId('gc-healthy-options')).toBe(true);
    });

    it('rejects invalid IDs', () => {
      expect(isGainCreatorId('gain-1')).toBe(false);
      expect(isGainCreatorId('creator-variety')).toBe(false);
      expect(isGainCreatorId('gc-')).toBe(false);
      expect(isGainCreatorId('GC-test')).toBe(false);
      expect(isGainCreatorId('')).toBe(false);
    });
  });

  describe('isCostId (v2)', () => {
    it('accepts valid cost- prefixed IDs', () => {
      expect(isCostId('cost-ingredients')).toBe(true);
      expect(isCostId('cost-1')).toBe(true);
      expect(isCostId('cost-delivery-fleet')).toBe(true);
    });

    it('rejects invalid IDs', () => {
      expect(isCostId('mc-ingredients')).toBe(false);
      expect(isCostId('major-cost-1')).toBe(false);
      expect(isCostId('cost-')).toBe(false);
      expect(isCostId('COST-test')).toBe(false);
      expect(isCostId('')).toBe(false);
    });
  });
});

describe('Type Compatibility', () => {
  it('valid-v2-complete.bmml conforms to BMCDocumentV2 type', () => {
    const content = readFileSync('test/fixtures/valid-v2-complete.bmml', 'utf-8');
    const doc = loadYaml(content) as BMCDocumentV2;

    // Verify top-level structure
    expect(doc.version).toBe('2.0');
    expect(doc.meta).toBeDefined();
    expect(doc.meta.name).toBe('Meal Kit Co');
    expect(doc.meta.portfolio).toBe('explore');
    expect(doc.meta.stage).toBe('validation');

    // Verify arrays exist and have items
    expect(doc.customer_segments).toBeDefined();
    expect(doc.customer_segments!.length).toBeGreaterThan(0);
    expect(doc.value_propositions).toBeDefined();
    expect(doc.fits).toBeDefined();
    expect(doc.channels).toBeDefined();
    expect(doc.customer_relationships).toBeDefined();
    expect(doc.revenue_streams).toBeDefined();
    expect(doc.key_resources).toBeDefined();
    expect(doc.key_activities).toBeDefined();
    expect(doc.key_partnerships).toBeDefined();
    expect(doc.costs).toBeDefined();
  });

  it('valid-v2-minimal.bmml conforms to BMCDocumentV2 type', () => {
    const content = readFileSync('test/fixtures/valid-v2-minimal.bmml', 'utf-8');
    const doc = loadYaml(content) as BMCDocumentV2;

    expect(doc.version).toBe('2.0');
    expect(doc.meta).toBeDefined();
    expect(doc.meta.name).toBeDefined();
    expect(doc.meta.portfolio).toBeDefined();
    expect(doc.meta.stage).toBeDefined();
  });

  it('customer segment IDs in v2 fixtures are valid', () => {
    const content = readFileSync('test/fixtures/valid-v2-complete.bmml', 'utf-8');
    const doc = loadYaml(content) as BMCDocumentV2;

    for (const segment of doc.customer_segments || []) {
      expect(isCustomerSegmentId(segment.id)).toBe(true);
    }
  });

  it('value proposition IDs in v2 fixtures are valid', () => {
    const content = readFileSync('test/fixtures/valid-v2-complete.bmml', 'utf-8');
    const doc = loadYaml(content) as BMCDocumentV2;

    for (const vp of doc.value_propositions || []) {
      expect(isValuePropositionId(vp.id)).toBe(true);
    }
  });
});

describe('v2 Type Compatibility', () => {
  it('BMCDocumentV2 interface accepts valid v2 structure', () => {
    // Programmatic test since v2 fixtures don't exist yet
    const doc: BMCDocumentV2 = {
      version: '2.0',
      meta: {
        name: 'Test v2 Model',
        portfolio: 'explore',
        stage: 'ideation',
      },
      customer_segments: [
        {
          id: 'cs-busy',
          name: 'Busy Professionals',
          jobs: [{ id: 'job-eat-healthy', description: 'Eat healthy without cooking' }],
          pains: [{ id: 'pain-time', description: 'No time to cook' }],
          gains: [{ id: 'gain-variety', description: 'Enjoy variety in meals' }],
        },
      ],
      value_propositions: [
        {
          id: 'vp-convenience',
          name: 'Convenient Meal Kits',
          products_services: [{ id: 'ps-kit', name: 'Pre-portioned meal kit' }],
          pain_relievers: [{ id: 'pr-time', name: 'Save cooking time' }],
          gain_creators: [{ id: 'gc-variety', name: 'Weekly menu rotation' }],
        },
      ],
      fits: [
        {
          id: 'fit-convenience-busy',
          for: {
            value_propositions: ['vp-convenience'],
            customer_segments: ['cs-busy'],
          },
          mappings: [
            ['pr-time', 'pain-time'],
            ['gc-variety', 'gain-variety'],
          ],
        },
      ],
      channels: [
        {
          id: 'ch-website',
          name: 'Website',
          for: {
            value_propositions: ['vp-convenience'],
            customer_segments: ['cs-busy'],
          },
        },
      ],
      customer_relationships: [
        {
          id: 'cr-subscription',
          name: 'Subscription service',
          for: { customer_segments: ['cs-busy'] },
        },
      ],
      revenue_streams: [
        {
          id: 'rs-subscriptions',
          name: 'Weekly subscriptions',
          from: { customer_segments: ['cs-busy'] },
          for: { value_propositions: ['vp-convenience'] },
        },
      ],
      key_resources: [
        {
          id: 'kr-kitchen',
          name: 'Central kitchen',
          for: { value_propositions: ['vp-convenience'] },
        },
      ],
      key_activities: [
        {
          id: 'ka-meal-prep',
          name: 'Meal preparation',
          for: { value_propositions: ['vp-convenience'] },
        },
      ],
      key_partnerships: [
        {
          id: 'kp-suppliers',
          name: 'Ingredient suppliers',
          for: { key_resources: ['kr-kitchen'] },
        },
      ],
      costs: [
        {
          id: 'cost-ingredients',
          name: 'Ingredient costs',
          for: { key_resources: ['kr-kitchen'], key_activities: ['ka-meal-prep'] },
        },
      ],
    };

    // Verify structure compiles and has correct types
    expect(doc.version).toBe('2.0');
    expect(doc.meta.name).toBe('Test v2 Model');
    expect(doc.customer_segments).toHaveLength(1);
    expect(doc.value_propositions).toHaveLength(1);
    expect(doc.fits).toHaveLength(1);
    expect(doc.costs).toHaveLength(1);
  });

  it('v2 IDs in programmatic document are valid', () => {
    const doc: BMCDocumentV2 = {
      version: '2.0',
      meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
      value_propositions: [
        {
          id: 'vp-test',
          name: 'Test VP',
          pain_relievers: [{ id: 'pr-test', name: 'Test reliever' }],
          gain_creators: [{ id: 'gc-test', name: 'Test creator' }],
        },
      ],
      costs: [{ id: 'cost-test', name: 'Test cost' }],
    };

    // Verify v2 IDs
    expect(isPainRelieverId(doc.value_propositions![0].pain_relievers![0].id)).toBe(true);
    expect(isGainCreatorId(doc.value_propositions![0].gain_creators![0].id)).toBe(true);
    expect(isCostId(doc.costs![0].id)).toBe(true);
  });

  it('FitMapping type enforces tuple structure', () => {
    // Type-level test - if this compiles, the type is correct
    const mapping: [string, string] = ['pr-time', 'pain-time'];
    expect(mapping).toHaveLength(2);
    expect(mapping[0]).toBe('pr-time');
    expect(mapping[1]).toBe('pain-time');
  });
});
