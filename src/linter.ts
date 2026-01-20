/**
 * BMCLang Linter
 * TODO: Implement lint rules per specs/bmclang-mvp.md
 */

import type { BMCDocument } from './types.js';

export interface LintResult {
  issues: { rule: string; severity: 'error' | 'warning' | 'info'; message: string; path: string }[];
}

export function lint(_doc: BMCDocument): LintResult {
  throw new Error('Not implemented');
}
