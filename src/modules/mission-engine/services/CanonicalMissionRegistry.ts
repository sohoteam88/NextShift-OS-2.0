import { CANONICAL_ROUTES } from '@/config/canonical-routes';
import type {
  DashboardPriority,
  MissionBottleneck,
  MissionAuthorityDefinition,
  MissionType,
} from '../contracts/MissionAuthority';

type CanonicalMissionEntry = {
  missionType: MissionType;
  route: string;
  aliases: string[];
  ctaLabel: string;
  defaultPriority: DashboardPriority;
};

const ENTRIES: CanonicalMissionEntry[] = [
  {
    missionType: 'BRAND',
    route: CANONICAL_ROUTES.brandInterview,
    aliases: [CANONICAL_ROUTES.brandInterview],
    ctaLabel: '开始 AI 访谈',
    defaultPriority: 'Critical',
  },
  {
    missionType: 'POSITIONING',
    route: CANONICAL_ROUTES.brandProfile,
    aliases: [CANONICAL_ROUTES.brandProfile, CANONICAL_ROUTES.brandBuilderProfile],
    ctaLabel: '确认 Brand DNA',
    defaultPriority: 'High',
  },
  {
    missionType: 'CONTENT',
    route: CANONICAL_ROUTES.contentEngine,
    aliases: [CANONICAL_ROUTES.contentEngine],
    ctaLabel: '打开内容引擎',
    defaultPriority: 'High',
  },
  {
    missionType: 'LEAD_MAGNET',
    route: CANONICAL_ROUTES.leadMagnet,
    aliases: [CANONICAL_ROUTES.leadMagnet],
    ctaLabel: '生成引流资源',
    defaultPriority: 'High',
  },
  {
    missionType: 'FUNNEL',
    route: CANONICAL_ROUTES.funnel,
    aliases: [CANONICAL_ROUTES.funnel],
    ctaLabel: '生成双漏斗落地页',
    defaultPriority: 'High',
  },
  {
    missionType: 'TRAFFIC',
    route: CANONICAL_ROUTES.trafficEngine,
    aliases: [CANONICAL_ROUTES.trafficEngine],
    ctaLabel: '启动流量测试',
    defaultPriority: 'High',
  },
  {
    missionType: 'WEBINAR',
    route: CANONICAL_ROUTES.webinarCenter,
    aliases: [CANONICAL_ROUTES.webinarCenter],
    ctaLabel: '生成 Webinar 系统',
    defaultPriority: 'High',
  },
  {
    missionType: 'CUSTOMERS',
    route: CANONICAL_ROUTES.leads,
    aliases: [CANONICAL_ROUTES.leads, CANONICAL_ROUTES.crm, CANONICAL_ROUTES.sales, '/customers'],
    ctaLabel: '处理 Leads',
    defaultPriority: 'High',
  },
  {
    missionType: 'OPTIMIZATION',
    route: CANONICAL_ROUTES.dashboard,
    aliases: [CANONICAL_ROUTES.dashboard],
    ctaLabel: '继续优化系统',
    defaultPriority: 'Normal',
  },
  {
    missionType: 'TEAM',
    route: CANONICAL_ROUTES.teamGrowth,
    aliases: [CANONICAL_ROUTES.teamGrowth, CANONICAL_ROUTES.team, CANONICAL_ROUTES.aiWorkforce],
    ctaLabel: '启动 Team / Workforce',
    defaultPriority: 'Normal',
  },
];

const ENTRY_BY_TYPE = new Map(ENTRIES.map((entry) => [entry.missionType, entry]));
const ENTRY_BY_ROUTE = new Map(
  ENTRIES.flatMap((entry) => entry.aliases.map((route) => [route, entry] as const)),
);

const TYPE_BY_BOTTLENECK: Record<MissionBottleneck, MissionType> = {
  NO_BRAND: 'BRAND',
  NO_POSITIONING: 'POSITIONING',
  NO_CONTENT: 'CONTENT',
  NO_AUDIENCE: 'POSITIONING',
  NO_LEAD_MAGNET: 'LEAD_MAGNET',
  NO_FUNNEL: 'FUNNEL',
  NO_TRAFFIC: 'TRAFFIC',
  NO_LEADS: 'CUSTOMERS',
  NO_CONVERSION: 'CUSTOMERS',
  NO_CUSTOMERS: 'CUSTOMERS',
  NO_RETENTION: 'CUSTOMERS',
  BUSINESS_HEALTHY: 'OPTIMIZATION',
  NO_SYSTEM: 'TEAM',
  NO_TEAM: 'TEAM',
};

const TYPE_BY_COMPLETION_CONDITION: Array<{ condition: string; missionType: MissionType }> = [
  { condition: 'brand_discovery_completed', missionType: 'BRAND' },
  { condition: 'brand_dna_confirmed', missionType: 'POSITIONING' },
  { condition: 'positioning_completed', missionType: 'POSITIONING' },
  { condition: 'first_content_generated', missionType: 'CONTENT' },
  { condition: 'lead_magnet_created', missionType: 'LEAD_MAGNET' },
  { condition: 'funnel_published', missionType: 'FUNNEL' },
  { condition: 'traffic_campaign_launched', missionType: 'TRAFFIC' },
  { condition: 'webinar_deck_generated', missionType: 'WEBINAR' },
  { condition: 'webinar_speaker_script_generated', missionType: 'WEBINAR' },
  { condition: 'whatsapp_followup_configured', missionType: 'CUSTOMERS' },
  { condition: 'crm_setup_completed', missionType: 'CUSTOMERS' },
  { condition: 'first_sale_completed', missionType: 'CUSTOMERS' },
  { condition: 'growth_mode_active', missionType: 'TEAM' },
  { condition: 'delegation_ready', missionType: 'TEAM' },
];

function entryForType(missionType: MissionType) {
  return ENTRY_BY_TYPE.get(missionType) ?? ENTRY_BY_TYPE.get('BRAND')!;
}

function priorityForMission(mission: MissionAuthorityDefinition, fallback: DashboardPriority): DashboardPriority {
  if (mission.priority >= 90) return 'Critical';
  if (mission.priority >= 50) return 'High';
  return fallback;
}

function typeForMission(mission: MissionAuthorityDefinition): MissionType {
  const routeEntry = ENTRY_BY_ROUTE.get(mission.route);
  if (routeEntry) return routeEntry.missionType;

  const conditionEntry = TYPE_BY_COMPLETION_CONDITION.find((entry) => (
    mission.completionConditions.includes(entry.condition)
  ));
  return conditionEntry?.missionType ?? 'BRAND';
}

export const CanonicalMissionRegistry = {
  entries: ENTRIES,

  forRoute(route: string | undefined) {
    if (!route) return null;
    return ENTRY_BY_ROUTE.get(route) ?? null;
  },

  forBottleneck(bottleneck: MissionBottleneck) {
    return entryForType(TYPE_BY_BOTTLENECK[bottleneck]);
  },

  forMission(mission: MissionAuthorityDefinition) {
    return entryForType(typeForMission(mission));
  },

  missionTypeFor(mission: MissionAuthorityDefinition) {
    return typeForMission(mission);
  },

  priorityFor(mission: MissionAuthorityDefinition) {
    return priorityForMission(mission, this.forMission(mission).defaultPriority);
  },

  ctaLabelFor(input: { route?: string; bottleneck?: MissionBottleneck; mission?: MissionAuthorityDefinition }) {
    if (input.bottleneck) return this.forBottleneck(input.bottleneck).ctaLabel;
    if (input.route) return this.forRoute(input.route)?.ctaLabel ?? '开始任务';
    if (input.mission) return this.forMission(input.mission).ctaLabel;
    return '开始任务';
  },
};
