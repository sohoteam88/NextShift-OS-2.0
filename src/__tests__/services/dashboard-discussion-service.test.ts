import { describe, expect, it, vi } from 'vitest';
import { AppError } from '@/lib/errors';
import {
  AI_DISCUSSION_SYSTEM_PROMPT,
  DISCUSSION_TASK_CATEGORY,
  discussCommandCenterRecommendation,
  type DiscussionServiceDependencies,
} from '@/modules/dashboard/services/discussion-service';
import {
  DecisionConversation,
  type DecisionContext,
  type DecisionConversationId,
} from '@nextshift/decision-brain';

describe('Command Center discussion service', () => {
  it('returns null and does not call recommendation or router when the flag is OFF', async () => {
    const dependencies = createDependencies({ isEnabled: () => false });

    const result = await discussCommandCenterRecommendation(user(), {
      message: 'Can we discuss this recommendation?',
      history: [],
    }, dependencies);

    expect(result).toBeNull();
    expect(dependencies.getRecommendation).not.toHaveBeenCalled();
    expect(dependencies.enforceQuota).not.toHaveBeenCalled();
    expect(dependencies.getRouter).not.toHaveBeenCalled();
  });

  it('uses conversation-engine framing and routes normal discussion through the AI router', async () => {
    const generate = vi.fn().mockResolvedValue(routerResult('Focus on the qualified lead first.'));
    const continueConversation = vi.fn((context: DecisionContext) => [
      DecisionConversation.create({
        decisionConversationId: 'conversation-1' as DecisionConversationId,
        decisionContextId: context.decisionContextId,
        conversationType: 'Advisory',
        title: 'Discuss conversion',
        summary: 'Recommendation: Convert the next qualified lead',
        latestMessage: 'Why this action today?',
        messageCount: 1,
        createdAt: '2026-07-11T00:00:00.000Z',
        updatedAt: '2026-07-11T00:00:00.000Z',
      }),
    ]);
    const dependencies = createDependencies({
      conversationEngine: { continueConversation },
      getRouter: vi.fn().mockResolvedValue({ generate }),
    });

    const result = await discussCommandCenterRecommendation(user(), {
      message: 'Why should I do this today?',
      history: [],
    }, dependencies);

    expect(result).toEqual({
      reply: 'Focus on the qualified lead first.',
      turnsUsed: 1,
      turnsLimit: 5,
    });
    expect(continueConversation).toHaveBeenCalledTimes(1);
    expect(dependencies.enforceQuota).toHaveBeenCalledWith('tenant_1');
    expect(dependencies.getRouter).toHaveBeenCalledWith('tenant_1');
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Current recommendation context:'),
        userMessage: expect.stringContaining('Why should I do this today?'),
        temperature: 0.4,
        maxTokens: 700,
      }),
      DISCUSSION_TASK_CATEGORY,
    );
    expect(dependencies.logUsage).toHaveBeenCalledWith(expect.objectContaining({
      tenantId: 'tenant_1',
      userId: 'user_1',
      feature: 'ai_discussion',
    }));
    expect(dependencies.getBusinessContext).toHaveBeenCalledWith('user_1', 'tenant_1');
    expect(dependencies.appendMemoryEvent).toHaveBeenCalledWith(expect.objectContaining({
      type: 'DISCUSSION_STARTED',
      metadata: expect.objectContaining({
        recommendationId: 'command-center-engine-next-action',
        turnNumber: 1,
        source: 'engine',
      }),
    }));
    expect(dependencies.appendMemoryEvent).toHaveBeenCalledWith(expect.objectContaining({
      type: 'DISCUSSION_TURN_COMPLETED',
    }));
  });

  it('uses a concise business-memory summary in the prompt when the memory read succeeds', async () => {
    const generate = vi.fn().mockResolvedValue(routerResult());
    const dependencies = createDependencies({ getRouter: vi.fn().mockResolvedValue({ generate }) });

    await discussCommandCenterRecommendation(user(), { message: 'What should I do first?' }, dependencies);

    const systemPrompt = generate.mock.calls[0][0].systemPrompt;
    expect(systemPrompt).toContain('Relevant business memory');
    expect(systemPrompt).toContain('Activity level: active');
    expect(systemPrompt).toContain('Recent activity: Completed outreach');
    expect(systemPrompt).toContain('accepted IDs: recommendation-accepted');
  });

  it('continues without business memory when the memory read fails and still records the completed turn', async () => {
    const generate = vi.fn().mockResolvedValue(routerResult('Still available.'));
    const dependencies = createDependencies({
      getRouter: vi.fn().mockResolvedValue({ generate }),
      getBusinessContext: vi.fn().mockRejectedValue(new Error('memory unavailable')),
    });

    const result = await discussCommandCenterRecommendation(user(), { message: 'What should I do first?' }, dependencies);

    expect(result?.reply).toBe('Still available.');
    expect(generate.mock.calls[0][0].systemPrompt).not.toContain('Relevant business memory');
    expect(dependencies.logFallback).toHaveBeenCalledWith(
      '[discussion-memory] continuing without business memory',
      expect.objectContaining({ error: 'memory unavailable' }),
    );
    expect(dependencies.appendMemoryEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'DISCUSSION_TURN_COMPLETED' }));
  });

  it('returns the reply when memory event writes fail after a successful read', async () => {
    const dependencies = createDependencies({
      appendMemoryEvent: vi.fn().mockRejectedValue(new Error('audit unavailable')),
    });

    const result = await discussCommandCenterRecommendation(user(), { message: 'What should I do first?' }, dependencies);

    expect(result?.reply).toBe('Discussion reply');
    expect(dependencies.logFallback).toHaveBeenCalledWith(
      '[discussion-memory] failed to record discussion event',
      expect.objectContaining({ error: 'audit unavailable' }),
    );
  });

  it('returns the reply when both memory reads and writes fail', async () => {
    const dependencies = createDependencies({
      getBusinessContext: vi.fn().mockRejectedValue(new Error('memory unavailable')),
      appendMemoryEvent: vi.fn().mockRejectedValue(new Error('audit unavailable')),
    });

    const result = await discussCommandCenterRecommendation(user(), { message: 'What should I do first?' }, dependencies);

    expect(result?.reply).toBe('Discussion reply');
    expect(dependencies.logFallback).toHaveBeenCalledTimes(3);
  });

  it('injects the off-topic refusal and no-invention rules into the system prompt', async () => {
    const generate = vi.fn().mockResolvedValue(routerResult('Use the recommendation context only.'));
    const dependencies = createDependencies({
      getRouter: vi.fn().mockResolvedValue({ generate }),
    });

    await discussCommandCenterRecommendation(user(), {
      message: 'What tradeoff should I watch?',
      history: [{ role: 'assistant', content: 'We are discussing conversion.' }],
    }, dependencies);

    const systemPrompt = generate.mock.calls[0][0].systemPrompt;
    expect(systemPrompt).toContain(AI_DISCUSSION_SYSTEM_PROMPT);
    expect(systemPrompt).toContain('Only discuss the current recommendation');
    expect(systemPrompt).toContain('politely refuse');
    expect(systemPrompt).toContain('Do not invent data');
    expect(systemPrompt).toContain('Confidence: 84%');
  });

  it('returns a local polite refusal for clearly off-topic messages without using the router', async () => {
    const dependencies = createDependencies();

    const result = await discussCommandCenterRecommendation(user(), {
      message: 'What is the weather in Tokyo tomorrow?',
      history: [],
    }, dependencies);

    expect(result).toMatchObject({
      turnsUsed: 1,
      turnsLimit: 5,
    });
    expect(result?.reply).toContain('I can only discuss today\'s recommendation');
    expect(dependencies.enforceQuota).not.toHaveBeenCalled();
    expect(dependencies.getRouter).not.toHaveBeenCalled();
  });

  it('returns TURNS_EXHAUSTED when the session exceeds five user turns', async () => {
    const dependencies = createDependencies();

    await expect(discussCommandCenterRecommendation(user(), {
      message: 'One more question',
      history: Array.from({ length: 5 }, (_, index) => ({
        role: 'user' as const,
        content: `Question ${index + 1}`,
      })),
    }, dependencies)).rejects.toMatchObject({
      code: 'TURNS_EXHAUSTED',
      statusCode: 429,
      details: {
        turnsUsed: 5,
        turnsLimit: 5,
      },
    });
    expect(dependencies.getRecommendation).not.toHaveBeenCalled();
    expect(dependencies.enforceQuota).not.toHaveBeenCalled();
  });

  it('passes quota 429 errors through before router generation', async () => {
    const generate = vi.fn();
    const quotaError = new AppError('QUOTA_EXCEEDED', 429, 'AI daily tenant quota exceeded.');
    const dependencies = createDependencies({
      enforceQuota: vi.fn().mockRejectedValue(quotaError),
      getRouter: vi.fn().mockResolvedValue({ generate }),
    });

    await expect(discussCommandCenterRecommendation(user(), {
      message: 'How do I execute this?',
      history: [],
    }, dependencies)).rejects.toBe(quotaError);
    expect(generate).not.toHaveBeenCalled();
  });
});

function user() {
  return {
    id: 'user_1',
    tenantId: 'tenant_1',
  };
}

function createDependencies(
  overrides: Partial<DiscussionServiceDependencies> = {},
): DiscussionServiceDependencies & Record<string, any> {
  return {
    isEnabled: () => true,
    getRecommendation: vi.fn().mockResolvedValue(recommendation()),
    getRouter: vi.fn().mockResolvedValue({ generate: vi.fn().mockResolvedValue(routerResult()) }),
    enforceQuota: vi.fn().mockResolvedValue(undefined),
    logUsage: vi.fn().mockResolvedValue(undefined),
    getBusinessContext: vi.fn().mockResolvedValue(memory()),
    appendMemoryEvent: vi.fn().mockResolvedValue({}),
    logFallback: vi.fn(),
    now: () => new Date('2026-07-11T00:00:00.000Z'),
    ...overrides,
  };
}

function memory() {
  return {
    recentActivities: [
      {
        type: 'MISSION_COMPLETED',
        title: 'Completed outreach',
        summary: 'Contacted qualified leads.',
        occurredAt: '2026-07-10T00:00:00.000Z',
      },
    ],
    currentFocus: 'Follow up with qualified leads',
    blockedAreas: [],
    completedMilestones: [],
    executionPattern: {
      activityLevel: 'active',
      completionVelocity: 'steady',
      recommendationResponse: 'accepting',
      consistency: 'high',
    },
    recommendedFocus: 'Follow up with qualified leads',
    recommendationMemory: {
      recentlyIssuedIds: ['recommendation-issued'],
      acceptedIds: ['recommendation-accepted'],
      ignoredIds: [],
    },
  } as const;
}

function recommendation() {
  return {
    recommendation: {
      id: 'command-center-engine-next-action',
      title: 'Convert the next qualified lead',
      summary: 'Focus today on the highest-impact sales action.',
      rationale: 'Mission, business-state, revenue, and analytics signals agree on conversion.',
      type: 'Growth',
      route: '/sales',
      ctaLabel: 'Open Sales',
    },
    confidence: 0.84,
    explain: 'Mission, business-state, revenue, and analytics signals agree on conversion.',
    source: 'engine',
  } as const;
}

function routerResult(text = 'Discussion reply') {
  return {
    text,
    tokensIn: 120,
    tokensOut: 80,
    durationMs: 500,
    provider: 'openai',
    model: 'gpt-4o-mini',
    routing: {
      selectedTier: 'B',
      originalTier: 'B',
      wasEscalated: false,
    },
  } as any;
}
