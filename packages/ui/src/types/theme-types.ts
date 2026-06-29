import type { ThemeTokens } from "@nextshift/shared";
import type * as React from "react";

export type ThemeMode = "light" | "dark" | "system";

export type ResolvedThemeMode = "light" | "dark";

type ThemeOverrideLeaf<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends readonly string[]
      ? readonly string[]
      : T;

export type DeepPartial<T> = {
  readonly [Key in keyof T]?: T[Key] extends readonly unknown[]
    ? ThemeOverrideLeaf<T[Key]>
    : T[Key] extends object
      ? DeepPartial<T[Key]>
      : ThemeOverrideLeaf<T[Key]>;
};

export type ThemeTokenOverrides = DeepPartial<ThemeTokens>;

export interface ThemeBrandingAssets {
  readonly logo?: string;
  readonly logoDark?: string;
  readonly icon?: string;
  readonly favicon?: string;
  readonly wordmark?: string;
  readonly altText?: string;
}

export interface WhiteLabelBrandingContract {
  readonly brandId: string;
  readonly displayName: string;
  readonly legalName?: string;
  readonly supportEmail?: string;
  readonly homepageUrl?: string;
  readonly assets?: ThemeBrandingAssets;
}

export interface BrandThemeOverride {
  readonly brand: WhiteLabelBrandingContract;
  readonly tokens?: ThemeTokenOverrides;
}

export interface ThemePersistenceContract {
  readonly loadThemeMode?: () => ThemeMode | undefined | Promise<ThemeMode | undefined>;
  readonly saveThemeMode?: (mode: ThemeMode) => void | Promise<void>;
}

export interface ThemeContextValue {
  readonly mode: ThemeMode;
  readonly resolvedMode: ResolvedThemeMode;
  readonly theme: ThemeTokens;
  readonly brand?: WhiteLabelBrandingContract;
  readonly setMode: (mode: ThemeMode) => void;
  readonly toggleMode: () => void;
}

export interface ThemeProviderProps {
  readonly mode?: ThemeMode;
  readonly defaultMode?: ThemeMode;
  readonly brandOverride?: BrandThemeOverride;
  readonly persistence?: ThemePersistenceContract;
  readonly systemPrefersDark?: boolean;
  readonly children: React.ReactNode;
}
