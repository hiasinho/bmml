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
  type BMCDocument,
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
});

describe('Type Compatibility', () => {
  it('valid-complete.bmml conforms to BMCDocument type', () => {
    const content = readFileSync('test/fixtures/valid-complete.bmml', 'utf-8');
    const doc = loadYaml(content) as BMCDocument;

    // Verify top-level structure
    expect(doc.version).toBe('1.0');
    expect(doc.meta).toBeDefined();
    expect(doc.meta.name).toBe('Urban Brew');
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
    expect(doc.cost_structure).toBeDefined();
  });

  it('valid-minimal.bmml conforms to BMCDocument type', () => {
    const content = readFileSync('test/fixtures/valid-minimal.bmml', 'utf-8');
    const doc = loadYaml(content) as BMCDocument;

    expect(doc.version).toBe('1.0');
    expect(doc.meta).toBeDefined();
    expect(doc.meta.name).toBeDefined();
    expect(doc.meta.portfolio).toBeDefined();
    expect(doc.meta.stage).toBeDefined();
  });

  it('customer segment IDs in fixtures are valid', () => {
    const content = readFileSync('test/fixtures/valid-complete.bmml', 'utf-8');
    const doc = loadYaml(content) as BMCDocument;

    for (const segment of doc.customer_segments || []) {
      expect(isCustomerSegmentId(segment.id)).toBe(true);
    }
  });

  it('value proposition IDs in fixtures are valid', () => {
    const content = readFileSync('test/fixtures/valid-complete.bmml', 'utf-8');
    const doc = loadYaml(content) as BMCDocument;

    for (const vp of doc.value_propositions || []) {
      expect(isValuePropositionId(vp.id)).toBe(true);
    }
  });
});
