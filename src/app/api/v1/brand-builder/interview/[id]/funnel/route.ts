import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { AppError } from '@/lib/errors';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';
import { brandInterviewService } from '@/modules/brand-builder/services/brand-interview-service';

export const dynamic = 'force-dynamic';

async function getId(context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined) {
  return (await Promise.resolve(context!.params)).id;
}

export const POST = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const id = await getId(context);
  const body = (await request.json()) as {
    action?: string;
    option_id?: string;
    facts?: string[];
    skip?: boolean;
  };

  if (body.action === 'select' && typeof body.option_id === 'string') {
    const data = await brandInterviewService.selectForkedInterviewOption(id, user, body.option_id);
    return NextResponse.json({ data });
  }
  if (body.action === 'previous') {
    const data = await brandInterviewService.goToPreviousForkedInterviewTopic(id, user);
    return NextResponse.json({ data });
  }
  if (body.action === 'facts') {
    if (body.facts !== undefined && (!Array.isArray(body.facts) || !body.facts.every((fact) => typeof fact === 'string'))) {
      throw new AppError('VALIDATION_ERROR', 400, 'facts must be an array of strings');
    }
    const data = await brandInterviewService.saveForkedInterviewFacts(id, user, body.facts ?? [], body.skip === true);
    return NextResponse.json({ data });
  }
  if (body.action === 'generate') {
    const data = await brandInterviewService.generateForkedInterviewConfirmation(id, user);
    return NextResponse.json({ data });
  }
  if (body.action === 'confirm') {
    const data = await brandInterviewService.confirmForkedInterviewTopic(id, user);
    const mission = data.state.phase === 'completed'
      ? await notifyMissionProgress(user, 'brand_dna_confirmed')
      : null;
    return NextResponse.json({ data, mission });
  }
  throw new AppError('VALIDATION_ERROR', 400, 'Unsupported funnel action');
});
