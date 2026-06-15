// Objection Handling Engine

import type { ObjectionResponse } from '../types/sales.types';

const RESPONSES: Record<string, ObjectionResponse> = {
  too_expensive: {
    objection: 'Too expensive',
    rootCause: 'Value not clearly communicated. Customer sees cost, not result.',
    responseFramework: 'Acknowledge concern → Reframe as investment → Compare to cost of inaction → Offer payment plan',
    followUpQuestion: 'If the price were right, would this solve your problem?',
  },
  no_time: {
    objection: 'No time',
    rootCause: 'Priority misalignment. Customer does not see this as urgent.',
    responseFramework: 'Acknowledge → Show time cost of current method → Show time savings → Quick start option',
    followUpQuestion: 'How much time are you spending on this problem right now?',
  },
  need_to_think: {
    objection: 'Need to think about it',
    rootCause: 'Unaddressed concern or lack of urgency.',
    responseFramework: 'Validate → Identify hidden concern → Address directly → Limited-time offer',
    followUpQuestion: 'What specifically would you like to think about? I want to make sure I have answered everything.',
  },
  spouse_approval: {
    objection: 'Need spouse approval',
    rootCause: 'Joint decision-maker not involved in the conversation.',
    responseFramework: 'Acknowledge joint decision → Offer joint meeting → Provide summary for partner',
    followUpQuestion: 'Would it help if I prepared a summary for your spouse?',
  },
  not_interested: {
    objection: 'Not interested',
    rootCause: 'Problem not urgent enough or solution not relevant.',
    responseFramework: 'Acknowledge → Ask permission to share one insight → Share specific result → Leave door open',
    followUpQuestion: 'What would need to change for this to become relevant for you?',
  },
  tried_before: {
    objection: 'Already tried before',
    rootCause: 'Past negative experience with similar offering.',
    responseFramework: 'Empathize → Differentiate → Share recent success story → Offer low-risk trial',
    followUpQuestion: 'What was different about the previous experience? I want to make sure we address that.',
  },
};

export function identifyObjection(message: string): string | null {
  const lower = message.toLowerCase();
  if (lower.includes('expensive') || lower.includes('price') || lower.includes('cost') || lower.includes('mahal')) return 'too_expensive';
  if (lower.includes('time') || lower.includes('busy') || lower.includes('sibuk')) return 'no_time';
  if (lower.includes('think') || lower.includes('consider') || lower.includes('fikir')) return 'need_to_think';
  if (lower.includes('wife') || lower.includes('husband') || lower.includes('spouse') || lower.includes('isteri') || lower.includes('suami')) return 'spouse_approval';
  if (lower.includes('not interested') || lower.includes('no thanks') || lower.includes('tak minat')) return 'not_interested';
  if (lower.includes('tried') || lower.includes('before') || lower.includes('already') || lower.includes('pernah')) return 'tried_before';
  return null;
}

export function generateResponse(objectionKey: string): ObjectionResponse {
  return RESPONSES[objectionKey] ?? {
    objection: objectionKey,
    rootCause: 'Unclear value proposition.',
    responseFramework: 'Listen → Acknowledge → Probe → Address → Confirm',
    followUpQuestion: 'Can you help me understand what is holding you back?',
  };
}
