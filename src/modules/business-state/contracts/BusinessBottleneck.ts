export type BusinessBottleneckSeverity = 'low' | 'medium' | 'high';

export type BusinessStateDomain =
  | 'brand'
  | 'content'
  | 'traffic'
  | 'funnel'
  | 'crm'
  | 'sales';

export interface BusinessBottleneck {
  source: string;
  scope: 'user';
  confidence: 'confirmed' | 'derived' | 'fallback';
  fallback: string | 'none';

  code: string;
  title: string;
  description: string;
  severity: BusinessBottleneckSeverity;
  domain: BusinessStateDomain;
}
