import type { ThemeTokens } from "@nextshift/shared";
import type * as React from "react";
import type { BrandThemeOverride, ThemeMode } from "../types";
import { getThemeForMode, resolveThemeMode } from "./theme-utils";

function toCssVariableName(path: string): string {
  return `--nextshift-${path.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`).replace(/\./g, "-")}`;
}

function flattenThemeTokens(
  value: unknown,
  prefix = ""
): ReadonlyArray<readonly [string, string | number]> {
  if (typeof value === "string" || typeof value === "number") {
    return [[prefix, value]];
  }

  if (Array.isArray(value) || typeof value !== "object" || value === null) {
    return [];
  }

  return Object.entries(value).flatMap(([key, nestedValue]) =>
    flattenThemeTokens(nestedValue, prefix ? `${prefix}.${key}` : key)
  );
}

export function createThemeCssVariables(
  theme: ThemeTokens
): React.CSSProperties {
  return Object.fromEntries(
    flattenThemeTokens(theme).map(([path, value]) => [
      toCssVariableName(path),
      String(value),
    ])
  ) as React.CSSProperties;
}

export function getThemeRootAttributes(options: {
  readonly mode: ThemeMode;
  readonly brandOverride?: BrandThemeOverride;
  readonly systemPrefersDark?: boolean;
}): {
  readonly "data-nextshift-theme": string;
  readonly "data-nextshift-theme-mode": ThemeMode;
  readonly "data-nextshift-brand"?: string;
} {
  return {
    "data-nextshift-brand": options.brandOverride?.brand.brandId,
    "data-nextshift-theme": resolveThemeMode(
      options.mode,
      options.systemPrefersDark
    ),
    "data-nextshift-theme-mode": options.mode,
  };
}

export function getThemeRootStyle(options: {
  readonly mode: ThemeMode;
  readonly brandOverride?: BrandThemeOverride;
  readonly systemPrefersDark?: boolean;
}): React.CSSProperties {
  return createThemeCssVariables(
    getThemeForMode(options.mode, {
      brandOverride: options.brandOverride,
      systemPrefersDark: options.systemPrefersDark,
    })
  );
}

export function getThemedSurfaceStyle(theme: ThemeTokens): React.CSSProperties {
  return {
    background: theme.color.background,
    color: theme.color.foreground,
    fontFamily: theme.typography.fontFamily.sans,
  };
}
