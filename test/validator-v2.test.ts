/**
 * V2 Schema Validator tests
 * Test validation against the v2 JSON Schema
 */

import { describe, it, expect } from 'vitest';
import { validate, validateDocument, loadSchema } from '../src/validator';

describe('v2 schema', () => {
  describe('loadSchema', () => {
    it('loads the v2 JSON Schema', () => {
      const schema = loadSchema('v2');
      expect(schema).toBeDefined();
      expect(schema).toHaveProperty('$schema');
      expect(schema).toHaveProperty('$id', 'https://bmclang.dev/schemas/bmclang-v2.schema.json');
      expect(schema).toHaveProperty('$defs');
    });
  });

  describe('Phase 1: Base Schema Setup', () => {
    it('validates empty document with just version and meta', () => {
      const result = validate(
        `
version: "2.0"
meta:
  name: Test Business
  portfolio: explore
  stage: ideation
`,
        'v2'
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('fails when meta is missing', () => {
      const result = validate(
        `
version: "2.0"
`,
        'v2'
      );

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      const metaError = result.errors.find(
        (e) => e.message.includes('meta') || e.path === '/'
      );
      expect(metaError).toBeDefined();
    });

    it('fails when version is wrong', () => {
      const result = validate(
        `
version: "1.0"
meta:
  name: Test
  portfolio: explore
  stage: ideation
`,
        'v2'
      );

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      const versionError = result.errors.find((e) => e.path.includes('version'));
      expect(versionError).toBeDefined();
    });

    it('rejects v1 cost_structure object', () => {
      const result = validate(
        `
version: "2.0"
meta:
  name: Test
  portfolio: explore
  stage: ideation
cost_structure:
  type: cost_driven
`,
        'v2'
      );

      expect(result.valid).toBe(false);
      const costStructureError = result.errors.find(
        (e) => e.message.includes('cost_structure')
      );
      expect(costStructureError).toBeDefined();
    });
  });

  describe('Phase 2: Customer Side Schema', () => {
    it('validates customer segment without profile', () => {
      const result = validate(
        `
version: "2.0"
meta:
  name: Test
  portfolio: explore
  stage: ideation
customer_segments:
  - id: cs-busy
    name: Busy Professionals
`,
        'v2'
      );

      expect(result.valid).toBe(true);
    });

    it('validates customer segment with profile (jobs, pains, gains)', () => {
      const result = validate(
        `
version: "2.0"
meta:
  name: Test
  portfolio: explore
  stage: ideation
customer_segments:
  - id: cs-busy
    name: Busy Professionals
    jobs:
      - id: job-healthy
        description: Eat healthy despite time constraints
    pains:
      - id: pain-time
        description: No time to plan and shop
    gains:
      - id: gain-variety
        description: Explore new cuisines
`,
        'v2'
      );

      expect(result.valid).toBe(true);
    });

    it('validates job ID pattern (job-[a-z0-9-]+)', () => {
      const validResult = validate(
        `
version: "2.0"
meta:
  name: Test
  portfolio: explore
  stage: ideation
customer_segments:
  - id: cs-test
    name: Test
    jobs:
      - id: job-healthy
        description: Test job
`,
        'v2'
      );
      expect(validResult.valid).toBe(true);

      const invalidResult = validate(
        `
version: "2.0"
meta:
  name: Test
  portfolio: explore
  stage: ideation
customer_segments:
  - id: cs-test
    name: Test
    jobs:
      - id: job_healthy
        description: Test job
`,
        'v2'
      );
      expect(invalidResult.valid).toBe(false);
    });

    it('validates pain ID pattern (pain-[a-z0-9-]+)', () => {
      const validResult = validate(
        `
version: "2.0"
meta:
  name: Test
  portfolio: explore
  stage: ideation
customer_segments:
  - id: cs-test
    name: Test
    pains:
      - id: pain-time
        description: Test pain
`,
        'v2'
      );
      expect(validResult.valid).toBe(true);
    });

    it('validates gain ID pattern (gain-[a-z0-9-]+)', () => {
      const validResult = validate(
        `
version: "2.0"
meta:
  name: Test
  portfolio: explore
  stage: ideation
customer_segments:
  - id: cs-test
    name: Test
    gains:
      - id: gain-variety
        description: Test gain
`,
        'v2'
      );
      expect(validResult.valid).toBe(true);
    });
  });

  describe('Phase 3: Value Side Schema', () => {
    it('validates value proposition without value map', () => {
      const result = validate(
        `
version: "2.0"
meta:
  name: Test
  portfolio: explore
  stage: ideation
value_propositions:
  - id: vp-convenience
    name: Convenient Meal Kit
`,
        'v2'
      );

      expect(result.valid).toBe(true);
    });

    it('validates value proposition with full value map', () => {
      const result = validate(
        `
version: "2.0"
meta:
  name: Test
  portfolio: explore
  stage: ideation
value_propositions:
  - id: vp-convenience
    name: Convenient Meal Kit
    products_services:
      - id: ps-kit
        name: Weekly meal kit box
    pain_relievers:
      - id: pr-time
        name: Eliminates planning and shopping
    gain_creators:
      - id: gc-variety
        name: Weekly rotating menu
`,
        'v2'
      );

      expect(result.valid).toBe(true);
    });

    it('validates pain reliever ID pattern (pr-[a-z0-9-]+)', () => {
      const validResult = validate(
        `
version: "2.0"
meta:
  name: Test
  portfolio: explore
  stage: ideation
value_propositions:
  - id: vp-test
    name: Test VP
    pain_relievers:
      - id: pr-time-saver
        name: Time saver
`,
        'v2'
      );
      expect(validResult.valid).toBe(true);

      const invalidResult = validate(
        `
version: "2.0"
meta:
  name: Test
  portfolio: explore
  stage: ideation
value_propositions:
  - id: vp-test
    name: Test VP
    pain_relievers:
      - id: reliever-time
        name: Time saver
`,
        'v2'
      );
      expect(invalidResult.valid).toBe(false);
    });

    it('validates gain creator ID pattern (gc-[a-z0-9-]+)', () => {
      const validResult = validate(
        `
version: "2.0"
meta:
  name: Test
  portfolio: explore
  stage: ideation
value_propositions:
  - id: vp-test
    name: Test VP
    gain_creators:
      - id: gc-variety
        name: Variety
`,
        'v2'
      );
      expect(validResult.valid).toBe(true);
    });
  });

  describe('Phase 4: Fit Schema (v2 pattern)', () => {
    it('validates fit with for: typed sub-keys', () => {
      const result = validate(
        `
version: "2.0"
meta:
  name: Test
  portfolio: explore
  stage: ideation
fits:
  - id: fit-busy-convenience
    for:
      value_propositions: [vp-convenience]
      customer_segments: [cs-busy]
`,
        'v2'
      );

      expect(result.valid).toBe(true);
    });

    it('rejects v1 fit structure (value_proposition singular)', () => {
      const result = validate(
        `
version: "2.0"
meta:
  name: Test
  portfolio: explore
  stage: ideation
fits:
  - id: fit-test
    value_proposition: vp-convenience
    customer_segment: cs-busy
`,
        'v2'
      );

      expect(result.valid).toBe(false);
    });

    it('validates tuple array mappings', () => {
      const validResult = validate(
        `
version: "2.0"
meta:
  name: Test
  portfolio: explore
  stage: ideation
fits:
  - id: fit-test
    for:
      value_propositions: [vp-convenience]
      customer_segments: [cs-busy]
    mappings:
      - [pr-time, pain-time]
      - [gc-variety, gain-variety]
`,
        'v2'
      );
      expect(validResult.valid).toBe(true);
    });

    it('rejects flat array mappings (missing nesting)', () => {
      const result = validate(
        `
version: "2.0"
meta:
  name: Test
  portfolio: explore
  stage: ideation
fits:
  - id: fit-test
    for:
      value_propositions: [vp-convenience]
      customer_segments: [cs-busy]
    mappings:
      - pr-time
      - pain-time
`,
        'v2'
      );

      expect(result.valid).toBe(false);
    });
  });

  describe('Phase 5: Delivery Schema (Channels, Relationships)', () => {
    it('validates channel with dual for: sub-keys', () => {
      const result = validate(
        `
version: "2.0"
meta:
  name: Test
  portfolio: explore
  stage: ideation
channels:
  - id: ch-social
    name: Social Media
    for:
      value_propositions: [vp-convenience]
      customer_segments: [cs-busy]
`,
        'v2'
      );

      expect(result.valid).toBe(true);
    });

    it('validates customer relationship with for: pattern', () => {
      const result = validate(
        `
version: "2.0"
meta:
  name: Test
  portfolio: explore
  stage: ideation
customer_relationships:
  - id: cr-self
    name: Self-Service
    for:
      customer_segments: [cs-busy]
`,
        'v2'
      );

      expect(result.valid).toBe(true);
    });
  });

  describe('Phase 6: Capture Schema (Revenue)', () => {
    it('validates revenue stream with for: and from: patterns', () => {
      const result = validate(
        `
version: "2.0"
meta:
  name: Test
  portfolio: explore
  stage: ideation
revenue_streams:
  - id: rs-subscription
    name: Weekly Subscription
    from:
      customer_segments: [cs-busy]
    for:
      value_propositions: [vp-convenience]
`,
        'v2'
      );

      expect(result.valid).toBe(true);
    });
  });

  describe('Phase 7: Infrastructure Schema', () => {
    it('validates key resource with for: pattern', () => {
      const result = validate(
        `
version: "2.0"
meta:
  name: Test
  portfolio: explore
  stage: ideation
key_resources:
  - id: kr-supply
    name: Supply Chain
    for:
      value_propositions: [vp-convenience]
`,
        'v2'
      );

      expect(result.valid).toBe(true);
    });

    it('validates key activity with for: pattern', () => {
      const result = validate(
        `
version: "2.0"
meta:
  name: Test
  portfolio: explore
  stage: ideation
key_activities:
  - id: ka-sourcing
    name: Ingredient Sourcing
    for:
      value_propositions: [vp-convenience]
`,
        'v2'
      );

      expect(result.valid).toBe(true);
    });

    it('validates key partnership with for: pattern', () => {
      const result = validate(
        `
version: "2.0"
meta:
  name: Test
  portfolio: explore
  stage: ideation
key_partnerships:
  - id: kp-farms
    name: Local Farms
    for:
      key_resources: [kr-supply]
      key_activities: [ka-sourcing]
`,
        'v2'
      );

      expect(result.valid).toBe(true);
    });

    it('validates costs array (v2 pattern)', () => {
      const result = validate(
        `
version: "2.0"
meta:
  name: Test
  portfolio: explore
  stage: ideation
costs:
  - id: cost-ingredients
    name: Ingredients
    for:
      key_activities: [ka-sourcing]
`,
        'v2'
      );

      expect(result.valid).toBe(true);
    });

    it('validates cost ID pattern (cost-[a-z0-9-]+)', () => {
      const validResult = validate(
        `
version: "2.0"
meta:
  name: Test
  portfolio: explore
  stage: ideation
costs:
  - id: cost-ingredients
    name: Ingredients
`,
        'v2'
      );
      expect(validResult.valid).toBe(true);

      const invalidResult = validate(
        `
version: "2.0"
meta:
  name: Test
  portfolio: explore
  stage: ideation
costs:
  - id: major-cost-ingredients
    name: Ingredients
`,
        'v2'
      );
      expect(invalidResult.valid).toBe(false);
    });
  });

  describe('Phase 8: Type Fields Removed', () => {
    it('validates entities without type fields', () => {
      const result = validate(
        `
version: "2.0"
meta:
  name: Test
  portfolio: explore
  stage: ideation
customer_segments:
  - id: cs-test
    name: Test
    jobs:
      - id: job-test
        description: Test job
value_propositions:
  - id: vp-test
    name: Test VP
    products_services:
      - id: ps-test
        name: Test product
channels:
  - id: ch-test
    name: Test channel
`,
        'v2'
      );

      expect(result.valid).toBe(true);
    });
  });

  describe('Complete v2 document', () => {
    it('validates a complete v2 document with all sections', () => {
      const result = validate(
        `
version: "2.0"

meta:
  name: Meal Kit Co
  portfolio: explore
  stage: validation

customer_segments:
  - id: cs-busy
    name: Busy Professionals
    description: Time-poor, money-rich urban dwellers
    jobs:
      - id: job-healthy
        description: Eat healthy despite time constraints
    pains:
      - id: pain-time
        description: No time to plan, shop, or cook
      - id: pain-waste
        description: Food goes bad before using it
    gains:
      - id: gain-variety
        description: Explore new cuisines without effort

value_propositions:
  - id: vp-convenience
    name: Convenient Meal Kit
    description: Pre-portioned ingredients with recipes
    products_services:
      - id: ps-kit
        name: Weekly meal kit box
      - id: ps-recipes
        name: Chef-designed recipes
    pain_relievers:
      - id: pr-time
        name: Eliminates planning and shopping
      - id: pr-portions
        name: Pre-portioned eliminates waste
    gain_creators:
      - id: gc-variety
        name: Weekly rotating menu

fits:
  - id: fit-busy-convenience
    for:
      value_propositions: [vp-convenience]
      customer_segments: [cs-busy]
    mappings:
      - [pr-time, pain-time]
      - [pr-portions, pain-waste]
      - [gc-variety, gain-variety]

channels:
  - id: ch-social
    name: Social Media
    for:
      value_propositions: [vp-convenience]
      customer_segments: [cs-busy]

customer_relationships:
  - id: cr-self
    name: Self-Service App
    for:
      customer_segments: [cs-busy]

revenue_streams:
  - id: rs-subscription
    name: Weekly Subscription
    from:
      customer_segments: [cs-busy]
    for:
      value_propositions: [vp-convenience]

key_resources:
  - id: kr-supply
    name: Supply Chain Network
    for:
      value_propositions: [vp-convenience]

key_activities:
  - id: ka-sourcing
    name: Ingredient Sourcing
    for:
      value_propositions: [vp-convenience]

key_partnerships:
  - id: kp-farms
    name: Local Organic Farms
    for:
      key_resources: [kr-supply]
      key_activities: [ka-sourcing]

costs:
  - id: cost-ingredients
    name: Ingredient Costs
    for:
      key_activities: [ka-sourcing]
`,
        'v2'
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
