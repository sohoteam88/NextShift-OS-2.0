import type { componentTokens } from "./component-tokens";
import type { primitiveTokens } from "./primitive-tokens";
import type { semanticTokens } from "./semantic-tokens";
import type { nextShiftThemeTokens } from "./theme-tokens";

export type TokenValue = string | number | readonly string[];

export interface TokenRecord {
  readonly [key: string]: TokenValue | TokenRecord;
}

export type PrimitiveTokens = typeof primitiveTokens;
export type SemanticTokens = typeof semanticTokens;
export type ComponentTokens = typeof componentTokens;
export type ThemeTokens = typeof nextShiftThemeTokens;

export type TokenPathFor<T> = T extends TokenValue
  ? never
  : {
      [Key in Extract<keyof T, string>]: T[Key] extends TokenValue
        ? Key
        : `${Key}.${TokenPathFor<T[Key]>}`;
    }[Extract<keyof T, string>];

export type TokenPath = TokenPathFor<ThemeTokens>;
