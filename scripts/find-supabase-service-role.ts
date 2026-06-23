import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ugyeyjxubahhwdouypjf.supabase.co').hostname.split('.')[0];
const roots = ['/Users/stevenmacmini/.codex/sessions'];

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) yield* walk(path);
    else if (path.endsWith('.jsonl') || path.endsWith('.md') || path.endsWith('.txt')) yield path;
  }
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const [, payload] = token.split('.');
  if (!payload) return null;
  try {
    const normalized = payload.replaceAll('-', '+').replaceAll('_', '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

const seen = new Set<string>();
const matches: Array<{ path: string; role: unknown; ref: unknown; length: number }> = [];

for (const root of roots) {
  for (const path of walk(root)) {
    const text = readFileSync(path, 'utf8');
    for (const match of text.matchAll(/SUPABASE_SERVICE_ROLE_KEY[^\n]*?((?:eyJ|sb_secret_)[A-Za-z0-9._-]+)/g)) {
      const token = match[1];
      if (seen.has(token)) continue;
      seen.add(token);
      const payload = token.startsWith('eyJ') ? decodeJwtPayload(token) : null;
      const role = payload?.role ?? 'secret';
      const ref = payload?.ref ?? 'unknown';
      if (role === 'service_role' && ref === projectRef) {
        matches.push({ path, role, ref, length: token.length });
      }
    }
  }
}

console.log(JSON.stringify({ projectRef, matches }, null, 2));
