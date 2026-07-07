import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

type RepositoryFile = {
  repositoryPath: string;
  checksum: string;
};

const rootDir = process.cwd();
const artifactsDir = path.join(rootDir, 'artifacts');
const latestDir = path.join(artifactsDir, 'latest');
const repositoryPackageDir = path.join(artifactsDir, 'repository', 'latest');
const repositoryZipPath = path.join(latestDir, 'repository-latest.zip');
const contextZipPath = path.join(latestDir, 'context-latest.zip');
const uploadChecklistPath = path.join(latestDir, 'CHAT_UPLOAD_CHECKLIST.md');
const bootstrapManifestPath = path.join(latestDir, 'CHAT_BOOTSTRAP_MANIFEST.md');
const generatedAt = new Date().toISOString();

function exec(command: string, args: string[], options: { capture?: boolean } = {}): string {
  const output = execFileSync(command, args, {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
  });

  return typeof output === 'string' ? output.trim() : '';
}

function git(args: string[]): string {
  return exec('git', args, { capture: true });
}

function sha256File(filePath: string): string {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

function listRepositoryFiles(): string[] {
  const output = git(['ls-files', '--cached', '--others', '--exclude-standard']);

  return output
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean)
    .filter((file) => {
      const absolutePath = path.join(rootDir, file);
      return existsSync(absolutePath) && statSync(absolutePath).isFile();
    });
}

function copyRepositoryFiles(files: string[]): RepositoryFile[] {
  rmSync(repositoryPackageDir, { recursive: true, force: true });
  mkdirSync(repositoryPackageDir, { recursive: true });

  return files.map((file) => {
    const sourcePath = path.join(rootDir, file);
    const targetPath = path.join(repositoryPackageDir, file);
    mkdirSync(path.dirname(targetPath), { recursive: true });
    copyFileSync(sourcePath, targetPath);

    return {
      repositoryPath: toPosixPath(file),
      checksum: sha256File(sourcePath),
    };
  });
}

function formatRepositoryManifest(branch: string, head: string, files: RepositoryFile[]): string {
  return [
    '# Repository Bootstrap Package Manifest',
    '',
    `Generated: ${generatedAt}`,
    '',
    `Branch: \`${branch}\``,
    '',
    `HEAD: \`${head}\``,
    '',
    'Package: `repository-latest.zip`',
    '',
    '---',
    '',
    '## Repository Files',
    '',
    '| File | SHA-256 |',
    '| --- | --- |',
    ...files.map((file) => `| ${file.repositoryPath} | \`${file.checksum}\` |`),
  ].join('\n') + '\n';
}

function formatRepositoryChecksums(files: RepositoryFile[]): string {
  const packageHash = createHash('sha256')
    .update(files.map((file) => `${file.repositoryPath}:${file.checksum}`).join('\n'))
    .digest('hex');

  return [
    '# Repository Bootstrap Package Checksums',
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
    ...files.map((file) => `| ${file.repositoryPath} | \`${file.checksum}\` |`),
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

function formatUploadChecklist(branch: string, head: string): string {
  return [
    '# Chat Upload Checklist',
    '',
    `Generated: ${generatedAt}`,
    '',
    `Branch: \`${branch}\``,
    '',
    `HEAD: \`${head}\``,
    '',
    '---',
    '',
    '## Required Uploads',
    '',
    '- [ ] `context-latest.zip`',
    '- [ ] `repository-latest.zip`',
    '- [ ] `CHAT_BOOTSTRAP_MANIFEST.md`',
    '',
    '---',
    '',
    '## Upload Order',
    '',
    '1. Upload `context-latest.zip`.',
    '2. Upload `repository-latest.zip`.',
    '3. Upload `CHAT_BOOTSTRAP_MANIFEST.md`.',
    '4. Instruct the next chat to load the manifest first, then load the context package before inspecting repository files. Then type: `继续`.',
    '',
    '---',
    '',
    '## Validation',
    '',
    '- [ ] Confirm `context-latest.zip` exists.',
    '- [ ] Confirm `repository-latest.zip` exists.',
    '- [ ] Confirm this checklist and the bootstrap manifest exist.',
    '- [ ] Confirm no generated artifact ZIP is committed.',
  ].join('\n') + '\n';
}

function formatBootstrapManifest(
  branch: string,
  head: string,
  repositoryFileCount: number,
): string {
  return [
    '# Chat Bootstrap Manifest',
    '',
    `Generated: ${generatedAt}`,
    '',
    `Branch: \`${branch}\``,
    '',
    `HEAD: \`${head}\``,
    '',
    '---',
    '',
    '## Packages',
    '',
    '| Package | Purpose |',
    '| --- | --- |',
    '| `context-latest.zip` | Current project context package |',
    '| `repository-latest.zip` | Repository source snapshot for chat bootstrap |',
    '',
    '---',
    '',
    '## Bootstrap Instructions',
    '',
    '1. Load this manifest first.',
    '2. Load `context-latest.zip` to establish current project context.',
    '3. Use `repository-latest.zip` only for repository source inspection.',
    '4. Treat Git as the source of truth for future commits and pushes.',
    '',
    '---',
    '',
    '## Repository Package',
    '',
    `Repository file count: ${repositoryFileCount}`,
    '',
    'Generated from Git-visible, non-ignored files in the working tree.',
  ].join('\n') + '\n';
}

function zipRepositoryPackage() {
  rmSync(repositoryZipPath, { force: true });
  execFileSync('zip', ['-qr', repositoryZipPath, '.'], { cwd: repositoryPackageDir });
}

function prepareChatBootstrap() {
  mkdirSync(latestDir, { recursive: true });

  exec('pnpm', ['context:generate']);
  exec('pnpm', ['artifact:generate']);

  const branch = git(['branch', '--show-current']);
  const head = git(['rev-parse', 'HEAD']);
  const repositoryFiles = copyRepositoryFiles(listRepositoryFiles());

  writeFileSync(
    path.join(repositoryPackageDir, 'REPOSITORY_PACKAGE_MANIFEST.md'),
    formatRepositoryManifest(branch, head, repositoryFiles),
  );
  writeFileSync(
    path.join(repositoryPackageDir, 'CHECKSUMS.md'),
    formatRepositoryChecksums(repositoryFiles),
  );
  writeFileSync(uploadChecklistPath, formatUploadChecklist(branch, head));
  writeFileSync(
    bootstrapManifestPath,
    formatBootstrapManifest(branch, head, repositoryFiles.length),
  );
  zipRepositoryPackage();
  rmSync(repositoryPackageDir, { recursive: true, force: true });

  console.log(`Generated chat context package: ${toPosixPath(path.relative(rootDir, contextZipPath))}`);
  console.log(
    `Generated chat repository package: ${toPosixPath(path.relative(rootDir, repositoryZipPath))}`,
  );
  console.log(
    `Generated chat upload checklist: ${toPosixPath(path.relative(rootDir, uploadChecklistPath))}`,
  );
  console.log(
    `Generated chat bootstrap manifest: ${toPosixPath(path.relative(rootDir, bootstrapManifestPath))}`,
  );
  console.log(`Branch: ${branch}`);
  console.log(`HEAD: ${head}`);
}

try {
  prepareChatBootstrap();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
