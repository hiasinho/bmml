/**
 * Migration tests
 * Test v1 to v2 document migration
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { migrateV1toV2, migrateDocumentV1toV2 } from '../src/migrate';
import { validateAuto, parseYaml } from '../src/validator';
import type { BMCDocument } from '../src/types';

const FIXTURES_DIR = 'test/fixtures';

describe('migrateV1toV2', () => {
  describe('basic functionality', () => {
    it('returns error for invalid YAML', () => {
      const result = migrateV1toV2('invalid: yaml: syntax: ::');
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('YAML parse error');
    });

    it('returns error for v2 documents', () => {
      const v2Content = readFileSync(`${FIXTURES_DIR}/valid-v2-minimal.bmml`, 'utf-8');
      const result = migrateV1toV2(v2Content);
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('already be v2');
    });

    it('returns error for missing meta', () => {
      const result = migrateV1toV2('version: "1.0"\n');
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Missing required meta');
    });

    it('returns error for unsupported version', () => {
      const result = migrateV1toV2('version: "3.0"\nmeta:\n  name: Test\n  portfolio: explore\n  stage: ideation');
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Unsupported version');
    });

    it('successfully migrates minimal v1 document', () => {
      const v1Content = readFileSync(`${FIXTURES_DIR}/valid-minimal.bmml`, 'utf-8');
      const result = migrateV1toV2(v1Content);
      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
      expect(result.output).toContain('version: "2.0"');
    });

    it('successfully migrates complete v1 document', () => {
      const v1Content = readFileSync(`${FIXTURES_DIR}/valid-complete.bmml`, 'utf-8');
      const result = migrateV1toV2(v1Content);
      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
    });
  });

  describe('version field', () => {
    it('changes version from 1.0 to 2.0', () => {
      const v1Content = readFileSync(`${FIXTURES_DIR}/valid-minimal.bmml`, 'utf-8');
      const result = migrateV1toV2(v1Content);
      expect(result.success).toBe(true);
      expect(result.output).toContain('version: "2.0"');
      expect(result.output).not.toContain('version: "1.0"');
    });
  });

  describe('customer segments migration', () => {
    it('preserves customer segment core fields', () => {
      const result = migrateV1toV2(`
version: "1.0"
meta:
  name: Test
  portfolio: explore
  stage: ideation
customer_segments:
  - id: cs-test
    name: Test Segment
    description: A test segment
`);
      expect(result.success).toBe(true);
      expect(result.output).toContain('cs-test');
      expect(result.output).toContain('Test Segment');
    });

    it('strips type and importance from jobs', () => {
      const v1Content = readFileSync(`${FIXTURES_DIR}/valid-complete.bmml`, 'utf-8');
      const result = migrateV1toV2(v1Content);
      expect(result.success).toBe(true);
      // v2 jobs should not have type or importance
      const parseResult = parseYaml(result.output!);
      expect('data' in parseResult).toBe(true);
      if ('data' in parseResult) {
        const doc = parseResult.data as any;
        const job = doc.customer_segments?.[0]?.jobs?.[0];
        expect(job).toBeDefined();
        expect(job.id).toBeDefined();
        expect(job.description).toBeDefined();
        expect(job.type).toBeUndefined();
        expect(job.importance).toBeUndefined();
      }
    });

    it('strips severity from pains', () => {
      const v1Content = readFileSync(`${FIXTURES_DIR}/valid-complete.bmml`, 'utf-8');
      const result = migrateV1toV2(v1Content);
      expect(result.success).toBe(true);
      const parseResult = parseYaml(result.output!);
      expect('data' in parseResult).toBe(true);
      if ('data' in parseResult) {
        const doc = parseResult.data as any;
        const pain = doc.customer_segments?.[0]?.pains?.[0];
        expect(pain).toBeDefined();
        expect(pain.id).toBeDefined();
        expect(pain.description).toBeDefined();
        expect(pain.severity).toBeUndefined();
      }
    });

    it('strips importance from gains', () => {
      const v1Content = readFileSync(`${FIXTURES_DIR}/valid-complete.bmml`, 'utf-8');
      const result = migrateV1toV2(v1Content);
      expect(result.success).toBe(true);
      const parseResult = parseYaml(result.output!);
      expect('data' in parseResult).toBe(true);
      if ('data' in parseResult) {
        const doc = parseResult.data as any;
        const gain = doc.customer_segments?.[0]?.gains?.[0];
        expect(gain).toBeDefined();
        expect(gain.id).toBeDefined();
        expect(gain.description).toBeDefined();
        expect(gain.importance).toBeUndefined();
      }
    });
  });

  describe('value propositions migration', () => {
    it('converts products_services type to name', () => {
      const v1Content = readFileSync(`${FIXTURES_DIR}/valid-complete.bmml`, 'utf-8');
      const result = migrateV1toV2(v1Content);
      expect(result.success).toBe(true);
      const parseResult = parseYaml(result.output!);
      expect('data' in parseResult).toBe(true);
      if ('data' in parseResult) {
        const doc = parseResult.data as any;
        const ps = doc.value_propositions?.[0]?.products_services?.[0];
        expect(ps).toBeDefined();
        expect(ps.id).toBeDefined();
        expect(ps.name).toBeDefined();
        expect(ps.type).toBeUndefined();
      }
    });

    it('adds pain_relievers extracted from fits', () => {
      const v1Content = readFileSync(`${FIXTURES_DIR}/valid-complete.bmml`, 'utf-8');
      const result = migrateV1toV2(v1Content);
      expect(result.success).toBe(true);
      const parseResult = parseYaml(result.output!);
      expect('data' in parseResult).toBe(true);
      if ('data' in parseResult) {
        const doc = parseResult.data as any;
        // First VP (vp-workspace) should have pain relievers from fit-workspace-remote
        const vp = doc.value_propositions?.[0];
        expect(vp?.pain_relievers).toBeDefined();
        expect(vp?.pain_relievers?.length).toBeGreaterThan(0);
        expect(vp?.pain_relievers?.[0]?.id).toMatch(/^pr-/);
      }
    });

    it('adds gain_creators extracted from fits', () => {
      const v1Content = readFileSync(`${FIXTURES_DIR}/valid-complete.bmml`, 'utf-8');
      const result = migrateV1toV2(v1Content);
      expect(result.success).toBe(true);
      const parseResult = parseYaml(result.output!);
      expect('data' in parseResult).toBe(true);
      if ('data' in parseResult) {
        const doc = parseResult.data as any;
        // First VP should have gain creators
        const vp = doc.value_propositions?.[0];
        expect(vp?.gain_creators).toBeDefined();
        expect(vp?.gain_creators?.length).toBeGreaterThan(0);
        expect(vp?.gain_creators?.[0]?.id).toMatch(/^gc-/);
      }
    });
  });

  describe('fits migration', () => {
    it('converts value_proposition + customer_segment to for: pattern', () => {
      const v1Content = readFileSync(`${FIXTURES_DIR}/valid-complete.bmml`, 'utf-8');
      const result = migrateV1toV2(v1Content);
      expect(result.success).toBe(true);
      const parseResult = parseYaml(result.output!);
      expect('data' in parseResult).toBe(true);
      if ('data' in parseResult) {
        const doc = parseResult.data as any;
        const fit = doc.fits?.[0];
        expect(fit).toBeDefined();
        expect(fit.for).toBeDefined();
        expect(fit.for.value_propositions).toBeInstanceOf(Array);
        expect(fit.for.customer_segments).toBeInstanceOf(Array);
        // v1 fields should not exist
        expect(fit.value_proposition).toBeUndefined();
        expect(fit.customer_segment).toBeUndefined();
      }
    });

    it('creates tuple mappings for pain relievers and gain creators', () => {
      const v1Content = readFileSync(`${FIXTURES_DIR}/valid-complete.bmml`, 'utf-8');
      const result = migrateV1toV2(v1Content);
      expect(result.success).toBe(true);
      const parseResult = parseYaml(result.output!);
      expect('data' in parseResult).toBe(true);
      if ('data' in parseResult) {
        const doc = parseResult.data as any;
        const fit = doc.fits?.[0];
        expect(fit.mappings).toBeDefined();
        expect(fit.mappings?.length).toBeGreaterThan(0);
        // Each mapping should be a tuple [pr-*/gc-*, pain-*/gain-*]
        for (const mapping of fit.mappings || []) {
          expect(Array.isArray(mapping)).toBe(true);
          expect(mapping.length).toBe(2);
          // First element should be pr- or gc-
          expect(mapping[0]).toMatch(/^(pr-|gc-)/);
          // Second element should be pain- or gain-
          expect(mapping[1]).toMatch(/^(pain-|gain-)/);
        }
      }
    });
  });

  describe('channels migration', () => {
    it('converts segments to for: { customer_segments: [] }', () => {
      const v1Content = readFileSync(`${FIXTURES_DIR}/valid-complete.bmml`, 'utf-8');
      const result = migrateV1toV2(v1Content);
      expect(result.success).toBe(true);
      const parseResult = parseYaml(result.output!);
      expect('data' in parseResult).toBe(true);
      if ('data' in parseResult) {
        const doc = parseResult.data as any;
        const channel = doc.channels?.[0];
        expect(channel).toBeDefined();
        expect(channel.for?.customer_segments).toBeInstanceOf(Array);
        expect(channel.segments).toBeUndefined();
      }
    });
  });

  describe('customer_relationships migration', () => {
    it('converts segment to for: { customer_segments: [] }', () => {
      const v1Content = readFileSync(`${FIXTURES_DIR}/valid-complete.bmml`, 'utf-8');
      const result = migrateV1toV2(v1Content);
      expect(result.success).toBe(true);
      const parseResult = parseYaml(result.output!);
      expect('data' in parseResult).toBe(true);
      if ('data' in parseResult) {
        const doc = parseResult.data as any;
        const cr = doc.customer_relationships?.[0];
        expect(cr).toBeDefined();
        expect(cr.for?.customer_segments).toBeInstanceOf(Array);
        expect(cr.segment).toBeUndefined();
        expect(cr.type).toBeUndefined();
      }
    });
  });

  describe('revenue_streams migration', () => {
    it('converts from_segments to from: { customer_segments: [] }', () => {
      const v1Content = readFileSync(`${FIXTURES_DIR}/valid-complete.bmml`, 'utf-8');
      const result = migrateV1toV2(v1Content);
      expect(result.success).toBe(true);
      const parseResult = parseYaml(result.output!);
      expect('data' in parseResult).toBe(true);
      if ('data' in parseResult) {
        const doc = parseResult.data as any;
        const rs = doc.revenue_streams?.[0];
        expect(rs).toBeDefined();
        expect(rs.from?.customer_segments).toBeInstanceOf(Array);
        expect(rs.from_segments).toBeUndefined();
      }
    });

    it('converts for_value to for: { value_propositions: [] }', () => {
      const v1Content = readFileSync(`${FIXTURES_DIR}/valid-complete.bmml`, 'utf-8');
      const result = migrateV1toV2(v1Content);
      expect(result.success).toBe(true);
      const parseResult = parseYaml(result.output!);
      expect('data' in parseResult).toBe(true);
      if ('data' in parseResult) {
        const doc = parseResult.data as any;
        const rs = doc.revenue_streams?.[0];
        expect(rs.for?.value_propositions).toBeInstanceOf(Array);
        expect(rs.for_value).toBeUndefined();
      }
    });
  });

  describe('key_resources migration', () => {
    it('converts for_value to for: { value_propositions: [] }', () => {
      const v1Content = readFileSync(`${FIXTURES_DIR}/valid-complete.bmml`, 'utf-8');
      const result = migrateV1toV2(v1Content);
      expect(result.success).toBe(true);
      const parseResult = parseYaml(result.output!);
      expect('data' in parseResult).toBe(true);
      if ('data' in parseResult) {
        const doc = parseResult.data as any;
        const kr = doc.key_resources?.[0];
        expect(kr).toBeDefined();
        expect(kr.for?.value_propositions).toBeInstanceOf(Array);
        expect(kr.for_value).toBeUndefined();
      }
    });
  });

  describe('key_activities migration', () => {
    it('converts for_value to for: { value_propositions: [] }', () => {
      const v1Content = readFileSync(`${FIXTURES_DIR}/valid-complete.bmml`, 'utf-8');
      const result = migrateV1toV2(v1Content);
      expect(result.success).toBe(true);
      const parseResult = parseYaml(result.output!);
      expect('data' in parseResult).toBe(true);
      if ('data' in parseResult) {
        const doc = parseResult.data as any;
        const ka = doc.key_activities?.[0];
        expect(ka).toBeDefined();
        expect(ka.for?.value_propositions).toBeInstanceOf(Array);
        expect(ka.for_value).toBeUndefined();
      }
    });
  });

  describe('key_partnerships migration', () => {
    it('converts provides to for: { key_resources: [], key_activities: [] }', () => {
      const v1Content = readFileSync(`${FIXTURES_DIR}/valid-complete.bmml`, 'utf-8');
      const result = migrateV1toV2(v1Content);
      expect(result.success).toBe(true);
      const parseResult = parseYaml(result.output!);
      expect('data' in parseResult).toBe(true);
      if ('data' in parseResult) {
        const doc = parseResult.data as any;
        const kp = doc.key_partnerships?.[0];
        expect(kp).toBeDefined();
        // Should have for with key_resources (since the v1 example provides kr-equipment)
        expect(kp.for?.key_resources).toBeInstanceOf(Array);
        expect(kp.provides).toBeUndefined();
      }
    });
  });

  describe('cost_structure migration', () => {
    it('converts cost_structure.major_costs to costs array', () => {
      const v1Content = readFileSync(`${FIXTURES_DIR}/valid-complete.bmml`, 'utf-8');
      const result = migrateV1toV2(v1Content);
      expect(result.success).toBe(true);
      const parseResult = parseYaml(result.output!);
      expect('data' in parseResult).toBe(true);
      if ('data' in parseResult) {
        const doc = parseResult.data as any;
        expect(doc.costs).toBeInstanceOf(Array);
        expect(doc.cost_structure).toBeUndefined();
      }
    });

    it('generates cost- prefixed IDs', () => {
      const v1Content = readFileSync(`${FIXTURES_DIR}/valid-complete.bmml`, 'utf-8');
      const result = migrateV1toV2(v1Content);
      expect(result.success).toBe(true);
      const parseResult = parseYaml(result.output!);
      expect('data' in parseResult).toBe(true);
      if ('data' in parseResult) {
        const doc = parseResult.data as any;
        for (const cost of doc.costs || []) {
          expect(cost.id).toMatch(/^cost-/);
        }
      }
    });

    it('converts linked_to to for: { key_resources: [], key_activities: [] }', () => {
      const v1Content = readFileSync(`${FIXTURES_DIR}/valid-complete.bmml`, 'utf-8');
      const result = migrateV1toV2(v1Content);
      expect(result.success).toBe(true);
      const parseResult = parseYaml(result.output!);
      expect('data' in parseResult).toBe(true);
      if ('data' in parseResult) {
        const doc = parseResult.data as any;
        // First cost (Rent) is linked to kr-location
        const rentCost = doc.costs?.find((c: any) => c.name === 'Rent');
        expect(rentCost?.for?.key_resources).toBeInstanceOf(Array);
        expect(rentCost?.for?.key_resources).toContain('kr-location');
      }
    });
  });

  describe('validation of migrated output', () => {
    it('produces valid v2 output from valid-minimal.bmml', () => {
      const v1Content = readFileSync(`${FIXTURES_DIR}/valid-minimal.bmml`, 'utf-8');
      const migrationResult = migrateV1toV2(v1Content);
      expect(migrationResult.success).toBe(true);

      const validationResult = validateAuto(migrationResult.output!);
      expect(validationResult.valid).toBe(true);
      expect(validationResult.detectedVersion).toBe('v2');
    });

    it('produces valid v2 output from valid-complete.bmml', () => {
      const v1Content = readFileSync(`${FIXTURES_DIR}/valid-complete.bmml`, 'utf-8');
      const migrationResult = migrateV1toV2(v1Content);
      expect(migrationResult.success).toBe(true);

      const validationResult = validateAuto(migrationResult.output!);
      // Show errors if validation fails
      if (!validationResult.valid) {
        console.log('Validation errors:', validationResult.errors);
      }
      expect(validationResult.valid).toBe(true);
      expect(validationResult.detectedVersion).toBe('v2');
    });
  });
});

describe('migrateDocumentV1toV2', () => {
  it('handles document without optional sections', () => {
    const doc: BMCDocument = {
      version: '1.0',
      meta: {
        name: 'Minimal',
        portfolio: 'explore',
        stage: 'ideation',
      },
    };

    const result = migrateDocumentV1toV2(doc);
    expect(result.version).toBe('2.0');
    expect(result.meta.name).toBe('Minimal');
    expect(result.customer_segments).toBeUndefined();
    expect(result.value_propositions).toBeUndefined();
    expect(result.fits).toBeUndefined();
  });
});
