/**
 * Linter tests
 * Test reference integrity validation
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { load as loadYaml } from 'js-yaml';
import { lint, lintIsValid } from '../src/linter';
import type { BMCDocument } from '../src/types';

const FIXTURES_DIR = 'test/fixtures';

function loadFixture(filename: string): BMCDocument {
  const content = readFileSync(`${FIXTURES_DIR}/${filename}`, 'utf-8');
  return loadYaml(content) as BMCDocument;
}

describe('lint', () => {
  describe('valid documents', () => {
    it('valid-minimal.bmml passes linting', () => {
      const doc = loadFixture('valid-minimal.bmml');
      const result = lint(doc);

      expect(result.issues).toHaveLength(0);
      expect(lintIsValid(doc)).toBe(true);
    });

    it('valid-complete.bmml passes linting', () => {
      const doc = loadFixture('valid-complete.bmml');
      const result = lint(doc);

      expect(result.issues).toHaveLength(0);
      expect(lintIsValid(doc)).toBe(true);
    });
  });

  describe('invalid references', () => {
    it('detects all reference integrity errors in invalid-references.bmml', () => {
      const doc = loadFixture('invalid-references.bmml');
      const result = lint(doc);

      // Should have many errors
      expect(result.issues.length).toBeGreaterThan(0);
      expect(lintIsValid(doc)).toBe(false);

      // Check specific rules are triggered
      const rules = new Set(result.issues.map((i) => i.rule));
      expect(rules.has('fit-value-proposition-ref')).toBe(true);
      expect(rules.has('fit-customer-segment-ref')).toBe(true);
      expect(rules.has('fit-pain-ref')).toBe(true);
      expect(rules.has('fit-through-ref')).toBe(true);
      expect(rules.has('channel-segment-ref')).toBe(true);
      expect(rules.has('customer-relationship-segment-ref')).toBe(true);
      expect(rules.has('revenue-stream-segment-ref')).toBe(true);
      expect(rules.has('revenue-stream-value-ref')).toBe(true);
      expect(rules.has('key-resource-value-ref')).toBe(true);
      expect(rules.has('key-activity-value-ref')).toBe(true);
      expect(rules.has('key-partnership-provides-ref')).toBe(true);
      expect(rules.has('cost-linked-to-ref')).toBe(true);
    });
  });

  describe('fit reference rules', () => {
    it('detects missing value_proposition reference', () => {
      const doc: BMCDocument = {
        version: '1.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        fits: [
          {
            id: 'fit-test',
            value_proposition: 'vp-nonexistent',
            customer_segment: 'cs-test',
          },
        ],
        customer_segments: [{ id: 'cs-test', name: 'Test Segment' }],
      };

      const result = lint(doc);
      const error = result.issues.find(
        (i) => i.rule === 'fit-value-proposition-ref'
      );
      expect(error).toBeDefined();
      expect(error?.message).toContain('vp-nonexistent');
    });

    it('detects missing customer_segment reference', () => {
      const doc: BMCDocument = {
        version: '1.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        fits: [
          {
            id: 'fit-test',
            value_proposition: 'vp-test',
            customer_segment: 'cs-nonexistent',
          },
        ],
        value_propositions: [{ id: 'vp-test', name: 'Test VP' }],
      };

      const result = lint(doc);
      const error = result.issues.find(
        (i) => i.rule === 'fit-customer-segment-ref'
      );
      expect(error).toBeDefined();
      expect(error?.message).toContain('cs-nonexistent');
    });

    it('detects pain not in referenced customer segment', () => {
      const doc: BMCDocument = {
        version: '1.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        customer_segments: [
          {
            id: 'cs-test',
            name: 'Test Segment',
            pains: [{ id: 'pain-actual', description: 'Actual pain' }],
          },
        ],
        value_propositions: [
          {
            id: 'vp-test',
            name: 'Test VP',
            products_services: [
              { id: 'ps-test', type: 'product', description: 'Test' },
            ],
          },
        ],
        fits: [
          {
            id: 'fit-test',
            value_proposition: 'vp-test',
            customer_segment: 'cs-test',
            pain_relievers: [
              {
                pain: 'pain-wrong',
                through: ['ps-test'],
              },
            ],
          },
        ],
      };

      const result = lint(doc);
      const error = result.issues.find((i) => i.rule === 'fit-pain-ref');
      expect(error).toBeDefined();
      expect(error?.message).toContain('pain-wrong');
      expect(error?.message).toContain('cs-test');
    });

    it('detects gain not in referenced customer segment', () => {
      const doc: BMCDocument = {
        version: '1.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        customer_segments: [
          {
            id: 'cs-test',
            name: 'Test Segment',
            gains: [{ id: 'gain-actual', description: 'Actual gain' }],
          },
        ],
        value_propositions: [
          {
            id: 'vp-test',
            name: 'Test VP',
            products_services: [
              { id: 'ps-test', type: 'product', description: 'Test' },
            ],
          },
        ],
        fits: [
          {
            id: 'fit-test',
            value_proposition: 'vp-test',
            customer_segment: 'cs-test',
            gain_creators: [
              {
                gain: 'gain-wrong',
                through: ['ps-test'],
              },
            ],
          },
        ],
      };

      const result = lint(doc);
      const error = result.issues.find((i) => i.rule === 'fit-gain-ref');
      expect(error).toBeDefined();
      expect(error?.message).toContain('gain-wrong');
    });

    it('detects job not in referenced customer segment', () => {
      const doc: BMCDocument = {
        version: '1.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        customer_segments: [
          {
            id: 'cs-test',
            name: 'Test Segment',
            jobs: [
              {
                id: 'job-actual',
                type: 'functional',
                description: 'Actual job',
              },
            ],
          },
        ],
        value_propositions: [
          {
            id: 'vp-test',
            name: 'Test VP',
            products_services: [
              { id: 'ps-test', type: 'product', description: 'Test' },
            ],
          },
        ],
        fits: [
          {
            id: 'fit-test',
            value_proposition: 'vp-test',
            customer_segment: 'cs-test',
            job_addressers: [
              {
                job: 'job-wrong',
                through: ['ps-test'],
              },
            ],
          },
        ],
      };

      const result = lint(doc);
      const error = result.issues.find((i) => i.rule === 'fit-job-ref');
      expect(error).toBeDefined();
      expect(error?.message).toContain('job-wrong');
    });

    it('detects through reference not in value proposition', () => {
      const doc: BMCDocument = {
        version: '1.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        customer_segments: [
          {
            id: 'cs-test',
            name: 'Test Segment',
            pains: [{ id: 'pain-test', description: 'Test pain' }],
          },
        ],
        value_propositions: [
          {
            id: 'vp-test',
            name: 'Test VP',
            products_services: [
              { id: 'ps-actual', type: 'product', description: 'Actual' },
            ],
          },
        ],
        fits: [
          {
            id: 'fit-test',
            value_proposition: 'vp-test',
            customer_segment: 'cs-test',
            pain_relievers: [
              {
                pain: 'pain-test',
                through: ['ps-wrong'],
              },
            ],
          },
        ],
      };

      const result = lint(doc);
      const error = result.issues.find((i) => i.rule === 'fit-through-ref');
      expect(error).toBeDefined();
      expect(error?.message).toContain('ps-wrong');
      expect(error?.message).toContain('vp-test');
    });
  });

  describe('channel reference rules', () => {
    it('detects missing segment reference in channels', () => {
      const doc: BMCDocument = {
        version: '1.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        channels: [
          {
            id: 'ch-test',
            name: 'Test Channel',
            type: 'direct',
            segments: ['cs-nonexistent'],
          },
        ],
      };

      const result = lint(doc);
      const error = result.issues.find((i) => i.rule === 'channel-segment-ref');
      expect(error).toBeDefined();
      expect(error?.message).toContain('cs-nonexistent');
    });
  });

  describe('customer_relationships reference rules', () => {
    it('detects missing segment reference', () => {
      const doc: BMCDocument = {
        version: '1.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        customer_relationships: [
          {
            id: 'cr-test',
            segment: 'cs-nonexistent',
            type: 'self_service',
          },
        ],
      };

      const result = lint(doc);
      const error = result.issues.find(
        (i) => i.rule === 'customer-relationship-segment-ref'
      );
      expect(error).toBeDefined();
      expect(error?.message).toContain('cs-nonexistent');
    });
  });

  describe('revenue_streams reference rules', () => {
    it('detects missing segment reference in from_segments', () => {
      const doc: BMCDocument = {
        version: '1.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        revenue_streams: [
          {
            id: 'rs-test',
            name: 'Test Revenue',
            type: 'transaction',
            from_segments: ['cs-nonexistent'],
          },
        ],
      };

      const result = lint(doc);
      const error = result.issues.find(
        (i) => i.rule === 'revenue-stream-segment-ref'
      );
      expect(error).toBeDefined();
    });

    it('detects missing value proposition reference', () => {
      const doc: BMCDocument = {
        version: '1.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        revenue_streams: [
          {
            id: 'rs-test',
            name: 'Test Revenue',
            type: 'transaction',
            for_value: 'vp-nonexistent',
          },
        ],
      };

      const result = lint(doc);
      const error = result.issues.find(
        (i) => i.rule === 'revenue-stream-value-ref'
      );
      expect(error).toBeDefined();
    });
  });

  describe('key_resources reference rules', () => {
    it('detects missing value proposition reference', () => {
      const doc: BMCDocument = {
        version: '1.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        key_resources: [
          {
            id: 'kr-test',
            name: 'Test Resource',
            type: 'physical',
            for_value: ['vp-nonexistent'],
          },
        ],
      };

      const result = lint(doc);
      const error = result.issues.find(
        (i) => i.rule === 'key-resource-value-ref'
      );
      expect(error).toBeDefined();
    });
  });

  describe('key_activities reference rules', () => {
    it('detects missing value proposition reference', () => {
      const doc: BMCDocument = {
        version: '1.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        key_activities: [
          {
            id: 'ka-test',
            name: 'Test Activity',
            type: 'production',
            for_value: ['vp-nonexistent'],
          },
        ],
      };

      const result = lint(doc);
      const error = result.issues.find(
        (i) => i.rule === 'key-activity-value-ref'
      );
      expect(error).toBeDefined();
    });
  });

  describe('key_partnerships reference rules', () => {
    it('detects missing resource reference in provides', () => {
      const doc: BMCDocument = {
        version: '1.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        key_partnerships: [
          {
            id: 'kp-test',
            name: 'Test Partner',
            type: 'supplier',
            motivation: 'optimization',
            provides: ['kr-nonexistent'],
          },
        ],
      };

      const result = lint(doc);
      const error = result.issues.find(
        (i) => i.rule === 'key-partnership-provides-ref'
      );
      expect(error).toBeDefined();
    });

    it('allows valid resource or activity references', () => {
      const doc: BMCDocument = {
        version: '1.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        key_resources: [{ id: 'kr-valid', name: 'Resource', type: 'physical' }],
        key_activities: [
          { id: 'ka-valid', name: 'Activity', type: 'production' },
        ],
        key_partnerships: [
          {
            id: 'kp-test',
            name: 'Test Partner',
            type: 'supplier',
            motivation: 'optimization',
            provides: ['kr-valid', 'ka-valid'],
          },
        ],
      };

      const result = lint(doc);
      const error = result.issues.find(
        (i) => i.rule === 'key-partnership-provides-ref'
      );
      expect(error).toBeUndefined();
    });
  });

  describe('cost_structure reference rules', () => {
    it('detects missing resource/activity reference in linked_to', () => {
      const doc: BMCDocument = {
        version: '1.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        cost_structure: {
          type: 'cost_driven',
          major_costs: [
            {
              name: 'Test Cost',
              type: 'fixed',
              linked_to: ['kr-nonexistent'],
            },
          ],
        },
      };

      const result = lint(doc);
      const error = result.issues.find((i) => i.rule === 'cost-linked-to-ref');
      expect(error).toBeDefined();
    });

    it('allows valid resource or activity references', () => {
      const doc: BMCDocument = {
        version: '1.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        key_resources: [{ id: 'kr-valid', name: 'Resource', type: 'physical' }],
        key_activities: [
          { id: 'ka-valid', name: 'Activity', type: 'production' },
        ],
        cost_structure: {
          type: 'cost_driven',
          major_costs: [
            {
              name: 'Test Cost',
              type: 'fixed',
              linked_to: ['kr-valid', 'ka-valid'],
            },
          ],
        },
      };

      const result = lint(doc);
      const error = result.issues.find((i) => i.rule === 'cost-linked-to-ref');
      expect(error).toBeUndefined();
    });
  });

  describe('error reporting', () => {
    it('includes JSON path in error', () => {
      const doc: BMCDocument = {
        version: '1.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        channels: [
          {
            id: 'ch-test',
            name: 'Test',
            type: 'direct',
            segments: ['cs-missing'],
          },
        ],
      };

      const result = lint(doc);
      const error = result.issues.find((i) => i.rule === 'channel-segment-ref');
      expect(error?.path).toBe('/channels/0/segments/0');
    });

    it('reports all errors, not just the first', () => {
      const doc: BMCDocument = {
        version: '1.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        channels: [
          {
            id: 'ch-test',
            name: 'Test',
            type: 'direct',
            segments: ['cs-missing1', 'cs-missing2'],
          },
        ],
      };

      const result = lint(doc);
      const errors = result.issues.filter(
        (i) => i.rule === 'channel-segment-ref'
      );
      expect(errors).toHaveLength(2);
    });
  });
});
