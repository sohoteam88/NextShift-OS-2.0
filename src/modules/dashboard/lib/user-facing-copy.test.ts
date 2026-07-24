import { describe, expect, it } from 'vitest';
import { humanizeEstimatedTime, userFacingCopy } from './user-facing-copy';

describe('dashboard user-facing copy', () => {
  it('maps internal checks and legacy terms to user language', () => {
    expect(userFacingCopy('leadMagnet.exists · AI COO · 引流磁铁')).toBe('引流资源已创建 · AI 教练 · 引流资源');
  });

  it('rounds raw hour values into human time', () => {
    expect(humanizeEstimatedTime('剩余 47.44 小时')).toBe('约 2 天');
  });
});
