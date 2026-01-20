/**
 * Validator tests
 * Test YAML parsing and JSON Schema validation
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import {
  validate,
  validateFile,
  validateDocument,
  parseYaml,
  loadSchema,
} from '../src/validator';

const FIXTURES_DIR = 'test/fixtures';

describe('loadSchema', () => {
  it('loads the JSON Schema', () => {
    const schema = loadSchema();
    expect(schema).toBeDefined();
    expect(schema).toHaveProperty('$schema');
    expect(schema).toHaveProperty('$defs');
  });
});

describe('parseYaml', () => {
  it('parses valid YAML', () => {
    const result = parseYaml('version: "1.0"\nmeta:\n  name: Test');
    expect(result).toHaveProperty('data');
    if ('data' in result) {
      expect(result.data).toEqual({
        version: '1.0',
        meta: { name: 'Test' },
      });
    }
  });

  it('returns error for invalid YAML', () => {
    const result = parseYaml('invalid: yaml: syntax: ::');
    expect(result).toHaveProperty('error');
    if ('error' in result) {
      expect(result.error.message).toContain('YAML parse error');
    }
  });
});

describe('validate', () => {
  describe('valid fixtures', () => {
    it('valid-minimal.bmml passes validation', () => {
      const content = readFileSync(`${FIXTURES_DIR}/valid-minimal.bmml`, 'utf-8');
      const result = validate(content);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('valid-complete.bmml passes validation', () => {
      const content = readFileSync(`${FIXTURES_DIR}/valid-complete.bmml`, 'utf-8');
      const result = validate(content);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('invalid fixtures', () => {
    it('invalid-missing-meta.bmml fails with correct error', () => {
      const content = readFileSync(`${FIXTURES_DIR}/invalid-missing-meta.bmml`, 'utf-8');
      const result = validate(content);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      // Should have an error about missing 'meta'
      const metaError = result.errors.find(
        (e) => e.message.includes('meta') || e.path === '/'
      );
      expect(metaError).toBeDefined();
    });

    it('invalid-portfolio-stage.bmml fails with portfolio-stage constraint error', () => {
      const content = readFileSync(`${FIXTURES_DIR}/invalid-portfolio-stage.bmml`, 'utf-8');
      const result = validate(content);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      // The error should be about the stage enum not matching for explore portfolio
      // explore allows: ideation, discovery, validation, acceleration, transfer
      // but the fixture has "sustain" which is only valid for exploit
      const stageError = result.errors.find(
        (e) => e.path.includes('stage') || e.message.includes('enum') || e.message.includes('one of')
      );
      expect(stageError).toBeDefined();
    });
  });

  describe('error messages', () => {
    it('reports missing required properties', () => {
      const result = validate('version: "1.0"');

      expect(result.valid).toBe(false);
      const metaError = result.errors.find((e) => e.message.includes("'meta'"));
      expect(metaError).toBeDefined();
    });

    it('reports unknown properties', () => {
      const result = validate(`
version: "1.0"
meta:
  name: Test
  portfolio: explore
  stage: ideation
unknown_field: value
`);

      expect(result.valid).toBe(false);
      const unknownError = result.errors.find((e) =>
        e.message.includes('unknown_field')
      );
      expect(unknownError).toBeDefined();
    });

    it('reports invalid enum values', () => {
      const result = validate(`
version: "1.0"
meta:
  name: Test
  portfolio: invalid_portfolio
  stage: ideation
`);

      expect(result.valid).toBe(false);
      const enumError = result.errors.find(
        (e) => e.message.includes('one of') || e.message.includes('enum')
      );
      expect(enumError).toBeDefined();
    });

    it('reports invalid ID patterns', () => {
      const result = validate(`
version: "1.0"
meta:
  name: Test
  portfolio: explore
  stage: ideation
customer_segments:
  - id: invalid_id
    name: Test
`);

      expect(result.valid).toBe(false);
      const patternError = result.errors.find(
        (e) => e.message.includes('pattern') || e.message.includes('format')
      );
      expect(patternError).toBeDefined();
    });
  });
});

describe('validateDocument', () => {
  it('validates a parsed document object', () => {
    const doc = {
      version: '1.0',
      meta: {
        name: 'Test',
        portfolio: 'explore',
        stage: 'ideation',
      },
    };

    const result = validateDocument(doc);
    expect(result.valid).toBe(true);
  });

  it('rejects invalid document object', () => {
    const doc = {
      version: '1.0',
      // missing meta
    };

    const result = validateDocument(doc);
    expect(result.valid).toBe(false);
  });
});

describe('validateFile', () => {
  it('validates a file from disk', () => {
    const result = validateFile(`${FIXTURES_DIR}/valid-minimal.bmml`);
    expect(result.valid).toBe(true);
  });

  it('returns error for non-existent file', () => {
    const result = validateFile('non-existent-file.bmml');
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('File not found');
  });
});
