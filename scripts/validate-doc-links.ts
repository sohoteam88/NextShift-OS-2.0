import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

type LinkIssue = {
  file: string;
  line: number;
  href: string;
  reason: string;
};

const rootDir = process.cwd();
const docsDir = path.join(rootDir, 'docs/nextshift-os-3');
const markdownLinkPattern = /!?\[[^\]]*\]\(([^)\s]+(?:\s+"[^"]*")?)\)/g;
const skippedSchemes = [
  'http://',
  'https://',
  'mailto:',
  'tel:',
  'data:',
];

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

function walkMarkdownFiles(dir: string): string[] {
  return readdirSync(dir)
    .flatMap((entry) => {
      const absolutePath = path.join(dir, entry);
      const stat = statSync(absolutePath);

      if (stat.isDirectory()) {
        return walkMarkdownFiles(absolutePath);
      }

      return entry.endsWith('.md') ? [absolutePath] : [];
    })
    .sort();
}

function stripTitle(rawHref: string): string {
  const trimmed = rawHref.trim();
  const titleStart = trimmed.search(/\s+"/);

  return titleStart >= 0 ? trimmed.slice(0, titleStart).trim() : trimmed;
}

function normalizeHref(rawHref: string): string {
  return stripTitle(rawHref).replace(/^<|>$/g, '');
}

function shouldSkipHref(href: string): boolean {
  return (
    href.length === 0 ||
    href.startsWith('#') ||
    skippedSchemes.some((scheme) => href.startsWith(scheme))
  );
}

function resolveTarget(file: string, href: string): string {
  const [targetWithoutAnchor] = href.split('#', 1);
  const [targetWithoutQuery] = targetWithoutAnchor.split('?', 1);
  const decodedTarget = decodeURIComponent(targetWithoutQuery);

  if (decodedTarget.startsWith('/')) {
    return path.join(rootDir, decodedTarget);
  }

  return path.resolve(path.dirname(file), decodedTarget);
}

function lineNumberForIndex(content: string, index: number): number {
  return content.slice(0, index).split('\n').length;
}

function validateFile(file: string): LinkIssue[] {
  const content = readFileSync(file, 'utf8');
  const issues: LinkIssue[] = [];
  const relativeFile = toPosixPath(path.relative(rootDir, file));

  for (const match of content.matchAll(markdownLinkPattern)) {
    const rawHref = match[1];
    const href = normalizeHref(rawHref);

    if (shouldSkipHref(href)) {
      continue;
    }

    let target: string;
    try {
      target = resolveTarget(file, href);
    } catch (error) {
      issues.push({
        file: relativeFile,
        line: lineNumberForIndex(content, match.index ?? 0),
        href,
        reason: error instanceof Error ? error.message : 'invalid link target',
      });
      continue;
    }

    const relativeTarget = path.relative(rootDir, target);

    if (relativeTarget.startsWith('..') || path.isAbsolute(relativeTarget)) {
      issues.push({
        file: relativeFile,
        line: lineNumberForIndex(content, match.index ?? 0),
        href,
        reason: 'target resolves outside repository',
      });
      continue;
    }

    if (!existsSync(target)) {
      issues.push({
        file: relativeFile,
        line: lineNumberForIndex(content, match.index ?? 0),
        href,
        reason: 'target does not exist',
      });
    }
  }

  return issues;
}

function main() {
  if (!existsSync(docsDir)) {
    throw new Error('docs/nextshift-os-3 does not exist');
  }

  const files = walkMarkdownFiles(docsDir);
  const issues = files.flatMap(validateFile);

  if (issues.length > 0) {
    console.error(`Markdown link validation failed with ${issues.length} issue(s).`);
    for (const issue of issues) {
      console.error(`${issue.file}:${issue.line} ${issue.href} - ${issue.reason}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Markdown link validation passed for ${files.length} file(s).`);
}

main();
