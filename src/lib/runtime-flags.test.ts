import { describe, expect, it } from 'vitest';
import { RUNTIME_FLAGS } from './runtime-flags';

describe('runtime flag lifecycle registry', () => {
  it('keeps graduated and introduced lifecycle fields auditable', () => {
    for (const flag of Object.values(RUNTIME_FLAGS)) {
      if (flag.lifecycleStatus === 'graduated') {
        expect(flag.graduatedAt).toEqual(expect.any(String));
        expect(flag.graduatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        continue;
      }

      expect(flag.lifecycleStatus).toBe('introduced');
      expect(flag).not.toHaveProperty('graduatedAt');
    }
  });
});
