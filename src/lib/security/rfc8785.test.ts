import { describe, expect, it } from 'vitest';
import { canonicalizeJson } from './rfc8785';

describe('RFC 8785 JSON canonicalization', () => {
  it('matches the RFC 8785 primitive/object ordering example', () => {
    expect(canonicalizeJson({
      numbers: [333333333.33333329, 1e30, 4.50, 2e-3, 1e-27],
      string: '\u20ac$\u000f\nA\'B\"\\\"/',
      literals: [null, true, false],
    })).toBe('{"literals":[null,true,false],"numbers":[333333333.3333333,1e+30,4.5,0.002,1e-27],"string":"€$\\u000f\\nA\'B\\\"\\\\\\\"/"}');
  });

  it('uses UTF-16 member ordering and is stable for semantically identical objects', () => {
    expect(canonicalizeJson({ b: 2, a: { z: 1, y: 0 } }))
      .toBe(canonicalizeJson({ a: { y: 0, z: 1 }, b: 2 }));
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, undefined, BigInt(1), () => null])(
    'rejects non-I-JSON input %#',
    (input) => expect(() => canonicalizeJson({ input })).toThrow(),
  );

  it('rejects lone Unicode surrogates', () => {
    expect(() => canonicalizeJson({ value: '\ud800' })).toThrow(/lone high surrogate/);
  });
});
