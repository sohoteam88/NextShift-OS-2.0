import { AppError } from './errors';

export function assertRequestBodySize(
  request: Request,
  maxBytes: number,
  label = 'Request body',
) {
  const contentLength = request.headers.get('content-length');
  if (!contentLength) return;

  const parsed = Number(contentLength);
  if (Number.isFinite(parsed) && parsed > maxBytes) {
    throw new AppError('FILE_TOO_LARGE', 413, `${label} exceeds the allowed size`);
  }
}
