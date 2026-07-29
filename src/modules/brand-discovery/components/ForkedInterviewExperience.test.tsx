/** @vitest-environment jsdom */

import * as React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  confirmTopic,
  createForkedInterviewState,
  goToPreviousTopic,
  setTopicConfirmation,
  setTopicFacts,
  setTopicOption,
  type ForkedInterviewState,
} from '@/modules/brand-discovery/forkedInterview/funnelDefinition';
import { ForkedInterviewExperience } from './ForkedInterviewExperience';

function answerCurrent(
  state: ForkedInterviewState,
  optionId: string,
  confirmation: string,
): ForkedInterviewState {
  return confirmTopic(
    setTopicConfirmation(
      setTopicFacts(setTopicOption(state, optionId), [], true),
      confirmation,
    ),
  );
}

function response(data: unknown): Response {
  return {
    ok: true,
    json: async () => data,
  } as Response;
}

function interviewResponse(state: ForkedInterviewState) {
  return {
    data: {
      id: 'interview-1',
      mode: 'funnel',
      answers: { __forked_funnel: state },
    },
  };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('ForkedInterviewExperience back navigation', () => {
  it('shows a previous-topic control and loads the preceding answered topic', async () => {
    let serverState = createForkedInterviewState();
    serverState = answerCurrent(serverState, 'product_first', '我先体验到变化。');
    serverState = answerCurrent(serverState, 'energy', '我的精神更稳定。');
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (!init?.method) return response(interviewResponse(serverState));
      const body = JSON.parse(String(init.body)) as { action: string };
      if (body.action === 'previous') serverState = goToPreviousTopic(serverState);
      return response({ data: { state: serverState } });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<ForkedInterviewExperience />);
    expect(await screen.findByText(/主题 3 \/ 5/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '上一题' }));

    expect(await screen.findByText(/主题 2 \/ 5/)).toBeTruthy();
    expect(screen.getByRole('button', { name: '更有精神' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('asks before a path-changing edit and cancel leaves every answer unchanged', async () => {
    let state = createForkedInterviewState();
    state = answerCurrent(state, 'product_first', '我先体验到变化。');
    state = answerCurrent(state, 'energy', '我的精神更稳定。');
    state = answerCurrent(state, 'employee', '我过去是上班族。');
    state = goToPreviousTopic(goToPreviousTopic(goToPreviousTopic(state)));
    const originalState = structuredClone(state);
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (!init?.method) return response(interviewResponse(state));
      return response({ data: { state } });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<ForkedInterviewExperience />);
    expect(await screen.findByText(/主题 1 \/ 5/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '先看到事业机会，产品刚开始用' }));

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('改这一题，后面几题要重答')).toBeTruthy();
    expect(screen.getByText(/后面已经答的 2 题会清掉/)).toBeTruthy();
    const cancel = screen.getByRole('button', { name: '取消' });
    await waitFor(() => expect(document.activeElement).toBe(cancel));

    fireEvent.click(cancel);

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('路径 A')).toBeTruthy();
    expect(state).toEqual(originalState);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
