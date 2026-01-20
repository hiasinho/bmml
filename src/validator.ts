/**
 * BMCLang Validator
 * Validates BMCLang documents against the JSON Schema
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { load as loadYaml, YAMLException } from 'js-yaml';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Handle CJS/ESM interop
const AjvClass = Ajv.default ?? Ajv;
const addFormatsPlugin = addFormats.default ?? addFormats;

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

interface AjvError {
  instancePath: string;
  message?: string;
  keyword: string;
  params: Record<string, unknown>;
}

export type SchemaVersion = 'v1' | 'v2';

/**
 * Detect the schema version of a parsed BMML document.
 *
 * Detection logic:
 * 1. If `version` field is explicitly "2.0", it's v2
 * 2. If `version` field is explicitly "1.0", it's v1
 * 3. Otherwise, detect by structure:
 *    - v2: has `for:`/`from:` patterns, `costs` array, no `cost_structure`
 *    - v1: has `value_proposition` (singular), `segments`, `for_value`, `cost_structure`
 *
 * @param doc - The parsed document object
 * @returns Detected schema version
 */
export function detectVersion(doc: unknown): SchemaVersion {
  if (!doc || typeof doc !== 'object') {
    return 'v1'; // Default to v1 for invalid documents
  }

  const obj = doc as Record<string, unknown>;

  // Explicit version field takes precedence
  if (obj.version === '2.0') {
    return 'v2';
  }
  if (obj.version === '1.0') {
    return 'v1';
  }

  // Structural detection: check for v2-specific patterns

  // v2: has `costs` array (v1 has `cost_structure` object)
  if (Array.isArray(obj.costs)) {
    return 'v2';
  }

  // v1: has `cost_structure` object
  if (obj.cost_structure && typeof obj.cost_structure === 'object') {
    return 'v1';
  }

  // Check fits for v2 `for:` pattern vs v1 `value_proposition` pattern
  if (Array.isArray(obj.fits) && obj.fits.length > 0) {
    const firstFit = obj.fits[0] as Record<string, unknown>;
    // v2 fits have `for:` with nested sub-keys
    if (firstFit.for && typeof firstFit.for === 'object') {
      return 'v2';
    }
    // v1 fits have `value_proposition` and `customer_segment` as direct properties
    if ('value_proposition' in firstFit || 'customer_segment' in firstFit) {
      return 'v1';
    }
  }

  // Check channels for v2 `for:` pattern vs v1 `segments` pattern
  if (Array.isArray(obj.channels) && obj.channels.length > 0) {
    const firstChannel = obj.channels[0] as Record<string, unknown>;
    if (firstChannel.for && typeof firstChannel.for === 'object') {
      return 'v2';
    }
    if ('segments' in firstChannel) {
      return 'v1';
    }
  }

  // Check customer_relationships for v2 `for:` pattern vs v1 `segment` pattern
  if (Array.isArray(obj.customer_relationships) && obj.customer_relationships.length > 0) {
    const firstCR = obj.customer_relationships[0] as Record<string, unknown>;
    if (firstCR.for && typeof firstCR.for === 'object') {
      return 'v2';
    }
    if ('segment' in firstCR) {
      return 'v1';
    }
  }

  // Check revenue_streams for v2 `from:` pattern vs v1 `from_segments` pattern
  if (Array.isArray(obj.revenue_streams) && obj.revenue_streams.length > 0) {
    const firstRS = obj.revenue_streams[0] as Record<string, unknown>;
    if (firstRS.from && typeof firstRS.from === 'object') {
      return 'v2';
    }
    if ('from_segments' in firstRS) {
      return 'v1';
    }
  }

  // Check key_resources for v2 `for:` pattern vs v1 `for_value` pattern
  if (Array.isArray(obj.key_resources) && obj.key_resources.length > 0) {
    const firstKR = obj.key_resources[0] as Record<string, unknown>;
    if (firstKR.for && typeof firstKR.for === 'object') {
      return 'v2';
    }
    if ('for_value' in firstKR) {
      return 'v1';
    }
  }

  // Check key_partnerships for v2 `for:` pattern vs v1 `provides` pattern
  if (Array.isArray(obj.key_partnerships) && obj.key_partnerships.length > 0) {
    const firstKP = obj.key_partnerships[0] as Record<string, unknown>;
    if (firstKP.for && typeof firstKP.for === 'object') {
      return 'v2';
    }
    if ('provides' in firstKP) {
      return 'v1';
    }
  }

  // Default to v1 for minimal documents or when detection is ambiguous
  return 'v1';
}

/**
 * Load the BMCLang JSON Schema from the schemas directory
 * @param version - Schema version to load ('v1' or 'v2'), defaults to 'v1'
 */
export function loadSchema(version: SchemaVersion = 'v1'): object {
  const schemaFile = version === 'v2' ? 'bmclang-v2.schema.json' : 'bmclang.schema.json';
  const schemaPath = join(__dirname, '..', 'schemas', schemaFile);
  const schemaContent = readFileSync(schemaPath, 'utf-8');
  return JSON.parse(schemaContent);
}

/**
 * Create a configured Ajv instance with the BMCLang schema
 */
function createValidator(): InstanceType<typeof AjvClass> {
  const ajv = new AjvClass({
    allErrors: true,
    verbose: true,
  });
  addFormatsPlugin(ajv);
  return ajv;
}

/**
 * Convert Ajv errors to ValidationError format
 */
function formatErrors(errors: AjvError[] | null | undefined): ValidationError[] {
  if (!errors) return [];

  return errors.map((err) => {
    const path = err.instancePath || '/';
    let message = err.message || 'Unknown error';

    // Enhance error messages for common cases
    if (err.keyword === 'additionalProperties') {
      message = `Unknown property '${err.params.additionalProperty}'`;
    } else if (err.keyword === 'required') {
      message = `Missing required property '${err.params.missingProperty}'`;
    } else if (err.keyword === 'enum') {
      const allowed = err.params.allowedValues as string[];
      message = `Must be one of: ${allowed.join(', ')}`;
    } else if (err.keyword === 'pattern') {
      message = `Invalid format. ${message}`;
    } else if (err.keyword === 'const') {
      message = `Must be '${err.params.allowedValue}'`;
    }

    return { path, message };
  });
}

/**
 * Parse YAML content into a JavaScript object
 * Returns errors if YAML is invalid
 */
export function parseYaml(content: string): { data: unknown } | { error: ValidationError } {
  try {
    const data = loadYaml(content);
    return { data };
  } catch (err) {
    if (err instanceof YAMLException) {
      return {
        error: {
          path: '/',
          message: `YAML parse error: ${err.message}`,
        },
      };
    }
    throw err;
  }
}

/**
 * Validate a BMCLang document (as parsed object) against the schema
 * @param doc - The parsed document object
 * @param version - Schema version to validate against ('v1' or 'v2'), defaults to 'v1'
 */
export function validateDocument(doc: unknown, version: SchemaVersion = 'v1'): ValidationResult {
  const ajv = createValidator();
  const schema = loadSchema(version);
  const validateFn = ajv.compile(schema);

  const valid = validateFn(doc);

  if (valid) {
    return { valid: true, errors: [] };
  }

  return {
    valid: false,
    errors: formatErrors(validateFn.errors as AjvError[] | null),
  };
}

/**
 * Validate a BMCLang YAML string
 * Parses YAML and validates against the JSON Schema
 * @param content - YAML string to validate
 * @param version - Schema version to validate against ('v1' or 'v2'), defaults to 'v1'
 */
export function validate(content: string, version: SchemaVersion = 'v1'): ValidationResult {
  // First parse the YAML
  const parseResult = parseYaml(content);
  if ('error' in parseResult) {
    return {
      valid: false,
      errors: [parseResult.error],
    };
  }

  // Then validate against schema
  return validateDocument(parseResult.data, version);
}

/**
 * Validate a BMCLang file from disk
 * @param filePath - Path to the YAML file
 * @param version - Schema version to validate against ('v1' or 'v2'), defaults to 'v1'
 */
export function validateFile(filePath: string, version: SchemaVersion = 'v1'): ValidationResult {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return validate(content, version);
  } catch (err) {
    if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
      return {
        valid: false,
        errors: [{ path: '/', message: `File not found: ${filePath}` }],
      };
    }
    throw err;
  }
}

/**
 * Extended validation result that includes detected version
 */
export interface AutoValidationResult extends ValidationResult {
  detectedVersion: SchemaVersion;
}

/**
 * Validate a BMCLang document with automatic version detection.
 * Detects whether the document is v1 or v2 and validates against the appropriate schema.
 * @param doc - The parsed document object
 */
export function validateDocumentAuto(doc: unknown): AutoValidationResult {
  const detectedVersion = detectVersion(doc);
  const result = validateDocument(doc, detectedVersion);
  return {
    ...result,
    detectedVersion,
  };
}

/**
 * Validate a BMCLang YAML string with automatic version detection.
 * Detects whether the document is v1 or v2 and validates against the appropriate schema.
 * @param content - YAML string to validate
 */
export function validateAuto(content: string): AutoValidationResult {
  // First parse the YAML
  const parseResult = parseYaml(content);
  if ('error' in parseResult) {
    return {
      valid: false,
      errors: [parseResult.error],
      detectedVersion: 'v1', // Default when can't parse
    };
  }

  // Detect version and validate
  return validateDocumentAuto(parseResult.data);
}

/**
 * Validate a BMCLang file from disk with automatic version detection.
 * @param filePath - Path to the YAML file
 */
export function validateFileAuto(filePath: string): AutoValidationResult {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return validateAuto(content);
  } catch (err) {
    if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
      return {
        valid: false,
        errors: [{ path: '/', message: `File not found: ${filePath}` }],
        detectedVersion: 'v1',
      };
    }
    throw err;
  }
}
