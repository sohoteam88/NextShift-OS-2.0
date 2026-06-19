import type { GrowthSignal } from './GrowthSignal';

export type ExpansionPath =
  | 'upgrade'
  | 'team_growth'
  | 'franchise'
  | 'automation'
  | 'platform_growth'
  | 'replication';

export interface ExpansionOpportunity {
  id: string;
  path: ExpansionPath;
  title: string;
  expectedImpact: string;
  route?: string;
}

export interface ExpansionSignal extends GrowthSignal {
  domain: 'expansion';
  paths: ExpansionPath[];
  opportunities: ExpansionOpportunity[];
  teamSize?: number;
  customerCount?: number;
  revenuePotentialScore?: number;
}
