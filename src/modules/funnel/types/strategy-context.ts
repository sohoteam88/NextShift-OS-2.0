export interface StrategyContext {
  brand: {
    identity: string;
    story: string;
    personality: string;
    differentiator: string;
    value_proposition: string;
  };
  business: {
    type: string;
    product: string;
    audience: string;
    pain_point: string;
    desired_outcome: string;
    price_range?: string;
  };
  real_material: {
    founder_story?: string;
    case_studies: CaseStudy[];
    common_objections: string[];
    competitors_mentioned?: string;
  };
  strategy: {
    funnel_type: 'landing' | 'quiz' | 'lead_magnet' | 'webinar';
    funnel_type_reason: string;
    primary_angle: 'pain' | 'result' | 'mistake' | 'myth' | 'story' | 'checklist' | 'test' | 'transformation' | 'local' | 'beginner';
    primary_angle_reason: string;
    core_narrative: string;
    biggest_risk: string;
    risk_mitigation: string;
    sequence_length_days: number;
    sequence_length_reason: string;
  };
}

export interface CaseStudy {
  name: string;
  before_state: string;
  process: string;
  after_result: string;
}
