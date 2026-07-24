const INTERNAL_FIELD_LABELS: Record<string, string> = {
  'leadMagnet.exists': '引流资源已创建',
  'leadMagnet.published': '引流资源已发布',
  'facebook.cta': 'Facebook 行动按钮',
  'facebook.pageName': 'Facebook 主页名称',
  'content.draftCreated': '内容草稿已创建',
  'businessProfile.exists': '业务资料已完成',
};

export function userFacingCopy(value: string) {
  let copy = value
    .replace(/Create Your First Lead Magnet/g, '创建你的第一个引流资源')
    .replace(/引流磁铁/g, '引流资源')
    .replace(/AI COO/g, 'AI 教练');
  for (const [field, label] of Object.entries(INTERNAL_FIELD_LABELS)) {
    copy = copy.replaceAll(field, label);
  }
  return copy;
}

export function humanizeEstimatedTime(value: string) {
  const match = value.match(/(\d+(?:\.\d+)?)\s*(?:hours?|小时)/i);
  if (!match) return userFacingCopy(value);
  const hours = Number(match[1]);
  if (!Number.isFinite(hours) || hours < 24) return `约 ${Math.max(1, Math.ceil(hours))} 小时`;
  return `约 ${Math.max(1, Math.ceil(hours / 24))} 天`;
}
