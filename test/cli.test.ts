/**
 * CLI tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { main } from '../src/cli';
import { readFileSync, writeFileSync, unlinkSync, copyFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const FIXTURES_DIR = 'test/fixtures';

describe('CLI', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('help command', () => {
    it('shows help with no arguments', () => {
      const exitCode = main([]);
      expect(exitCode).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('bmml');
      expect(output).toContain('USAGE');
    });

    it('shows help with "help" command', () => {
      const exitCode = main(['help']);
      expect(exitCode).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('shows help with --help flag', () => {
      const exitCode = main(['--help']);
      expect(exitCode).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('shows help with -h flag', () => {
      const exitCode = main(['-h']);
      expect(exitCode).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('validate command', () => {
    it('validates a valid minimal file', () => {
      const exitCode = main(['validate', `${FIXTURES_DIR}/valid-v2-minimal.bmml`]);
      expect(exitCode).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalledWith('OK');
    });

    it('validates a valid complete file', () => {
      const exitCode = main(['validate', `${FIXTURES_DIR}/valid-v2-complete.bmml`]);
      expect(exitCode).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalledWith('OK');
    });

    it('fails for invalid file with missing meta', () => {
      const exitCode = main(['validate', `${FIXTURES_DIR}/invalid-missing-meta.bmml`]);
      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalled();
      const errorOutput = consoleErrorSpy.mock.calls.flat().join('\n');
      expect(errorOutput).toContain('Validation errors');
    });

    it('fails for invalid portfolio-stage combination', () => {
      const exitCode = main(['validate', `${FIXTURES_DIR}/invalid-portfolio-stage.bmml`]);
      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('fails for non-existent file', () => {
      const exitCode = main(['validate', 'non-existent-file.bmml']);
      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalled();
      const errorOutput = consoleErrorSpy.mock.calls.flat().join('\n');
      expect(errorOutput).toContain('File not found');
    });

    it('requires a file argument', () => {
      const exitCode = main(['validate']);
      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalled();
      const errorOutput = consoleErrorSpy.mock.calls.flat().join('\n');
      expect(errorOutput).toContain('requires a file argument');
    });

    it('outputs JSON with --json flag', () => {
      const exitCode = main(['validate', '--json', `${FIXTURES_DIR}/valid-v2-minimal.bmml`]);
      expect(exitCode).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0];
      const parsed = JSON.parse(output);
      expect(parsed.success).toBe(true);
      expect(parsed.validationErrors).toEqual([]);
    });

    it('outputs JSON errors with --json flag', () => {
      const exitCode = main(['validate', '--json', `${FIXTURES_DIR}/invalid-missing-meta.bmml`]);
      expect(exitCode).toBe(1);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0];
      const parsed = JSON.parse(output);
      expect(parsed.success).toBe(false);
      expect(parsed.validationErrors.length).toBeGreaterThan(0);
    });
  });

  describe('lint command', () => {
    it('lints a valid file without issues', () => {
      const exitCode = main(['lint', `${FIXTURES_DIR}/valid-v2-complete.bmml`]);
      expect(exitCode).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalledWith('OK');
    });

    it('fails validation before linting for invalid schema', () => {
      const exitCode = main(['lint', `${FIXTURES_DIR}/invalid-missing-meta.bmml`]);
      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalled();
      const errorOutput = consoleErrorSpy.mock.calls.flat().join('\n');
      expect(errorOutput).toContain('Validation errors');
    });

    it('reports lint issues for invalid scope references', () => {
      const exitCode = main(['lint', `${FIXTURES_DIR}/invalid-v2-scope-refs.bmml`]);
      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalled();
      const errorOutput = consoleErrorSpy.mock.calls.flat().join('\n');
      expect(errorOutput).toContain('Lint issues');
    });

    it('requires a file argument', () => {
      const exitCode = main(['lint']);
      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalled();
      const errorOutput = consoleErrorSpy.mock.calls.flat().join('\n');
      expect(errorOutput).toContain('requires a file argument');
    });

    it('outputs JSON with --json flag', () => {
      const exitCode = main(['lint', '--json', `${FIXTURES_DIR}/valid-v2-minimal.bmml`]);
      expect(exitCode).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0];
      const parsed = JSON.parse(output);
      expect(parsed.success).toBe(true);
      // Only check that there are no errors - warnings/info are acceptable
      const errors = parsed.lintIssues.filter((i: { severity: string }) => i.severity === 'error');
      expect(errors).toEqual([]);
    });

    it('outputs JSON lint issues with --json flag', () => {
      const exitCode = main(['lint', '--json', `${FIXTURES_DIR}/invalid-v2-scope-refs.bmml`]);
      expect(exitCode).toBe(1);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0];
      const parsed = JSON.parse(output);
      expect(parsed.success).toBe(false);
      expect(parsed.lintIssues.length).toBeGreaterThan(0);
    });
  });

  describe('migrate command', () => {
    it('migrates a v1 file to v2 (dry-run by default)', () => {
      const exitCode = main(['migrate', `${FIXTURES_DIR}/migrate/costs-v1.bmml`]);
      expect(exitCode).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('version: "2.0"');
    });

    it('migrates a complete v1 file with relationships', () => {
      const exitCode = main(['migrate', `${FIXTURES_DIR}/migrate/relationships-v1.bmml`]);
      expect(exitCode).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('version: "2.0"');
      // v2 uses for: pattern
      expect(output).toContain('for:');
    });

    it('fails for already v2 files', () => {
      const exitCode = main(['migrate', `${FIXTURES_DIR}/valid-v2-minimal.bmml`]);
      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalled();
      const errorOutput = consoleErrorSpy.mock.calls.flat().join('\n');
      expect(errorOutput).toContain('already be v2');
    });

    it('requires a file argument', () => {
      const exitCode = main(['migrate']);
      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalled();
      const errorOutput = consoleErrorSpy.mock.calls.flat().join('\n');
      expect(errorOutput).toContain('requires a file argument');
    });

    it('fails for non-existent file', () => {
      const exitCode = main(['migrate', 'non-existent-file.bmml']);
      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalled();
      const errorOutput = consoleErrorSpy.mock.calls.flat().join('\n');
      expect(errorOutput).toContain('File not found');
    });

    it('outputs JSON with --json flag', () => {
      const exitCode = main(['migrate', '--json', `${FIXTURES_DIR}/migrate/costs-v1.bmml`]);
      expect(exitCode).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0];
      const parsed = JSON.parse(output);
      expect(parsed.success).toBe(true);
      expect(parsed.output).toContain('version: "2.0"');
    });

    it('outputs JSON errors with --json flag', () => {
      const exitCode = main(['migrate', '--json', `${FIXTURES_DIR}/valid-v2-minimal.bmml`]);
      expect(exitCode).toBe(1);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0];
      const parsed = JSON.parse(output);
      expect(parsed.success).toBe(false);
      expect(parsed.errors.length).toBeGreaterThan(0);
    });

    it('respects --dry-run flag explicitly', () => {
      const exitCode = main(['migrate', '--dry-run', `${FIXTURES_DIR}/migrate/costs-v1.bmml`]);
      expect(exitCode).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('version: "2.0"');
    });

    it('modifies file with --in-place flag', () => {
      // Create a temporary copy of the v1 file
      const tempFile = join(tmpdir(), `test-migrate-${Date.now()}.bmml`);
      copyFileSync(`${FIXTURES_DIR}/migrate/costs-v1.bmml`, tempFile);

      try {
        // Verify it's v1
        const originalContent = readFileSync(tempFile, 'utf-8');
        expect(originalContent).toContain('version: "1.0"');

        // Run migration with --in-place
        const exitCode = main(['migrate', '--in-place', tempFile]);
        expect(exitCode).toBe(0);
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Migrated'));

        // Verify the file was modified
        const newContent = readFileSync(tempFile, 'utf-8');
        expect(newContent).toContain('version: "2.0"');
        expect(newContent).not.toContain('version: "1.0"');
      } finally {
        // Cleanup
        try {
          unlinkSync(tempFile);
        } catch {
          // Ignore cleanup errors
        }
      }
    });

    it('outputs JSON with --in-place and --json flags', () => {
      // Create a temporary copy of the v1 file
      const tempFile = join(tmpdir(), `test-migrate-json-${Date.now()}.bmml`);
      copyFileSync(`${FIXTURES_DIR}/migrate/costs-v1.bmml`, tempFile);

      try {
        const exitCode = main(['migrate', '--in-place', '--json', tempFile]);
        expect(exitCode).toBe(0);
        const output = consoleLogSpy.mock.calls[0][0];
        const parsed = JSON.parse(output);
        expect(parsed.success).toBe(true);
        expect(parsed.file).toBe(tempFile);
      } finally {
        try {
          unlinkSync(tempFile);
        } catch {
          // Ignore cleanup errors
        }
      }
    });
  });

  describe('unknown command', () => {
    it('fails for unknown command', () => {
      const exitCode = main(['unknown']);
      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalled();
      const errorOutput = consoleErrorSpy.mock.calls.flat().join('\n');
      expect(errorOutput).toContain('Unknown command');
    });
  });

  describe('options parsing', () => {
    it('handles --json before file argument', () => {
      const exitCode = main(['validate', '--json', `${FIXTURES_DIR}/valid-v2-minimal.bmml`]);
      expect(exitCode).toBe(0);
      const output = consoleLogSpy.mock.calls[0][0];
      expect(() => JSON.parse(output)).not.toThrow();
    });

    it('handles --json after file argument', () => {
      const exitCode = main(['validate', `${FIXTURES_DIR}/valid-v2-minimal.bmml`, '--json']);
      expect(exitCode).toBe(0);
      const output = consoleLogSpy.mock.calls[0][0];
      expect(() => JSON.parse(output)).not.toThrow();
    });
  });
});
