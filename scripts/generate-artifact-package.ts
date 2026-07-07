import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

type PackageType = 'context' | 'execution' | 'audit' | 'release' | 'deployment';

type CliOptions = {
  type: PackageType;
  id: string;
  sources: string[];
};

type PackageFile = {
  packagePath: string;
  content: string;
};

const rootDir = process.cwd();
const artifactRootDir = path.join(rootDir, 'artifacts');
const packageTypes = new Set<PackageType>([
  'context',
  'execution',
  'audit',
  'release',
  'deployment',
]);
const generatedAt = new Date().toISOString();

const defaultContextSources = [
  'docs/nextshift-os-3/PROJECT_CONTEXT.md',
  'docs/nextshift-os-3/REPOSITORY_STATUS.md',
  'docs/nextshift-os-3/NEXT_ACTION.md',
  'docs/nextshift-os-3/AI_HANDOVER.md',
  'docs/nextshift-os-3/CONTEXT_CHECKSUM.md',
];

function git(args: string[]): string {
  return execFileSync('git', args, { cwd: rootDir, encoding: 'utf8' }).trim();
}

function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

function sanitizeId(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'artifact';
}

function parsePackageType(value: string): PackageType {
  if (packageTypes.has(value as PackageType)) {
    return value as PackageType;
  }

  throw new Error(`Unsupported package type: ${value}`);
}

function parseArgs(argv: string[]): CliOptions {
  const shortHead = git(['rev-parse', '--short', 'HEAD']);
  const options: CliOptions = {
    type: 'context',
    id: shortHead,
    sources: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--') {
      continue;
    }

    if (arg === '--type') {
      if (!next) {
        throw new Error('Missing value for --type');
      }
      options.type = parsePackageType(next);
      index += 1;
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

    if (arg === '--source') {
      if (!next) {
        throw new Error('Missing value for --source');
      }
      options.sources.push(next);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (options.sources.length === 0) {
    options.sources = defaultContextSources;
  }

  return options;
}

function resolveSourcePath(source: string): string {
  const absolutePath = path.resolve(rootDir, source);
  const relativePath = path.relative(rootDir, absolutePath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error(`Source file must be inside repository: ${source}`);
  }

  if (!source.endsWith('.md')) {
    throw new Error(`Artifact source must be a Markdown file: ${source}`);
  }

  if (!existsSync(absolutePath)) {
    throw new Error(`Required artifact source is missing: ${source}`);
  }

  return absolutePath;
}

function readSourceFiles(sources: string[]): PackageFile[] {
  return sources.map((source) => {
    const absolutePath = resolveSourcePath(source);
    const repositoryPath = toPosixPath(path.relative(rootDir, absolutePath));

    return {
      packagePath: `source/${repositoryPath}`,
      content: readFileSync(absolutePath, 'utf8'),
    };
  });
}

function formatManifest(
  options: CliOptions,
  branch: string,
  head: string,
  sourceFiles: PackageFile[],
): string {
  return [
    '# NextShift Artifact Package Manifest',
    '',
    `Generated: ${generatedAt}`,
    '',
    `Package Type: ${options.type}`,
    '',
    `Package ID: ${options.id}`,
    '',
    `Branch: \`${branch}\``,
    '',
    `HEAD: \`${head}\``,
    '',
    '---',
    '',
    '## Source Files',
    '',
    '| Package Path | SHA-256 |',
    '| --- | --- |',
    ...sourceFiles.map(
      (file) => `| [${file.packagePath}](${file.packagePath}) | \`${sha256(file.content)}\` |`,
    ),
    '',
    '---',
    '',
    '## Generated Files',
    '',
    '- [Package Manifest](PACKAGE_MANIFEST.md)',
    '- [Checksums](CHECKSUMS.md)',
    '',
    '---',
    '',
    '## Generation Command',
    '',
    '```bash',
    `pnpm artifact:generate -- --type ${options.type} --id ${options.id}`,
    '```',
  ].join('\n') + '\n';
}

function formatChecksums(files: PackageFile[]): string {
  const packageHash = sha256(files.map((file) => file.content.trimEnd()).join('\n'));

  return [
    '# NextShift Artifact Package Checksums',
    '',
    `Generated: ${generatedAt}`,
    '',
    'Algorithm: SHA-256',
    '',
    '---',
    '',
    '## File Checksums',
    '',
    '| File | SHA-256 |',
    '| --- | --- |',
    ...files.map((file) => `| ${file.packagePath} | \`${sha256(file.content)}\` |`),
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

function writePackageFiles(packageDir: string, files: PackageFile[]) {
  for (const file of files) {
    const targetPath = path.join(packageDir, file.packagePath);
    mkdirSync(path.dirname(targetPath), { recursive: true });
    writeFileSync(targetPath, file.content);
  }
}

function zipPackage(packageDir: string, zipPath: string) {
  rmSync(zipPath, { force: true });
  execFileSync('zip', ['-qr', zipPath, '.'], { cwd: packageDir });
}

function generate() {
  const options = parseArgs(process.argv.slice(2));
  const branch = git(['branch', '--show-current']);
  const head = git(['rev-parse', 'HEAD']);
  const timestamp = generatedAt.replace(/[:.]/g, '-');
  const packageSlug = `${options.type}-${sanitizeId(options.id)}-${timestamp}`;
  const typeDir = path.join(artifactRootDir, options.type);
  const latestDir = path.join(artifactRootDir, 'latest');
  const packageDir = path.join(typeDir, packageSlug);
  const zipPath = path.join(typeDir, `${packageSlug}.zip`);
  const latestZipPath = path.join(latestDir, `${options.type}-latest.zip`);

  const sourceFiles = readSourceFiles(options.sources);
  const manifest = formatManifest(options, branch, head, sourceFiles);
  const packageFiles: PackageFile[] = [
    ...sourceFiles,
    { packagePath: 'PACKAGE_MANIFEST.md', content: manifest },
  ];
  packageFiles.push({ packagePath: 'CHECKSUMS.md', content: formatChecksums(packageFiles) });

  rmSync(packageDir, { recursive: true, force: true });
  mkdirSync(packageDir, { recursive: true });
  mkdirSync(latestDir, { recursive: true });
  writePackageFiles(packageDir, packageFiles);
  zipPackage(packageDir, zipPath);
  copyFileSync(zipPath, latestZipPath);

  console.log(`Generated artifact package: ${toPosixPath(path.relative(rootDir, zipPath))}`);
  console.log(`Updated latest package: ${toPosixPath(path.relative(rootDir, latestZipPath))}`);
  console.log(`Package type: ${options.type}`);
  console.log(`Package ID: ${options.id}`);
  console.log(`Branch: ${branch}`);
  console.log(`HEAD: ${head}`);
}

try {
  generate();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
