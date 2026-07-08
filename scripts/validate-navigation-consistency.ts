import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

type NavigationIssue = {
  file: string;
  message: string;
};

type NavigationResult = {
  issues: NavigationIssue[];
  warnings: NavigationIssue[];
};

const rootDir = process.cwd();
const docsDir = path.join(rootDir, 'docs/nextshift-os-3');
const navigationFiles = [
  path.join(docsDir, 'MASTER_INDEX.md'),
  ...findReadmes(docsDir),
];
const markdownLinkPattern = /\[[^\]]+\]\(([^)]+)\)/g;

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

function findReadmes(dir: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir)
    .flatMap((entry) => {
      const absolutePath = path.join(dir, entry);
      const stat = statSync(absolutePath);

      if (stat.isDirectory()) {
        return findReadmes(absolutePath);
      }

      return entry === 'README.md' ? [absolutePath] : [];
    })
    .sort();
}

function isLocalHref(href: string): boolean {
  return !(
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:') ||
    href.startsWith('#')
  );
}

function targetExists(file: string, href: string): boolean {
  const cleanHref = href.replace(/^<|>$/g, '').split('#', 1)[0].split('?', 1)[0];
  if (!cleanHref) {
    return true;
  }

  const target = cleanHref.startsWith('/')
    ? path.join(rootDir, cleanHref)
    : path.resolve(path.dirname(file), decodeURIComponent(cleanHref));

  return existsSync(target);
}

function validateNavigationFile(file: string): NavigationResult {
  const relativeFile = toPosixPath(path.relative(rootDir, file));
  const content = readFileSync(file, 'utf8');
  const issues: NavigationIssue[] = [];
  const warnings: NavigationIssue[] = [];
  const seenLinks = new Set<string>();

  for (const match of content.matchAll(markdownLinkPattern)) {
    const href = match[1].trim();

    if (!isLocalHref(href)) {
      continue;
    }

    if (seenLinks.has(href)) {
      warnings.push({
        file: relativeFile,
        message: `duplicate navigation link: ${href}`,
      });
    }
    seenLinks.add(href);

    if (!targetExists(file, href)) {
      issues.push({
        file: relativeFile,
        message: `missing navigation target: ${href}`,
      });
    }
  }

  return { issues, warnings };
}

function main() {
  const existingNavigationFiles = navigationFiles.filter((file) => existsSync(file));
  const results = existingNavigationFiles.map(validateNavigationFile);
  const issues = results.flatMap((result) => result.issues);
  const warnings = results.flatMap((result) => result.warnings);

  if (issues.length > 0) {
    console.error(`Navigation consistency validation failed with ${issues.length} issue(s).`);
    for (const issue of issues) {
      console.error(`${issue.file}: ${issue.message}`);
    }
    process.exitCode = 1;
    return;
  }

  if (warnings.length > 0) {
    console.warn(`Navigation consistency validation passed with ${warnings.length} warning(s).`);
    for (const warning of warnings) {
      console.warn(`${warning.file}: ${warning.message}`);
    }
  }

  console.log(`Navigation consistency validation passed for ${existingNavigationFiles.length} file(s).`);
}

main();
