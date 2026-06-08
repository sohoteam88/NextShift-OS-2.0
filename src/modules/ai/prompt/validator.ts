const BLOCKED_PATTERNS_ZH = [
  /月入\d+/,
  /保证.*收入/,
  /躺赚/,
  /轻松赚/,
  /一夜致富/,
  /稳赚/,
  /100%.*效果/,
  /包治/,
  /减.*斤.*天/,
];

const BLOCKED_PATTERNS_EN = [
  /earn.*\$\d+.*month/i,
  /guarantee.*income/i,
  /passive.*income/i,
  /get.*rich.*quick/i,
  /100%.*effective/i,
  /cure.*all/i,
];

export function validateAIOutput(text: string): { valid: boolean; violations: string[] } {
  const violations: string[] = [];

  for (const pattern of [...BLOCKED_PATTERNS_ZH, ...BLOCKED_PATTERNS_EN]) {
    if (pattern.test(text)) {
      violations.push(`Blocked pattern detected: ${pattern.source}`);
    }
  }

  return { valid: violations.length === 0, violations };
}

export function sanitizePromptVariable(input: string): string {
  return input
    .replace(/```/g, '')
    .replace(/\bsystem\b:/gi, 'system:')
    .replace(/\bignore\b.*\binstructions\b/gi, '[filtered]')
    .replace(/\bforget\b.*\bprevious\b/gi, '[filtered]')
    .trim()
    .slice(0, 2000);
}
