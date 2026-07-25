export type ComplianceTrack = 'retail' | 'recruitment';

/** All fields that can be returned to a public content destination. */
export interface ComplianceFields {
  title: string;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
}

export type ComplianceField = keyof ComplianceFields;

export type ViolationCode =
  | 'brand_hidden'
  | 'brand_residual_rewritten'
  | 'income_promise'
  | 'medical_claim'
  | 'weight_claim'
  | 'public_price';

export interface Violation {
  code: ViolationCode;
  field: ComplianceField;
  match: string;
  message: string;
}

export type ComplianceVerdict =
  | { status: 'clean'; fields: ComplianceFields }
  | { status: 'rewritten'; fields: ComplianceFields; rewrites: Violation[] }
  | { status: 'rejected'; violations: Violation[] };

export interface EnforceComplianceHardFilterOptions {
  fields: ComplianceFields;
  track: ComplianceTrack;
}
