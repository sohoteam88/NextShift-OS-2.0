import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

type ContextFile = {
  label: string;
  file: string;
};

type ValidationResult = {
  file: string;
  checks: string[];
  failures: string[];
};

const rootDir = process.cwd();
const contextDir = path.join(rootDir, 'docs/nextshift-os-3');
const outputDir = path.join(contextDir, 'context-package');
const generatedDate = new Date().toISOString().slice(0, 10);

const contextFiles: ContextFile[] = [
  { label: 'Project Context', file: 'PROJECT_CONTEXT.md' },
  { label: 'Repository Status', file: 'REPOSITORY_STATUS.md' },
  { label: 'Next Action', file: 'NEXT_ACTION.md' },
  { label: 'AI Handover', file: 'AI_HANDOVER.md' },
  { label: 'Context Checksum', file: 'CONTEXT_CHECKSUM.md' },
];

function git(args: string[]): string {
  return execFileSync('git', args, { cwd: rootDir, encoding: 'utf8' }).trim();
}

function readContextFile(file: string): string {
  return readFileSync(path.join(contextDir, file), 'utf8');
}

function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

function rewriteLocalLinksForPackage(content: string): string {
  return content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label: string, href: string) => {
    if (
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('mailto:') ||
      href.startsWith('#')
    ) {
      return match;
    }

    const [target, anchor] = href.split('#', 2);
    if (!target) {
      return match;
    }

    const resolvedTarget = path.resolve(contextDir, target);
    const relativeTarget = toPosixPath(path.relative(outputDir, resolvedTarget));
    const nextHref = anchor ? `${relativeTarget}#${anchor}` : relativeTarget;

    return `[${label}](${nextHref})`;
  });
}

function parseReleaseId(): string {
  const releaseFlagIndex = process.argv.findIndex((arg) => arg === '--release');
  if (releaseFlagIndex >= 0 && process.argv[releaseFlagIndex + 1]) {
    return process.argv[releaseFlagIndex + 1];
  }

  return git(['rev-parse', '--short', 'HEAD']);
}

function requireContains(
  result: ValidationResult,
  content: string,
  pattern: RegExp,
  check: string,
) {
  if (pattern.test(content)) {
    result.checks.push(check);
  } else {
    result.failures.push(check);
  }
}

function validateFile(file: string, content: string): ValidationResult {
  const result: ValidationResult = {
    file,
    checks: [],
    failures: [],
  };

  requireContains(result, content, /^# .+/m, 'title present');
  requireContains(result, content, /^Version: .+/m, 'version metadata present');
  requireContains(result, content, /^Status: .+/m, 'status metadata present');
  requireContains(result, content, /^Last Updated: \d{4}-\d{2}-\d{2}/m, 'last updated metadata present');

  if (file === 'PROJECT_CONTEXT.md') {
    requireContains(result, content, /single source of truth/i, 'project context authority declared');
  }

  if (file === 'CONTEXT_CHECKSUM.md') {
    for (const requiredFile of contextFiles.filter((entry) => entry.file !== 'CONTEXT_CHECKSUM.md')) {
      requireContains(
        result,
        content,
        new RegExp(requiredFile.file.replace('.', '\\.')),
        `${requiredFile.file} checksum reference present`,
      );
    }
    requireContains(result, content, /Package checksum/i, 'package checksum present');
  }

  return result;
}

function formatValidation(results: ValidationResult[]): string {
  const failed = results.flatMap((result) =>
    result.failures.map((failure) => `${result.file}: ${failure}`),
  );
  const status = failed.length === 0 ? 'PASS' : 'FAIL';

  return [
    '# Project Context Package Metadata Validation',
    '',
    `Generated: ${generatedDate}`,
    '',
    `Status: ${status}`,
    '',
    '---',
    '',
    '## Validation Results',
    '',
    ...results.flatMap((result) => [
      `### ${result.file}`,
      '',
      ...result.checks.map((check) => `- PASS: ${check}`),
      ...result.failures.map((failure) => `- FAIL: ${failure}`),
      '',
    ]),
  ].join('\n');
}

function formatCombinedPackage(contents: Map<string, string>, releaseId: string): string {
  return [
    '# Project Context Package',
    '',
    `Generated: ${generatedDate}`,
    '',
    `Release: ${releaseId}`,
    '',
    '---',
    '',
    ...contextFiles.flatMap((entry) => [
      `## ${entry.label}`,
      '',
      `Source: \`${entry.file}\``,
      '',
      rewriteLocalLinksForPackage(contents.get(entry.file)?.trimEnd() ?? ''),
      '',
      '---',
      '',
    ]),
  ].join('\n').trimEnd() + '\n';
}

function formatManifest(releaseId: string, branch: string, head: string): string {
  return [
    '# Project Context Package Release Manifest',
    '',
    `Generated: ${generatedDate}`,
    '',
    `Release: ${releaseId}`,
    '',
    `Branch: \`${branch}\``,
    '',
    `HEAD: \`${head}\``,
    '',
    '---',
    '',
    '## Source Files',
    '',
    ...contextFiles.map((entry) => `- [${entry.label}](../${entry.file})`),
    '',
    '---',
    '',
    '## Generated Files',
    '',
    '- [Project Context Package](PROJECT_CONTEXT_PACKAGE.md)',
    '- [Release Manifest](RELEASE_MANIFEST.md)',
    '- [Metadata Validation](METADATA_VALIDATION.md)',
    '- [Checksums](CHECKSUMS.md)',
    '',
    '---',
    '',
    '## Generation Command',
    '',
    '```bash',
    'pnpm context:generate',
    '```',
  ].join('\n') + '\n';
}

function formatChecksums(files: Map<string, string>, packageHash: string): string {
  return [
    '# Project Context Package Checksums',
    '',
    `Generated: ${generatedDate}`,
    '',
    'Algorithm: SHA-256',
    '',
    '---',
    '',
    '## File Checksums',
    '',
    '| File | SHA-256 |',
    '| --- | --- |',
    ...[...files.entries()].map(([file, content]) => `| ${file} | \`${sha256(content)}\` |`),
    '',
    '---',
    '',
    '## Package Checksum',
    '',
    '```text',
    packageHash,
    '```',
  ].join('\n') + '\n';
}

const releaseId = parseReleaseId();
const branch = git(['branch', '--show-current']);
const head = git(['rev-parse', 'HEAD']);
const contents = new Map(contextFiles.map((entry) => [entry.file, readContextFile(entry.file)]));
const validationResults = [...contents.entries()].map(([file, content]) => validateFile(file, content));
const validationFailures = validationResults.flatMap((result) => result.failures);

if (validationFailures.length > 0) {
  console.error(formatValidation(validationResults));
  process.exit(1);
}

mkdirSync(outputDir, { recursive: true });

const combinedPackage = formatCombinedPackage(contents, releaseId);
const manifest = formatManifest(releaseId, branch, head);
const validation = formatValidation(validationResults);

const generatedFiles = new Map<string, string>([
  ['PROJECT_CONTEXT_PACKAGE.md', combinedPackage],
  ['RELEASE_MANIFEST.md', manifest],
  ['METADATA_VALIDATION.md', validation],
]);

const packageHash = sha256(
  [...contents.values(), ...generatedFiles.values()].map((content) => content.trimEnd()).join('\n'),
);
const checksums = formatChecksums(new Map([...contents, ...generatedFiles]), packageHash);

for (const [file, content] of [...generatedFiles, ['CHECKSUMS.md', checksums] as const]) {
  writeFileSync(path.join(outputDir, file), content);
}

console.log(`Generated Project Context package at ${path.relative(rootDir, outputDir)}`);
console.log(`Release: ${releaseId}`);
console.log(`Package checksum: ${packageHash}`);
