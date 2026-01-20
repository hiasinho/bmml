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
