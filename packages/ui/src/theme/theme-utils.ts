import {
  nextShiftThemeTokens,
  primitiveTokens,
  type ThemeTokens,
} from "@nextshift/shared";
import type {
  BrandThemeOverride,
  ResolvedThemeMode,
  ThemeMode,
  ThemeTokenOverrides,
} from "../types";

type AnyRecord = Record<string, unknown>;

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mergeThemeTokens(
  base: ThemeTokens,
  overrides?: ThemeTokenOverrides
): ThemeTokens {
  if (!overrides) {
    return base;
  }

  const merge = (target: unknown, source: unknown): unknown => {
    if (!isRecord(target) || !isRecord(source)) {
      return source ?? target;
    }

    const result: AnyRecord = { ...target };
    for (const [key, value] of Object.entries(source)) {
      result[key] = key in result ? merge(result[key], value) : value;
    }
    return result;
  };

  return merge(base, overrides) as ThemeTokens;
}

export function resolveThemeMode(
  mode: ThemeMode,
  systemPrefersDark = false
): ResolvedThemeMode {
  return mode === "system" ? (systemPrefersDark ? "dark" : "light") : mode;
}

export function getNextThemeMode(
  mode: ThemeMode,
  options: {
    readonly includeSystem?: boolean;
    readonly systemPrefersDark?: boolean;
  } = {}
): ThemeMode {
  if (options.includeSystem) {
    if (mode === "light") {
      return "dark";
    }
    if (mode === "dark") {
      return "system";
    }
    return resolveThemeMode("system", options.systemPrefersDark) === "dark"
      ? "light"
      : "dark";
  }

  return resolveThemeMode(mode, options.systemPrefersDark) === "dark"
    ? "light"
    : "dark";
}

export function createBrandTheme(
  base: ThemeTokens,
  brandOverride?: BrandThemeOverride
): ThemeTokens {
  return mergeThemeTokens(base, brandOverride?.tokens);
}

export const nextShiftLightTheme = nextShiftThemeTokens;

export const nextShiftDarkTheme = mergeThemeTokens(nextShiftThemeTokens, {
  color: {
    background: primitiveTokens.color.neutral["950"],
    foreground: primitiveTokens.color.neutral["50"],
    surface: primitiveTokens.color.neutral["900"],
    surfaceMuted: primitiveTokens.color.neutral["800"],
    border: primitiveTokens.color.neutral["700"],
    borderStrong: primitiveTokens.color.neutral["600"],
    primary: primitiveTokens.color.brand["400"],
    primaryForeground: primitiveTokens.color.neutral["950"],
    secondary: primitiveTokens.color.neutral["800"],
    secondaryForeground: primitiveTokens.color.neutral["50"],
    muted: primitiveTokens.color.neutral["800"],
    mutedForeground: primitiveTokens.color.neutral["300"],
    disabled: primitiveTokens.color.neutral["700"],
    focusRing: primitiveTokens.color.brand["300"],
  },
  overlay: {
    background: "rgba(3, 7, 18, 0.82)",
    scrim: "rgba(3, 7, 18, 0.68)",
  },
  chart: {
    grid: primitiveTokens.color.neutral["700"],
    axis: primitiveTokens.color.neutral["300"],
    tooltip: {
      background: primitiveTokens.color.neutral["50"],
      foreground: primitiveTokens.color.neutral["950"],
      border: primitiveTokens.color.neutral["300"],
    },
  },
} as ThemeTokenOverrides);

export function getThemeForMode(
  mode: ThemeMode,
  options: {
    readonly brandOverride?: BrandThemeOverride;
    readonly systemPrefersDark?: boolean;
  } = {}
): ThemeTokens {
  const base =
    resolveThemeMode(mode, options.systemPrefersDark) === "dark"
      ? nextShiftDarkTheme
      : nextShiftLightTheme;

  return createBrandTheme(base, options.brandOverride);
}

export function getBrandAsset(
  brandOverride: BrandThemeOverride | undefined,
  key: keyof NonNullable<BrandThemeOverride["brand"]["assets"]>,
  mode: ResolvedThemeMode = "light"
): string | undefined {
  if (!brandOverride?.brand.assets) {
    return undefined;
  }

  if (key === "logo" && mode === "dark") {
    return brandOverride.brand.assets.logoDark ?? brandOverride.brand.assets.logo;
  }

  return brandOverride.brand.assets[key];
}
