#!/usr/bin/env node
/**
 * BMML CLI
 * Command-line interface for validating and linting BMML files
 */

import { validateFileAuto, parseYaml, validateDocument } from './validator.js';
import { lint } from './linter.js';
import { migrateV1toV2 } from './migrate.js';
import { render } from './render.js';
import type { BMCDocumentV2 } from './types.js';
import { readFileSync, writeFileSync } from 'fs';

interface CliOptions {
  json: boolean;
  help: boolean;
  dryRun: boolean;
  inPlace: boolean;
  output: string | null;
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
  migrate <file>     Migrate a v1 file to v2 format
  render <file>      Render a .bmml file as an SVG Business Model Canvas
  help               Show this help message

OPTIONS:
  --json             Output results as JSON
  --help, -h         Show help for a command
  --dry-run          (migrate) Output to stdout without modifying file (default)
  --in-place         (migrate) Modify the file in place
  -o, --output PATH  (render) Write SVG to file instead of stdout

EXAMPLES:
  bmml validate model.bmml
  bmml lint model.bmml --json
  bmml validate --json model.bmml
  bmml migrate model.bmml
  bmml migrate --in-place model.bmml
  bmml render model.bmml
  bmml render model.bmml -o canvas.svg
`.trim();

function parseArgs(args: string[]): { command: string; file: string | null; options: CliOptions } {
  const options: CliOptions = { json: false, help: false, dryRun: false, inPlace: false, output: null };
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--json') {
      options.json = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--in-place') {
      options.inPlace = true;
    } else if (arg === '-o' || arg === '--output') {
      const nextArg = args[i + 1];
      if (!nextArg || nextArg.startsWith('-')) {
        console.error('Error: --output requires a path argument');
        process.exit(1);
      }
      options.output = nextArg;
      i++; // Skip the next argument since we consumed it
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
  const validationResult = validateFileAuto(file);

  const result: CliResult = {
    success: validationResult.valid,
    validationErrors: validationResult.errors,
    lintIssues: [],
  };

  outputResult(result, options);
  return result.success ? 0 : 1;
}

function runLint(file: string, options: CliOptions): number {
  // First validate the file with auto-detection
  const validationResult = validateFileAuto(file);

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

  const lintResult = lint(parseResult.data as BMCDocumentV2);
  const errors = lintResult.issues.filter((i) => i.severity === 'error');

  const result: CliResult = {
    success: errors.length === 0,
    validationErrors: [],
    lintIssues: lintResult.issues,
  };

  outputResult(result, options);
  return result.success ? 0 : 1;
}

interface MigrateResult {
  success: boolean;
  output?: string;
  errors: string[];
  validationErrors?: Array<{ path: string; message: string }>;
}

function runMigrate(file: string, options: CliOptions): number {
  // Read the file
  let content: string;
  try {
    content = readFileSync(file, 'utf-8');
  } catch {
    const result: MigrateResult = {
      success: false,
      errors: [`File not found: ${file}`],
    };
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error(`Error: File not found: ${file}`);
    }
    return 1;
  }

  // Perform migration
  const migrationResult = migrateV1toV2(content);

  if (!migrationResult.success || !migrationResult.output) {
    const result: MigrateResult = {
      success: false,
      errors: migrationResult.errors,
    };
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error('Migration failed:');
      for (const error of migrationResult.errors) {
        console.error(`  ${error}`);
      }
    }
    return 1;
  }

  // Validate the migrated output
  const parseResult = parseYaml(migrationResult.output);
  if ('error' in parseResult) {
    const result: MigrateResult = {
      success: false,
      errors: ['Migrated output failed to parse'],
      validationErrors: [parseResult.error],
    };
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error('Migration produced invalid YAML:');
      console.error(`  ${parseResult.error.message}`);
    }
    return 1;
  }

  // Validate against v2 schema
  const validationResult = validateDocument(parseResult.data);
  if (!validationResult.valid) {
    const result: MigrateResult = {
      success: false,
      errors: ['Migrated output failed v2 validation'],
      validationErrors: validationResult.errors,
    };
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error('Migration produced invalid v2 document:');
      for (const error of validationResult.errors) {
        const path = error.path === '/' ? '(root)' : error.path;
        console.error(`  ${path}: ${error.message}`);
      }
    }
    return 1;
  }

  // Handle output
  if (options.inPlace) {
    writeFileSync(file, migrationResult.output, 'utf-8');
    if (options.json) {
      console.log(JSON.stringify({ success: true, errors: [], file }, null, 2));
    } else {
      console.log(`Migrated ${file} to v2 format`);
    }
  } else {
    // Default: dry-run (output to stdout)
    if (options.json) {
      console.log(JSON.stringify({ success: true, errors: [], output: migrationResult.output }, null, 2));
    } else {
      console.log(migrationResult.output);
    }
  }

  return 0;
}

interface RenderResult {
  success: boolean;
  output?: string;
  file?: string;
  errors: string[];
  validationErrors?: Array<{ path: string; message: string }>;
}

function runRender(file: string, options: CliOptions): number {
  // First validate the file
  const validationResult = validateFileAuto(file);

  if (!validationResult.valid) {
    const result: RenderResult = {
      success: false,
      errors: ['File failed validation'],
      validationErrors: validationResult.errors,
    };
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error('Validation errors:');
      for (const error of validationResult.errors) {
        const path = error.path === '/' ? '(root)' : error.path;
        console.error(`  ${path}: ${error.message}`);
      }
    }
    return 1;
  }

  // Parse the file to get the document for rendering
  const content = readFileSync(file, 'utf-8');
  const parseResult = parseYaml(content);
  if ('error' in parseResult) {
    const result: RenderResult = {
      success: false,
      errors: ['Failed to parse file'],
      validationErrors: [parseResult.error],
    };
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error(`Error: ${parseResult.error.message}`);
    }
    return 1;
  }

  // Render the document
  const svg = render(parseResult.data as BMCDocumentV2);

  // Handle output
  if (options.output) {
    writeFileSync(options.output, svg, 'utf-8');
    if (options.json) {
      console.log(JSON.stringify({ success: true, errors: [], file: options.output }, null, 2));
    } else {
      console.log(`Rendered to ${options.output}`);
    }
  } else {
    // Output to stdout
    if (options.json) {
      console.log(JSON.stringify({ success: true, errors: [], output: svg }, null, 2));
    } else {
      console.log(svg);
    }
  }

  return 0;
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

  if (command === 'migrate') {
    if (!file) {
      console.error('Error: migrate command requires a file argument');
      console.error('Usage: bmml migrate <file>');
      return 1;
    }
    return runMigrate(file, options);
  }

  if (command === 'render') {
    if (!file) {
      console.error('Error: render command requires a file argument');
      console.error('Usage: bmml render <file>');
      return 1;
    }
    return runRender(file, options);
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
