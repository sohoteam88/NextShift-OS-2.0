export type InterviewQuestion = {
  id: string;
  text: string;
  category: string;
  options?: string[];
};

export const INTERVIEW_QUESTIONS: Record<string, InterviewQuestion[]> = {
  zh: [
    { id: 'q1', text: '你的职业或身份是什么？（例如：全职妈妈、营养师、上班族）', category: 'identity' },
    { id: 'q2', text: '你有什么特别的经历或转变？（例如：产后减重、克服健康问题）', category: 'story' },
    { id: 'q3', text: '你最擅长什么？在什么方面别人常来找你帮忙？', category: 'expertise' },
    { id: 'q4', text: '你最想帮助什么样的人？他们最大的困扰是什么？', category: 'audience' },
    {
      id: 'q5',
      text: '你希望别人怎么看你？',
      category: 'personality',
      options: ['专业可靠', '亲切温暖', '励志激励', '有趣好玩'],
    },
    {
      id: 'q6',
      text: '你打算在哪个平台发展？',
      category: 'platforms',
      options: ['Facebook', 'Instagram', '两个都要', 'TikTok', '小红书'],
    },
    { id: 'q7', text: '你有没有欣赏或想参考的账号？（名字或链接）', category: 'references' },
    {
      id: 'q8',
      text: '你每天能花多少时间做社交媒体内容？',
      category: 'capacity',
      options: ['15 分钟', '30 分钟', '1 小时', '1 小时以上'],
    },
  ],
  en: [
    {
      id: 'q1',
      text: 'What is your occupation or identity? (e.g., stay-at-home mom, nutritionist, office worker)',
      category: 'identity',
    },
    {
      id: 'q2',
      text: 'Do you have a special experience or transformation? (e.g., postpartum weight loss, overcoming health issues)',
      category: 'story',
    },
    {
      id: 'q3',
      text: 'What are you best at? What do people often come to you for help with?',
      category: 'expertise',
    },
    {
      id: 'q4',
      text: 'Who do you most want to help? What is their biggest struggle?',
      category: 'audience',
    },
    {
      id: 'q5',
      text: 'How do you want others to see you?',
      category: 'personality',
      options: ['Professional', 'Friendly & warm', 'Inspirational', 'Fun & playful'],
    },
    {
      id: 'q6',
      text: 'Which platforms do you want to build on?',
      category: 'platforms',
      options: ['Facebook', 'Instagram', 'Both', 'TikTok', 'Xiaohongshu'],
    },
    { id: 'q7', text: 'Any accounts you admire or want to reference? (names or links)', category: 'references' },
    {
      id: 'q8',
      text: 'How much time can you spend daily on social media content?',
      category: 'capacity',
      options: ['15 minutes', '30 minutes', '1 hour', 'More than 1 hour'],
    },
  ],
  ms: [
    { id: 'q1', text: 'Apakah pekerjaan atau identiti anda?', category: 'identity' },
    { id: 'q2', text: 'Adakah anda mempunyai pengalaman atau perubahan yang istimewa?', category: 'story' },
    { id: 'q3', text: 'Apakah yang paling anda mahir?', category: 'expertise' },
    { id: 'q4', text: 'Siapa yang paling anda ingin bantu? Apakah masalah terbesar mereka?', category: 'audience' },
    {
      id: 'q5',
      text: 'Bagaimana anda mahu orang lain melihat anda?',
      category: 'personality',
      options: ['Profesional', 'Mesra', 'Inspirasi', 'Menyeronokkan'],
    },
    {
      id: 'q6',
      text: 'Platform mana yang anda ingin bangunkan?',
      category: 'platforms',
      options: ['Facebook', 'Instagram', 'Kedua-dua', 'TikTok', 'Xiaohongshu'],
    },
    { id: 'q7', text: 'Ada akaun yang anda kagumi atau ingin rujuk?', category: 'references' },
    {
      id: 'q8',
      text: 'Berapa banyak masa anda boleh luangkan setiap hari untuk kandungan media sosial?',
      category: 'capacity',
      options: ['15 minit', '30 minit', '1 jam', 'Lebih 1 jam'],
    },
  ],
};

export const VOICE_INTERVIEW_PROMPT: Record<string, string> = {
  zh: '请用 2-5 分钟介绍你自己：你的背景、经历、你擅长什么、你想帮助什么样的人、你希望在社交媒体上展示什么样的形象。想到什么就说什么，不需要完美。',
  en: "Please take 2-5 minutes to introduce yourself: your background, experiences, what you're good at, who you want to help, and what image you want to present on social media. Just speak freely.",
  ms: 'Sila ambil 2-5 minit untuk memperkenalkan diri anda: latar belakang, pengalaman, kepakaran, siapa yang ingin anda bantu, dan imej yang ingin anda tunjukkan di media sosial.',
};

export const SKIPPABLE_QUESTIONS = new Set(['q7', 'q8']);
