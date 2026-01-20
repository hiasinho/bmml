/**
 * Fixture loading tests
 * These verify the test fixtures are valid YAML
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { load as loadYaml } from 'js-yaml';

const FIXTURES_DIR = 'test/fixtures';

describe('Test Fixtures', () => {
  const fixtures = readdirSync(FIXTURES_DIR).filter((f) => f.endsWith('.bml'));

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
