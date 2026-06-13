import type { TranslationMemoryEntry, SupportedLanguage } from './types';

export const TRANSLATION_MEMORY: TranslationMemoryEntry[] = [
  { term: 'NextShift', translations: { en: 'NextShift', 'zh-CN': 'NextShift', 'zh-TW': 'NextShift', 'ms-MY': 'NextShift' }, category: 'brand' },
  { term: 'Personal Brand', translations: { en: 'Personal Brand', 'zh-CN': '个人品牌', 'zh-TW': '個人品牌', 'ms-MY': 'Jenama Peribadi' }, category: 'core' },
  { term: 'Side Income', translations: { en: 'Side Income', 'zh-CN': '副业收入', 'zh-TW': '副業收入', 'ms-MY': 'Pendapatan Sampingan' }, category: 'core' },
  { term: 'Business Blueprint', translations: { en: 'Business Blueprint', 'zh-CN': '商业蓝图', 'zh-TW': '商業藍圖', 'ms-MY': 'Pelan Perniagaan' }, category: 'core' },
  { term: 'AI Assistant', translations: { en: 'AI Assistant', 'zh-CN': 'AI助理', 'zh-TW': 'AI助理', 'ms-MY': 'Pembantu AI' }, category: 'product' },
  { term: 'Lead Magnet', translations: { en: 'Lead Magnet', 'zh-CN': '引流磁铁', 'zh-TW': '引流磁鐵', 'ms-MY': 'Magnet Pelanggan' }, category: 'product' },
  { term: 'Free Assessment', translations: { en: 'Free Assessment', 'zh-CN': '免费评估', 'zh-TW': '免費評估', 'ms-MY': 'Penilaian Percuma' }, category: 'cta' },
  { term: 'Get Started', translations: { en: 'Get Started', 'zh-CN': '立即开始', 'zh-TW': '立即開始', 'ms-MY': 'Mula Sekarang' }, category: 'cta' },
  { term: 'Book Consultation', translations: { en: 'Book Consultation', 'zh-CN': '预约咨询', 'zh-TW': '預約諮詢', 'ms-MY': 'Tempah Konsultasi' }, category: 'cta' },
  { term: 'WhatsApp', translations: { en: 'WhatsApp', 'zh-CN': 'WhatsApp', 'zh-TW': 'WhatsApp', 'ms-MY': 'WhatsApp' }, category: 'platform' },
  { term: 'Webinar', translations: { en: 'Webinar', 'zh-CN': '线上讲座', 'zh-TW': '線上講座', 'ms-MY': 'Webinar' }, category: 'product' },
  { term: 'Funnel', translations: { en: 'Funnel', 'zh-CN': '销售漏斗', 'zh-TW': '銷售漏斗', 'ms-MY': 'Corong Jualan' }, category: 'product' },
  { term: 'Content Calendar', translations: { en: 'Content Calendar', 'zh-CN': '内容日历', 'zh-TW': '內容日曆', 'ms-MY': 'Kalendar Kandungan' }, category: 'product' },
];

export function translateTerm(term: string, language: SupportedLanguage): string {
  const entry = TRANSLATION_MEMORY.find(e => e.term.toLowerCase() === term.toLowerCase());
  return entry?.translations[language] ?? term;
}

export function getTermsByCategory(category: string): TranslationMemoryEntry[] {
  return TRANSLATION_MEMORY.filter(e => e.category === category);
}
