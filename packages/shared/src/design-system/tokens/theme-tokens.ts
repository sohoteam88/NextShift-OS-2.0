import { componentTokens } from "./component-tokens";
import { primitiveTokens } from "./primitive-tokens";
import { semanticTokens } from "./semantic-tokens";
import { deepFreeze } from "./token-freeze";

export const nextShiftThemeTokens = deepFreeze({
  color: semanticTokens.color,
  typography: semanticTokens.typography,
  spacing: semanticTokens.spacing,
  radius: semanticTokens.radius,
  elevation: semanticTokens.elevation,
  motion: semanticTokens.motion,
  breakpoint: semanticTokens.breakpoint,
  zIndex: semanticTokens.zIndex,
  state: semanticTokens.state,
  chart: semanticTokens.chart,
  component: componentTokens,
  primitive: primitiveTokens,
  semantic: semanticTokens,
} as const);
