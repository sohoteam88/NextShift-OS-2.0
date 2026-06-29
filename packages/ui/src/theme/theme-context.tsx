import * as React from "react";
import type { BrandThemeOverride, ThemeContextValue, ThemeMode } from "../types";
import {
  getNextThemeMode,
  getThemeForMode,
  resolveThemeMode,
} from "./theme-utils";

const defaultMode: ThemeMode = "light";

export const ThemeContext = React.createContext<ThemeContextValue>({
  brand: undefined,
  mode: defaultMode,
  resolvedMode: "light",
  setMode: () => undefined,
  theme: getThemeForMode(defaultMode),
  toggleMode: () => undefined,
});

export function useTheme(): ThemeContextValue {
  return React.useContext(ThemeContext);
}

export function createThemeContextValue(options: {
  readonly mode: ThemeMode;
  readonly setMode: (mode: ThemeMode) => void;
  readonly brandOverride?: BrandThemeOverride;
  readonly systemPrefersDark?: boolean;
}): ThemeContextValue {
  const resolvedMode = resolveThemeMode(options.mode, options.systemPrefersDark);

  return {
    brand: options.brandOverride?.brand,
    mode: options.mode,
    resolvedMode,
    setMode: options.setMode,
    theme: getThemeForMode(options.mode, {
      brandOverride: options.brandOverride,
      systemPrefersDark: options.systemPrefersDark,
    }),
    toggleMode: () => {
      options.setMode(
        getNextThemeMode(options.mode, {
          systemPrefersDark: options.systemPrefersDark,
        })
      );
    },
  };
}
