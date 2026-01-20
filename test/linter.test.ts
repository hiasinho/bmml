/**
 * Linter tests
 * Test reference integrity validation
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { load as loadYaml } from 'js-yaml';
import { lint, lintIsValid } from '../src/linter';
import type { BMCDocument, BMCDocumentV2 } from '../src/types';

const FIXTURES_DIR = 'test/fixtures';

function loadFixture(filename: string): BMCDocument {
  const content = readFileSync(`${FIXTURES_DIR}/${filename}`, 'utf-8');
  return loadYaml(content) as BMCDocument;
}

function loadFixtureV2(filename: string): BMCDocumentV2 {
  const content = readFileSync(`${FIXTURES_DIR}/${filename}`, 'utf-8');
  return loadYaml(content) as BMCDocumentV2;
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

  describe('coverage warnings', () => {
    it('warns when customer segment has no fits defined', () => {
      const doc: BMCDocument = {
        version: '1.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        customer_segments: [
          { id: 'cs-lonely', name: 'Lonely Segment' },
        ],
      };

      const result = lint(doc);
      const warning = result.issues.find((i) => i.rule === 'segment-no-fits');
      expect(warning).toBeDefined();
      expect(warning?.severity).toBe('warning');
      expect(warning?.message).toContain('cs-lonely');
      expect(warning?.message).toContain('has no fits defined');
      expect(warning?.path).toBe('/customer_segments/0');
    });

    it('does not warn when customer segment has a fit', () => {
      const doc: BMCDocument = {
        version: '1.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        customer_segments: [
          { id: 'cs-covered', name: 'Covered Segment' },
        ],
        value_propositions: [
          { id: 'vp-test', name: 'Test VP' },
        ],
        fits: [
          {
            id: 'fit-test',
            value_proposition: 'vp-test',
            customer_segment: 'cs-covered',
          },
        ],
      };

      const result = lint(doc);
      const warning = result.issues.find((i) => i.rule === 'segment-no-fits');
      expect(warning).toBeUndefined();
    });

    it('warns for each segment without fits', () => {
      const doc: BMCDocument = {
        version: '1.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        customer_segments: [
          { id: 'cs-lonely1', name: 'Lonely 1' },
          { id: 'cs-lonely2', name: 'Lonely 2' },
        ],
      };

      const result = lint(doc);
      const warnings = result.issues.filter((i) => i.rule === 'segment-no-fits');
      expect(warnings).toHaveLength(2);
    });

    it('only warns for segments without fits (mixed scenario)', () => {
      const doc: BMCDocument = {
        version: '1.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        customer_segments: [
          { id: 'cs-covered', name: 'Covered Segment' },
          { id: 'cs-lonely', name: 'Lonely Segment' },
        ],
        value_propositions: [
          { id: 'vp-test', name: 'Test VP' },
        ],
        fits: [
          {
            id: 'fit-test',
            value_proposition: 'vp-test',
            customer_segment: 'cs-covered',
          },
        ],
      };

      const result = lint(doc);
      const warnings = result.issues.filter((i) => i.rule === 'segment-no-fits');
      expect(warnings).toHaveLength(1);
      expect(warnings[0].message).toContain('cs-lonely');
    });

    it('validation still passes with segment-no-fits warning', () => {
      const doc: BMCDocument = {
        version: '1.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        customer_segments: [
          { id: 'cs-lonely', name: 'Lonely Segment' },
        ],
      };

      const result = lint(doc);
      const errors = result.issues.filter((i) => i.severity === 'error');
      expect(errors).toHaveLength(0);
    });
  });
});

// ============================================================================
// v2 Linter Tests
// ============================================================================

describe('lint v2', () => {
  describe('version detection', () => {
    it('detects v1 documents', () => {
      const doc: BMCDocument = {
        version: '1.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
      };
      const result = lint(doc);
      expect(result.version).toBe('v1');
    });

    it('detects v2 documents', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
      };
      const result = lint(doc);
      expect(result.version).toBe('v2');
    });
  });

  describe('fit reference rules (v2 for: pattern)', () => {
    it('detects missing value_proposition in for.value_propositions', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        customer_segments: [{ id: 'cs-test', name: 'Test Segment' }],
        fits: [
          {
            id: 'fit-test',
            for: {
              value_propositions: ['vp-nonexistent'],
              customer_segments: ['cs-test'],
            },
          },
        ],
      };

      const result = lint(doc);
      const error = result.issues.find(
        (i) => i.rule === 'fit-value-proposition-ref'
      );
      expect(error).toBeDefined();
      expect(error?.message).toContain('vp-nonexistent');
      expect(error?.path).toBe('/fits/0/for/value_propositions/0');
    });

    it('detects missing customer_segment in for.customer_segments', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        value_propositions: [{ id: 'vp-test', name: 'Test VP' }],
        fits: [
          {
            id: 'fit-test',
            for: {
              value_propositions: ['vp-test'],
              customer_segments: ['cs-nonexistent'],
            },
          },
        ],
      };

      const result = lint(doc);
      const error = result.issues.find(
        (i) => i.rule === 'fit-customer-segment-ref'
      );
      expect(error).toBeDefined();
      expect(error?.message).toContain('cs-nonexistent');
      expect(error?.path).toBe('/fits/0/for/customer_segments/0');
    });

    it('passes with valid v2 fit references', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        customer_segments: [{ id: 'cs-test', name: 'Test Segment' }],
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

      const result = lint(doc);
      expect(result.issues).toHaveLength(0);
    });
  });

  describe('fit mapping validation (v2 tuples)', () => {
    it('detects type mismatch: pain reliever mapped to gain', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        customer_segments: [
          {
            id: 'cs-test',
            name: 'Test Segment',
            gains: [{ id: 'gain-test', description: 'Test gain' }],
          },
        ],
        value_propositions: [
          {
            id: 'vp-test',
            name: 'Test VP',
            pain_relievers: [{ id: 'pr-test', name: 'Test reliever' }],
          },
        ],
        fits: [
          {
            id: 'fit-test',
            for: {
              value_propositions: ['vp-test'],
              customer_segments: ['cs-test'],
            },
            mappings: [['pr-test', 'gain-test']],
          },
        ],
      };

      const result = lint(doc);
      const error = result.issues.find(
        (i) => i.rule === 'fit-mapping-type-mismatch'
      );
      expect(error).toBeDefined();
      expect(error?.message).toContain('pain reliever');
      expect(error?.message).toContain('gain');
    });

    it('detects type mismatch: gain creator mapped to pain', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
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
            gain_creators: [{ id: 'gc-test', name: 'Test creator' }],
          },
        ],
        fits: [
          {
            id: 'fit-test',
            for: {
              value_propositions: ['vp-test'],
              customer_segments: ['cs-test'],
            },
            mappings: [['gc-test', 'pain-test']],
          },
        ],
      };

      const result = lint(doc);
      const error = result.issues.find(
        (i) => i.rule === 'fit-mapping-type-mismatch'
      );
      expect(error).toBeDefined();
      expect(error?.message).toContain('gain creator');
      expect(error?.message).toContain('pain');
    });

    it('allows valid pain reliever to pain mapping', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
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
            pain_relievers: [{ id: 'pr-test', name: 'Test reliever' }],
          },
        ],
        fits: [
          {
            id: 'fit-test',
            for: {
              value_propositions: ['vp-test'],
              customer_segments: ['cs-test'],
            },
            mappings: [['pr-test', 'pain-test']],
          },
        ],
      };

      const result = lint(doc);
      expect(result.issues.filter((i) => i.severity === 'error')).toHaveLength(
        0
      );
    });

    it('allows valid gain creator to gain mapping', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        customer_segments: [
          {
            id: 'cs-test',
            name: 'Test Segment',
            gains: [{ id: 'gain-test', description: 'Test gain' }],
          },
        ],
        value_propositions: [
          {
            id: 'vp-test',
            name: 'Test VP',
            gain_creators: [{ id: 'gc-test', name: 'Test creator' }],
          },
        ],
        fits: [
          {
            id: 'fit-test',
            for: {
              value_propositions: ['vp-test'],
              customer_segments: ['cs-test'],
            },
            mappings: [['gc-test', 'gain-test']],
          },
        ],
      };

      const result = lint(doc);
      expect(result.issues.filter((i) => i.severity === 'error')).toHaveLength(
        0
      );
    });
  });

  describe('pain reliever scope validation', () => {
    it('detects pain reliever not in linked VP value map', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
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
            pain_relievers: [{ id: 'pr-actual', name: 'Actual reliever' }],
          },
        ],
        fits: [
          {
            id: 'fit-test',
            for: {
              value_propositions: ['vp-test'],
              customer_segments: ['cs-test'],
            },
            mappings: [['pr-nonexistent', 'pain-test']],
          },
        ],
      };

      const result = lint(doc);
      const error = result.issues.find(
        (i) => i.rule === 'pain-reliever-scope-ref'
      );
      expect(error).toBeDefined();
      expect(error?.message).toContain('pr-nonexistent');
    });
  });

  describe('gain creator scope validation', () => {
    it('detects gain creator not in linked VP value map', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        customer_segments: [
          {
            id: 'cs-test',
            name: 'Test Segment',
            gains: [{ id: 'gain-test', description: 'Test gain' }],
          },
        ],
        value_propositions: [
          {
            id: 'vp-test',
            name: 'Test VP',
            gain_creators: [{ id: 'gc-actual', name: 'Actual creator' }],
          },
        ],
        fits: [
          {
            id: 'fit-test',
            for: {
              value_propositions: ['vp-test'],
              customer_segments: ['cs-test'],
            },
            mappings: [['gc-nonexistent', 'gain-test']],
          },
        ],
      };

      const result = lint(doc);
      const error = result.issues.find(
        (i) => i.rule === 'gain-creator-scope-ref'
      );
      expect(error).toBeDefined();
      expect(error?.message).toContain('gc-nonexistent');
    });
  });

  describe('pain/gain scope validation', () => {
    it('detects pain not in linked customer segment profile', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
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
            pain_relievers: [{ id: 'pr-test', name: 'Test reliever' }],
          },
        ],
        fits: [
          {
            id: 'fit-test',
            for: {
              value_propositions: ['vp-test'],
              customer_segments: ['cs-test'],
            },
            mappings: [['pr-test', 'pain-nonexistent']],
          },
        ],
      };

      const result = lint(doc);
      const error = result.issues.find((i) => i.rule === 'fit-pain-ref');
      expect(error).toBeDefined();
      expect(error?.message).toContain('pain-nonexistent');
    });

    it('detects gain not in linked customer segment profile', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
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
            gain_creators: [{ id: 'gc-test', name: 'Test creator' }],
          },
        ],
        fits: [
          {
            id: 'fit-test',
            for: {
              value_propositions: ['vp-test'],
              customer_segments: ['cs-test'],
            },
            mappings: [['gc-test', 'gain-nonexistent']],
          },
        ],
      };

      const result = lint(doc);
      const error = result.issues.find((i) => i.rule === 'fit-gain-ref');
      expect(error).toBeDefined();
      expect(error?.message).toContain('gain-nonexistent');
    });
  });

  describe('channel reference rules (v2 for: pattern)', () => {
    it('detects missing customer segment in for.customer_segments', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        channels: [
          {
            id: 'ch-test',
            name: 'Test Channel',
            for: {
              customer_segments: ['cs-nonexistent'],
            },
          },
        ],
      };

      const result = lint(doc);
      const error = result.issues.find((i) => i.rule === 'channel-segment-ref');
      expect(error).toBeDefined();
      expect(error?.path).toBe('/channels/0/for/customer_segments/0');
    });

    it('detects missing value proposition in for.value_propositions', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        channels: [
          {
            id: 'ch-test',
            name: 'Test Channel',
            for: {
              value_propositions: ['vp-nonexistent'],
            },
          },
        ],
      };

      const result = lint(doc);
      const error = result.issues.find((i) => i.rule === 'channel-value-ref');
      expect(error).toBeDefined();
      expect(error?.path).toBe('/channels/0/for/value_propositions/0');
    });
  });

  describe('customer_relationships reference rules (v2 for: pattern)', () => {
    it('detects missing customer segment in for.customer_segments', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        customer_relationships: [
          {
            id: 'cr-test',
            name: 'Self Service',
            for: {
              customer_segments: ['cs-nonexistent'],
            },
          },
        ],
      };

      const result = lint(doc);
      const error = result.issues.find(
        (i) => i.rule === 'customer-relationship-segment-ref'
      );
      expect(error).toBeDefined();
      expect(error?.path).toBe('/customer_relationships/0/for/customer_segments/0');
    });
  });

  describe('revenue_streams reference rules (v2 from:/for: pattern)', () => {
    it('detects missing customer segment in from.customer_segments', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        revenue_streams: [
          {
            id: 'rs-test',
            name: 'Test Revenue',
            from: {
              customer_segments: ['cs-nonexistent'],
            },
          },
        ],
      };

      const result = lint(doc);
      const error = result.issues.find(
        (i) => i.rule === 'revenue-stream-segment-ref'
      );
      expect(error).toBeDefined();
      expect(error?.path).toBe('/revenue_streams/0/from/customer_segments/0');
    });

    it('detects missing value proposition in for.value_propositions', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        revenue_streams: [
          {
            id: 'rs-test',
            name: 'Test Revenue',
            for: {
              value_propositions: ['vp-nonexistent'],
            },
          },
        ],
      };

      const result = lint(doc);
      const error = result.issues.find(
        (i) => i.rule === 'revenue-stream-value-ref'
      );
      expect(error).toBeDefined();
      expect(error?.path).toBe('/revenue_streams/0/for/value_propositions/0');
    });
  });

  describe('key_resources reference rules (v2 for: pattern)', () => {
    it('detects missing value proposition in for.value_propositions', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        key_resources: [
          {
            id: 'kr-test',
            name: 'Test Resource',
            for: {
              value_propositions: ['vp-nonexistent'],
            },
          },
        ],
      };

      const result = lint(doc);
      const error = result.issues.find(
        (i) => i.rule === 'key-resource-value-ref'
      );
      expect(error).toBeDefined();
      expect(error?.path).toBe('/key_resources/0/for/value_propositions/0');
    });
  });

  describe('key_activities reference rules (v2 for: pattern)', () => {
    it('detects missing value proposition in for.value_propositions', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        key_activities: [
          {
            id: 'ka-test',
            name: 'Test Activity',
            for: {
              value_propositions: ['vp-nonexistent'],
            },
          },
        ],
      };

      const result = lint(doc);
      const error = result.issues.find(
        (i) => i.rule === 'key-activity-value-ref'
      );
      expect(error).toBeDefined();
      expect(error?.path).toBe('/key_activities/0/for/value_propositions/0');
    });
  });

  describe('key_partnerships reference rules (v2 for: pattern)', () => {
    it('detects missing key resource in for.key_resources', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        key_partnerships: [
          {
            id: 'kp-test',
            name: 'Test Partner',
            for: {
              key_resources: ['kr-nonexistent'],
            },
          },
        ],
      };

      const result = lint(doc);
      const error = result.issues.find(
        (i) => i.rule === 'key-partnership-provides-ref'
      );
      expect(error).toBeDefined();
      expect(error?.message).toContain('kr-nonexistent');
    });

    it('detects missing key activity in for.key_activities', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        key_partnerships: [
          {
            id: 'kp-test',
            name: 'Test Partner',
            for: {
              key_activities: ['ka-nonexistent'],
            },
          },
        ],
      };

      const result = lint(doc);
      const error = result.issues.find(
        (i) => i.rule === 'key-partnership-provides-ref'
      );
      expect(error).toBeDefined();
      expect(error?.message).toContain('ka-nonexistent');
    });

    it('passes with valid key resource and activity references', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        key_resources: [{ id: 'kr-valid', name: 'Resource' }],
        key_activities: [{ id: 'ka-valid', name: 'Activity' }],
        key_partnerships: [
          {
            id: 'kp-test',
            name: 'Test Partner',
            for: {
              key_resources: ['kr-valid'],
              key_activities: ['ka-valid'],
            },
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

  describe('costs reference rules (v2 costs array)', () => {
    it('detects missing key resource in for.key_resources', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        costs: [
          {
            id: 'cost-test',
            name: 'Test Cost',
            for: {
              key_resources: ['kr-nonexistent'],
            },
          },
        ],
      };

      const result = lint(doc);
      const error = result.issues.find((i) => i.rule === 'cost-linked-to-ref');
      expect(error).toBeDefined();
      expect(error?.message).toContain('kr-nonexistent');
    });

    it('detects missing key activity in for.key_activities', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        costs: [
          {
            id: 'cost-test',
            name: 'Test Cost',
            for: {
              key_activities: ['ka-nonexistent'],
            },
          },
        ],
      };

      const result = lint(doc);
      const error = result.issues.find((i) => i.rule === 'cost-linked-to-ref');
      expect(error).toBeDefined();
      expect(error?.message).toContain('ka-nonexistent');
    });

    it('passes with valid key resource and activity references', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        key_resources: [{ id: 'kr-valid', name: 'Resource' }],
        key_activities: [{ id: 'ka-valid', name: 'Activity' }],
        costs: [
          {
            id: 'cost-test',
            name: 'Test Cost',
            for: {
              key_resources: ['kr-valid'],
              key_activities: ['ka-valid'],
            },
          },
        ],
      };

      const result = lint(doc);
      const error = result.issues.find((i) => i.rule === 'cost-linked-to-ref');
      expect(error).toBeUndefined();
    });
  });

  describe('coverage warnings (v2)', () => {
    it('warns when customer segment has no fits defined', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        customer_segments: [
          { id: 'cs-lonely', name: 'Lonely Segment' },
        ],
      };

      const result = lint(doc);
      const warning = result.issues.find((i) => i.rule === 'segment-no-fits');
      expect(warning).toBeDefined();
      expect(warning?.severity).toBe('warning');
      expect(warning?.message).toContain('cs-lonely');
      expect(warning?.message).toContain('has no fits defined');
      expect(warning?.path).toBe('/customer_segments/0');
    });

    it('does not warn when customer segment has a fit (v2 for: pattern)', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        customer_segments: [
          { id: 'cs-covered', name: 'Covered Segment' },
        ],
        value_propositions: [
          { id: 'vp-test', name: 'Test VP' },
        ],
        fits: [
          {
            id: 'fit-test',
            for: {
              value_propositions: ['vp-test'],
              customer_segments: ['cs-covered'],
            },
          },
        ],
      };

      const result = lint(doc);
      const warning = result.issues.find((i) => i.rule === 'segment-no-fits');
      expect(warning).toBeUndefined();
    });

    it('does not warn when segment is in any fit (multiple segments per fit)', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        customer_segments: [
          { id: 'cs-one', name: 'Segment One' },
          { id: 'cs-two', name: 'Segment Two' },
        ],
        value_propositions: [
          { id: 'vp-test', name: 'Test VP' },
        ],
        fits: [
          {
            id: 'fit-test',
            for: {
              value_propositions: ['vp-test'],
              customer_segments: ['cs-one', 'cs-two'],
            },
          },
        ],
      };

      const result = lint(doc);
      const warnings = result.issues.filter((i) => i.rule === 'segment-no-fits');
      expect(warnings).toHaveLength(0);
    });

    it('warns for each segment without fits', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        customer_segments: [
          { id: 'cs-lonely1', name: 'Lonely 1' },
          { id: 'cs-lonely2', name: 'Lonely 2' },
        ],
      };

      const result = lint(doc);
      const warnings = result.issues.filter((i) => i.rule === 'segment-no-fits');
      expect(warnings).toHaveLength(2);
    });

    it('only warns for segments without fits (mixed scenario)', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        customer_segments: [
          { id: 'cs-covered', name: 'Covered Segment' },
          { id: 'cs-lonely', name: 'Lonely Segment' },
        ],
        value_propositions: [
          { id: 'vp-test', name: 'Test VP' },
        ],
        fits: [
          {
            id: 'fit-test',
            for: {
              value_propositions: ['vp-test'],
              customer_segments: ['cs-covered'],
            },
          },
        ],
      };

      const result = lint(doc);
      const warnings = result.issues.filter((i) => i.rule === 'segment-no-fits');
      expect(warnings).toHaveLength(1);
      expect(warnings[0].message).toContain('cs-lonely');
    });

    it('validation still passes with segment-no-fits warning', () => {
      const doc: BMCDocumentV2 = {
        version: '2.0',
        meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
        customer_segments: [
          { id: 'cs-lonely', name: 'Lonely Segment' },
        ],
      };

      const result = lint(doc);
      const errors = result.issues.filter((i) => i.severity === 'error');
      expect(errors).toHaveLength(0);
    });
  });
});
