import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prisma: {
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
    user: { findUnique: vi.fn() },
    videoProject: {
      findFirst: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn(), count: vi.fn(),
    },
    contentCalendar: { updateMany: vi.fn() },
  },
  masterScript: { generateScript: vi.fn(), regenerateScene: vi.fn() },
  shotList: { generate: vi.fn() },
  broll: { generate: vi.fn() },
  aiPrompt: { generateVeoPrompt: vi.fn(), generateMiniMaxPrompt: vi.fn() },
  capcut: { generate: vi.fn() },
  adaptation: { generate: vi.fn() },
  subtitle: { generateSRT: vi.fn() },
  performance: { create: vi.fn() },
  brand: vi.fn(),
  brandDnaVersion: vi.fn(),
  runGeneration: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ default: mocks.prisma }));
vi.mock('@/modules/mission/utils/complete-mission', () => ({ notifyMissionProgress: vi.fn() }));
vi.mock('@/modules/video/services/master-script-service', () => ({ masterScriptService: mocks.masterScript }));
vi.mock('@/modules/video/services/shot-list-service', () => ({ shotListService: mocks.shotList }));
vi.mock('@/modules/video/services/broll-service', () => ({ brollService: mocks.broll }));
vi.mock('@/modules/video/services/ai-video-prompt-service', () => ({ aiVideoPromptService: mocks.aiPrompt }));
vi.mock('@/modules/video/services/capcut-service', () => ({ capcutService: mocks.capcut }));
vi.mock('@/modules/video/services/platform-adaptation-service', () => ({ platformAdaptationService: mocks.adaptation }));
vi.mock('@/modules/video/services/subtitle-service', () => ({ subtitleService: mocks.subtitle }));
vi.mock('@/modules/brand-builder/services/post-performance-service', () => ({ postPerformanceService: mocks.performance }));
vi.mock('@/modules/brand-dna/services/BrandContextProvider', () => ({
  getBrandContext: mocks.brand,
  getBrandDnaVersion: mocks.brandDnaVersion,
}));
vi.mock('@/modules/ai/generation', async () => ({
  ...(await vi.importActual<typeof import('@/modules/ai/generation')>('@/modules/ai/generation')),
  runGeneration: mocks.runGeneration,
}));

import { writeClipboardText } from '@/lib/clipboard';
import { leadMagnetDeleteSchema, leadMagnetPatchSchema } from '@/modules/lead-magnet/input';
import { generateLeadMagnetTracks, reconcileLeadMagnetTrack } from '@/modules/lead-magnet/leadMagnetGeneration';
import { leadMagnetService } from '@/modules/lead-magnet/leadMagnetService';
import type { LeadMagnetConfig } from '@/modules/lead-magnet/types';
import { productionPlanService } from '@/modules/video/services/production-plan-service';
import { videoFinalizeService } from '@/modules/video/services/video-finalize-service';
import { videoProjectService } from '@/modules/video/services/video-project-service';
import type { MasterScript } from '@/modules/video/types';
import { generateFullWebinar } from '@/modules/webinar-center/webinarGenerators';
import { webinarDeleteSchema, webinarPatchSchema } from '@/modules/webinar-center/input';
import { webinarService } from '@/modules/webinar-center/webinarService';
import type { WebinarPackage } from '@/modules/webinar-center/types';
import { generateWebinarWithReconciliation, reconcileWebinarGeneration } from '@/modules/webinar-center/webinarGeneration';

const user = { id: 'user-a', tenantId: 'tenant-a', email: 'member@example.test', role: 'member' as const, name: 'Member', preferredLanguage: 'zh', status: 'active' as const };
const exactWhere = { id: 'video-1', tenantId: user.tenantId, userId: user.id };
const scene = { scene_number: 1, time_range: '0-5s', purpose: 'hook', visual: 'visual', text_overlay: 'text', voiceover: 'voice', emotion: 'curious' };
const script = { scenes: [scene], cta: scene } as unknown as MasterScript;
const brand = { personalName: 'Steven', brandName: 'NextShift', positioning: 'AI operator', audience: 'founders', audiencePainPoints: [], messaging: { coreMessage: 'system', uniqueAngle: 'clarity', elevatorPitch: 'clarity' }, offer: { primary: 'OS', transformation: 'growth' } };
const cta = { headline: 'CTA', buttonText: 'Go', description: 'CTA', whatsappCta: 'WhatsApp', funnelCta: 'Funnel' };
const lead = (track: 'retail' | 'recruitment', id = `lm-${track}`): LeadMagnetConfig => ({ id, type: 'guide', track, title: `${track} title`, promise: 'promise', description: 'body', audiencePain: 'pain', resultPage: { scoreLabel: 'A', categoryLabel: 'A', explanation: 'A', recommendations: [], nextAction: 'A', cta }, cta, segmentation: { leadScore: 'A', nextAction: 'A', followUpStrategy: 'A' }, qualityScore: 80, status: 'generated', createdAt: '2026-07-19T00:00:00.000Z', updatedAt: '2026-07-19T00:00:00.000Z' });

describe('E3B stable GAP executable fixtures', () => {
  let metadata: Record<string, unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    metadata = { unrelated: { locale: 'zh-MY' } };
    mocks.brand.mockResolvedValue(brand);
    mocks.brandDnaVersion.mockResolvedValue(1);
    mocks.runGeneration.mockImplementation(async (_user, options) => ({
      status: 'degraded', source: 'template_fallback', value: options.fallback,
      userVisibleLabel: 'AI 暂时不可用，这是基础版本', reason: 'test fallback',
    }));
    mocks.prisma.$transaction.mockImplementation(async (callback: (tx: typeof mocks.prisma) => Promise<unknown>) => callback(mocks.prisma));
    mocks.prisma.user.findUnique.mockImplementation(async () => ({ metadata, updatedAt: new Date('2026-07-19T00:00:00.000Z') }));
    mocks.prisma.$queryRaw.mockImplementation(async (query: { strings?: string[]; values?: unknown[] }) => {
      const values = query.values ?? [];
      if ((query.strings ?? []).join(' ').includes('FOR UPDATE')) return [{ id: user.id }];
      const serialized = values.find((value) => typeof value === 'string' && value.startsWith('{'));
      if (typeof serialized === 'string') {
        const value = JSON.parse(serialized) as Record<string, unknown>;
        if (value.track === 'retail' || value.track === 'recruitment') {
          const requestedId = values.find((entry) => typeof entry === 'string' && entry.startsWith('lm-'));
          const existing = ((metadata.lead_magnet_tracks as Record<string, LeadMagnetConfig> | undefined) ?? {})[value.track];
          if ((query.strings ?? []).join(' ').includes('#>>') && existing?.id !== requestedId) return [];
          const tracks = { ...((metadata.lead_magnet_tracks as Record<string, unknown>) ?? {}), [value.track]: value };
          metadata = { ...metadata, lead_magnet_tracks: tracks, ...(value.track === 'retail' ? { lead_magnet: value } : {}) };
        } else if ('topic' in value) {
          const requestedId = values.find((entry) => typeof entry === 'string' && entry.startsWith('webinar-'));
          if ((query.strings ?? []).join(' ').includes('#>>') && (metadata.webinar as WebinarPackage | undefined)?.id !== requestedId) return [];
          metadata = { ...metadata, webinar: value };
        }
        return [{ id: user.id }];
      }
      const sql = (query.strings ?? []).join(' ');
      if (sql.includes("#- '{lead_magnet_tracks")) {
        const id = values.find((value) => typeof value === 'string' && value.startsWith('lm-'));
        const tracks = { ...((metadata.lead_magnet_tracks as Record<string, unknown>) ?? {}) };
        const track = (tracks.retail as LeadMagnetConfig | undefined)?.id === id ? 'retail' : (tracks.recruitment as LeadMagnetConfig | undefined)?.id === id ? 'recruitment' : null;
        if (!track) return [];
        delete tracks[track]; metadata = { ...metadata, lead_magnet_tracks: tracks };
        if (track === 'retail') delete metadata.lead_magnet;
        return [{ id: user.id }];
      }
      if (sql.includes("- 'webinar'")) {
        const id = values.find((value) => typeof value === 'string' && value.startsWith('webinar-'));
        if ((metadata.webinar as WebinarPackage | undefined)?.id !== id) return [];
        delete metadata.webinar; return [{ id: user.id }];
      }
      return [];
    });
  });

  it('E3-GAP-VIDEO-01: every exact read/mutation fails closed for a same-tenant non-owner', async () => {
    mocks.prisma.videoProject.findFirst.mockResolvedValue(null);
    mocks.prisma.videoProject.deleteMany.mockResolvedValue({ count: 0 });
    expect(await videoProjectService.get(user, 'video-1')).toBeNull();
    await expect(videoProjectService.generateFullScript(user, 'video-1', {} as never, {} as never)).rejects.toMatchObject({ statusCode: 404 });
    await expect(videoProjectService.regenerateScene(user, 'video-1', 1, 'change')).rejects.toMatchObject({ statusCode: 404 });
    await expect(productionPlanService.generateProductionPlan(user, 'video-1')).rejects.toMatchObject({ statusCode: 404 });
    await expect(videoFinalizeService.finalize(user, 'video-1')).rejects.toMatchObject({ statusCode: 404 });
    await expect(videoFinalizeService.markPublished(user, 'video-1')).rejects.toMatchObject({ statusCode: 404 });
    await expect(videoProjectService.delete(user, 'video-1')).rejects.toMatchObject({ statusCode: 404 });
    expect(mocks.prisma.videoProject.findFirst).toHaveBeenCalledWith({ where: exactWhere });
    expect(mocks.prisma.videoProject.updateMany).not.toHaveBeenCalled();
    expect(mocks.masterScript.generateScript).not.toHaveBeenCalled();
    expect(mocks.performance.create).not.toHaveBeenCalled();
  });

  it('E3-GAP-VIDEO-01: the exact owner can reopen and persist script/plan/finalize/publish updates', async () => {
    const project = { ...exactWhere, masterScript: script, strategy: {}, style: 'talking_head', platform: 'instagram_reel', contentPillar: 'authority', calendarId: null, performanceId: null, platformAdaptations: null };
    mocks.prisma.videoProject.findFirst.mockResolvedValue(project);
    mocks.prisma.videoProject.updateMany.mockResolvedValue({ count: 1 });
    mocks.prisma.videoProject.count.mockResolvedValue(0);
    mocks.masterScript.generateScript.mockResolvedValue(script);
    mocks.shotList.generate.mockResolvedValue([]); mocks.broll.generate.mockResolvedValue([]);
    mocks.capcut.generate.mockResolvedValue({}); mocks.adaptation.generate.mockResolvedValue([]); mocks.subtitle.generateSRT.mockReturnValue('subtitle');
    await expect(videoProjectService.get(user, 'video-1')).resolves.toEqual(project);
    await videoProjectService.generateFullScript(user, 'video-1', {} as never, {} as never);
    await productionPlanService.generateProductionPlan(user, 'video-1');
    await videoFinalizeService.finalize(user, 'video-1');
    await videoFinalizeService.markPublished(user, 'video-1');
    expect(mocks.prisma.videoProject.updateMany).toHaveBeenCalledTimes(4);
    for (const call of mocks.prisma.videoProject.updateMany.mock.calls) expect(call[0].where).toEqual(exactWhere);
  });

  it('E3-GAP-VIDEO-02: clipboard completion is awaited and rejection remains observable', async () => {
    let release!: () => void;
    const promise = new Promise<void>((resolve) => { release = resolve; });
    const clipboard = { writeText: vi.fn(() => promise) };
    let settled = false; const operation = writeClipboardText('current scene', clipboard).then(() => { settled = true; });
    await Promise.resolve(); expect(settled).toBe(false); expect(clipboard.writeText).toHaveBeenCalledWith('current scene');
    release(); await operation; expect(settled).toBe(true);
    await expect(writeClipboardText('current script', { writeText: vi.fn().mockRejectedValue(new Error('denied')) })).rejects.toThrow('denied');
  });

  it('E3-GAP-VIDEO-03: exact-owner delete succeeds once and an unmatched owner never mutates', async () => {
    mocks.prisma.videoProject.deleteMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    await expect(videoProjectService.delete(user, 'video-1')).resolves.toEqual({ deleted: true });
    await expect(videoProjectService.delete(user, 'video-1')).rejects.toMatchObject({ statusCode: 404 });
    expect(mocks.prisma.videoProject.deleteMany).toHaveBeenNthCalledWith(1, { where: exactWhere });
    expect(mocks.prisma.videoProject.deleteMany).toHaveBeenNthCalledWith(2, { where: exactWhere });
  });

  it('E3-GAP-LEAD-MAGNET-01: same-ID save preserves identity/createdAt/unrelated metadata and rejects a stale ID', async () => {
    const retail = lead('retail'); metadata = { ...metadata, lead_magnet: retail, lead_magnet_tracks: { retail } };
    const saved = await leadMagnetService.updateTrack(user.id, 'retail', retail.id, { title: 'edited', whatsappCta: 'new CTA' });
    expect(saved.id).toBe(retail.id); expect(saved.createdAt).toBe(retail.createdAt); expect(saved.title).toBe('edited'); expect(saved.updatedAt).not.toBe(retail.updatedAt);
    expect(metadata.unrelated).toEqual({ locale: 'zh-MY' });
    await expect(leadMagnetService.updateTrack(user.id, 'retail', 'lm-stale', { title: 'no' })).rejects.toMatchObject({ statusCode: 404 });
    expect(() => leadMagnetPatchSchema.parse({ id: retail.id, track: 'retail', title: 'x'.repeat(201) })).toThrow();
    expect(() => leadMagnetPatchSchema.parse({ id: retail.id, track: 'retail', title: 'valid', tenantId: 'injected' })).toThrow();
    expect(() => leadMagnetDeleteSchema.parse({ id: retail.id, track: 'unknown' })).toThrow();
  });

  it('E3-GAP-LEAD-MAGNET-02: current track copy awaits the exact current editor value', async () => {
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
    await writeClipboardText('retail edited\n\ncurrent body', clipboard);
    expect(clipboard.writeText).toHaveBeenCalledOnce(); expect(clipboard.writeText).toHaveBeenCalledWith('retail edited\n\ncurrent body');
  });

  it('E3-GAP-LEAD-MAGNET-03: exact-track delete preserves the other track and unrelated metadata', async () => {
    const retail = lead('retail'); const recruitment = lead('recruitment'); metadata = { ...metadata, lead_magnet: retail, lead_magnet_tracks: { retail, recruitment } };
    await leadMagnetService.deleteTrack(user.id, 'retail', retail.id);
    const reopened = await leadMagnetService.getTracks(user.id);
    expect(reopened.retail).toBeNull(); expect(reopened.recruitment?.id).toBe(recruitment.id); expect(metadata.unrelated).toEqual({ locale: 'zh-MY' });
    await expect(leadMagnetService.deleteTrack(user.id, 'retail', retail.id)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('E3-GAP-LEAD-MAGNET-04: repeated generation replaces only its track with a new canonical ID', async () => {
    const first = lead('retail', 'lm-retail-1'); const second = lead('retail', 'lm-retail-2'); const recruitment = lead('recruitment');
    await leadMagnetService.saveTrack(user.id, 'retail', first); await leadMagnetService.saveTrack(user.id, 'recruitment', recruitment); await leadMagnetService.saveTrack(user.id, 'retail', second);
    const reopened = await leadMagnetService.getTracks(user.id);
    expect(reopened.retail?.id).toBe(second.id); expect(reopened.recruitment?.id).toBe(recruitment.id); expect(metadata.unrelated).toEqual({ locale: 'zh-MY' });
  });

  it.each([
    ['retail', 'recruitment'],
    ['recruitment', 'retail'],
  ] as const)(
    'E3B-LEAD-PARTIAL-RETRY: preserves successful %s and retries only failed %s',
    async (successfulTrack, failedTrack) => {
      const canonical: Partial<Record<'retail' | 'recruitment', LeadMagnetConfig>> = {};
      const calls: Array<'retail' | 'recruitment'> = [];
      let firstFailure = true;
      const request = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body)) as {
          track: 'retail' | 'recruitment';
        };
        calls.push(body.track);
        if (body.track === failedTrack && firstFailure) {
          firstFailure = false;
          return new Response(JSON.stringify({ message: 'deterministic failure' }), {
            status: 500,
          });
        }
        const data = lead(body.track, `lm-${body.track}-${calls.length}`);
        canonical[body.track] = data;
        return new Response(JSON.stringify({ data }), { status: 200 });
      });

      const first = await generateLeadMagnetTracks(
        [
          { track: 'retail', type: 'guide' },
          { track: 'recruitment', type: 'checklist' },
        ],
        request as typeof fetch,
      );
      const successful = first.find(
        (outcome) => outcome.track === successfulTrack && 'data' in outcome,
      );
      expect(successful && 'data' in successful ? successful.data.id : null).toBe(
        canonical[successfulTrack]?.id,
      );
      const successfulSnapshot = structuredClone(canonical[successfulTrack]);

      const retry = await generateLeadMagnetTracks(
        [
          {
            track: failedTrack,
            type: failedTrack === 'retail' ? 'guide' : 'checklist',
          },
        ],
        request as typeof fetch,
      );
      expect(retry).toHaveLength(1);
      expect(retry[0]?.track).toBe(failedTrack);
      expect(canonical[successfulTrack]).toEqual(successfulSnapshot);
      expect(canonical[failedTrack]?.id).toMatch(`lm-${failedTrack}-`);
      expect(calls).toEqual(['retail', 'recruitment', failedTrack]);
    },
  );

  it('E3B-LEAD-COMMIT-RESPONSE-LOSS: reconciles a committed track without a second POST', async () => {
    const previous = lead('retail', 'lm-retail-before');
    const committed = lead('retail', 'lm-retail-committed');
    let canonical = previous; let postCount = 0; let getCount = 0;
    const request = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'POST') { postCount += 1; canonical = committed; throw new TypeError('response connection lost after commit'); }
      getCount += 1;
      return new Response(JSON.stringify({ data: canonical, trackLeadMagnets: { retail: canonical, recruitment: null } }), { status: 200 });
    });
    const [outcome] = await generateLeadMagnetTracks(
      [{ track: 'retail', type: 'guide', previousId: previous.id }], request as typeof fetch,
    );
    expect(outcome).toMatchObject({ status: 'success', source: 'reconciliation', previousId: previous.id, data: { id: committed.id } });
    expect(postCount).toBe(1); expect(getCount).toBe(1);
  });

  it('E3B-LEAD-REPLACEMENT-RECONCILIATION: adopts the exact replacement after a malformed success response', async () => {
    const previous = lead('recruitment', 'lm-recruitment-before');
    const committed = lead('recruitment', 'lm-recruitment-committed');
    let postCount = 0;
    const request = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'POST') { postCount += 1; return new Response('{malformed', { status: 200 }); }
      return new Response(JSON.stringify({ data: null, trackLeadMagnets: { retail: null, recruitment: committed } }), { status: 200 });
    });
    const [outcome] = await generateLeadMagnetTracks(
      [{ track: 'recruitment', type: 'checklist', previousId: previous.id }], request as typeof fetch,
    );
    expect(outcome).toMatchObject({ status: 'success', source: 'reconciliation', data: { id: committed.id } });
    expect(postCount).toBe(1);
  });

  it.each([[null, 'initial'], ['webinar-before', 'replacement']] as const)(
    'E3B-WEBINAR-COMMIT-RESPONSE-LOSS: reconciles %s generation without duplicate POST (%s)',
    async (previousId, _mode) => {
      const committed = { ...generateFullWebinar(brand as never), id: `webinar-committed-${previousId ?? 'initial'}` };
      let postCount = 0; let getCount = 0;
      const request = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === 'POST') { postCount += 1; throw new TypeError('response connection lost after commit'); }
        getCount += 1; return new Response(JSON.stringify({ data: committed }), { status: 200 });
      });
      const outcome = await generateWebinarWithReconciliation(previousId, request as typeof fetch);
      expect(outcome).toMatchObject({ status: 'success', source: 'reconciliation', previousId, data: { id: committed.id } });
      expect(postCount).toBe(1); expect(getCount).toBe(1);
    },
  );

  it('E3B-AMBIGUOUS-RECONCILIATION-FAIL-CLOSED: failed canonical checks never issue a second generation POST', async () => {
    let leadPostCount = 0;
    const leadRequest = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'POST') { leadPostCount += 1; throw new TypeError('response lost'); }
      return new Response(JSON.stringify({ error: 'unavailable' }), { status: 503 });
    });
    const [leadOutcome] = await generateLeadMagnetTracks(
      [{ track: 'retail', type: 'guide', previousId: 'lm-before' }], leadRequest as typeof fetch,
    );
    expect(leadOutcome?.status).toBe('ambiguous');
    await expect(reconcileLeadMagnetTrack('retail', 'lm-before', leadRequest as typeof fetch)).resolves.toMatchObject({ status: 'ambiguous' });
    expect(leadPostCount).toBe(1);

    let webinarPostCount = 0;
    const webinarRequest = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'POST') { webinarPostCount += 1; return new Response('{malformed', { status: 200 }); }
      return new Response(JSON.stringify({ error: 'unavailable' }), { status: 503 });
    });
    await expect(generateWebinarWithReconciliation('webinar-before', webinarRequest as typeof fetch)).resolves.toMatchObject({ status: 'ambiguous' });
    await expect(reconcileWebinarGeneration('webinar-before', webinarRequest as typeof fetch)).resolves.toMatchObject({ status: 'ambiguous' });
    expect(webinarPostCount).toBe(1);
  });

  it('E3-GAP-WEBINAR-01: generation has stable identity and a failed replacement preserves the existing package', async () => {
    const existing = generateFullWebinar(brand as never); metadata = { ...metadata, webinar: existing };
    mocks.brand.mockRejectedValueOnce(new Error('generation unavailable'));
    await expect(webinarService.generate(user.id, user.tenantId)).rejects.toThrow('generation unavailable');
    expect((metadata.webinar as WebinarPackage).id).toBe(existing.id);
    const retried = await webinarService.generate(user.id, user.tenantId);
    expect(retried.id).toMatch(/^webinar-/); expect(retried.id).not.toBe(existing.id); expect(retried.createdAt).toBe(retried.updatedAt);
  });

  it('E3-GAP-WEBINAR-02: same-ID save keeps createdAt, advances updatedAt and rejects stale identity', async () => {
    const existing = { ...generateFullWebinar(brand as never), createdAt: '2026-07-18T00:00:00.000Z', updatedAt: '2026-07-18T00:00:00.000Z' }; metadata = { ...metadata, webinar: existing };
    const saved = await webinarService.update(user.id, existing.id, { title: 'edited title', loomScript: 'edited script' });
    expect(saved.id).toBe(existing.id); expect(saved.createdAt).toBe(existing.createdAt); expect(saved.updatedAt).not.toBe(existing.updatedAt); expect(saved.topic.title).toBe('edited title');
    await expect(webinarService.update(user.id, 'webinar-stale', { title: 'no' })).rejects.toMatchObject({ statusCode: 404 });
    expect(() => webinarPatchSchema.parse({ id: existing.id, loomScript: 'x'.repeat(20_001) })).toThrow();
    expect(() => webinarPatchSchema.parse({ id: existing.id, title: 'valid', ownerId: 'injected' })).toThrow();
    expect(() => webinarDeleteSchema.parse({ id: existing.id, tenantId: 'injected' })).toThrow();
  });

  it('E3-GAP-WEBINAR-03: current section copy awaits exact script/slides/registration/follow-up text', async () => {
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
    for (const value of ['current script', 'current slides', 'current registration', 'current follow-up']) await writeClipboardText(value, clipboard);
    expect(clipboard.writeText.mock.calls.map(([value]) => value)).toEqual(['current script', 'current slides', 'current registration', 'current follow-up']);
  });

  it('E3-GAP-WEBINAR-04: exact-ID delete preserves unrelated metadata and a replay fails closed', async () => {
    const existing = generateFullWebinar(brand as never); metadata = { ...metadata, webinar: existing };
    await webinarService.delete(user.id, existing.id);
    expect(await webinarService.get(user.id)).toBeNull(); expect(metadata.unrelated).toEqual({ locale: 'zh-MY' });
    await expect(webinarService.delete(user.id, existing.id)).rejects.toMatchObject({ statusCode: 404 });
  });
});
