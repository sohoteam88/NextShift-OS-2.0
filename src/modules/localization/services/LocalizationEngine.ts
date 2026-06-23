import type { AgentAssetType } from '@/modules/mission-workspace/services/MissionAgentAssistanceService';

export type ProductLocale = 'en' | 'zh' | 'ms';

export type LocalizedText = {
  key: string;
  locale: ProductLocale;
  value: string;
};

export type LocalizationSource = 'registry' | 'fallback' | 'missing';

export type LocalizedValue = LocalizedText & {
  translationSource: LocalizationSource;
  fallbackUsed: boolean;
  missingKey?: string;
};

export type LocaleResolutionInput = {
  userPreference?: string | null;
  tenantLocale?: string | null;
  browserLocale?: string | null;
  systemDefault?: string | null;
};

export type LocaleResolution = {
  locale: ProductLocale;
  source: 'userPreference' | 'tenantSetting' | 'browserLocale' | 'systemDefault';
  fallbackUsed: boolean;
};

export type LocalizedGeneratedAsset = {
  locale: ProductLocale;
  title: string;
  content: string;
  preview: string;
  translationSource: LocalizationSource;
  fallbackUsed: boolean;
};

const DEFAULT_LOCALE: ProductLocale = 'en';

const FALLBACK_TEXT: Record<ProductLocale, string> = {
  en: 'Text unavailable',
  zh: '内容暂时不可用',
  ms: 'Teks belum tersedia',
};

const LOCALIZATION_REGISTRY = {
  'dashboard.currentGoal': {
    en: 'Current Goal',
    zh: '当前目标',
    ms: 'Matlamat Semasa',
  },
  'dashboard.mission': {
    en: 'Mission',
    zh: '任务',
    ms: 'Misi',
  },
  'dashboard.verificationStatus': {
    en: 'Verification Status',
    zh: '验证状态',
    ms: 'Status Pengesahan',
  },
  'workspace.objective': {
    en: 'Objective',
    zh: '目标',
    ms: 'Objektif',
  },
  'workspace.description': {
    en: 'Description',
    zh: '说明',
    ms: 'Penerangan',
  },
  'workspace.steps': {
    en: 'Steps',
    zh: '步骤',
    ms: 'Langkah',
  },
  'workspace.assets': {
    en: 'Assets',
    zh: '资产',
    ms: 'Aset',
  },
  'workspace.verification': {
    en: 'Verification',
    zh: '验证',
    ms: 'Pengesahan',
  },
  'outcome.firstLead': {
    en: 'Acquire First Lead',
    zh: '获得第一位潜在客户',
    ms: 'Dapatkan Prospek Pertama',
  },
  'outcome.firstCustomer': {
    en: 'Acquire First Customer',
    zh: '获得第一位客户',
    ms: 'Dapatkan Pelanggan Pertama',
  },
  'notification.missionCompleted': {
    en: 'Mission completed',
    zh: '任务已完成',
    ms: 'Misi selesai',
  },
  'notification.assetApproved': {
    en: 'Asset approved',
    zh: '资产已批准',
    ms: 'Aset diluluskan',
  },
  'notification.verificationPassed': {
    en: 'Verification passed',
    zh: '验证已通过',
    ms: 'Pengesahan lulus',
  },
  'notification.approvalRequired': {
    en: 'Approval required',
    zh: '需要批准',
    ms: 'Kelulusan diperlukan',
  },
  'error.invalidLogin': {
    en: 'Invalid login credentials',
    zh: '登录信息无效',
    ms: 'Maklumat log masuk tidak sah',
  },
  'error.missionFailed': {
    en: 'Mission failed',
    zh: '任务失败',
    ms: 'Misi gagal',
  },
  'error.verificationError': {
    en: 'Verification error',
    zh: '验证错误',
    ms: 'Ralat pengesahan',
  },
  'error.approvalExpired': {
    en: 'Approval expired',
    zh: '批准已过期',
    ms: 'Kelulusan telah tamat tempoh',
  },
  'asset.generatedDescription': {
    en: '{agent} created a draft asset for this mission. Asset approval assists execution and does not complete the mission.',
    zh: '{agent} 已为此任务创建资产草稿。批准资产只协助执行，不会完成任务。',
    ms: '{agent} telah mencipta draf aset untuk misi ini. Kelulusan aset membantu pelaksanaan dan tidak melengkapkan misi.',
  },
  'activation.state.active': {
    en: 'Active',
    zh: '进行中',
    ms: 'Dalam Proses',
  },
  'activation.state.onTrack': {
    en: 'On track',
    zh: '进行中',
    ms: 'Dalam Proses',
  },
  'activation.state.atRisk': {
    en: 'At risk',
    zh: '存在风险',
    ms: 'Berisiko',
  },
  'activation.state.droppedOff': {
    en: 'Dropped off',
    zh: '已流失',
    ms: 'Tergendala',
  },
  'activation.state.activated': {
    en: 'Activated',
    zh: '已激活',
    ms: 'Diaktifkan',
  },
  'activation.step.accountCreated': {
    en: 'Account created',
    zh: '账号已创建',
    ms: 'Akaun telah dicipta',
  },
  'activation.step.interviewStarted': {
    en: 'Start brand interview',
    zh: '开始品牌访谈',
    ms: 'Mulakan temu bual jenama',
  },
  'activation.step.interviewCompleted': {
    en: 'Complete brand interview',
    zh: '完成品牌访谈',
    ms: 'Lengkapkan temu bual jenama',
  },
  'activation.step.brandDnaGenerated': {
    en: 'Generate Brand DNA',
    zh: '生成品牌 DNA',
    ms: 'Hasilkan DNA Jenama',
  },
  'activation.step.firstContentGenerated': {
    en: 'Generate first content',
    zh: '生成第一篇内容',
    ms: 'Hasilkan kandungan pertama',
  },
  'activation.step.firstLeadCaptured': {
    en: 'Capture first lead',
    zh: '获得第一位潜在客户',
    ms: 'Dapatkan prospek pertama',
  },
  'activation.funnel.signup': {
    en: 'Sign up',
    zh: '完成注册',
    ms: 'Daftar akaun',
  },
  'activation.funnel.aiInterview': {
    en: 'Complete AI interview',
    zh: '完成 AI 访谈',
    ms: 'Lengkapkan Temu Bual AI',
  },
  'activation.funnel.businessAnalysis': {
    en: 'Review business analysis',
    zh: '查看业务分析',
    ms: 'Semak analisis bisnes',
  },
  'activation.funnel.firstMission': {
    en: 'Start first mission',
    zh: '开始第一个任务',
    ms: 'Mulakan Misi Pertama',
  },
  'activation.funnel.firstAsset': {
    en: 'Generate first asset',
    zh: '生成第一个资产',
    ms: 'Hasilkan Aset Pertama',
  },
  'activation.funnel.firstOutcome': {
    en: 'Reach first outcome',
    zh: '达成第一个结果',
    ms: 'Capai hasil pertama',
  },
  'activation.funnel.activated': {
    en: 'Activated',
    zh: '已激活',
    ms: 'Diaktifkan',
  },
  'activation.success.accountCreated': {
    en: 'Account created',
    zh: '账号已创建',
    ms: 'Akaun telah dicipta',
  },
  'activation.success.interviewCompleted': {
    en: 'Interview completed',
    zh: '访谈已完成',
    ms: 'Temu bual selesai',
  },
  'activation.success.businessStateGenerated': {
    en: 'Business state generated',
    zh: '业务状态已生成',
    ms: 'Status bisnes telah dijana',
  },
  'activation.success.missionStarted': {
    en: 'Mission started',
    zh: '任务已开始',
    ms: 'Misi telah dimulakan',
  },
  'activation.success.assetGenerated': {
    en: 'Asset generated',
    zh: '资产已生成',
    ms: 'Aset telah dijana',
  },
  'activation.success.outcomeVerified': {
    en: 'Outcome verified',
    zh: '结果已验证',
    ms: 'Hasil telah disahkan',
  },
  'activation.success.valueRealized': {
    en: 'Value realized',
    zh: '价值已实现',
    ms: 'Nilai telah dicapai',
  },
  'activation.firstValue.none': {
    en: 'No first value yet',
    zh: '还没有第一个成果',
    ms: 'Belum ada nilai pertama',
  },
  'activation.firstValue.firstAsset': {
    en: 'First asset generated',
    zh: '已生成你的第一个资产',
    ms: 'Aset pertama anda telah dijana',
  },
  'activation.firstValue.firstContent': {
    en: 'First content generated',
    zh: '已生成你的第一篇内容',
    ms: 'Kandungan pertama anda telah dijana',
  },
  'activation.firstValue.firstFunnel': {
    en: 'First funnel created',
    zh: '已创建你的第一个漏斗',
    ms: 'Funnel pertama anda telah dicipta',
  },
  'activation.firstValue.firstLead': {
    en: 'First lead captured',
    zh: '已获得你的第一位潜在客户',
    ms: 'Prospek pertama anda telah diperoleh',
  },
  'activation.firstValue.firstOutcome': {
    en: 'First outcome verified',
    zh: '已验证你的第一个业务结果',
    ms: 'Hasil bisnes pertama anda telah disahkan',
  },
  'activation.firstValue.generateFirstAsset': {
    en: 'Generate your first useful asset',
    zh: '生成你的第一个可用资产',
    ms: 'Hasilkan aset berguna pertama anda',
  },
  'activation.firstUser.headline.new': {
    en: 'Answer a few questions and we will give you a clear first step.',
    zh: '先回答几个问题，我们会给你一个清楚的第一步。',
    ms: 'Jawab beberapa soalan dan kami akan berikan langkah pertama yang jelas.',
  },
  'activation.firstUser.headline.onboarding': {
    en: 'Complete the interview to unlock your first recommended mission.',
    zh: '完成访谈后，你会看到第一个推荐任务。',
    ms: 'Lengkapkan temu bual untuk membuka misi cadangan pertama anda.',
  },
  'activation.firstUser.headline.active': {
    en: 'Your next step is ready.',
    zh: '你的下一步已经准备好。',
    ms: 'Langkah seterusnya anda sudah tersedia.',
  },
  'activation.firstUser.headline.valueRealized': {
    en: 'You already have your first usable result.',
    zh: '你已经拿到第一个可用成果。',
    ms: 'Anda sudah mendapat hasil berguna pertama.',
  },
  'activation.firstUser.headline.retained': {
    en: 'Keep moving toward the next business result.',
    zh: '继续推进下一个业务结果。',
    ms: 'Teruskan menuju hasil bisnes seterusnya.',
  },
  'activation.firstUser.empty.generateFirstAsset': {
    en: 'Generate first asset',
    zh: '生成第一个资产',
    ms: 'Hasilkan aset pertama',
  },
  'activation.currentMission.accountCreated.description': {
    en: 'Your account is ready. Start the brand interview next.',
    zh: '账号已经创建，下一步是开始品牌访谈。',
    ms: 'Akaun anda sudah tersedia. Seterusnya, mulakan temu bual jenama.',
  },
  'activation.currentMission.interviewStarted.description': {
    en: 'Spend a few minutes helping AI understand your story, goals, and audience.',
    zh: '用几分钟让 AI 了解你的故事、目标和受众。',
    ms: 'Luangkan beberapa minit untuk membantu AI memahami cerita, matlamat dan audiens anda.',
  },
  'activation.currentMission.interviewCompleted.description': {
    en: 'Turn the interview into clear Brand DNA.',
    zh: '把访谈内容转换成清楚的品牌 DNA。',
    ms: 'Tukar temu bual kepada DNA Jenama yang jelas.',
  },
  'activation.currentMission.brandDnaGenerated.description': {
    en: 'Use your Brand DNA to generate the first publishable content.',
    zh: '用品牌 DNA 生成第一篇可以发布的内容。',
    ms: 'Gunakan DNA Jenama anda untuk menghasilkan kandungan pertama yang boleh diterbitkan.',
  },
  'activation.currentMission.firstContentGenerated.description': {
    en: 'Connect the first content to a lead magnet and start collecting leads.',
    zh: '用第一篇内容连接到引流磁铁，开始收集潜在客户。',
    ms: 'Sambungkan kandungan pertama kepada lead magnet dan mula mengumpul prospek.',
  },
  'activation.currentMission.firstLeadCaptured.description': {
    en: 'Your first lead is captured. Move into follow-up and conversion.',
    zh: '你已经获得第一位潜在客户，可以进入跟进和转化。',
    ms: 'Prospek pertama anda telah diperoleh. Teruskan kepada susulan dan penukaran.',
  },
  'activation.currentMission.startInterview': {
    en: 'Start interview',
    zh: '开始访谈',
    ms: 'Mulakan temu bual',
  },
  'activation.currentMission.continueActivation': {
    en: 'Continue activation',
    zh: '继续激活',
    ms: 'Teruskan pengaktifan',
  },
  'activation.currentMission.viewLeads': {
    en: 'View leads',
    zh: '查看潜在客户',
    ms: 'Lihat prospek',
  },
  'activation.intervention.atRisk': {
    en: 'You are still on track, with {hours} hours left for this activation step.',
    zh: '你仍在进度内，这个激活步骤还剩 {hours} 小时。',
    ms: 'Anda masih dalam jadual, dengan {hours} jam lagi untuk langkah pengaktifan ini.',
  },
  'activation.intervention.interviewDropoff': {
    en: 'Finish the AI interview so we can generate your first mission.',
    zh: '完成 AI 访谈，我们就能生成你的第一个任务。',
    ms: 'Lengkapkan temu bual AI supaya kami boleh menjana misi pertama anda.',
  },
  'activation.intervention.firstMissionDropoff': {
    en: 'Start your first mission to reach the first useful result.',
    zh: '开始第一个任务，拿到第一个可用成果。',
    ms: 'Mulakan misi pertama anda untuk mencapai hasil berguna pertama.',
  },
  'activation.intervention.firstAssetReviewDropoff': {
    en: 'Review the generated asset and approve the next step.',
    zh: '查看已生成的资产，并批准下一步。',
    ms: 'Semak aset yang dijana dan luluskan langkah seterusnya.',
  },
  'activation.intervention.firstOutcomeDropoff': {
    en: 'Use the next AI COO recommendation to turn the asset into a real business outcome.',
    zh: '使用下一条 AI COO 建议，把资产转成真实业务结果。',
    ms: 'Gunakan cadangan AI COO seterusnya untuk menukar aset kepada hasil bisnes sebenar.',
  },
  'activation.intervention.resumeProgress': {
    en: 'Continue activation to generate the first visible business asset.',
    zh: '继续完成激活，生成第一个可见的业务资产。',
    ms: 'Teruskan pengaktifan untuk menghasilkan aset bisnes pertama yang jelas.',
  },
  'activation.recovery.paused': {
    en: 'Your progress has paused for a while. Continue the current step to resume progress.',
    zh: '你的进度已经暂停一段时间。继续完成当前步骤即可恢复进度。',
    ms: 'Kemajuan anda telah terhenti buat sementara waktu. Sambung langkah semasa untuk meneruskan kemajuan.',
  },
  'activation.success.missionStartedMessage': {
    en: 'Your first mission has started.',
    zh: '你的第一个任务已开始。',
    ms: 'Misi pertama anda telah dimulakan.',
  },
  'activation.success.assetGeneratedMessage': {
    en: 'Your first asset has been generated.',
    zh: '你的第一个资产已生成。',
    ms: 'Aset pertama anda telah dijana.',
  },
  'activation.success.outcomeAchievedMessage': {
    en: 'Your first business outcome has been achieved.',
    zh: '你的第一个业务结果已达成。',
    ms: 'Hasil bisnes pertama anda telah dicapai.',
  },
  'activation.success.activationCompletedMessage': {
    en: 'Activation completed.',
    zh: '激活已完成。',
    ms: 'Pengaktifan selesai.',
  },
  'activation.risk.atRiskTitle': {
    en: 'Activation at risk',
    zh: '激活存在风险',
    ms: 'Pengaktifan berisiko',
  },
  'activation.risk.droppedOffTitle': {
    en: 'Activation dropped off',
    zh: '激活已流失',
    ms: 'Pengaktifan tergendala',
  },
  'activation.risk.reason': {
    en: 'Activation state is {state}. Current step: {step}. Hours remaining: {hours}.',
    zh: '当前激活状态是 {state}。当前步骤：{step}。剩余时间：{hours} 小时。',
    ms: 'Status pengaktifan ialah {state}. Langkah semasa: {step}. Baki masa: {hours} jam.',
  },
  'activation.risk.noTimer': {
    en: 'n/a',
    zh: '无计时',
    ms: 'tiada',
  },
  'success.outcome.FIRST_LEAD': {
    en: 'Acquire First Lead',
    zh: '获得第一位潜在客户',
    ms: 'Dapatkan Prospek Pertama',
  },
  'success.outcome.FIRST_CUSTOMER': {
    en: 'Acquire First Customer',
    zh: '获得第一位客户',
    ms: 'Dapatkan Pelanggan Pertama',
  },
  'success.outcome.FIRST_REVENUE': {
    en: 'Generate First Revenue',
    zh: '创造第一笔收入',
    ms: 'Jana Hasil Pertama',
  },
  'success.outcome.RETENTION_SYSTEM': {
    en: 'Build Retention System',
    zh: '建立留存系统',
    ms: 'Bina Sistem Pengekalan',
  },
  'success.outcome.TEAM_SCALING': {
    en: 'Scale Team Execution',
    zh: '扩大团队执行',
    ms: 'Skalakan Pelaksanaan Pasukan',
  },
  'success.outcome.AUTHORITY_BUILDING': {
    en: 'Build Market Authority',
    zh: '建立市场权威',
    ms: 'Bina Autoriti Pasaran',
  },
  'success.milestone.firstLead': {
    en: 'First Lead',
    zh: '第一位潜在客户',
    ms: 'Prospek Pertama',
  },
  'success.milestone.firstCustomer': {
    en: 'First Customer',
    zh: '第一位客户',
    ms: 'Pelanggan Pertama',
  },
  'success.milestone.firstSale': {
    en: 'First Sale',
    zh: '第一笔销售',
    ms: 'Jualan Pertama',
  },
  'success.milestone.retentionSystem': {
    en: 'Retention System',
    zh: '留存系统',
    ms: 'Sistem Pengekalan',
  },
  'success.milestone.teamSystem': {
    en: 'Team System',
    zh: '团队系统',
    ms: 'Sistem Pasukan',
  },
  'success.milestone.authorityContent': {
    en: 'Authority Content',
    zh: '权威内容',
    ms: 'Kandungan Autoriti',
  },
  'success.blocker.traffic.title': {
    en: 'Traffic blocker',
    zh: '流量阻塞',
    ms: 'Halangan trafik',
  },
  'success.blocker.traffic.reason': {
    en: 'The asset exists, but no lead has been captured yet. Activate a traffic source.',
    zh: '资产已经存在，但还没有潜在客户。需要启动一个流量来源。',
    ms: 'Aset sudah wujud, tetapi belum ada prospek. Aktifkan satu sumber trafik.',
  },
  'success.blocker.conversion.title': {
    en: 'Conversion blocker',
    zh: '转化阻塞',
    ms: 'Halangan penukaran',
  },
  'success.blocker.conversion.reason': {
    en: 'Leads exist, but no customer has been recorded yet. Improve the offer and follow-up path.',
    zh: '已有潜在客户，但还没有客户。需要优化 offer 和跟进路径。',
    ms: 'Prospek sudah ada, tetapi belum ada pelanggan. Baiki tawaran dan aliran susulan.',
  },
  'success.blocker.revenue.title': {
    en: 'Revenue blocker',
    zh: '收入阻塞',
    ms: 'Halangan hasil',
  },
  'success.blocker.revenue.reason': {
    en: 'Customers exist, but no revenue has been recorded yet.',
    zh: '已有客户，但还没有记录收入。',
    ms: 'Pelanggan sudah ada, tetapi hasil belum direkodkan.',
  },
  'success.blocker.retention.title': {
    en: 'Retention blocker',
    zh: '留存阻塞',
    ms: 'Halangan pengekalan',
  },
  'success.blocker.retention.reason': {
    en: 'Customers exist, but repeat value or retention is below target.',
    zh: '已有客户，但复购价值或留存还低于目标。',
    ms: 'Pelanggan sudah ada, tetapi nilai ulangan atau pengekalan masih di bawah sasaran.',
  },
  'success.blocker.team.title': {
    en: 'Team system blocker',
    zh: '团队系统阻塞',
    ms: 'Halangan sistem pasukan',
  },
  'success.blocker.team.reason': {
    en: 'Team execution needs a repeatable SOP or active agent support.',
    zh: '团队执行需要可复用 SOP 或活跃 agent 支援。',
    ms: 'Pelaksanaan pasukan memerlukan SOP berulang atau sokongan agent aktif.',
  },
  'success.blocker.authority.title': {
    en: 'Authority blocker',
    zh: '权威建立阻塞',
    ms: 'Halangan autoriti',
  },
  'success.blocker.authority.reason': {
    en: 'More published content is needed before authority is visible.',
    zh: '需要更多已发布内容，市场权威才会显现。',
    ms: 'Lebih banyak kandungan diterbitkan diperlukan sebelum autoriti menjadi jelas.',
  },
  'success.recovery.activateTraffic': {
    en: 'Activate traffic source',
    zh: '启动流量来源',
    ms: 'Aktifkan sumber trafik',
  },
  'success.recovery.improveOffer': {
    en: 'Improve offer',
    zh: '优化 Offer',
    ms: 'Baiki tawaran',
  },
  'success.recovery.closeFirstSale': {
    en: 'Close first sale',
    zh: '完成第一笔销售',
    ms: 'Tutup jualan pertama',
  },
  'success.recovery.buildRetention': {
    en: 'Build retention follow-up',
    zh: '建立留存跟进',
    ms: 'Bina susulan pengekalan',
  },
  'success.recovery.createSop': {
    en: 'Create operating SOP',
    zh: '创建运营 SOP',
    ms: 'Cipta SOP operasi',
  },
  'success.recovery.publishAuthority': {
    en: 'Publish authority content',
    zh: '发布权威内容',
    ms: 'Terbitkan kandungan autoriti',
  },
  'success.celebration.firstLead': {
    en: 'First lead captured',
    zh: '已获得第一位潜在客户',
    ms: 'Prospek pertama telah diperoleh',
  },
  'success.celebration.firstCustomer': {
    en: 'First customer acquired',
    zh: '已获得第一位客户',
    ms: 'Pelanggan pertama telah diperoleh',
  },
  'success.celebration.firstRevenue': {
    en: 'First revenue generated',
    zh: '已创造第一笔收入',
    ms: 'Hasil pertama telah dijana',
  },
  'success.celebration.firstRetainedCustomer': {
    en: 'First retained customer proven',
    zh: '已验证第一位留存客户',
    ms: 'Pelanggan pertama yang kekal telah dibuktikan',
  },
  'retention.level.NEW_SUCCESS': {
    en: 'New Success',
    zh: '刚获得成果',
    ms: 'Kejayaan Baharu',
  },
  'retention.level.ACTIVE_PROGRESS': {
    en: 'Active Progress',
    zh: '积极推进',
    ms: 'Kemajuan Aktif',
  },
  'retention.level.MOMENTUM': {
    en: 'Momentum',
    zh: '增长动能',
    ms: 'Momentum',
  },
  'retention.level.AT_RISK': {
    en: 'At Risk',
    zh: '存在风险',
    ms: 'Berisiko',
  },
  'retention.level.STALLED': {
    en: 'Stalled',
    zh: '已停滞',
    ms: 'Tergendala',
  },
  'retention.level.RETAINED': {
    en: 'Retained',
    zh: '已留存',
    ms: 'Dikekalkan',
  },
  'retention.level.EXPANDING': {
    en: 'Expanding',
    zh: '正在扩张',
    ms: 'Sedang Berkembang',
  },
  'retention.momentum.strong': {
    en: 'Outcome momentum is strong. Keep moving toward the next business result.',
    zh: '成果动能很强。继续推进下一个业务结果。',
    ms: 'Momentum hasil adalah kuat. Teruskan menuju hasil bisnes seterusnya.',
  },
  'retention.momentum.building': {
    en: 'Outcome momentum is building. Complete one meaningful step today.',
    zh: '成果动能正在建立。今天完成一个有意义的步骤。',
    ms: 'Momentum hasil sedang dibina. Lengkapkan satu langkah bermakna hari ini.',
  },
  'retention.momentum.reinforce': {
    en: 'Recent wins exist, but the next outcome needs reinforcement.',
    zh: '已有近期成果，但下一个结果需要加强推进。',
    ms: 'Kemenangan terkini sudah ada, tetapi hasil seterusnya perlu diperkukuh.',
  },
  'retention.momentum.low': {
    en: 'Outcome momentum is low. Restart with one guided recovery action.',
    zh: '成果动能偏低。先用一个引导恢复动作重新启动。',
    ms: 'Momentum hasil rendah. Mulakan semula dengan satu tindakan pemulihan terpandu.',
  },
  'retention.recovery.nextOutcome': {
    en: 'Recommend next outcome',
    zh: '推荐下一个成果',
    ms: 'Cadangkan hasil seterusnya',
  },
  'retention.recovery.recoveryMission': {
    en: 'Generate recovery mission',
    zh: '生成恢复任务',
    ms: 'Jana misi pemulihan',
  },
  'retention.recovery.agentAssistance': {
    en: 'Activate agent assistance',
    zh: '启动 Agent 协助',
    ms: 'Aktifkan bantuan agent',
  },
  'retention.recovery.progressReminder': {
    en: 'Send progress reminder',
    zh: '发送进度提醒',
    ms: 'Hantar peringatan kemajuan',
  },
  'retention.recovery.reason.atRisk': {
    en: 'No outcome progress for 14 days. Re-engage with the next logical outcome.',
    zh: '已有 14 天没有成果推进。用下一个合理成果重新带动用户。',
    ms: 'Tiada kemajuan hasil selama 14 hari. Libatkan semula dengan hasil logik seterusnya.',
  },
  'retention.recovery.reason.stalled': {
    en: 'No outcome progress for 30 days. Restart with a recovery mission before growth work.',
    zh: '已有 30 天没有成果推进。先用恢复任务重新启动，再谈增长。',
    ms: 'Tiada kemajuan hasil selama 30 hari. Mulakan semula dengan misi pemulihan sebelum kerja pertumbuhan.',
  },
  'retention.recovery.reason.next': {
    en: 'The user is ready for the next business outcome.',
    zh: '用户已经准备好推进下一个业务成果。',
    ms: 'Pengguna sudah bersedia untuk hasil bisnes seterusnya.',
  },
  'expansion.level.EMERGING': {
    en: 'Emerging',
    zh: '开始增长',
    ms: 'Mula Berkembang',
  },
  'expansion.level.GROWING': {
    en: 'Growing',
    zh: '持续增长',
    ms: 'Sedang Bertumbuh',
  },
  'expansion.level.SCALING': {
    en: 'Scaling',
    zh: '正在规模化',
    ms: 'Sedang Skala',
  },
  'expansion.level.OPTIMIZING': {
    en: 'Optimizing',
    zh: '正在优化',
    ms: 'Sedang Dioptimumkan',
  },
  'expansion.level.LEADING': {
    en: 'Leading',
    zh: '正在带队增长',
    ms: 'Memimpin Pertumbuhan',
  },
  'expansion.level.AUTHORITY': {
    en: 'Authority',
    zh: '权威增长',
    ms: 'Autoriti',
  },
  'expansion.opportunity.FIRST_CUSTOMER': {
    en: 'Acquire more customers',
    zh: '获得更多客户',
    ms: 'Dapatkan lebih ramai pelanggan',
  },
  'expansion.opportunity.FIRST_REVENUE': {
    en: 'Grow revenue',
    zh: '增长收入',
    ms: 'Tingkatkan hasil',
  },
  'expansion.opportunity.RETENTION_SYSTEM': {
    en: 'Build retention system',
    zh: '建立留存系统',
    ms: 'Bina sistem retention',
  },
  'expansion.opportunity.TEAM_SCALING': {
    en: 'Scale team',
    zh: '规模化团队',
    ms: 'Skalakan pasukan',
  },
  'expansion.opportunity.AUTHORITY_BUILDING': {
    en: 'Build authority',
    zh: '建立权威',
    ms: 'Bina autoriti',
  },
  'expansion.opportunity.MARKET_LEADERSHIP': {
    en: 'Grow market leadership',
    zh: '扩大市场领导力',
    ms: 'Kembangkan kepimpinan pasaran',
  },
  'expansion.recovery.growth_mission': {
    en: 'Create growth mission',
    zh: '创建增长任务',
    ms: 'Cipta misi pertumbuhan',
  },
  'expansion.recovery.optimization_mission': {
    en: 'Create optimization mission',
    zh: '创建优化任务',
    ms: 'Cipta misi pengoptimuman',
  },
  'expansion.recovery.expansion_outcome': {
    en: 'Recommend expansion outcome',
    zh: '推荐扩张成果',
    ms: 'Cadangkan hasil pengembangan',
  },
  'expansion.recovery.workforce_assistance': {
    en: 'Activate workforce assistance',
    zh: '启动团队协助',
    ms: 'Aktifkan bantuan tenaga kerja',
  },
  'expansion.recovery.reason.plateau': {
    en: 'Revenue growth has plateaued for 30 days. Optimize the current conversion or revenue path before scaling wider.',
    zh: '收入增长已停滞 30 天。先优化当前转化或收入路径，再扩大规模。',
    ms: 'Pertumbuhan hasil mendatar selama 30 hari. Optimumkan laluan conversion atau hasil sebelum skala lebih luas.',
  },
  'expansion.recovery.reason.stalledGrowth': {
    en: 'No new verified outcome has appeared for 45 days. Restart growth with a focused mission.',
    zh: '45 天内没有新的已验证成果。用一个聚焦任务重新启动增长。',
    ms: 'Tiada hasil disahkan baharu selama 45 hari. Mulakan semula pertumbuhan dengan misi fokus.',
  },
  'expansion.recovery.reason.scalingBlocked': {
    en: 'Team progress has been blocked for 60 days. Use workforce assistance to unblock leverage.',
    zh: '团队推进已停滞 60 天。用团队协助解除杠杆阻塞。',
    ms: 'Kemajuan pasukan tersekat selama 60 hari. Gunakan bantuan tenaga kerja untuk buka leverage.',
  },
  'expansion.recovery.reason.next': {
    en: 'The user is ready for the next larger business outcome.',
    zh: '用户已经准备好推进下一个更大的业务成果。',
    ms: 'Pengguna sudah bersedia untuk hasil bisnes yang lebih besar seterusnya.',
  },
  'expansion.celebration.firstRevenue': {
    en: 'First revenue achieved',
    zh: '已达成第一笔收入',
    ms: 'Hasil pertama dicapai',
  },
  'expansion.celebration.retentionSystem': {
    en: 'Retention system proven',
    zh: '留存系统已验证',
    ms: 'Sistem retention telah dibuktikan',
  },
  'expansion.celebration.firstTeamMember': {
    en: 'First team member added',
    zh: '已新增第一位团队成员',
    ms: 'Ahli pasukan pertama ditambah',
  },
  'expansion.celebration.authorityMilestone': {
    en: 'Authority milestone reached',
    zh: '已达成权威里程碑',
    ms: 'Milestone autoriti dicapai',
  },
  'referral.level.NOT_READY': {
    en: 'Not Ready',
    zh: '尚未准备好',
    ms: 'Belum Bersedia',
  },
  'referral.level.READY': {
    en: 'Ready',
    zh: '已准备好',
    ms: 'Bersedia',
  },
  'referral.level.ADVOCATE': {
    en: 'Advocate',
    zh: '推荐者',
    ms: 'Penyokong',
  },
  'referral.level.AMBASSADOR': {
    en: 'Ambassador',
    zh: '大使',
    ms: 'Duta',
  },
  'referral.level.CHAMPION': {
    en: 'Champion',
    zh: '冠军推荐者',
    ms: 'Juara',
  },
  'referral.opportunity.invite_friend': {
    en: 'Invite a friend',
    zh: '邀请一位朋友',
    ms: 'Jemput seorang rakan',
  },
  'referral.opportunity.share_success_story': {
    en: 'Share success story',
    zh: '分享成功故事',
    ms: 'Kongsi kisah kejayaan',
  },
  'referral.opportunity.case_study': {
    en: 'Create case study',
    zh: '制作案例研究',
    ms: 'Cipta kajian kes',
  },
  'referral.opportunity.content_collaboration': {
    en: 'Start content collaboration',
    zh: '发起内容合作',
    ms: 'Mulakan kolaborasi kandungan',
  },
  'referral.opportunity.client_referral': {
    en: 'Ask for client referral',
    zh: '请求客户转介绍',
    ms: 'Minta referral pelanggan',
  },
  'referral.opportunity.testimonial': {
    en: 'Collect testimonial',
    zh: '收集客户见证',
    ms: 'Kumpul testimoni',
  },
  'referral.opportunity.review_request': {
    en: 'Request review',
    zh: '发送评价请求',
    ms: 'Minta ulasan',
  },
  'referral.opportunity.customer_referral': {
    en: 'Start customer referral',
    zh: '启动顾客转介绍',
    ms: 'Mulakan referral pelanggan',
  },
  'referral.opportunity.transformation_story': {
    en: 'Share transformation story',
    zh: '分享转变故事',
    ms: 'Kongsi kisah transformasi',
  },
  'referral.opportunity.repeat_buyer_referral': {
    en: 'Invite repeat buyer referral',
    zh: '邀请复购顾客推荐',
    ms: 'Jemput referral pembeli berulang',
  },
  'referral.opportunity.recruit_referral': {
    en: 'Ask for recruit referral',
    zh: '请求招募转介绍',
    ms: 'Minta referral rekrut',
  },
  'referral.opportunity.team_success_story': {
    en: 'Share team success story',
    zh: '发布团队成功故事',
    ms: 'Kongsi kisah kejayaan pasukan',
  },
  'referral.opportunity.leadership_referral': {
    en: 'Invite leadership referral',
    zh: '邀请领导力推荐',
    ms: 'Jemput referral kepimpinan',
  },
  'referral.risk.NO_SUCCESS_YET': {
    en: 'No verified success yet. Block referral requests until value is proven.',
    zh: '还没有已验证成功。先证明价值，再请求推荐。',
    ms: 'Belum ada kejayaan disahkan. Sekat permintaan referral sehingga nilai dibuktikan.',
  },
  'referral.risk.RETENTION_NOT_ACHIEVED': {
    en: 'Retention is not achieved yet. Never ask unsuccessful users for referrals.',
    zh: '留存尚未达成。不要向未成功用户请求推荐。',
    ms: 'Retention belum dicapai. Jangan minta referral daripada pengguna yang belum berjaya.',
  },
  'referral.risk.REFERRAL_REQUESTS_IGNORED': {
    en: 'Referral requests were ignored. Reduce frequency and switch to proof sharing.',
    zh: '推荐请求被忽略。降低频率，改为分享成果证明。',
    ms: 'Permintaan referral diabaikan. Kurangkan kekerapan dan tukar kepada perkongsian bukti.',
  },
  'referral.risk.SATISFACTION_RISK': {
    en: 'Satisfaction risk exists. Resolve customer confidence before asking for referrals.',
    zh: '存在满意度风险。先修复客户信心，再请求推荐。',
    ms: 'Ada risiko kepuasan. Pulihkan keyakinan pelanggan sebelum minta referral.',
  },
  'referral.risk.REFERRAL_PATH_MISSING': {
    en: 'Referral path is missing. Create a trackable invite path first.',
    zh: '缺少推荐路径。先创建可追踪的邀请路径。',
    ms: 'Laluan referral belum ada. Cipta laluan jemputan yang boleh dijejak dahulu.',
  },
  'referral.risk.none': {
    en: 'Referral path is healthy.',
    zh: '推荐路径健康。',
    ms: 'Laluan referral sihat.',
  },
  'referral.reward.advocate': {
    en: 'Advocate Badge',
    zh: '推荐者徽章',
    ms: 'Lencana Penyokong',
  },
  'referral.reward.ambassador': {
    en: 'Ambassador Badge',
    zh: '大使徽章',
    ms: 'Lencana Duta',
  },
  'referral.reward.champion': {
    en: 'Champion Badge',
    zh: '冠军徽章',
    ms: 'Lencana Juara',
  },
  'referral.reward.leaderboard': {
    en: 'Leaderboard',
    zh: '排行榜',
    ms: 'Papan Kedudukan',
  },
  'health.level.CRITICAL': {
    en: 'Critical',
    zh: '严重风险',
    ms: 'Kritikal',
  },
  'health.level.AT_RISK': {
    en: 'At Risk',
    zh: '存在风险',
    ms: 'Berisiko',
  },
  'health.level.STABLE': {
    en: 'Stable',
    zh: '稳定',
    ms: 'Stabil',
  },
  'health.level.HEALTHY': {
    en: 'Healthy',
    zh: '健康',
    ms: 'Sihat',
  },
  'health.level.THRIVING': {
    en: 'Thriving',
    zh: '蓬勃增长',
    ms: 'Berkembang Pesat',
  },
  'health.driver.outcomeVelocity': {
    en: 'Outcome velocity',
    zh: '成果推进速度',
    ms: 'Kelajuan hasil',
  },
  'health.driver.missionConsistency': {
    en: 'Mission completion consistency',
    zh: '任务完成一致性',
    ms: 'Konsistensi penyelesaian misi',
  },
  'health.driver.retentionProgress': {
    en: 'Retention progress',
    zh: '留存进展',
    ms: 'Kemajuan retention',
  },
  'health.driver.expansionProgress': {
    en: 'Expansion progress',
    zh: '扩张进展',
    ms: 'Kemajuan pengembangan',
  },
  'health.driver.referralSuccess': {
    en: 'Referral success',
    zh: '推荐成功',
    ms: 'Kejayaan referral',
  },
  'health.risk.noOutcomeProgress': {
    en: 'No outcome progress',
    zh: '没有成果推进',
    ms: 'Tiada kemajuan hasil',
  },
  'health.risk.successDropping': {
    en: 'Success dropping',
    zh: '成功进度下降',
    ms: 'Kejayaan menurun',
  },
  'health.risk.retentionDeclining': {
    en: 'Retention declining',
    zh: '留存下降',
    ms: 'Retention menurun',
  },
  'health.risk.expansionPlateau': {
    en: 'Expansion plateau',
    zh: '扩张停滞',
    ms: 'Pengembangan mendatar',
  },
  'health.risk.noMissionActivity': {
    en: 'No mission activity',
    zh: '没有任务活动',
    ms: 'Tiada aktiviti misi',
  },
  'health.risk.lowAssetUtilization': {
    en: 'Low asset utilization',
    zh: '资产使用率低',
    ms: 'Penggunaan aset rendah',
  },
  'health.action.none': {
    en: 'No intervention',
    zh: '无需干预',
    ms: 'Tiada intervensi',
  },
  'health.action.recovery_recommendation': {
    en: 'Recovery recommendation',
    zh: '恢复建议',
    ms: 'Cadangan pemulihan',
  },
  'health.action.outcome_recovery_mission': {
    en: 'Outcome recovery mission',
    zh: '成果恢复任务',
    ms: 'Misi pemulihan hasil',
  },
  'health.action.expansion_recovery_mission': {
    en: 'Expansion recovery mission',
    zh: '扩张恢复任务',
    ms: 'Misi pemulihan pengembangan',
  },
  'health.action.retention_recovery_mission': {
    en: 'Retention recovery mission',
    zh: '留存恢复任务',
    ms: 'Misi pemulihan retention',
  },
  'health.action.referral_recovery_mission': {
    en: 'Referral recovery mission',
    zh: '推荐恢复任务',
    ms: 'Misi pemulihan referral',
  },
  'health.action.priority_escalation': {
    en: 'Priority escalation',
    zh: '优先级升级',
    ms: 'Eskalasi keutamaan',
  },
  'health.action.ai_coo_attention': {
    en: 'AI COO attention',
    zh: 'AI COO 关注',
    ms: 'Perhatian AI COO',
  },
} satisfies Record<string, Record<ProductLocale, string>>;

const PHRASE_REPLACEMENTS: Record<Exclude<ProductLocale, 'en'>, Array<[RegExp, string]>> = {
  zh: [
    [/Create Your First Lead Magnet/g, '创建你的第一个引流赠品'],
    [/Acquire First Lead/g, '获得第一位潜在客户'],
    [/Lead Magnet Draft/g, '引流赠品草稿'],
    [/Content Draft/g, '内容草稿'],
    [/Funnel Draft/g, '漏斗草稿'],
    [/Traffic Plan/g, '流量计划'],
    [/CRM Follow-Up/g, 'CRM 跟进'],
    [/Offer Draft/g, '产品方案草稿'],
    [/Draft Asset/g, '资产草稿'],
    [/7 Hidden Habits Preventing Fat Loss/g, '阻碍减脂的7个隐藏习惯'],
    [/7 Mistakes New Entrepreneurs Make Before Their First Lead/g, '新创业者获得第一个潜在客户前常犯的7个错误'],
    [/Created for:/g, '适合对象：'],
    [/Audience:/g, '受众：'],
    [/Offer:/g, '方案：'],
    [/Tone:/g, '语气：'],
    [/Brand angle:/g, '品牌角度：'],
    [/Market theme:/g, '市场主题：'],
    [/Lead source context:/g, '线索来源背景：'],
    [/Positioning:/g, '定位：'],
    [/Promise:/g, '承诺：'],
    [/Sections:/g, '内容结构：'],
    [/CTA:/g, '行动号召：'],
    [/Hook:/g, '开场钩子：'],
    [/Body:/g, '正文：'],
    [/Landing Page Sections:/g, '落地页结构：'],
    [/Thank You Page:/g, '感谢页：'],
    [/Lead Flow:/g, '线索流程：'],
    [/Angles:/g, '切入角度：'],
    [/Channels:/g, '渠道：'],
    [/Follow-Up Sequence:/g, '跟进序列：'],
    [/Segmentation:/g, '分群：'],
    [/Offer Promise:/g, '方案承诺：'],
    [/Objections To Address:/g, '需要处理的异议：'],
    [/Write in Chinese with clear, practical phrasing\./g, '请使用自然中文，表达清楚、实用。'],
    [/Write in English with direct, useful phrasing\./g, '请使用自然中文，表达清楚、实用。'],
    [/Write in Malay with clear, practical phrasing\./g, '请使用自然中文，表达清楚、实用。'],
    [/Previous asset topics: none yet\./g, '之前的资产主题：暂无。'],
    [/Avoid repeating these previous topics:/g, '避免重复这些旧主题：'],
    [/Stage context: prioritize educational assets that clarify identity, audience, and first trust signals\./g, '阶段背景：优先创建能说明身份、受众和初始信任信号的教育型资产。'],
    [/Stage context: prioritize conversion assets that capture and qualify leads\./g, '阶段背景：优先创建能捕获并筛选潜在客户的转化型资产。'],
    [/Stage context: prioritize retention and customer success assets\./g, '阶段背景：优先创建留存和客户成功资产。'],
    [/1\. Why (.+) get stuck/g, '1. 为什么$1会卡住'],
    [/2\. The hidden cost of (.+)/g, '2. $1背后的隐藏代价'],
    [/3\. A simple checklist for (.+)/g, '3. 适用于$1的简单清单'],
    [/4\. The first action to take today/g, '4. 今天可以采取的第一个行动'],
    [/5\. What to track next/g, '5. 接下来要追踪什么'],
    [/Use this checklist, then take the next step toward (.+)\./g, '使用这份清单，然后迈向$1的下一步。'],
  ],
  ms: [
    [/Create Your First Lead Magnet/g, 'Cipta Lead Magnet Pertama Anda'],
    [/Acquire First Lead/g, 'Dapatkan Prospek Pertama'],
    [/Lead Magnet Draft/g, 'Draf Lead Magnet'],
    [/Content Draft/g, 'Draf Kandungan'],
    [/Funnel Draft/g, 'Draf Funnel'],
    [/Traffic Plan/g, 'Pelan Trafik'],
    [/CRM Follow-Up/g, 'Susulan CRM'],
    [/Offer Draft/g, 'Draf Tawaran'],
    [/Draft Asset/g, 'Draf Aset'],
    [/7 Hidden Habits Preventing Fat Loss/g, '7 Tabiat Tersembunyi yang Menghalang Kehilangan Lemak'],
    [/7 Mistakes New Entrepreneurs Make Before Their First Lead/g, '7 Kesilapan Usahawan Baharu Sebelum Mendapat Prospek Pertama'],
    [/Created for:/g, 'Dicipta untuk:'],
    [/Audience:/g, 'Audiens:'],
    [/Offer:/g, 'Tawaran:'],
    [/Tone:/g, 'Nada:'],
    [/Brand angle:/g, 'Sudut jenama:'],
    [/Market theme:/g, 'Tema pasaran:'],
    [/Lead source context:/g, 'Konteks sumber prospek:'],
    [/Positioning:/g, 'Kedudukan:'],
    [/Promise:/g, 'Janji:'],
    [/Sections:/g, 'Bahagian:'],
    [/CTA:/g, 'Seruan tindakan:'],
    [/Hook:/g, 'Pembuka:'],
    [/Body:/g, 'Isi:'],
    [/Landing Page Sections:/g, 'Bahagian Halaman Pendaratan:'],
    [/Thank You Page:/g, 'Halaman Terima Kasih:'],
    [/Lead Flow:/g, 'Aliran Prospek:'],
    [/Angles:/g, 'Sudut:'],
    [/Channels:/g, 'Saluran:'],
    [/Follow-Up Sequence:/g, 'Urutan Susulan:'],
    [/Segmentation:/g, 'Segmentasi:'],
    [/Offer Promise:/g, 'Janji Tawaran:'],
    [/Objections To Address:/g, 'Bantahan Untuk Dijawab:'],
    [/Write in Malay with clear, practical phrasing\./g, 'Tulis dalam Bahasa Melayu dengan frasa yang jelas dan praktikal.'],
    [/Write in English with direct, useful phrasing\./g, 'Tulis dalam Bahasa Melayu dengan frasa yang jelas dan praktikal.'],
    [/Write in Chinese with clear, practical phrasing\./g, 'Tulis dalam Bahasa Melayu dengan frasa yang jelas dan praktikal.'],
    [/Previous asset topics: none yet\./g, 'Topik aset terdahulu: belum ada.'],
    [/Avoid repeating these previous topics:/g, 'Elakkan mengulang topik terdahulu ini:'],
    [/Stage context: prioritize educational assets that clarify identity, audience, and first trust signals\./g, 'Konteks tahap: utamakan aset pendidikan yang menjelaskan identiti, audiens dan isyarat kepercayaan awal.'],
    [/Stage context: prioritize conversion assets that capture and qualify leads\./g, 'Konteks tahap: utamakan aset penukaran yang menangkap dan menapis prospek.'],
    [/Stage context: prioritize retention and customer success assets\./g, 'Konteks tahap: utamakan aset pengekalan dan kejayaan pelanggan.'],
    [/1\. Why (.+) get stuck/g, '1. Mengapa $1 tersekat'],
    [/2\. The hidden cost of (.+)/g, '2. Kos tersembunyi di sebalik $1'],
    [/3\. A simple checklist for (.+)/g, '3. Senarai semak mudah untuk $1'],
    [/4\. The first action to take today/g, '4. Tindakan pertama untuk dibuat hari ini'],
    [/5\. What to track next/g, '5. Apa yang perlu dijejaki seterusnya'],
    [/Use this checklist, then take the next step toward (.+)\./g, 'Gunakan senarai semak ini, kemudian ambil langkah seterusnya menuju $1.'],
  ],
};

export function normalizeProductLocale(value?: string | null): ProductLocale | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized === 'zh' || normalized.startsWith('zh-') || normalized.startsWith('cn')) return 'zh';
  if (normalized === 'ms' || normalized.startsWith('ms-') || normalized.includes('malay')) return 'ms';
  if (normalized === 'en' || normalized.startsWith('en-')) return 'en';
  return null;
}

export function resolveProductLocale(input: LocaleResolutionInput = {}): LocaleResolution {
  const candidates: Array<[LocaleResolution['source'], string | null | undefined]> = [
    ['userPreference', input.userPreference],
    ['tenantSetting', input.tenantLocale],
    ['browserLocale', input.browserLocale],
    ['systemDefault', input.systemDefault],
    ['systemDefault', DEFAULT_LOCALE],
  ];

  for (const [source, candidate] of candidates) {
    const locale = normalizeProductLocale(candidate);
    if (locale) {
      return {
        locale,
        source,
        fallbackUsed: source !== candidates[0][0],
      };
    }
  }

  return { locale: DEFAULT_LOCALE, source: 'systemDefault', fallbackUsed: true };
}

export function getLocalizedText(key: string, locale: ProductLocale): LocalizedValue {
  const entry = LOCALIZATION_REGISTRY[key as keyof typeof LOCALIZATION_REGISTRY];
  if (entry?.[locale]) {
    return {
      key,
      locale,
      value: entry[locale],
      translationSource: 'registry',
      fallbackUsed: false,
    };
  }

  if (entry?.en) {
    return {
      key,
      locale,
      value: entry.en,
      translationSource: 'fallback',
      fallbackUsed: true,
    };
  }

  return {
    key,
    locale,
    value: FALLBACK_TEXT[locale],
    translationSource: 'missing',
    fallbackUsed: true,
    missingKey: key,
  };
}

function applyPhraseReplacements(value: string, locale: ProductLocale) {
  if (locale === 'en') return value;
  return PHRASE_REPLACEMENTS[locale].reduce((text, [pattern, replacement]) => (
    text.replace(pattern, replacement)
  ), value);
}

function previewFor(content: string) {
  return content.split('\n').filter(Boolean).slice(0, 8).join('\n');
}

export function localizeGeneratedAsset(input: {
  title: string;
  content: string;
  locale: ProductLocale;
  assetType: AgentAssetType;
}): LocalizedGeneratedAsset {
  const title = applyPhraseReplacements(input.title, input.locale);
  const content = applyPhraseReplacements(input.content, input.locale);

  return {
    locale: input.locale,
    title,
    content,
    preview: previewFor(content),
    translationSource: input.locale === 'en' ? 'registry' : 'registry',
    fallbackUsed: false,
  };
}

export function getLocalizedAssetDescription(agentName: string, locale: ProductLocale): LocalizedValue {
  const value = getLocalizedText('asset.generatedDescription', locale);

  return {
    ...value,
    value: value.value.replace('{agent}', agentName),
  };
}

export const localizationEngine = {
  normalizeLocale: normalizeProductLocale,
  resolveLocale: resolveProductLocale,
  t: getLocalizedText,
  localizeGeneratedAsset,
  assetDescription: getLocalizedAssetDescription,
};
