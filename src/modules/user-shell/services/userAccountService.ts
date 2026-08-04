import { AccountTrack, Prisma, SocialPlatform, type UserAccount } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '@/lib/errors';
import prisma from '@/lib/prisma';

const accountScopeSchema = z.object({
  tenantId: z.string().uuid(),
  userId: z.string().uuid(),
});

const optionalUrlSchema = z.union([
  z.string().trim().url().max(2048),
  z.literal(''),
]).optional().transform((url) => url || undefined);

const editableUrlSchema = z.union([
  z.string().trim().url().max(2048),
  z.literal(''),
  z.null(),
]).optional().transform((url) => (url === '' ? null : url));

const accountNameSchema = z.string().trim().min(1, '请先填上号名').max(120, '号名请保持在 120 个字以内');

export const createAccountInputSchema = accountScopeSchema.extend({
  platform: z.nativeEnum(SocialPlatform),
  track: z.nativeEnum(AccountTrack),
  name: accountNameSchema,
  url: optionalUrlSchema,
});

export const updateAccountInputSchema = accountScopeSchema.extend({
  id: z.string().uuid(),
  name: accountNameSchema.optional(),
  url: editableUrlSchema,
}).refine((input) => input.name !== undefined || input.url !== undefined, {
  message: '请至少更新一个账号资料项目',
});

export const setEnabledInputSchema = accountScopeSchema.extend({
  id: z.string().uuid(),
  enabled: z.boolean(),
});

export type AccountScope = z.infer<typeof accountScopeSchema>;
export type CreateAccountInput = z.input<typeof createAccountInputSchema>;
export type UpdateAccountInput = z.input<typeof updateAccountInputSchema>;
export type SetEnabledInput = z.input<typeof setEnabledInputSchema>;

const ACCOUNT_EXISTS_MESSAGE = '这个平台的这个号你已经开过了，直接编辑就好。';
const ACCOUNT_NOT_FOUND_MESSAGE = '没有找到这个账号，回到“我的账号”再试一次。';

function accountNotFoundError(): AppError {
  return new AppError('ACCOUNT_NOT_FOUND', 404, ACCOUNT_NOT_FOUND_MESSAGE);
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

async function requireOwnedAccount({ tenantId, userId, id }: AccountScope & { id: string }): Promise<UserAccount> {
  const account = await prisma.userAccount.findFirst({
    where: { id, tenantId, userId },
  });

  if (!account) throw accountNotFoundError();
  return account;
}

export async function listAccounts(input: AccountScope): Promise<UserAccount[]> {
  const { tenantId, userId } = accountScopeSchema.parse(input);

  return prisma.userAccount.findMany({
    where: { tenantId, userId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createAccount(input: CreateAccountInput): Promise<UserAccount> {
  const { tenantId, userId, platform, track, name, url } = createAccountInputSchema.parse(input);

  try {
    return await prisma.userAccount.create({
      data: { tenantId, userId, platform, track, name, url },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError('ACCOUNT_EXISTS', 409, ACCOUNT_EXISTS_MESSAGE);
    }
    throw error;
  }
}

export async function updateAccount(input: UpdateAccountInput): Promise<UserAccount> {
  const { tenantId, userId, id, name, url } = updateAccountInputSchema.parse(input);
  await requireOwnedAccount({ tenantId, userId, id });

  return prisma.userAccount.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(url !== undefined ? { url } : {}),
    },
  });
}

export async function setEnabled(input: SetEnabledInput): Promise<UserAccount> {
  const { tenantId, userId, id, enabled } = setEnabledInputSchema.parse(input);
  await requireOwnedAccount({ tenantId, userId, id });

  return prisma.userAccount.update({
    where: { id },
    data: { enabled },
  });
}
