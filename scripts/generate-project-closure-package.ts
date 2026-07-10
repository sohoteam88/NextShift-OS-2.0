import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

type Options = {
  id: string;
  releaseDir: string;
  audit: string;
};

const rootDir = process.cwd();
const requiredReleaseFiles = [
  'RUNTIME_PLATFORM_V1_RELEASE_SUMMARY.md',
  'RUNTIME_PLATFORM_V1_RETROSPECTIVE.md',
  'RUNTIME_PLATFORM_V1_LESSONS_LEARNED.md',
  'RUNTIME_PLATFORM_V1_AUTOMATION_REVIEW.md',
];

function parseArgs(argv: string[]): Options {
  const options: Options = {
    id: '',
    releaseDir: '',
    audit: '',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--') {
      continue;
    }

    if (arg === '--id') {
      if (!next) {
        throw new Error('Missing value for --id');
      }
      options.id = next;
      index += 1;
      continue;
    }

    if (arg === '--release-dir') {
      if (!next) {
        throw new Error('Missing value for --release-dir');
      }
      options.releaseDir = next;
      index += 1;
      continue;
    }

    if (arg === '--audit') {
      if (!next) {
        throw new Error('Missing value for --audit');
      }
      options.audit = next;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.id || !options.releaseDir || !options.audit) {
    throw new Error('Usage: pnpm project:closure-package -- --id <id> --release-dir <dir> --audit <audit-md>');
  }

  return options;
}

function resolveRequiredFile(file: string): string {
  const absolutePath = path.resolve(rootDir, file);
  const relativePath = path.relative(rootDir, absolutePath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error(`Closure package source must be inside repository: ${file}`);
  }

  if (!existsSync(absolutePath)) {
    throw new Error(`Required closure package source is missing: ${file}`);
  }

  return relativePath.split(path.sep).join('/');
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const sources = [
    ...requiredReleaseFiles.map((file) => path.join(options.releaseDir, file)),
    options.audit,
  ].map(resolveRequiredFile);

  const args = [
    'artifact:generate',
    '--',
    '--type',
    'release',
    '--id',
    options.id,
    ...sources.flatMap((source) => ['--source', source]),
  ];

  execFileSync('pnpm', args, {
    cwd: rootDir,
    stdio: 'inherit',
  });
}

main();
