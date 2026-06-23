import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

function readDotEnvValue(name: string) {
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    if (!line.startsWith(`${name}=`)) continue;
    const raw = line.slice(name.length + 1).trim();
    return raw.replace(/^"|"$/g, '');
  }
  return '';
}

const email = process.argv[2];
if (!email) {
  throw new Error('Usage: tsx scripts/auth-user-status.ts <email>');
}

process.env.DATABASE_URL ||= readDotEnvValue('DATABASE_URL');
process.env.DIRECT_URL ||= readDotEnvValue('DIRECT_URL');

async function main() {
  const prisma = new PrismaClient();
  const rows = await prisma.$queryRaw<
    Array<{ id: string; email: string; email_confirmed_at: Date | null; confirmed_at: Date | null; created_at: Date }>
  >`
    select id, email, email_confirmed_at, confirmed_at, created_at
    from auth.users
    where lower(email) = lower(${email})
    order by created_at desc
    limit 3
  `;

  console.log(JSON.stringify(rows, null, 2));
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
