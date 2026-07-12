import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const sourceRoot = join(process.cwd(), 'src');
const sourceFiles = [];

async function collectFiles(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await collectFiles(path);
    else if (/\.(tsx|jsx)$/.test(entry.name)) sourceFiles.push(path);
  }
}

function classNameSegments(source) {
  return [...source.matchAll(/className\s*=\s*(?:"([\s\S]*?)"|'([\s\S]*?)'|\{([\s\S]{0,1200}?)\})/g)]
    .map((match) => match[1] ?? match[2] ?? match[3] ?? '');
}

function componentDeclarations(source, suffix) {
  return [...source.matchAll(new RegExp(`(?:export\\s+)?(?:function|const)\\s+([A-Za-z0-9_]*${suffix})\\b`, 'g'))]
    .map((match) => match[1]);
}

await collectFiles(sourceRoot);

let arbitraryValueCount = 0;
const customButtons = [];
const customCards = [];

for (const file of sourceFiles) {
  const source = await readFile(file, 'utf8');
  const relativeFile = relative(process.cwd(), file);
  const segments = classNameSegments(source);

  arbitraryValueCount += segments.reduce(
    (total, segment) => total + (segment.match(/(?:^|[\s'"`])[!\w-]*\[[^\]\r\n]+\]/g)?.length ?? 0),
    0,
  );

  if (relativeFile.startsWith('src/components/ui/')) continue;

  for (const name of componentDeclarations(source, 'Button')) {
    if (/<button\b/.test(source)) customButtons.push(`${relativeFile}:${name}`);
  }

  for (const name of componentDeclarations(source, 'Card')) {
    if (/className\s*=\s*[\s\S]{0,1200}(?:rounded|border|shadow)/.test(source)) {
      customCards.push(`${relativeFile}:${name}`);
    }
  }
}

console.log(`arbitrary_classname_values=${arbitraryValueCount}`);
console.log(`custom_button_implementations=${customButtons.length}`);
console.log(`custom_card_implementations=${customCards.length}`);
console.log('\nCustom Button implementations:');
console.log(customButtons.join('\n') || '(none)');
console.log('\nCustom Card implementations:');
console.log(customCards.join('\n') || '(none)');
