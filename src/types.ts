/**
 * BMCLang Types
 * See specs/bmclang-mvp.md for full specification
 */

export interface BMCDocument {
  version: string;
  meta: {
    name: string;
    portfolio: 'explore' | 'exploit';
    stage: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
