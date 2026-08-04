import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMocks = vi.hoisted(() => ({
  userAccount: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({ default: prismaMocks }));

import { createAccount, listAccounts, setEnabled, updateAccount } from './userAccountService';

const owner = { tenantId: '11111111-1111-4111-8111-111111111111', userId: '22222222-2222-4222-8222-222222222222' };
const otherOwner = { tenantId: '33333333-3333-4333-8333-333333333333', userId: '44444444-4444-4444-8444-444444444444' };
const accountId = '55555555-5555-4555-8555-555555555555';

describe('userAccountService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('turns a duplicate account constraint into a coach-voice message', async () => {
    prismaMocks.userAccount.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      { code: 'P2002', clientVersion: 'test' },
    ));

    await expect(createAccount({
      ...owner,
      platform: 'fb',
      track: 'recruitment',
      name: '我的分享页',
    })).rejects.toMatchObject({
      code: 'ACCOUNT_EXISTS',
      message: '这个平台的这个号你已经开过了，直接编辑就好。',
    });
  });

  it('lists records only through the authenticated tenant and user scope', async () => {
    prismaMocks.userAccount.findMany.mockResolvedValue([{ id: accountId, ...owner }]);

    await expect(listAccounts(owner)).resolves.toEqual([{ id: accountId, ...owner }]);
    expect(prismaMocks.userAccount.findMany).toHaveBeenCalledWith({
      where: owner,
      orderBy: { createdAt: 'asc' },
    });

    await listAccounts(otherOwner);
    expect(prismaMocks.userAccount.findMany).toHaveBeenLastCalledWith({
      where: otherOwner,
      orderBy: { createdAt: 'asc' },
    });
  });

  it('updates and enables an owned account with both scope values', async () => {
    const ownedAccount = { id: accountId, ...owner, enabled: true };
    prismaMocks.userAccount.findFirst.mockResolvedValue(ownedAccount);
    prismaMocks.userAccount.update
      .mockResolvedValueOnce({ ...ownedAccount, name: '更新后的号名' })
      .mockResolvedValueOnce({ ...ownedAccount, enabled: false });

    await expect(updateAccount({ ...owner, id: accountId, name: '更新后的号名', url: null }))
      .resolves.toMatchObject({ name: '更新后的号名' });
    await expect(setEnabled({ ...owner, id: accountId, enabled: false }))
      .resolves.toMatchObject({ enabled: false });

    expect(prismaMocks.userAccount.findFirst).toHaveBeenNthCalledWith(1, { where: { ...owner, id: accountId } });
    expect(prismaMocks.userAccount.findFirst).toHaveBeenNthCalledWith(2, { where: { ...owner, id: accountId } });
    expect(prismaMocks.userAccount.update).toHaveBeenNthCalledWith(1, {
      where: { id: accountId },
      data: { name: '更新后的号名', url: null },
    });
    expect(prismaMocks.userAccount.update).toHaveBeenNthCalledWith(2, {
      where: { id: accountId },
      data: { enabled: false },
    });
  });

  it('never mutates an account that the authenticated tenant and user do not own', async () => {
    prismaMocks.userAccount.findFirst.mockResolvedValue(null);

    await expect(setEnabled({ ...owner, id: accountId, enabled: false })).rejects.toMatchObject({
      code: 'ACCOUNT_NOT_FOUND',
      message: '没有找到这个账号，回到“我的账号”再试一次。',
    });

    expect(prismaMocks.userAccount.findFirst).toHaveBeenCalledWith({ where: { ...owner, id: accountId } });
    expect(prismaMocks.userAccount.update).not.toHaveBeenCalled();
  });
});
