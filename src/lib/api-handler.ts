import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError, getLocalizedErrorMessage, getRequestLocale } from './errors';
import { refundAiRateLimits, runWithAiRateLimitRefunds } from './ai-rate-limit';

type ApiHandler = (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> | Record<string, string> },
) => Promise<Response>;

export function apiHandler(handler: ApiHandler): ApiHandler {
  return async (request, context) => {
    const locale = getRequestLocale(request);
    return runWithAiRateLimitRefunds(async () => {
    try {
      return await handler(request, context);
    } catch (error) {
      // Validation and 4xx application errors are user-caused; provider and
      // unexpected failures should not consume an AI-generation allowance.
      if (!(error instanceof ZodError) && (!(error instanceof AppError) || error.statusCode >= 500)) {
        await refundAiRateLimits();
      }
      if (error instanceof AppError) {
        const rateDetails = error.code === 'RATE_LIMITED' && error.details && typeof error.details === 'object'
          ? error.details as { remaining?: number; retryAfterSeconds?: number }
          : null;
        const retryAfterSeconds = Math.max(1, rateDetails?.retryAfterSeconds ?? 1);
        const rateMessage = error.code === 'RATE_LIMITED'
          ? `${getLocalizedErrorMessage(error.code, locale, error.message)}，约 ${Math.ceil(retryAfterSeconds / 60)} 分钟后可重试。`
          : getLocalizedErrorMessage(error.code, locale, error.message);
        return NextResponse.json(
          {
            error: {
              code: error.code,
              message: rateMessage,
              details: error.details,
            },
          },
          {
            status: error.statusCode,
            headers: rateDetails
              ? {
                  'Retry-After': String(retryAfterSeconds),
                  'X-RateLimit-Remaining': String(rateDetails.remaining ?? 0),
                }
              : undefined,
          },
        );
      }

      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: getLocalizedErrorMessage('VALIDATION_ERROR', locale),
              details: error.issues,
            },
          },
          { status: 400 },
        );
      }

      console.error('Unhandled API error:', error);
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: getLocalizedErrorMessage('INTERNAL_ERROR', locale),
          },
        },
        { status: 500 },
      );
    }
    });
  };
}
