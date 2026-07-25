import { getComplianceRewriteRules } from '../business-pack';
import type {
  ComplianceField,
  ComplianceFields,
  ComplianceVerdict,
  EnforceComplianceHardFilterOptions,
  Violation,
} from './types';

/**
 * These are output-only, reject-and-regenerate patterns. They are deliberately
 * centralized here rather than embedded in prompts: prompts guide a model,
 * while this gate is the enforceable public-output contract.
 */
const INCOME_PROMISE_PATTERNS: RegExp[] = [
  /(?:月入|日入)\s*(?:RM\s*[\d,.]+|\d+(?:\.\d+)?\s*(?:千|万|k))/i,
  /(?:保证收入|包赚|保证赚|稳赚(?:不赔)?|guaranteed\s+income)/i,
];

// Matches the business pack's public `allowed-verbs` red-line: use support
// language (促进／帮助／支持／维持／有助于), never medical or guaranteed-result claims.
// Known trade-off: exclude the three common prefixes 政／自／法, not every safe combination; the
// occasional false positive costs one extra retry, which is acceptable for the public gate.
const MEDICAL_CLAIM_PATTERN = /(?:(?<![政自法])治(?!理)|降三高|减肥药|保证瘦|\b(?:cure|cures|curing|guaranteed\s+weight\s+loss)\b)/i;
const WEIGHT_NUMBER_PATTERN = /(?:瘦|减(?:重|脂)?|掉)\s*\d+(?:\s*(?:[-~至到]\s*\d+))?\s*(?:公斤|kg|斤)/i;
const PUBLIC_PRICE_PATTERN = /RM\s*[\d,]+/i;

const BARE_BRAND_PATTERN = /(?:\bherbalife\b|贺宝芙|康宝莱)/gi;
const PRODUCT_TRADEMARK_PATTERN = /(?:\bformula\s*1\b|\bn-?r-?g\b|\baloe\s+concentrate\b)/gi;
const SAFE_GENERIC_PRODUCT_TERM = '健康管理方案';

const FIELD_NAMES: ComplianceField[] = ['title', 'hook', 'body', 'cta', 'hashtags'];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function forEveryPublicText(
  fields: ComplianceFields,
  onText: (field: ComplianceField, text: string) => void,
): void {
  for (const field of FIELD_NAMES) {
    if (field === 'hashtags') {
      fields.hashtags.forEach((hashtag) => onText(field, hashtag));
    } else {
      onText(field, fields[field]);
    }
  }
}

function findRejectedViolations(fields: ComplianceFields): Violation[] {
  const violations: Violation[] = [];

  forEveryPublicText(fields, (field, text) => {
    for (const pattern of INCOME_PROMISE_PATTERNS) {
      const match = text.match(pattern)?.[0];
      if (match) {
        violations.push({
          code: 'income_promise',
          field,
          match,
          message: 'Public content cannot make income promises.',
        });
      }
    }

    const medicalMatch = text.match(MEDICAL_CLAIM_PATTERN)?.[0];
    if (medicalMatch) {
      violations.push({
        code: 'medical_claim',
        field,
        match: medicalMatch,
        message: 'Public content cannot make medical or guaranteed-result claims.',
      });
    }

    const weightMatch = text.match(WEIGHT_NUMBER_PATTERN)?.[0];
    if (weightMatch) {
      violations.push({
        code: 'weight_claim',
        field,
        match: weightMatch,
        message: 'Public content cannot promise specific weight-loss numbers.',
      });
    }

    const publicPriceMatch = text.match(PUBLIC_PRICE_PATTERN)?.[0];
    if (publicPriceMatch) {
      violations.push({
        code: 'public_price',
        field,
        match: publicPriceMatch,
        message: 'Public content cannot display price; price is private-visibility only.',
      });
    }
  });

  return violations;
}

function rewriteText(
  text: string,
  rewriteRules: Array<{ internalTerm: string; publicTerm: string }>,
  field: ComplianceField,
  rewrites: Violation[],
): string {
  let rewritten = text;

  // Longest first prevents a broad term from swallowing a more-specific term.
  for (const rule of [...rewriteRules].sort((a, b) => b.internalTerm.length - a.internalTerm.length)) {
    const pattern = new RegExp(escapeRegExp(rule.internalTerm), 'gi');
    rewritten = rewritten.replace(pattern, (match) => {
      rewrites.push({
        code: 'brand_hidden',
        field,
        match,
        message: `Rewritten to public term: ${rule.publicTerm}`,
      });
      return rule.publicTerm;
    });
  }

  // A model can return a bare brand or trademark that has no explicit
  // substitution-table row. Preserve the zero-brand public contract with a
  // generic public term, while retaining the visible audit violation.
  for (const pattern of [BARE_BRAND_PATTERN, PRODUCT_TRADEMARK_PATTERN]) {
    rewritten = rewritten.replace(pattern, (match) => {
      rewrites.push({
        code: 'brand_residual_rewritten',
        field,
        match,
        message: 'Unmapped brand/trademark replaced with a public generic term.',
      });
      return SAFE_GENERIC_PRODUCT_TERM;
    });
  }

  return rewritten;
}

/**
 * Pure public-output gate shared by every generation consumer. It has no
 * provider, database, or file-system dependency; business-pack access is via
 * its public, public-only barrel API.
 */
export function enforceComplianceHardFilter(
  options: EnforceComplianceHardFilterOptions,
): ComplianceVerdict {
  const rejected = findRejectedViolations(options.fields);
  if (rejected.length > 0) {
    return { status: 'rejected', violations: rejected };
  }

  const { rewriteRules } = getComplianceRewriteRules({ track: options.track });
  const rewrites: Violation[] = [];
  const fields: ComplianceFields = {
    title: rewriteText(options.fields.title, rewriteRules, 'title', rewrites),
    hook: rewriteText(options.fields.hook, rewriteRules, 'hook', rewrites),
    body: rewriteText(options.fields.body, rewriteRules, 'body', rewrites),
    cta: rewriteText(options.fields.cta, rewriteRules, 'cta', rewrites),
    hashtags: options.fields.hashtags.map((hashtag) => rewriteText(hashtag, rewriteRules, 'hashtags', rewrites)),
  };

  return rewrites.length > 0
    ? { status: 'rewritten', fields, rewrites }
    : { status: 'clean', fields };
}
