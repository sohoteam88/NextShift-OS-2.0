import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import prisma from '@/lib/prisma';
import { contentHash } from '@/lib/content-library-contracts';

export type ContentDraftForHygiene = {
  id: string;
  ownerId: string;
  platform: string | null;
  type: string;
  title: string | null;
  body: string;
  status: string;
  updatedAt: Date;
};

export type DuplicateDraftGroup = {
  ownerId: string;
  platform: string | null;
  type: string;
  hash: string;
  retainedId: string;
  deleteIds: string[];
};

export function findDuplicateDraftGroups(records: ContentDraftForHygiene[]): DuplicateDraftGroup[] {
  const grouped = new Map<string, ContentDraftForHygiene[]>();

  for (const record of records) {
    if (record.status !== 'draft') continue;
    const hash = contentHash(record.title, record.body);
    const key = JSON.stringify([record.ownerId, record.platform, record.type, hash]);
    const group = grouped.get(key) ?? [];
    group.push(record);
    grouped.set(key, group);
  }

  return Array.from(grouped.values())
    .filter((group) => group.length > 1)
    .map((group) => {
      const sorted = [...group].sort(
        (left, right) =>
          right.updatedAt.getTime() - left.updatedAt.getTime() || right.id.localeCompare(left.id),
      );
      const retained = sorted[0];
      return {
        ownerId: retained.ownerId,
        platform: retained.platform,
        type: retained.type,
        hash: contentHash(retained.title, retained.body),
        retainedId: retained.id,
        deleteIds: sorted.slice(1).map((record) => record.id),
      };
    });
}

export function summarizeDuplicateDraftGroups(
  records: ContentDraftForHygiene[],
  groups: DuplicateDraftGroup[],
) {
  return {
    scanned: records.length,
    duplicateGroups: groups.length,
    pendingDeletion: groups.reduce((total, group) => total + group.deleteIds.length, 0),
  };
}

async function main() {
  const apply = process.argv.includes('--apply');
  const records = await prisma.content.findMany({
    where: { status: 'draft' },
    select: {
      id: true,
      ownerId: true,
      platform: true,
      type: true,
      title: true,
      body: true,
      status: true,
      updatedAt: true,
    },
  });
  const groups = findDuplicateDraftGroups(records);
  const summary = summarizeDuplicateDraftGroups(records, groups);

  for (const group of groups) {
    console.log(
      `duplicate owner=${group.ownerId} platform=${group.platform ?? 'none'} type=${group.type} hash=${group.hash.slice(0, 12)} retain=${group.retainedId} delete=${group.deleteIds.length}`,
    );
  }

  let deleted = 0;
  if (apply && summary.pendingDeletion > 0) {
    const result = await prisma.content.deleteMany({
      where: {
        id: { in: groups.flatMap((group) => group.deleteIds) },
        status: 'draft',
      },
    });
    deleted = result.count;
  }

  console.log(
    `content draft hygiene: mode=${apply ? 'apply' : 'dry-run'} scanned=${summary.scanned} duplicateGroups=${summary.duplicateGroups} pendingDeletion=${summary.pendingDeletion} deleted=${deleted}`,
  );
}

const entrypoint = process.argv[1];
if (entrypoint && import.meta.url === pathToFileURL(resolve(entrypoint)).href) {
  void main()
    .catch((error: unknown) => {
      console.error('content draft hygiene failed', error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
