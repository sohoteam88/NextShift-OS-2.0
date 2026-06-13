// Agent Memory — stores execution history in user.metadata.agent_memory
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import type { AgentExecutionReport } from './types';

export const agentMemoryService = {
  async remember(userId: string, report: AgentExecutionReport) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
    const meta = (user?.metadata as Record<string, unknown>) ?? {};
    const history: AgentExecutionReport[] = Array.isArray(meta.agent_memory) ? (meta.agent_memory as AgentExecutionReport[]) : [];
    history.push(report);
    const trimmed = history.slice(-20);
    await prisma.user.update({ where: { id: userId }, data: { metadata: { ...meta, agent_memory: trimmed as unknown as Prisma.InputJsonValue } as Prisma.InputJsonValue } });
  },

  async recall(userId: string): Promise<AgentExecutionReport[]> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
    return (Array.isArray((user?.metadata as Record<string, unknown>)?.agent_memory) ? (user?.metadata as Record<string, unknown>).agent_memory as AgentExecutionReport[] : []);
  },
};
