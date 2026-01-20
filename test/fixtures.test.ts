/**
 * Fixture loading and validation tests
 * These verify the test fixtures are valid YAML and pass/fail validation as expected
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { load as loadYaml } from 'js-yaml';
import { validateFileAuto, detectVersion } from '../src/validator';
import { lint, lintIsValid } from '../src/linter';
import type { BMCDocumentV2 } from '../src/types';

const FIXTURES_DIR = 'test/fixtures';

function loadFixture(filename: string): BMCDocumentV2 {
  const content = readFileSync(`${FIXTURES_DIR}/${filename}`, 'utf-8');
  return loadYaml(content) as BMCDocumentV2;
}

describe('Test Fixtures', () => {
  const fixtures = readdirSync(FIXTURES_DIR).filter((f) => f.endsWith('.bmml'));

  it('has fixture files', () => {
    expect(fixtures.length).toBeGreaterThan(0);
  });

  for (const fixture of fixtures) {
    it(`${fixture} is valid YAML`, () => {
      const content = readFileSync(`${FIXTURES_DIR}/${fixture}`, 'utf-8');
      const doc = loadYaml(content);
      expect(doc).toBeDefined();
      expect(doc).toHaveProperty('version');
    });
  }
});

describe('v2 Fixtures', () => {
  describe('valid-v2-minimal.bmml', () => {
    it('validates against v2 schema', () => {
      const result = validateFileAuto(`${FIXTURES_DIR}/valid-v2-minimal.bmml`);
      expect(result.valid).toBe(true);
      expect(result.detectedVersion).toBe('v2');
    });

    it('passes linting', () => {
      const doc = loadFixture('valid-v2-minimal.bmml');
      expect(lintIsValid(doc)).toBe(true);
    });

    it('has all 9 BMC blocks with for:/from: patterns', () => {
      const doc = loadFixture('valid-v2-minimal.bmml');
      expect(doc.customer_segments).toBeDefined();
      expect(doc.value_propositions).toBeDefined();
      expect(doc.channels).toBeDefined();
      expect(doc.customer_relationships).toBeDefined();
      expect(doc.revenue_streams).toBeDefined();
      expect(doc.key_resources).toBeDefined();
      expect(doc.key_activities).toBeDefined();
      expect(doc.key_partnerships).toBeDefined();
      expect(doc.costs).toBeDefined();

      // Verify v2 for:/from: patterns are used
      expect(doc.channels![0]).toHaveProperty('for');
      expect(doc.revenue_streams![0]).toHaveProperty('from');
      expect(doc.revenue_streams![0]).toHaveProperty('for');
    });

    it('has no VPC detail (no jobs, pains, gains, fits)', () => {
      const doc = loadFixture('valid-v2-minimal.bmml');
      // Segments have no profile detail
      expect(doc.customer_segments![0].jobs).toBeUndefined();
      expect(doc.customer_segments![0].pains).toBeUndefined();
      expect(doc.customer_segments![0].gains).toBeUndefined();
      // No fits defined
      expect(doc.fits).toBeUndefined();
    });
  });

  describe('valid-v2-complete.bmml', () => {
    it('validates against v2 schema', () => {
      const result = validateFileAuto(`${FIXTURES_DIR}/valid-v2-complete.bmml`);
      expect(result.valid).toBe(true);
      expect(result.detectedVersion).toBe('v2');
    });

    it('passes linting', () => {
      const doc = loadFixture('valid-v2-complete.bmml');
      const result = lint(doc);
      expect(result.issues.filter((i) => i.severity === 'error')).toHaveLength(0);
    });

    it('has full VPC detail (profiles, value maps, fits)', () => {
      const doc = loadFixture('valid-v2-complete.bmml');

      // Customer profiles
      const segment = doc.customer_segments![0];
      expect(segment.jobs).toBeDefined();
      expect(segment.pains).toBeDefined();
      expect(segment.gains).toBeDefined();

      // Value maps
      const vp = doc.value_propositions![0];
      expect(vp.products_services).toBeDefined();
      expect(vp.pain_relievers).toBeDefined();
      expect(vp.gain_creators).toBeDefined();

      // Fits with tuple mappings
      expect(doc.fits).toBeDefined();
      expect(doc.fits!.length).toBeGreaterThan(0);
      const fit = doc.fits![0];
      expect(fit.for).toBeDefined();
      expect(fit.mappings).toBeDefined();
    });

    it('has correct tuple mapping format', () => {
      const doc = loadFixture('valid-v2-complete.bmml');
      const fit = doc.fits![0];

      // Mappings should be array of tuples
      expect(Array.isArray(fit.mappings)).toBe(true);
      for (const mapping of fit.mappings!) {
        expect(Array.isArray(mapping)).toBe(true);
        expect(mapping).toHaveLength(2);
        expect(typeof mapping[0]).toBe('string');
        expect(typeof mapping[1]).toBe('string');
      }
    });
  });

  describe('invalid-v2-tuple-format.bmml', () => {
    it('fails schema validation due to flat mappings', () => {
      const result = validateFileAuto(`${FIXTURES_DIR}/invalid-v2-tuple-format.bmml`);
      expect(result.valid).toBe(false);
      expect(result.detectedVersion).toBe('v2');
      // Error should mention mappings format issue
      const mappingError = result.errors.find(
        (e) => e.path.includes('mappings')
      );
      expect(mappingError).toBeDefined();
    });
  });

  describe('invalid-v2-scope-refs.bmml', () => {
    it('validates against schema', () => {
      const result = validateFileAuto(`${FIXTURES_DIR}/invalid-v2-scope-refs.bmml`);
      // Schema validates (structure is correct)
      expect(result.valid).toBe(true);
      expect(result.detectedVersion).toBe('v2');
    });

    it('fails linting with scope reference errors', () => {
      const doc = loadFixture('invalid-v2-scope-refs.bmml');
      const result = lint(doc);

      // Should have scope reference errors
      expect(result.issues.filter((i) => i.severity === 'error').length).toBeGreaterThan(0);

      // Specifically pain-reliever-scope-ref and gain-creator-scope-ref
      const scopeErrors = result.issues.filter(
        (i) =>
          i.rule === 'pain-reliever-scope-ref' ||
          i.rule === 'gain-creator-scope-ref'
      );
      expect(scopeErrors.length).toBeGreaterThan(0);
    });
  });

  describe('invalid-v2-type-mismatch.bmml', () => {
    it('validates against schema', () => {
      const result = validateFileAuto(`${FIXTURES_DIR}/invalid-v2-type-mismatch.bmml`);
      // Schema validates (structure is correct)
      expect(result.valid).toBe(true);
      expect(result.detectedVersion).toBe('v2');
    });

    it('fails linting with type mismatch errors', () => {
      const doc = loadFixture('invalid-v2-type-mismatch.bmml');
      const result = lint(doc);

      // Should have type mismatch errors
      const mismatchErrors = result.issues.filter(
        (i) => i.rule === 'fit-mapping-type-mismatch'
      );
      expect(mismatchErrors.length).toBeGreaterThan(0);

      // Should mention pain reliever -> gain and gain creator -> pain
      const prToGainError = mismatchErrors.find(
        (e) => e.message.includes('pain reliever') && e.message.includes('gain')
      );
      const gcToPainError = mismatchErrors.find(
        (e) => e.message.includes('gain creator') && e.message.includes('pain')
      );
      expect(prToGainError).toBeDefined();
      expect(gcToPainError).toBeDefined();
    });
  });
});

describe('Version Detection', () => {
  it('detects v2 fixtures correctly', () => {
    const doc = loadFixture('valid-v2-minimal.bmml');
    expect(detectVersion(doc)).toBe('v2');
  });
});
