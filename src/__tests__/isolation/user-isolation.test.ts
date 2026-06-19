import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import { cleanupTestTenants, createTestTenants, makeNextRequest, type IsolationFixture } from './setup';
import { adminService } from '@/modules/admin/services/admin-service';
import { teamService } from '@/modules/team/services/team-service';
import { POST as REGISTER_MEMBER } from '@/app/api/v1/member/register/route';

const authMocks = vi.hoisted(() => ({
  createServiceRoleSupabaseClient: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => authMocks);

const run = process.env.TEST_DATABASE_URL ? describe : describe.skip;

run('User Isolation', () => {
  let fixture: IsolationFixture;

  beforeAll(async () => {
    fixture = await createTestTenants();
  });

  afterAll(async () => {
    if (fixture) {
      await cleanupTestTenants(fixture);
    }
  });

  it('operator_a cannot list Tenant B users', async () => {
    const result = await adminService.listUsers(fixture.tenantA.id, { page: 1, limit: 20 });
    expect(result.data.every((user) => user.id !== fixture.dbUsers.operatorB.id && user.id !== fixture.dbUsers.memberB.id)).toBe(true);
  });

  it('operator_a cannot change roles in Tenant B', async () => {
    await expect(
      adminService.updateUser(fixture.dbUsers.operatorA.id, fixture.tenantA.id, fixture.dbUsers.memberB.id, {
        role: 'leader',
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('leader_a team tree does not include Tenant B users', async () => {
    const tree = await teamService.getTree(fixture.users.leaderA);
    const collected = collectIds(tree);

    expect(collected.has(fixture.dbUsers.operatorB.id)).toBe(false);
    expect(collected.has(fixture.dbUsers.memberB.id)).toBe(false);
  });

  it('invite code from Tenant A creates user in Tenant A only', async () => {
    const authUser = {
      id: randomUUID(),
      email: `join-${fixture.suffix}@example.test`,
    };
    const supabaseClient = {
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({ data: { user: authUser }, error: null }),
          deleteUser: vi.fn().mockResolvedValue({ error: null }),
        },
      },
    };
    authMocks.createServiceRoleSupabaseClient.mockReturnValue(supabaseClient);
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key');

    const response = await REGISTER_MEMBER(
      makeNextRequest('http://127.0.0.1/api/v1/member/register', {
        invite_code: fixture.inviteCodeA,
        name: 'Joined Member',
        email: authUser.email,
        password: 'test-password-123',
        phone: '+60123456789',
        preferred_language: 'zh',
      }),
    );

    expect(response.status).toBe(201);

    const prisma = (await import('@/lib/prisma')).default;
    const createdUser = await prisma.user.findUnique({ where: { id: authUser.id } });
    expect(createdUser?.tenantId).toBe(fixture.tenantA.id);
    expect(createdUser?.sponsorId).toBe(fixture.dbUsers.operatorA.id);
  });
});

function collectIds(node: any) {
  const ids = new Set<string>();
  const stack = [node];
  while (stack.length) {
    const current = stack.pop();
    if (!current) continue;
    ids.add(current.id);
    for (const child of current.children ?? []) stack.push(child);
  }
  return ids;
}
