import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const INDEX_FILE = path.join(process.cwd(), 'docs/nextshift-os-3/MASTER_INDEX.md');
const ORDERED_LINK_PATTERN = /^(\d+)\. (\[.+\]\(.+\))$/;

const content = readFileSync(INDEX_FILE, 'utf8');
let nextNumber = 1;

const renumbered = content
  .split('\n')
  .map((line) => {
    const match = line.match(ORDERED_LINK_PATTERN);
    if (!match) return line;

    return `${nextNumber++}. ${match[2]}`;
  })
  .join('\n');

writeFileSync(INDEX_FILE, renumbered);
console.log(`Renumbered ${nextNumber - 1} MASTER_INDEX entries.`);
