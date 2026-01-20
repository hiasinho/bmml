/**
 * BMCLang Validator
 * TODO: Implement schema validation per specs/bmclang-mvp.md
 */

import type { BMCDocument } from './types.js';

export interface ValidationResult {
  valid: boolean;
  errors: { path: string; message: string }[];
}

export function validate(_doc: unknown): ValidationResult {
  throw new Error('Not implemented');
}
