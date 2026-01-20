/**
 * CLI tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { main } from '../src/cli';

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
      const exitCode = main(['validate', `${FIXTURES_DIR}/valid-minimal.bmml`]);
      expect(exitCode).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalledWith('OK');
    });

    it('validates a valid complete file', () => {
      const exitCode = main(['validate', `${FIXTURES_DIR}/valid-complete.bmml`]);
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
      const exitCode = main(['validate', '--json', `${FIXTURES_DIR}/valid-minimal.bmml`]);
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
      const exitCode = main(['lint', `${FIXTURES_DIR}/valid-complete.bmml`]);
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

    it('reports lint issues for invalid references', () => {
      const exitCode = main(['lint', `${FIXTURES_DIR}/invalid-references.bmml`]);
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
      const exitCode = main(['lint', '--json', `${FIXTURES_DIR}/valid-complete.bmml`]);
      expect(exitCode).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0];
      const parsed = JSON.parse(output);
      expect(parsed.success).toBe(true);
      expect(parsed.lintIssues).toEqual([]);
    });

    it('outputs JSON lint issues with --json flag', () => {
      const exitCode = main(['lint', '--json', `${FIXTURES_DIR}/invalid-references.bmml`]);
      expect(exitCode).toBe(1);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0];
      const parsed = JSON.parse(output);
      expect(parsed.success).toBe(false);
      expect(parsed.lintIssues.length).toBeGreaterThan(0);
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
      const exitCode = main(['validate', '--json', `${FIXTURES_DIR}/valid-minimal.bmml`]);
      expect(exitCode).toBe(0);
      const output = consoleLogSpy.mock.calls[0][0];
      expect(() => JSON.parse(output)).not.toThrow();
    });

    it('handles --json after file argument', () => {
      const exitCode = main(['validate', `${FIXTURES_DIR}/valid-minimal.bmml`, '--json']);
      expect(exitCode).toBe(0);
      const output = consoleLogSpy.mock.calls[0][0];
      expect(() => JSON.parse(output)).not.toThrow();
    });
  });
});
