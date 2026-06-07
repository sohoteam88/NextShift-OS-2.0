import zh from '../src/messages/zh.json';
import en from '../src/messages/en.json';
import ms from '../src/messages/ms.json';

type Messages = Record<string, unknown>;

function flattenKeys(obj: Messages, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const next = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return flattenKeys(value as Messages, next);
    }
    return [next];
  });
}

function report(name: string, keys: Set<string>, missing: string[], orphaned: string[]) {
  console.log(`${name}: ${keys.size} keys (${missing.length} missing, ${orphaned.length} orphaned)`);
}

const zhKeys = new Set(flattenKeys(zh as Messages));
const enKeys = new Set(flattenKeys(en as Messages));
const msKeys = new Set(flattenKeys(ms as Messages));

const missingEn = [...zhKeys].filter((key) => !enKeys.has(key));
const missingMs = [...zhKeys].filter((key) => !msKeys.has(key));
const orphanedEn = [...enKeys].filter((key) => !zhKeys.has(key));
const orphanedMs = [...msKeys].filter((key) => !zhKeys.has(key));

report('zh', zhKeys, [], []);
report('en', enKeys, missingEn, orphanedEn);
report('ms', msKeys, missingMs, orphanedMs);

if (missingEn.length) {
  console.log('\nMissing in en:');
  console.log(missingEn.join('\n'));
}

if (missingMs.length) {
  console.log('\nMissing in ms:');
  console.log(missingMs.join('\n'));
}

if (orphanedEn.length) {
  console.log('\nOrphaned in en:');
  console.log(orphanedEn.join('\n'));
}

if (orphanedMs.length) {
  console.log('\nOrphaned in ms:');
  console.log(orphanedMs.join('\n'));
}
