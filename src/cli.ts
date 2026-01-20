#!/usr/bin/env node
/**
 * BMML CLI
 * Command-line interface for validating and linting BMML files
 */

import { validateFile, parseYaml } from './validator.js';
import { lint } from './linter.js';
import type { BMCDocument } from './types.js';
import { readFileSync } from 'fs';

interface CliOptions {
  json: boolean;
  help: boolean;
}

interface CliResult {
  success: boolean;
  validationErrors: Array<{ path: string; message: string }>;
  lintIssues: Array<{ rule: string; severity: string; message: string; path: string }>;
}

const USAGE = `
bmml - Business Model Markup Language validator and linter

USAGE:
  bmml <command> [options] <file>

COMMANDS:
  validate <file>    Validate a .bmml file against the schema
  lint <file>        Run linter checks (includes validation)
  help               Show this help message

OPTIONS:
  --json             Output results as JSON
  --help, -h         Show help for a command

EXAMPLES:
  bmml validate model.bmml
  bmml lint model.bmml --json
  bmml validate --json model.bmml
`.trim();

function parseArgs(args: string[]): { command: string; file: string | null; options: CliOptions } {
  const options: CliOptions = { json: false, help: false };
  const positional: string[] = [];

  for (const arg of args) {
    if (arg === '--json') {
      options.json = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (!arg.startsWith('-')) {
      positional.push(arg);
    } else {
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    }
  }

  const command = positional[0] || 'help';
  const file = positional[1] || null;

  return { command, file, options };
}

function formatValidationError(error: { path: string; message: string }): string {
  const path = error.path === '/' ? '(root)' : error.path;
  return `  ${path}: ${error.message}`;
}

function formatLintIssue(issue: { rule: string; severity: string; message: string; path: string }): string {
  const icon = issue.severity === 'error' ? '✗' : issue.severity === 'warning' ? '!' : 'i';
  const path = issue.path === '/' ? '(root)' : issue.path;
  return `  ${icon} [${issue.rule}] ${path}: ${issue.message}`;
}

function outputResult(result: CliResult, options: CliOptions): void {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (result.validationErrors.length > 0) {
    console.error('Validation errors:');
    for (const error of result.validationErrors) {
      console.error(formatValidationError(error));
    }
  }

  if (result.lintIssues.length > 0) {
    if (result.validationErrors.length > 0) {
      console.error('');
    }
    console.error('Lint issues:');
    for (const issue of result.lintIssues) {
      console.error(formatLintIssue(issue));
    }
  }

  if (result.success) {
    console.log('OK');
  }
}

function runValidate(file: string, options: CliOptions): number {
  const validationResult = validateFile(file);

  const result: CliResult = {
    success: validationResult.valid,
    validationErrors: validationResult.errors,
    lintIssues: [],
  };

  outputResult(result, options);
  return result.success ? 0 : 1;
}

function runLint(file: string, options: CliOptions): number {
  // First validate the file
  const validationResult = validateFile(file);

  if (!validationResult.valid) {
    const result: CliResult = {
      success: false,
      validationErrors: validationResult.errors,
      lintIssues: [],
    };
    outputResult(result, options);
    return 1;
  }

  // Parse the file again to get the document for linting
  const content = readFileSync(file, 'utf-8');
  const parseResult = parseYaml(content);
  if ('error' in parseResult) {
    // Should not happen since validation passed
    const result: CliResult = {
      success: false,
      validationErrors: [parseResult.error],
      lintIssues: [],
    };
    outputResult(result, options);
    return 1;
  }

  const lintResult = lint(parseResult.data as BMCDocument);
  const errors = lintResult.issues.filter((i) => i.severity === 'error');

  const result: CliResult = {
    success: errors.length === 0,
    validationErrors: [],
    lintIssues: lintResult.issues,
  };

  outputResult(result, options);
  return result.success ? 0 : 1;
}

function showHelp(): void {
  console.log(USAGE);
}

export function main(args: string[] = process.argv.slice(2)): number {
  const { command, file, options } = parseArgs(args);

  if (options.help || command === 'help') {
    showHelp();
    return 0;
  }

  if (command === 'validate') {
    if (!file) {
      console.error('Error: validate command requires a file argument');
      console.error('Usage: bmml validate <file>');
      return 1;
    }
    return runValidate(file, options);
  }

  if (command === 'lint') {
    if (!file) {
      console.error('Error: lint command requires a file argument');
      console.error('Usage: bmml lint <file>');
      return 1;
    }
    return runLint(file, options);
  }

  console.error(`Unknown command: ${command}`);
  console.error('Run "bmml help" for usage information');
  return 1;
}

// Run CLI when executed directly
const isMainModule = process.argv[1]?.endsWith('cli.ts') || process.argv[1]?.endsWith('cli.js');
if (isMainModule) {
  process.exit(main());
}
