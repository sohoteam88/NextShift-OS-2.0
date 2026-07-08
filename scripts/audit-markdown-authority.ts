import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative } from 'node:path';

type MarkdownFile = {
  path: string;
  title: string;
  normalizedTitle: string;
  normalizedPathTopic: string;
  versions: string[];
  docClass: 'active' | 'historical' | 'skill' | 'package' | 'unknown';
  status?: string;
};

type TopicGroup = {
  key: string;
  files: MarkdownFile[];
  versions: string[];
};

const repoRoot = process.cwd();
const reportPath = 'docs/nextshift-os-3/docs-hygiene/MARKDOWN_AUTHORITY_AUDIT.md';
const jsonPath = 'docs/nextshift-os-3/docs-hygiene/markdown-authority-audit.json';

const canonicalPaths = [
  'AGENTS.md',
  'docs/nextshift-os-3/MASTER_INDEX.md',
  'docs/nextshift-os-3/BLUEPRINT_STATUS.md',
  'docs/nextshift-os-3/RUNTIME_STATUS.md',
  'docs/nextshift-os-3/CAPABILITY_STATUS.md',
  'docs/nextshift-os-3/engineering/ENGINEERING_PLAYBOOK.md',
  'docs/nextshift-os-3/engineering/ENGINEERING_STANDARDS.md',
  'docs/nextshift-os-3/design-system/README.md',
  'docs/nextshift-os-3/ui-kit/README.md',
  'docs/chatgpt-system-context/README.md',
  'docs/chatgpt-system-context/VERSION_AUTHORITY_POLICY.md',
];

const ignoredPathFragments = [
  '/node_modules/',
  '/.next/',
  '/dist/',
  '/build/',
  '/coverage/',
  '/.git/',
];

function git(args: string[]): string {
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function shellFindMarkdown(): string[] {
  const output = execFileSync(
    'find',
    ['.', '-name', '*.md', '-type', 'f'],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  return output
    .split('\n')
    .filter(Boolean)
    .map((path) => path.replace(/^\.\//, ''))
    .filter((path) => !ignoredPathFragments.some((fragment) => `/${path}`.includes(fragment)))
    .sort();
}

function uniq(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}

function extractTitle(content: string, path: string): string {
  const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading) return heading;
  return path.split('/').pop()?.replace(/\.md$/i, '') ?? path;
}

function extractStatus(content: string): string | undefined {
  return content.match(/^Status:\s*(.+)$/m)?.[1]?.trim();
}

function extractVersions(content: string, path: string): string[] {
  const versions = new Set<string>();
  const combined = `${path}\n${content}`;
  const regexes = [
    /\bv\d+(?:\.\d+){0,2}\b/gi,
    /^Version:\s*([0-9]+(?:\.[0-9]+){0,2})$/gim,
    /\bVersion\s+([0-9]+(?:\.[0-9]+){0,2})\b/gi,
  ];

  for (const regex of regexes) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(combined)) !== null) {
      const raw = match[1] ? `v${match[1]}` : match[0];
      versions.add(raw.toLowerCase());
    }
  }

  return uniq(Array.from(versions));
}

function normalizeTopic(value: string): string {
  return value
    .toLowerCase()
    .replace(/\.md$/g, '')
    .replace(/\bv\d+(?:\.\d+){0,2}\b/g, '')
    .replace(/\bversion\s+[0-9]+(?:\.[0-9]+){0,2}\b/g, '')
    .replace(/\b20\d{2}[-_]\d{2}[-_]\d{2}\b/g, '')
    .replace(/\bcap[-_ ]?\d+\b/g, 'cap')
    .replace(/\bs[-_ ]?\d+\b/g, 'slice')
    .replace(/\bslice[-_ ]?\d+\b/g, 'slice')
    .replace(/\buk[-_ ]?\d+\b/g, 'uk')
    .replace(/\bds[-_ ]?\d+\b/g, 'ds')
    .replace(/\bep[-_ ]?\d+\b/g, 'ep')
    .replace(/\bag[-_ ]?\d+\b/g, 'ag')
    .replace(/\btask[-_ ]?\d+\b/g, 'task')
    .replace(/[()]/g, ' ')
    .replace(/[_/-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function classify(path: string): MarkdownFile['docClass'] {
  const lower = path.toLowerCase();
  const base = lower.split('/').pop() ?? lower;

  if (lower.startsWith('skills/')) return 'skill';
  if (lower.startsWith('packages/')) return 'package';
  if (lower.startsWith('audit/')) return 'historical';
  if (lower.startsWith('docs/nextshift-os-3/capabilities/')) return 'historical';
  if (lower.startsWith('docs/nextshift-os-3/developer-platform-v1.1/')) return 'historical';
  if (lower.startsWith('docs/nextshift-os-3/developer-platform/review/')) return 'historical';
  if (lower.startsWith('docs/nextshift-os-3/developer-platform/slices/')) return 'historical';
  if (
    lower.startsWith('docs/nextshift-os-3/engineering-playbook-v1.2/') &&
    ![
      'docs/nextshift-os-3/engineering-playbook-v1.2/readme.md',
      'docs/nextshift-os-3/engineering-playbook-v1.2/automation_governance.md',
      'docs/nextshift-os-3/engineering-playbook-v1.2/ai_workflow_governance.md',
      'docs/nextshift-os-3/engineering-playbook-v1.2/git_release_policy.md',
      'docs/nextshift-os-3/engineering-playbook-v1.2/documentation_validation_policy.md',
      'docs/nextshift-os-3/engineering-playbook-v1.2/navigation_consistency_policy.md',
      'docs/nextshift-os-3/engineering-playbook-v1.2/advisory_registry_policy.md',
      'docs/nextshift-os-3/engineering-playbook-v1.2/project_closure_policy.md',
      'docs/nextshift-os-3/engineering-playbook-v1.2/branch_synchronization_policy.md',
      'docs/nextshift-os-3/engineering-playbook-v1.2/governed_automation_workflow.md',
      'docs/nextshift-os-3/engineering-playbook-v1.2/release_strategy.md',
    ].includes(lower)
  ) {
    return 'historical';
  }

  const historicalMarkers = [
    'audit',
    'verification',
    'implementation_report',
    'implementation-report',
    'release_notes',
    'release-notes',
    'release_summary',
    'release-summary',
    'commit_message',
    'commit-message',
    'completion_report',
    'completion-report',
    'evidence',
    'smoke-results',
    'results',
  ];

  if (historicalMarkers.some((marker) => base.includes(marker))) return 'historical';

  const activeMarkers = [
    'readme.md',
    'master_index.md',
    'system_context.md',
    'blueprint_status.md',
    'runtime_status.md',
    'capability_status.md',
    'engineering_playbook.md',
    'engineering_standards.md',
    'project_planning.md',
    'planning.md',
    'governance.md',
    'policy.md',
    'version_authority_policy.md',
  ];

  if (
    lower === 'agents.md' ||
    lower.startsWith('docs/chatgpt-system-context/') ||
    lower.startsWith('docs/nextshift-os-3/') ||
    activeMarkers.some((marker) => base === marker)
  ) {
    return 'active';
  }

  return 'unknown';
}

function readMarkdownFiles(): MarkdownFile[] {
  return shellFindMarkdown().map((path) => {
    const content = readFileSync(path, 'utf8');
    const title = extractTitle(content, path);
    const filename = path.split('/').pop() ?? path;
    return {
      path,
      title,
      normalizedTitle: normalizeTopic(title),
      normalizedPathTopic: normalizeTopic(filename),
      versions: extractVersions(content, path),
      docClass: classify(path),
      status: extractStatus(content),
    };
  });
}

function groupBy(files: MarkdownFile[], getKey: (file: MarkdownFile) => string): TopicGroup[] {
  const groups = new Map<string, MarkdownFile[]>();
  for (const file of files) {
    const key = getKey(file);
    if (!key || key.length < 4) continue;
    groups.set(key, [...(groups.get(key) ?? []), file]);
  }

  return Array.from(groups.entries())
    .map(([key, groupedFiles]) => ({
      key,
      files: groupedFiles.sort((a, b) => a.path.localeCompare(b.path)),
      versions: uniq(groupedFiles.flatMap((file) => file.versions)),
    }))
    .filter((group) => group.files.length > 1)
    .sort((a, b) => b.files.length - a.files.length || a.key.localeCompare(b.key));
}

function getRemoteRefs(): string[] {
  return git(['for-each-ref', '--format=%(refname:short)', 'refs/remotes/origin'])
    .split('\n')
    .filter(Boolean)
    .sort();
}

function fileAtRef(ref: string, path: string): string | undefined {
  try {
    return git(['show', `${ref}:${path}`]);
  } catch {
    return undefined;
  }
}

function canonicalMatrix(refs: string[]) {
  return canonicalPaths.map((path) => {
    const branches = refs.flatMap((ref) => {
      const content = fileAtRef(ref, path);
      if (!content) return [];
      return [{
        ref,
        version: content.match(/^Version:\s*(.+)$/m)?.[1]?.trim() ?? '',
        status: content.match(/^Status:\s*(.+)$/m)?.[1]?.trim() ?? '',
      }];
    });

    return {
      path,
      branches,
      versions: uniq(branches.map((branch) => branch.version).filter(Boolean)),
    };
  }).filter((entry) => entry.branches.length > 0);
}

function workingTreeCanonicalState() {
  return canonicalPaths.flatMap((path) => {
    try {
      const content = readFileSync(path, 'utf8');
      return [{
        path,
        version: content.match(/^Version:\s*(.+)$/m)?.[1]?.trim() ?? '',
        status: content.match(/^Status:\s*(.+)$/m)?.[1]?.trim() ?? '',
      }];
    } catch {
      return [];
    }
  });
}

function branchContains(commit: string): string[] {
  try {
    return git(['branch', '-a', '--contains', commit])
      .split('\n')
      .map((line) => line.replace(/^[*+ ]+/, '').trim())
      .filter(Boolean)
      .sort();
  } catch {
    return [];
  }
}

function isGuardrailLine(line: string): boolean {
  return /supersedes|superseded|retired|historical|baseline|do not|must not|not current|not canonical|not the current|do not create|do not revive|do not suggest|must not be used/i.test(line);
}

function staleAuthorityLines(content: string): string[] {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /Engineering Playbook v1\.(0|1)\b|Engineering Orchestrator v1\.0\b/.test(line))
    .filter((line) => !isGuardrailLine(line));
}

function markdownTable(headers: string[], rows: string[][]): string {
  const escape = (value: string) => value.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
  return [
    `| ${headers.map(escape).join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(escape).join(' | ')} |`),
  ].join('\n');
}

function summarizeGroup(group: TopicGroup): string {
  const files = group.files
    .slice(0, 8)
    .map((file) => `${file.path}${file.versions.length ? ` (${file.versions.join(', ')})` : ''}`)
    .join('<br>');
  const suffix = group.files.length > 8 ? `<br>... ${group.files.length - 8} more` : '';
  return `${files}${suffix}`;
}

function createReport(files: MarkdownFile[], refs: string[]): string {
  const titleGroups = groupBy(files, (file) => file.normalizedTitle);
  const pathGroups = groupBy(files, (file) => file.normalizedPathTopic)
    .filter((group) => !['readme', 'planning', 'implementation report', 'release notes', 'verification'].includes(group.key));

  const versionedTitleGroups = titleGroups.filter((group) => group.versions.length > 1);
  const versionedPathGroups = pathGroups.filter((group) => group.versions.length > 1);
  const activeOldAuthorityRefs = files.filter((file) => {
    if (file.docClass !== 'active') return false;
    if (file.path.includes('/capabilities/')) return false;
    const content = readFileSync(file.path, 'utf8');
    return staleAuthorityLines(content).length > 0;
  });
  const historicalOldAuthorityRefs = files.filter((file) => {
    if (file.docClass !== 'historical') return false;
    const content = readFileSync(file.path, 'utf8');
    return /Engineering Playbook v1\.(0|1)\b/.test(content);
  });

  const matrix = canonicalMatrix(refs);
  const workingTreeMatrix = workingTreeCanonicalState();
  const branchVersionConflicts = matrix.filter((entry) => entry.versions.length > 1);
  const releaseBranches = branchContains('6dec2e4');
  const auditBranches = branchContains('f442e4a');

  const classCounts = ['active', 'historical', 'skill', 'package', 'unknown'].map((docClass) => [
    docClass,
    String(files.filter((file) => file.docClass === docClass).length),
  ]);

  const versionMentionCounts = ['v1.0', 'v1.1', 'v1.2', 'v1.3'].map((version) => [
    version,
    String(files.filter((file) => file.versions.includes(version)).length),
  ]);

  const activeRows = activeOldAuthorityRefs.map((file) => [
    file.path,
    file.versions.join(', ') || '-',
    file.path.includes('chatgpt-system-context') ||
    file.path.includes('docs-hygiene') ||
    file.path === 'docs/nextshift-os-3/engineering/ENGINEERING_PLAYBOOK.md' ||
    file.path === 'AGENTS.md'
      ? 'Keep branch-aware wording; ensure no stale denial remains'
      : 'Update to current authority or mark as historical baseline',
  ]);

  const branchRows = branchVersionConflicts.map((entry) => [
    entry.path,
    entry.versions.join(', '),
    entry.branches.map((branch) => `${branch.ref}: ${branch.version || 'no version'}`).join('<br>'),
  ]);
  const workingTreeRows = workingTreeMatrix
    .filter((entry) => entry.version || entry.status)
    .map((entry) => [entry.path, entry.version || '-', entry.status || '-']);

  const titleRows = versionedTitleGroups.slice(0, 40).map((group) => [
    group.key,
    group.versions.join(', '),
    String(group.files.length),
    summarizeGroup(group),
  ]);

  const pathRows = versionedPathGroups.slice(0, 40).map((group) => [
    group.key,
    group.versions.join(', '),
    String(group.files.length),
    summarizeGroup(group),
  ]);

  const genericRows = titleGroups
    .filter((group) => group.files.length >= 6 && group.versions.length <= 1)
    .slice(0, 30)
    .map((group) => [group.key, String(group.files.length), group.versions.join(', ') || '-', summarizeGroup(group)]);

  return `# Markdown Authority Audit

Generated by \`scripts/audit-markdown-authority.ts\`.

## Summary

${markdownTable(['Metric', 'Value'], [
    ['Markdown files scanned', String(files.length)],
    ['Remote refs scanned', String(refs.length)],
    ['Canonical files with branch version conflicts', String(branchVersionConflicts.length)],
    ['Topic-title groups with multiple versions', String(versionedTitleGroups.length)],
    ['Filename-topic groups with multiple versions', String(versionedPathGroups.length)],
    ['Active files with old engineering authority references', String(activeOldAuthorityRefs.length)],
    ['Historical evidence files preserving old engineering baselines', String(historicalOldAuthorityRefs.length)],
  ])}

## Document Classes

${markdownTable(['Class', 'Files'], classCounts)}

## Version Mentions

${markdownTable(['Version', 'Files mentioning version'], versionMentionCounts)}

## Engineering Playbook v1.2 Evidence

${markdownTable(['Evidence', 'Branches'], [
    ['Release commit 6dec2e4', releaseBranches.join('<br>') || 'Not found'],
    ['Audit commit f442e4a', auditBranches.join('<br>') || 'Not found'],
  ])}

## Working Tree Canonical State

${workingTreeRows.length ? markdownTable(['Canonical file', 'Local version', 'Local status'], workingTreeRows) : 'No local canonical files found.'}

## Canonical Branch Conflicts

${branchRows.length ? markdownTable(['Canonical file', 'Versions found', 'Branch details'], branchRows) : 'No canonical branch version conflicts found.'}

## Active Files Needing Authority Review

These are not historical audit/release/capability evidence files. They should either point to the current authority or explicitly say they are preserving a historical baseline.

${activeRows.length ? markdownTable(['File', 'Versions detected', 'Recommended action'], activeRows) : 'No active stale authority references found.'}

## Historical Evidence With Old Baselines

These files mention older engineering playbook baselines, but they are historical evidence. Do not bulk-replace these references; preserve them unless a document is reclassified as active authority.

${markdownTable(['Metric', 'Value'], [
    ['Historical evidence files mentioning Engineering Playbook v1.0/v1.1', String(historicalOldAuthorityRefs.length)],
    ['Recommended action', 'Keep historical baselines; move behind evidence/archive indexes if needed'],
  ])}

## Duplicate Topics With Multiple Versions

Grouped by normalized first heading.

${titleRows.length ? markdownTable(['Topic', 'Versions', 'Files', 'Examples'], titleRows) : 'No title-level multi-version duplicate topics found.'}

## Duplicate Filenames With Multiple Versions

Grouped by normalized filename.

${pathRows.length ? markdownTable(['Topic', 'Versions', 'Files', 'Examples'], pathRows) : 'No filename-level multi-version duplicate topics found.'}

## High-Volume Same-Topic Groups

These are not necessarily wrong. Most are lifecycle evidence sets that should be retained but moved behind index/navigation boundaries.

${genericRows.length ? markdownTable(['Topic', 'Files', 'Versions', 'Examples'], genericRows) : 'No high-volume same-topic groups found.'}

## Recommended Cleanup Policy

1. Promote the latest approved authority branch into the branch used by new ChatGPT/Codex sessions.
2. Update active docs to reference the latest authority.
3. Preserve old version strings in historical audit, verification, release, and implementation evidence.
4. Move superseded planning/update artifacts behind archive or evidence indexes instead of deleting them.
5. Add this audit script to routine documentation validation before future release commits.
`;
}

const files = readMarkdownFiles();
const refs = getRemoteRefs();
const report = createReport(files, refs);

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, report);
writeFileSync(jsonPath, JSON.stringify({
  generator: 'scripts/audit-markdown-authority.ts',
  files,
  workingTreeCanonicalState: workingTreeCanonicalState(),
  canonicalMatrix: canonicalMatrix(refs),
  engineeringPlaybookEvidence: {
    releaseCommit: '6dec2e4',
    releaseBranches: branchContains('6dec2e4'),
    auditCommit: 'f442e4a',
    auditBranches: branchContains('f442e4a'),
  },
}, null, 2));

console.log(`Wrote ${relative(repoRoot, reportPath)}`);
console.log(`Wrote ${relative(repoRoot, jsonPath)}`);
