import type {
  BottleneckResult,
  ExplainabilityLocale,
  ExplainabilityResult,
  MissionBottleneck,
  PriorityResult,
} from '../contracts/MissionAuthority';

type ExplainabilityTemplate = Omit<ExplainabilityResult, 'locale' | 'source'>;

const SUPPORTED_LOCALES: ExplainabilityLocale[] = ['en', 'zh', 'ms'];

const TEMPLATES: Record<ExplainabilityLocale, Record<MissionBottleneck, ExplainabilityTemplate>> = {
  en: {
    NO_BRAND: {
      whyThis: 'The business context is not complete enough to make reliable growth recommendations.',
      whyNow: 'Clarifying the business foundation now prevents content, offer, and funnel work from being built on weak assumptions.',
      whyNotOthers: 'Content, funnels, and traffic can help later, but they depend on a clear business profile first.',
      expectedOutcome: 'Complete the business profile so the next recommendation is grounded in the right market and offer.',
      expectedRisk: 'If this remains unclear, later growth actions may attract the wrong audience or promote the wrong offer.',
      nextMilestone: 'Define Market Position',
    },
    NO_POSITIONING: {
      whyThis: 'The market position needs to be clear before the business can communicate a compelling offer.',
      whyNow: 'Positioning now improves every downstream content, lead capture, and sales decision.',
      whyNotOthers: 'More content or traffic would only amplify unclear messaging at this stage.',
      expectedOutcome: 'Clarify the offer, audience, and trust angle.',
      expectedRisk: 'If positioning stays unclear, leads may not understand why they should trust or buy from the business.',
      nextMilestone: 'Build Content Foundation',
    },
    NO_CONTENT: {
      whyThis: 'The business needs a content foundation so the market can discover and trust the offer.',
      whyNow: 'Content now creates the attention and trust needed before lead capture can work reliably.',
      whyNotOthers: 'A funnel or traffic campaign is less effective when there is not enough trust-building content yet.',
      expectedOutcome: 'Publish the first content foundation.',
      expectedRisk: 'If content remains missing, the business may struggle to create consistent demand.',
      nextMilestone: 'Create Lead Magnet',
    },
    NO_AUDIENCE: {
      whyThis: 'The business needs audience growth content so the right people start engaging with the offer.',
      whyNow: 'Growing the right audience now gives the lead system enough qualified attention to convert.',
      whyNotOthers: 'Lead capture improvements matter, but the business first needs enough qualified people seeing the message.',
      expectedOutcome: 'Reach more qualified people with the current message.',
      expectedRisk: 'If audience growth is ignored, the business may keep creating assets that too few qualified people see.',
      nextMilestone: 'Create Lead Magnet',
    },
    NO_LEAD_MAGNET: {
      whyThis: 'The business needs a clear opt-in offer before visitors have a reason to leave contact information.',
      whyNow: 'Creating the lead magnet now turns existing attention into measurable lead generation.',
      whyNotOthers: 'Traffic and automation can wait because the business still needs a concrete lead capture asset.',
      expectedOutcome: 'Create the first lead capture asset.',
      expectedRisk: 'If lead capture stays missing, interested visitors may leave without entering the follow-up system.',
      nextMilestone: 'Build Funnel',
    },
    NO_FUNNEL: {
      whyThis: 'The business needs a working funnel to connect the lead offer, landing page, and follow-up path.',
      whyNow: 'Building the funnel now creates a place where traffic can convert instead of being wasted.',
      whyNotOthers: 'Traffic acquisition is valuable, but sending traffic before the funnel works would reduce conversion.',
      expectedOutcome: 'Create a working conversion path.',
      expectedRisk: 'If the funnel remains incomplete, lead opportunities may leak before they can be followed up.',
      nextMilestone: 'Activate Traffic Source',
    },
    NO_TRAFFIC: {
      whyThis: 'Your funnel and lead capture system are already in place. The primary constraint is that no traffic is entering the business.',
      whyNow: 'Without traffic, all downstream growth activities become less effective.',
      whyNotOthers: 'Content optimization is valuable. However traffic acquisition has a greater impact at this stage.',
      expectedOutcome: 'Generate your first leads.',
      expectedRisk: 'Business growth may stall if traffic remains inactive.',
      nextMilestone: 'Acquire your first customer',
    },
    NO_LEADS: {
      whyThis: 'Traffic exists, but the business is not converting enough visitors into leads.',
      whyNow: 'Improving lead capture now increases the value of every visitor already reaching the business.',
      whyNotOthers: 'More traffic can wait because the current capture path needs to convert the traffic already available.',
      expectedOutcome: 'Increase qualified lead flow.',
      expectedRisk: 'If lead capture is ignored, acquisition costs may rise while qualified lead growth remains weak.',
      nextMilestone: 'Acquire First Customer',
    },
    NO_CONVERSION: {
      whyThis: 'Existing leads are close to revenue, but they are not converting into customers.',
      whyNow: 'Improving the offer now can create revenue faster than adding more traffic or content.',
      whyNotOthers: 'More leads may help later, but the current constraint is turning existing interest into purchase intent.',
      expectedOutcome: 'Increase lead-to-customer conversion.',
      expectedRisk: 'If conversion remains unresolved, lead acquisition costs may increase while customer growth remains stagnant.',
      nextMilestone: 'Acquire First Customer',
    },
    NO_CUSTOMERS: {
      whyThis: 'The business has lead opportunities that need direct conversion work.',
      whyNow: 'Converting existing leads now creates the shortest path to first or next customer revenue.',
      whyNotOthers: 'New campaigns can wait because the closest opportunities are already in the lead pipeline.',
      expectedOutcome: 'Acquire or advance a customer opportunity.',
      expectedRisk: 'If existing leads are not worked, warm opportunities may become cold and revenue may be delayed.',
      nextMilestone: 'Build Retention System',
    },
    NO_RETENTION: {
      whyThis: 'The business needs a retention system so customer value continues after the first purchase.',
      whyNow: 'Improving retention now protects revenue and makes future acquisition more profitable.',
      whyNotOthers: 'New acquisition can help later, but retaining and re-engaging customers is the higher leverage constraint now.',
      expectedOutcome: 'Improve repeat purchase or customer follow-up.',
      expectedRisk: 'If retention is ignored, customer value may leak and growth may become harder to sustain.',
      nextMilestone: 'Create SOP',
    },
    NO_TEAM: {
      whyThis: 'The business needs repeatable operating procedures before execution can scale beyond the founder.',
      whyNow: 'Documenting the system now makes delegation and AI workforce execution possible.',
      whyNotOthers: 'More campaigns can wait because scaling a manual workflow would increase operational strain.',
      expectedOutcome: 'Create a repeatable operating workflow.',
      expectedRisk: 'If operating procedures remain missing, growth may depend too heavily on founder effort.',
      nextMilestone: 'Scale Operations',
    },
    BUSINESS_HEALTHY: {
      whyThis: 'Your business currently has no critical bottlenecks.',
      whyNow: 'Optimization opportunities produce the highest leverage improvements.',
      whyNotOthers: 'No repair actions are required at this stage.',
      expectedOutcome: 'Increase business performance.',
      expectedRisk: 'Growth may slow if optimization opportunities are ignored.',
      nextMilestone: 'Scale Operations',
    },
    NO_SYSTEM: {
      whyThis: 'Business signals are unavailable.',
      whyNow: 'Reliable recommendations cannot be generated until signal visibility is restored.',
      whyNotOthers: 'Any business recommendation would be speculative without valid signals.',
      expectedOutcome: 'Restore accurate business visibility.',
      expectedRisk: 'Incorrect decisions may be made if important business information is missing.',
      nextMilestone: 'Signal Recovery',
    },
  },
  zh: {
    NO_BRAND: {
      whyThis: '业务资料还不完整，系统还不能可靠判断你的受众、Offer、内容角度和增长路径。',
      whyNow: '现在先补齐业务基础，可以避免后面的内容、漏斗和流量动作建立在错误假设上。',
      whyNotOthers: '内容、漏斗和流量之后都重要，但它们需要先建立在清楚的业务画像上。',
      expectedOutcome: '完成业务资料，让下一步建议对准正确的市场和 Offer。',
      expectedRisk: '如果业务基础继续不清楚，后续增长动作可能会吸引错误受众或推广错误卖点。',
      nextMilestone: '确认市场定位',
    },
    NO_POSITIONING: {
      whyThis: '市场定位需要先清楚，业务才能表达出有吸引力的 Offer。',
      whyNow: '现在确认定位，会直接改善后续内容、线索收集和销售决策。',
      whyNotOthers: '如果现在先做更多内容或流量，只会放大还不清楚的信息。',
      expectedOutcome: '确认 Offer、受众和信任角度。',
      expectedRisk: '如果定位继续模糊，潜在客户可能不明白为什么要信任或购买。',
      nextMilestone: '建立内容基础',
    },
    NO_CONTENT: {
      whyThis: '业务需要内容基础，让市场能够发现并信任你的 Offer。',
      whyNow: '现在先建立内容，可以为后续线索收集累积注意力和信任。',
      whyNotOthers: '当信任内容还不够时，漏斗或流量活动的效果会受到限制。',
      expectedOutcome: '发布第一批内容基础。',
      expectedRisk: '如果持续缺少内容，业务会更难稳定创造需求。',
      nextMilestone: '创建引流资源',
    },
    NO_AUDIENCE: {
      whyThis: '业务需要让正确受众开始接触并回应当前 Offer。',
      whyNow: '现在扩大正确受众，可以让后续线索系统有足够合格注意力来转化。',
      whyNotOthers: '优化线索收集有价值，但当前需要先让足够多合格受众看到信息。',
      expectedOutcome: '让更多合格受众看到当前信息。',
      expectedRisk: '如果忽略受众增长，业务可能会持续创造很少人看到的资产。',
      nextMilestone: '创建引流资源',
    },
    NO_LEAD_MAGNET: {
      whyThis: '业务需要一个清楚的领取理由，访客才愿意留下联系方式。',
      whyNow: '现在创建引流资源，可以把已有注意力转化成可衡量的潜在客户。',
      whyNotOthers: '流量和自动化可以稍后处理，因为业务现在还缺少具体的线索收集资产。',
      expectedOutcome: '创建第一个线索收集资产。',
      expectedRisk: '如果继续没有线索收集入口，感兴趣的访客可能会离开而没有进入跟进系统。',
      nextMilestone: '建立漏斗',
    },
    NO_FUNNEL: {
      whyThis: '业务需要一个可运作的漏斗，把引流资源、落地页和跟进路径连接起来。',
      whyNow: '现在建立漏斗，可以让后续流量有地方转化，而不是被浪费。',
      whyNotOthers: '流量获取很有价值，但在漏斗未准备好之前导入流量会降低转化。',
      expectedOutcome: '建立一条可转化的路径。',
      expectedRisk: '如果漏斗继续不完整，线索机会可能会在跟进前流失。',
      nextMilestone: '启动流量来源',
    },
    NO_TRAFFIC: {
      whyThis: '你的漏斗和潜在客户收集系统已经建立完成。目前最大的限制是没有流量进入系统。',
      whyNow: '如果没有流量，所有后续增长活动都会受到限制。',
      whyNotOthers: '优化内容是有价值的。但目前流量获取比内容优化更能推动业务成长。',
      expectedOutcome: '获得第一批潜在客户。',
      expectedRisk: '如果持续没有流量，业务增长将停滞。',
      nextMilestone: '获得第一位客户',
    },
    NO_LEADS: {
      whyThis: '业务已经有流量，但还没有把足够访客转化成潜在客户。',
      whyNow: '现在优化线索收集，可以提高每一个现有访客的价值。',
      whyNotOthers: '更多流量可以稍后再做，因为当前的收集路径需要先转化已有流量。',
      expectedOutcome: '增加合格潜在客户。',
      expectedRisk: '如果忽略线索收集，获客成本可能上升，但合格线索增长仍然偏弱。',
      nextMilestone: '获得第一位客户',
    },
    NO_CONVERSION: {
      whyThis: '现有潜在客户已经接近收入，但还没有转化成客户。',
      whyNow: '现在优化 Offer，比增加更多流量或内容更快接近收入。',
      whyNotOthers: '更多线索之后会有帮助，但当前限制是把已有兴趣推进到购买意图。',
      expectedOutcome: '提高潜在客户到客户的转化。',
      expectedRisk: '如果转化问题没有解决，线索成本可能上升，而客户增长仍然停滞。',
      nextMilestone: '获得第一位客户',
    },
    NO_CUSTOMERS: {
      whyThis: '业务已经有线索机会，需要直接推进成交。',
      whyNow: '现在转化现有线索，是获得第一位或下一位客户收入的最短路径。',
      whyNotOthers: '新的活动可以稍后再做，因为最近的机会已经在线索管道里。',
      expectedOutcome: '获得或推进一个客户机会。',
      expectedRisk: '如果不跟进现有线索，温热机会可能变冷，收入也会被延后。',
      nextMilestone: '建立留存系统',
    },
    NO_RETENTION: {
      whyThis: '业务需要留存系统，让客户价值在第一次购买后继续延续。',
      whyNow: '现在改善留存，可以保护收入，并让后续获客更有利润。',
      whyNotOthers: '新增获客之后有帮助，但当前更高杠杆是留住并重新激活客户。',
      expectedOutcome: '改善复购或客户跟进。',
      expectedRisk: '如果忽略留存，客户价值可能流失，增长也会更难持续。',
      nextMilestone: '创建 SOP',
    },
    NO_TEAM: {
      whyThis: '业务需要可重复的操作流程，执行才能从创办人手上扩展出去。',
      whyNow: '现在整理系统，可以让委派和 AI workforce 执行变得可行。',
      whyNotOthers: '更多活动可以稍后再做，因为放大手动作业会增加运营压力。',
      expectedOutcome: '建立可重复执行的运营流程。',
      expectedRisk: '如果继续缺少操作流程，增长可能会过度依赖创办人执行。',
      nextMilestone: '扩大运营',
    },
    BUSINESS_HEALTHY: {
      whyThis: '你的业务目前没有关键瓶颈。',
      whyNow: '现在优化系统，是最高杠杆的改进机会。',
      whyNotOthers: '当前阶段不需要修复型动作。',
      expectedOutcome: '提升业务整体表现。',
      expectedRisk: '如果忽略优化机会，增长速度可能会放缓。',
      nextMilestone: '扩大运营',
    },
    NO_SYSTEM: {
      whyThis: '业务信号目前不可用。',
      whyNow: '可靠建议需要先恢复业务可见性。',
      whyNotOthers: '在缺少有效信号时，任何业务建议都可能只是猜测。',
      expectedOutcome: '恢复准确的业务可见性。',
      expectedRisk: '如果重要业务信息缺失，可能会做出错误决策。',
      nextMilestone: '恢复信号',
    },
  },
  ms: {
    NO_BRAND: {
      whyThis: 'Konteks perniagaan masih belum cukup lengkap untuk menghasilkan cadangan pertumbuhan yang boleh dipercayai.',
      whyNow: 'Menjelaskan asas perniagaan sekarang mengelakkan kerja kandungan, tawaran, dan funnel dibina atas andaian yang lemah.',
      whyNotOthers: 'Kandungan, funnel, dan trafik boleh membantu kemudian, tetapi semuanya memerlukan profil perniagaan yang jelas dahulu.',
      expectedOutcome: 'Lengkapkan profil perniagaan supaya cadangan seterusnya selari dengan pasaran dan tawaran yang betul.',
      expectedRisk: 'Jika asas ini kekal kabur, tindakan pertumbuhan seterusnya mungkin menarik audiens yang salah atau mempromosikan tawaran yang salah.',
      nextMilestone: 'Tentukan Kedudukan Pasaran',
    },
    NO_POSITIONING: {
      whyThis: 'Kedudukan pasaran perlu jelas sebelum perniagaan boleh menyampaikan tawaran yang meyakinkan.',
      whyNow: 'Menetapkan positioning sekarang akan memperbaiki keputusan kandungan, pengumpulan prospek, dan jualan seterusnya.',
      whyNotOthers: 'Lebih banyak kandungan atau trafik hanya akan membesarkan mesej yang masih belum jelas.',
      expectedOutcome: 'Jelaskan tawaran, audiens, dan sudut kepercayaan.',
      expectedRisk: 'Jika positioning kekal kabur, prospek mungkin tidak faham mengapa mereka perlu percaya atau membeli.',
      nextMilestone: 'Bina Asas Kandungan',
    },
    NO_CONTENT: {
      whyThis: 'Perniagaan memerlukan asas kandungan supaya pasaran boleh menemui dan mempercayai tawaran anda.',
      whyNow: 'Kandungan sekarang membina perhatian dan kepercayaan sebelum pengumpulan prospek boleh berfungsi dengan baik.',
      whyNotOthers: 'Funnel atau kempen trafik kurang berkesan apabila kandungan yang membina kepercayaan masih belum mencukupi.',
      expectedOutcome: 'Terbitkan asas kandungan pertama.',
      expectedRisk: 'Jika kandungan masih tiada, perniagaan mungkin sukar mencipta permintaan secara konsisten.',
      nextMilestone: 'Cipta Lead Magnet',
    },
    NO_AUDIENCE: {
      whyThis: 'Perniagaan perlu mengembangkan audiens yang tepat supaya orang yang sesuai mula memberi respons kepada tawaran.',
      whyNow: 'Mengembangkan audiens yang tepat sekarang memberi sistem prospek perhatian berkualiti untuk ditukar.',
      whyNotOthers: 'Penambahbaikan pengumpulan prospek penting, tetapi mesej perlu dilihat oleh cukup ramai audiens berkualiti dahulu.',
      expectedOutcome: 'Capai lebih ramai orang yang sesuai dengan mesej semasa.',
      expectedRisk: 'Jika pertumbuhan audiens diabaikan, perniagaan mungkin terus membina aset yang terlalu sedikit orang sesuai lihat.',
      nextMilestone: 'Cipta Lead Magnet',
    },
    NO_LEAD_MAGNET: {
      whyThis: 'Perniagaan memerlukan tawaran opt-in yang jelas sebelum pelawat mempunyai sebab untuk meninggalkan maklumat hubungan.',
      whyNow: 'Mencipta lead magnet sekarang menukar perhatian sedia ada kepada penjanaan prospek yang boleh diukur.',
      whyNotOthers: 'Trafik dan automasi boleh menunggu kerana perniagaan masih memerlukan aset pengumpulan prospek yang jelas.',
      expectedOutcome: 'Cipta aset pengumpulan prospek pertama.',
      expectedRisk: 'Jika pengumpulan prospek masih tiada, pelawat berminat mungkin keluar tanpa masuk ke sistem susulan.',
      nextMilestone: 'Bina Funnel',
    },
    NO_FUNNEL: {
      whyThis: 'Perniagaan memerlukan funnel yang berfungsi untuk menghubungkan tawaran prospek, landing page, dan laluan susulan.',
      whyNow: 'Membina funnel sekarang menyediakan tempat untuk trafik bertukar dan tidak dibazirkan.',
      whyNotOthers: 'Pemerolehan trafik bernilai, tetapi menghantar trafik sebelum funnel berfungsi akan mengurangkan penukaran.',
      expectedOutcome: 'Bina laluan penukaran yang berfungsi.',
      expectedRisk: 'Jika funnel masih belum lengkap, peluang prospek mungkin bocor sebelum dapat disusuli.',
      nextMilestone: 'Aktifkan Sumber Trafik',
    },
    NO_TRAFFIC: {
      whyThis: 'Sistem funnel dan pengumpulan prospek anda telah siap. Namun tiada trafik aktif memasuki perniagaan anda.',
      whyNow: 'Tanpa trafik, semua aktiviti pertumbuhan seterusnya menjadi kurang berkesan.',
      whyNotOthers: 'Penambahbaikan kandungan adalah penting. Tetapi pemerolehan trafik memberi impak yang lebih besar pada tahap ini.',
      expectedOutcome: 'Menjana prospek pertama.',
      expectedRisk: 'Pertumbuhan perniagaan mungkin terhenti jika trafik tidak diwujudkan.',
      nextMilestone: 'Mendapat pelanggan pertama',
    },
    NO_LEADS: {
      whyThis: 'Trafik sudah wujud, tetapi perniagaan belum menukar pelawat yang cukup menjadi prospek.',
      whyNow: 'Memperbaiki pengumpulan prospek sekarang meningkatkan nilai setiap pelawat yang sudah datang.',
      whyNotOthers: 'Lebih banyak trafik boleh menunggu kerana laluan pengumpulan semasa perlu menukar trafik yang sudah ada.',
      expectedOutcome: 'Tingkatkan aliran prospek berkualiti.',
      expectedRisk: 'Jika pengumpulan prospek diabaikan, kos pemerolehan mungkin meningkat sementara pertumbuhan prospek kekal lemah.',
      nextMilestone: 'Mendapat Pelanggan Pertama',
    },
    NO_CONVERSION: {
      whyThis: 'Prospek sedia ada hampir kepada hasil, tetapi belum bertukar menjadi pelanggan.',
      whyNow: 'Memperbaiki tawaran sekarang boleh mencipta hasil lebih cepat berbanding menambah trafik atau kandungan.',
      whyNotOthers: 'Lebih banyak prospek boleh membantu kemudian, tetapi kekangan semasa ialah menukar minat sedia ada kepada niat membeli.',
      expectedOutcome: 'Tingkatkan penukaran prospek kepada pelanggan.',
      expectedRisk: 'Jika penukaran tidak diselesaikan, kos prospek mungkin meningkat sementara pertumbuhan pelanggan kekal perlahan.',
      nextMilestone: 'Mendapat Pelanggan Pertama',
    },
    NO_CUSTOMERS: {
      whyThis: 'Perniagaan mempunyai peluang prospek yang memerlukan kerja penukaran secara langsung.',
      whyNow: 'Menukar prospek sedia ada sekarang ialah laluan paling dekat kepada hasil pelanggan pertama atau seterusnya.',
      whyNotOthers: 'Kempen baharu boleh menunggu kerana peluang terdekat sudah berada dalam pipeline prospek.',
      expectedOutcome: 'Dapatkan atau majukan satu peluang pelanggan.',
      expectedRisk: 'Jika prospek sedia ada tidak diusahakan, peluang yang hangat boleh menjadi sejuk dan hasil boleh tertangguh.',
      nextMilestone: 'Bina Sistem Retensi',
    },
    NO_RETENTION: {
      whyThis: 'Perniagaan memerlukan sistem retensi supaya nilai pelanggan berterusan selepas pembelian pertama.',
      whyNow: 'Memperbaiki retensi sekarang melindungi hasil dan menjadikan pemerolehan masa depan lebih menguntungkan.',
      whyNotOthers: 'Pemerolehan baharu boleh membantu kemudian, tetapi mengekalkan dan mengaktifkan semula pelanggan ialah kekangan yang lebih tinggi impaknya sekarang.',
      expectedOutcome: 'Tingkatkan pembelian berulang atau susulan pelanggan.',
      expectedRisk: 'Jika retensi diabaikan, nilai pelanggan mungkin bocor dan pertumbuhan menjadi lebih sukar dikekalkan.',
      nextMilestone: 'Cipta SOP',
    },
    NO_TEAM: {
      whyThis: 'Perniagaan memerlukan prosedur operasi yang boleh diulang sebelum pelaksanaan boleh diskalakan melebihi pengasas.',
      whyNow: 'Mendokumentasikan sistem sekarang menjadikan delegasi dan pelaksanaan AI workforce lebih boleh dilakukan.',
      whyNotOthers: 'Kempen tambahan boleh menunggu kerana menskalakan aliran kerja manual akan meningkatkan tekanan operasi.',
      expectedOutcome: 'Bina aliran kerja operasi yang boleh diulang.',
      expectedRisk: 'Jika prosedur operasi masih tiada, pertumbuhan mungkin terlalu bergantung pada usaha pengasas.',
      nextMilestone: 'Skalakan Operasi',
    },
    BUSINESS_HEALTHY: {
      whyThis: 'Perniagaan anda kini tiada bottleneck kritikal.',
      whyNow: 'Peluang pengoptimuman memberi peningkatan paling tinggi impaknya pada tahap ini.',
      whyNotOthers: 'Tiada tindakan pembaikan diperlukan pada tahap ini.',
      expectedOutcome: 'Tingkatkan prestasi perniagaan.',
      expectedRisk: 'Pertumbuhan mungkin perlahan jika peluang pengoptimuman diabaikan.',
      nextMilestone: 'Skalakan Operasi',
    },
    NO_SYSTEM: {
      whyThis: 'Isyarat perniagaan tidak tersedia.',
      whyNow: 'Cadangan yang boleh dipercayai memerlukan keterlihatan perniagaan dipulihkan dahulu.',
      whyNotOthers: 'Sebarang cadangan perniagaan akan menjadi spekulatif tanpa isyarat yang sah.',
      expectedOutcome: 'Pulihkan keterlihatan perniagaan yang tepat.',
      expectedRisk: 'Keputusan yang salah mungkin dibuat jika maklumat penting perniagaan tiada.',
      nextMilestone: 'Pemulihan Isyarat',
    },
  },
};

const EXPLAINABILITY_UNAVAILABLE: Record<ExplainabilityLocale, ExplainabilityTemplate> = {
  en: {
    whyThis: 'Explanation temporarily unavailable.',
    whyNow: 'Business context is being refreshed.',
    whyNotOthers: 'Alternative analysis unavailable.',
    expectedOutcome: 'Restore recommendation visibility.',
    expectedRisk: 'Reduced decision transparency.',
    nextMilestone: 'Explainability Recovery',
  },
  zh: {
    whyThis: '解释暂时不可用。',
    whyNow: '业务上下文正在刷新。',
    whyNotOthers: '其他方案分析暂时不可用。',
    expectedOutcome: '恢复建议可见性。',
    expectedRisk: '决策透明度会暂时降低。',
    nextMilestone: '解释恢复',
  },
  ms: {
    whyThis: 'Penjelasan sementara tidak tersedia.',
    whyNow: 'Konteks perniagaan sedang dikemas kini.',
    whyNotOthers: 'Analisis alternatif tidak tersedia.',
    expectedOutcome: 'Pulihkan keterlihatan cadangan.',
    expectedRisk: 'Ketelusan keputusan berkurang sementara.',
    nextMilestone: 'Pemulihan Penjelasan',
  },
};

function normalizeLocale(value?: string | null): ExplainabilityLocale | null {
  if (!value) return null;
  const normalized = value.toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LOCALES.includes(normalized as ExplainabilityLocale)
    ? normalized as ExplainabilityLocale
    : null;
}

export function resolveExplainabilityLocale(input: {
  locale?: string | null;
  userPreference?: string | null;
  workspaceSetting?: string | null;
  browserLocale?: string | null;
} = {}): ExplainabilityLocale {
  return normalizeLocale(input.locale)
    ?? normalizeLocale(input.userPreference)
    ?? normalizeLocale(input.workspaceSetting)
    ?? normalizeLocale(input.browserLocale)
    ?? 'en';
}

export function resolveExplainability(input: {
  bottleneckResult: BottleneckResult;
  priorityResult: PriorityResult;
  locale?: string | null;
}): ExplainabilityResult {
  const locale = resolveExplainabilityLocale({ locale: input.locale });
  const template = TEMPLATES[locale]?.[input.bottleneckResult.bottleneck] ?? EXPLAINABILITY_UNAVAILABLE[locale];
  return {
    ...template,
    locale,
    source: 'ExplainabilityEngine',
  };
}

export const explainabilityEngine = {
  resolve: resolveExplainability,
  resolveLocale: resolveExplainabilityLocale,
};
