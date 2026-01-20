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
  detectVersion,
  validateAuto,
  validateDocumentAuto,
  validateFileAuto,
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

describe('detectVersion', () => {
  describe('explicit version field', () => {
    it('detects v1 from explicit version: "1.0"', () => {
      const doc = { version: '1.0', meta: { name: 'Test' } };
      expect(detectVersion(doc)).toBe('v1');
    });

    it('detects v2 from explicit version: "2.0"', () => {
      const doc = { version: '2.0', meta: { name: 'Test' } };
      expect(detectVersion(doc)).toBe('v2');
    });
  });

  describe('structural detection - fits', () => {
    it('detects v1 from fit with value_proposition (singular)', () => {
      const doc = {
        fits: [
          { id: 'fit-test', value_proposition: 'vp-test', customer_segment: 'cs-test' },
        ],
      };
      expect(detectVersion(doc)).toBe('v1');
    });

    it('detects v2 from fit with for: pattern', () => {
      const doc = {
        fits: [
          {
            id: 'fit-test',
            for: { value_propositions: ['vp-test'], customer_segments: ['cs-test'] },
          },
        ],
      };
      expect(detectVersion(doc)).toBe('v2');
    });
  });

  describe('structural detection - channels', () => {
    it('detects v1 from channel with segments array', () => {
      const doc = {
        channels: [{ id: 'ch-test', name: 'Test', type: 'direct', segments: ['cs-test'] }],
      };
      expect(detectVersion(doc)).toBe('v1');
    });

    it('detects v2 from channel with for: pattern', () => {
      const doc = {
        channels: [
          { id: 'ch-test', name: 'Test', for: { customer_segments: ['cs-test'] } },
        ],
      };
      expect(detectVersion(doc)).toBe('v2');
    });
  });

  describe('structural detection - customer_relationships', () => {
    it('detects v1 from customer_relationship with segment (singular)', () => {
      const doc = {
        customer_relationships: [
          { id: 'cr-test', segment: 'cs-test', type: 'self_service' },
        ],
      };
      expect(detectVersion(doc)).toBe('v1');
    });

    it('detects v2 from customer_relationship with for: pattern', () => {
      const doc = {
        customer_relationships: [
          { id: 'cr-test', name: 'Test', for: { customer_segments: ['cs-test'] } },
        ],
      };
      expect(detectVersion(doc)).toBe('v2');
    });
  });

  describe('structural detection - revenue_streams', () => {
    it('detects v1 from revenue_stream with from_segments', () => {
      const doc = {
        revenue_streams: [
          { id: 'rs-test', name: 'Test', type: 'transaction', from_segments: ['cs-test'] },
        ],
      };
      expect(detectVersion(doc)).toBe('v1');
    });

    it('detects v2 from revenue_stream with from: pattern', () => {
      const doc = {
        revenue_streams: [
          { id: 'rs-test', name: 'Test', from: { customer_segments: ['cs-test'] } },
        ],
      };
      expect(detectVersion(doc)).toBe('v2');
    });
  });

  describe('structural detection - key_resources', () => {
    it('detects v1 from key_resource with for_value', () => {
      const doc = {
        key_resources: [{ id: 'kr-test', name: 'Test', type: 'physical', for_value: ['vp-test'] }],
      };
      expect(detectVersion(doc)).toBe('v1');
    });

    it('detects v2 from key_resource with for: pattern', () => {
      const doc = {
        key_resources: [
          { id: 'kr-test', name: 'Test', for: { value_propositions: ['vp-test'] } },
        ],
      };
      expect(detectVersion(doc)).toBe('v2');
    });
  });

  describe('structural detection - key_partnerships', () => {
    it('detects v1 from key_partnership with provides', () => {
      const doc = {
        key_partnerships: [
          { id: 'kp-test', name: 'Test', type: 'supplier', motivation: 'optimization', provides: ['kr-test'] },
        ],
      };
      expect(detectVersion(doc)).toBe('v1');
    });

    it('detects v2 from key_partnership with for: pattern', () => {
      const doc = {
        key_partnerships: [
          { id: 'kp-test', name: 'Test', for: { key_resources: ['kr-test'] } },
        ],
      };
      expect(detectVersion(doc)).toBe('v2');
    });
  });

  describe('structural detection - cost_structure vs costs', () => {
    it('detects v1 from cost_structure object', () => {
      const doc = {
        cost_structure: { type: 'cost_driven', major_costs: [] },
      };
      expect(detectVersion(doc)).toBe('v1');
    });

    it('detects v2 from costs array', () => {
      const doc = {
        costs: [{ id: 'cost-test', name: 'Test' }],
      };
      expect(detectVersion(doc)).toBe('v2');
    });
  });

  describe('edge cases', () => {
    it('defaults to v1 for invalid input (null)', () => {
      expect(detectVersion(null)).toBe('v1');
    });

    it('defaults to v1 for invalid input (undefined)', () => {
      expect(detectVersion(undefined)).toBe('v1');
    });

    it('defaults to v1 for empty object', () => {
      expect(detectVersion({})).toBe('v1');
    });

    it('defaults to v1 for minimal document with just meta', () => {
      const doc = { meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' } };
      expect(detectVersion(doc)).toBe('v1');
    });
  });
});

describe('validateAuto', () => {
  it('auto-detects and validates v1 document', () => {
    const v1Content = `
version: "1.0"
meta:
  name: Test
  portfolio: explore
  stage: ideation
`;
    const result = validateAuto(v1Content);
    expect(result.valid).toBe(true);
    expect(result.detectedVersion).toBe('v1');
  });

  it('auto-detects and validates v2 document', () => {
    const v2Content = `
version: "2.0"
meta:
  name: Test
  portfolio: explore
  stage: ideation
`;
    const result = validateAuto(v2Content);
    expect(result.valid).toBe(true);
    expect(result.detectedVersion).toBe('v2');
  });

  it('auto-detects v2 from structure without explicit version', () => {
    const v2Content = `
meta:
  name: Test
  portfolio: explore
  stage: ideation
fits:
  - id: fit-test
    for:
      value_propositions: [vp-test]
      customer_segments: [cs-test]
`;
    const result = validateAuto(v2Content);
    expect(result.detectedVersion).toBe('v2');
    // May not be valid due to missing version field, but detection works
  });

  it('auto-detects v1 from structure without explicit version', () => {
    const v1Content = `
meta:
  name: Test
  portfolio: explore
  stage: ideation
fits:
  - id: fit-test
    value_proposition: vp-test
    customer_segment: cs-test
`;
    const result = validateAuto(v1Content);
    expect(result.detectedVersion).toBe('v1');
  });

  it('returns v1 default for unparseable YAML', () => {
    const result = validateAuto('invalid: yaml: :: syntax');
    expect(result.valid).toBe(false);
    expect(result.detectedVersion).toBe('v1');
    expect(result.errors[0].message).toContain('YAML parse error');
  });
});

describe('validateDocumentAuto', () => {
  it('auto-detects and validates v1 document object', () => {
    const doc = {
      version: '1.0',
      meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
    };
    const result = validateDocumentAuto(doc);
    expect(result.valid).toBe(true);
    expect(result.detectedVersion).toBe('v1');
  });

  it('auto-detects and validates v2 document object', () => {
    const doc = {
      version: '2.0',
      meta: { name: 'Test', portfolio: 'explore', stage: 'ideation' },
    };
    const result = validateDocumentAuto(doc);
    expect(result.valid).toBe(true);
    expect(result.detectedVersion).toBe('v2');
  });
});

describe('validateFileAuto', () => {
  it('auto-validates v1 fixture file', () => {
    const result = validateFileAuto(`${FIXTURES_DIR}/valid-minimal.bmml`);
    expect(result.valid).toBe(true);
    expect(result.detectedVersion).toBe('v1');
  });

  it('returns error for non-existent file', () => {
    const result = validateFileAuto('non-existent-file.bmml');
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('File not found');
    expect(result.detectedVersion).toBe('v1'); // Default
  });
});
