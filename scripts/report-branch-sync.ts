import { execFileSync } from 'node:child_process';

const rootDir = process.cwd();

function git(args: string[]): string {
  try {
    return execFileSync('git', args, { cwd: rootDir, encoding: 'utf8' }).trim();
  } catch {
    return 'unavailable';
  }
}

function main() {
  const branch = git(['branch', '--show-current']);
  const head = git(['rev-parse', '--short', 'HEAD']);
  const upstream = git(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
  const latestCommit = git(['log', '--oneline', '-1']);
  const branchStatus = git(['status', '--branch', '--short']);
  const workingTreeStatus = git(['status', '--short']);

  console.log('# Branch Synchronization Report');
  console.log('');
  console.log(`Branch: \`${branch}\``);
  console.log('');
  console.log(`HEAD: \`${head}\``);
  console.log('');
  console.log(`Upstream: \`${upstream}\``);
  console.log('');
  console.log('## Latest Commit');
  console.log('');
  console.log('```text');
  console.log(latestCommit);
  console.log('```');
  console.log('');
  console.log('## Branch Status');
  console.log('');
  console.log('```text');
  console.log(branchStatus || 'clean');
  console.log('```');
  console.log('');
  console.log('## Working Tree Status');
  console.log('');
  console.log('```text');
  console.log(workingTreeStatus || 'clean');
  console.log('```');
}

main();
