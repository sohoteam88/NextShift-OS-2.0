import * as React from "react";
import type { ThemeMode, ThemeProviderProps } from "../types";
import { mergeStyles } from "../styles";
import { ThemeContext, createThemeContextValue } from "./theme-context";
import { getThemeRootAttributes, getThemeRootStyle } from "./theme-styles";

export function ThemeProvider({
  mode,
  defaultMode = "light",
  brandOverride,
  persistence,
  systemPrefersDark = false,
  children,
}: ThemeProviderProps): React.ReactElement {
  const [internalMode, setInternalMode] = React.useState<ThemeMode>(defaultMode);
  const currentMode = mode ?? internalMode;

  const setMode = React.useCallback(
    (nextMode: ThemeMode) => {
      if (mode === undefined) {
        setInternalMode(nextMode);
      }
      void persistence?.saveThemeMode?.(nextMode);
    },
    [mode, persistence]
  );

  const value = React.useMemo(
    () =>
      createThemeContextValue({
        brandOverride,
        mode: currentMode,
        setMode,
        systemPrefersDark,
      }),
    [brandOverride, currentMode, setMode, systemPrefersDark]
  );

  return (
    <ThemeContext.Provider value={value}>
      <div
        data-nextshift-theme-provider=""
        style={mergeStyles(
          getThemeRootStyle({
            brandOverride,
            mode: currentMode,
            systemPrefersDark,
          }),
          {
            background: value.theme.color.background,
            color: value.theme.color.foreground,
          }
        )}
        {...getThemeRootAttributes({
          brandOverride,
          mode: currentMode,
          systemPrefersDark,
        })}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
