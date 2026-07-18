import { defaultLocale, type Locale } from '../i18n/config';

export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message?: string,
    public details?: unknown,
  ) {
    super(message || code);
    this.name = 'AppError';
  }
}

export const ERROR_MESSAGES: Record<Locale, Record<string, string>> = {
  zh: {
    UNAUTHORIZED: '请先登录',
    FORBIDDEN: '你没有权限执行此操作',
    NOT_FOUND: '找不到请求的资源',
    VALIDATION_ERROR: '输入数据有误，请检查后重试',
    CONFLICT: '数据冲突，该记录可能已存在',
    QUOTA_EXCEEDED: '已达到使用上限，请联系管理员升级',
    RATE_LIMITED: '操作过于频繁，请稍后再试',
    INTERNAL_ERROR: '系统出错了，请稍后再试',
    AI_PROVIDER_ERROR: 'AI 服务暂时不可用，请稍后再试',
    FILE_TOO_LARGE: '文件太大，请选择较小的文件',
    INVALID_INVITE: '邀请链接无效或已过期',
    MEMBER_PENDING: '你的账号正在审核中',
    TENANT_DELETED: '此工作区已删除',
    TENANT_DELETED_TERMINAL: '已删除的工作区无法恢复',
    AUDIT_IDEMPOTENCY_CONFLICT: '审计记录冲突',
  },
  en: {
    UNAUTHORIZED: 'Please log in first',
    FORBIDDEN: "You don't have permission for this action",
    NOT_FOUND: 'The requested resource was not found',
    VALIDATION_ERROR: 'Invalid input, please check and try again',
    CONFLICT: 'Data conflict, this record may already exist',
    QUOTA_EXCEEDED: 'Usage limit reached, please contact admin to upgrade',
    RATE_LIMITED: 'Too many requests, please try again later',
    INTERNAL_ERROR: 'Something went wrong, please try again later',
    AI_PROVIDER_ERROR: 'AI service temporarily unavailable, please try again',
    FILE_TOO_LARGE: 'File too large, please choose a smaller file',
    INVALID_INVITE: 'Invite link is invalid or expired',
    MEMBER_PENDING: 'Your account is pending approval',
    TENANT_DELETED: 'This tenant has been deleted',
    TENANT_DELETED_TERMINAL: 'A deleted tenant cannot be restored',
    AUDIT_IDEMPOTENCY_CONFLICT: 'Audit event conflict',
  },
  ms: {
    UNAUTHORIZED: 'Sila log masuk terlebih dahulu',
    FORBIDDEN: 'Anda tiada kebenaran untuk tindakan ini',
    NOT_FOUND: 'Sumber yang diminta tidak dijumpai',
    VALIDATION_ERROR: 'Input tidak sah, sila semak dan cuba lagi',
    CONFLICT: 'Konflik data, rekod ini mungkin sudah wujud',
    QUOTA_EXCEEDED: 'Had penggunaan dicapai, sila hubungi admin untuk naik taraf',
    RATE_LIMITED: 'Terlalu banyak permintaan, sila cuba sebentar lagi',
    INTERNAL_ERROR: 'Sesuatu tidak kena, sila cuba sebentar lagi',
    AI_PROVIDER_ERROR: 'Perkhidmatan AI tidak tersedia buat sementara',
    FILE_TOO_LARGE: 'Fail terlalu besar, sila pilih fail yang lebih kecil',
    INVALID_INVITE: 'Pautan jemputan tidak sah atau telah tamat tempoh',
    MEMBER_PENDING: 'Akaun anda sedang menunggu kelulusan',
    TENANT_DELETED: 'Ruang kerja ini telah dipadamkan',
    TENANT_DELETED_TERMINAL: 'Ruang kerja yang dipadamkan tidak boleh dipulihkan',
    AUDIT_IDEMPOTENCY_CONFLICT: 'Konflik acara audit',
  },
};

export function getRequestLocale(request: { cookies?: { get(name: string): { value?: string } | undefined }; headers?: Headers }): Locale {
  const cookieLocale = request.cookies?.get('NEXT_LOCALE')?.value;
  if (cookieLocale === 'zh' || cookieLocale === 'en' || cookieLocale === 'ms') {
    return cookieLocale;
  }

  const acceptLanguage = request.headers?.get('accept-language')?.toLowerCase() ?? '';
  if (acceptLanguage.includes('zh')) return 'zh';
  if (acceptLanguage.includes('ms')) return 'ms';
  if (acceptLanguage.includes('en')) return 'en';
  return defaultLocale;
}

export function getLocalizedErrorMessage(code: string, locale: Locale = defaultLocale, fallback?: string) {
  return ERROR_MESSAGES[locale]?.[code]
    ?? ERROR_MESSAGES[defaultLocale]?.[code]
    ?? fallback
    ?? code;
}

export const Errors = {
  UNAUTHORIZED: new AppError('UNAUTHORIZED', 401, 'Authentication required'),
  FORBIDDEN: new AppError('FORBIDDEN', 403, 'Insufficient permissions'),
  NOT_FOUND: (resource: string) => new AppError('NOT_FOUND', 404, `${resource} not found`),
  VALIDATION: (message: string) => new AppError('VALIDATION_ERROR', 400, message),
  CONFLICT: (message: string) => new AppError('CONFLICT', 409, message),
  INTERNAL: new AppError('INTERNAL_ERROR', 500, 'Internal server error'),
  QUOTA_EXCEEDED: (message = 'Usage limit reached') => new AppError('QUOTA_EXCEEDED', 429, message),
  RATE_LIMITED: (message = 'Too many requests') => new AppError('RATE_LIMITED', 429, message),
  AI_PROVIDER_ERROR: (message = 'AI service temporarily unavailable') => new AppError('AI_PROVIDER_ERROR', 503, message),
  FILE_TOO_LARGE: (message = 'File too large') => new AppError('FILE_TOO_LARGE', 413, message),
  INVALID_INVITE: (message = 'Invalid invite link') => new AppError('INVALID_INVITE', 400, message),
  MEMBER_PENDING: (message = 'Your account is pending approval') => new AppError('MEMBER_PENDING', 403, message),
} as const;
