export type QualityGateSummary = {
  passed: boolean;
  pass_rate: number;
  checks: Record<string, { passed: boolean; duplicateIndexes: number[]; total: number }>;
};

export const qualityGateService = {
  checkDuplication(items: string[], threshold = 0.7): { passed: boolean; duplicateIndexes: number[] } {
    const duplicateIndexes: number[] = [];
    for (let i = 0; i < items.length; i += 1) {
      for (let j = i + 1; j < items.length; j += 1) {
        const similarity = this.similarity(items[i], items[j]);
        if (similarity > threshold) duplicateIndexes.push(j);
      }
    }
    return { passed: duplicateIndexes.length === 0, duplicateIndexes: [...new Set(duplicateIndexes)] };
  },

  similarity(a: string, b: string): number {
    const bigrams = (s: string) => {
      const set = new Set<string>();
      const compact = s.replace(/\s+/g, '');
      for (let i = 0; i < compact.length - 1; i += 1) set.add(compact.slice(i, i + 2));
      return set;
    };
    const setA = bigrams(a);
    const setB = bigrams(b);
    const intersection = new Set([...setA].filter((x) => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return union.size === 0 ? 0 : intersection.size / union.size;
  },

  async regenerateFlagged(
    generateOneFn: (excludeExamples: string[]) => Promise<string>,
    items: string[],
    duplicateIndexes: number[],
  ): Promise<string[]> {
    const result = [...items];
    for (const idx of duplicateIndexes) {
      result[idx] = await generateOneFn(items.filter((_, i) => i !== idx));
    }
    return result;
  },

  summarize(groups: Record<string, string[]>): QualityGateSummary {
    const checks: QualityGateSummary['checks'] = {};
    let passedItems = 0;
    let totalItems = 0;

    for (const [key, items] of Object.entries(groups)) {
      const result = this.checkDuplication(items);
      checks[key] = { ...result, total: items.length };
      totalItems += items.length;
      passedItems += items.length - result.duplicateIndexes.length;
    }

    const passRate = totalItems === 0 ? 100 : Math.round((passedItems / totalItems) * 100);
    return { passed: passRate >= 80, pass_rate: passRate, checks };
  },
};
