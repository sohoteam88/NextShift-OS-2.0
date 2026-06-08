import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError, getLocalizedErrorMessage, getRequestLocale } from './errors';

type ApiHandler = (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> | Record<string, string> },
) => Promise<Response>;

export function apiHandler(handler: ApiHandler): ApiHandler {
  return async (request, context) => {
    const locale = getRequestLocale(request);
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
          {
            error: {
              code: error.code,
              message: getLocalizedErrorMessage(error.code, locale, error.message),
              details: error.details,
            },
          },
          { status: error.statusCode },
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
  };
}
