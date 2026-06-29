import { nextShiftThemeTokens } from "@nextshift/shared";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  AppShell,
  Button,
  DashboardShell,
  Landmark,
  LoadingOverlay,
  Sparkline,
  ThemeContext,
  ThemeProvider,
  createBrandTheme,
  createThemeContextValue,
  createThemeCssVariables,
  getBrandAsset,
  getNextThemeMode,
  getThemeForMode,
  getThemeRootAttributes,
  getThemeRootStyle,
  getThemedSurfaceStyle,
  mergeThemeTokens,
  nextShiftDarkTheme,
  nextShiftLightTheme,
  resolveThemeMode,
  useTheme,
  type BrandThemeOverride,
  type ThemeBrandingAssets,
  type ThemeContextValue,
  type ThemeMode,
  type ThemePersistenceContract,
  type ThemeProviderProps,
  type ThemeTokenOverrides,
  type WhiteLabelBrandingContract,
} from "../src";

describe("DS-008 theme and branding", () => {
  it("exposes theme provider, context, helpers, and types", () => {
    const mode: ThemeMode = "system";
    const assets: ThemeBrandingAssets = { logo: "/logo.svg" };
    const brand: WhiteLabelBrandingContract = {
      assets,
      brandId: "acme",
      displayName: "Acme",
    };
    const override: ThemeTokenOverrides = {
      color: { primary: "#111111" },
    };
    const brandOverride: BrandThemeOverride = { brand, tokens: override };
    const persistence: ThemePersistenceContract = {
      loadThemeMode: () => "dark",
      saveThemeMode: () => undefined,
    };
    const providerProps: ThemeProviderProps = {
      brandOverride,
      children: "Theme",
      defaultMode: mode,
      persistence,
    };

    expect(ThemeProvider).toBeDefined();
    expect(ThemeContext).toBeDefined();
    expect(useTheme).toBeDefined();
    expect(providerProps.defaultMode).toBe("system");
    expect(brandOverride.brand.displayName).toBe("Acme");
  });

  it("provides light and dark themes from DS-001 tokens", () => {
    expect(nextShiftLightTheme.color.background).toBe(
      nextShiftThemeTokens.color.background
    );
    expect(nextShiftDarkTheme.color.background).toBe("#030712");
    expect(nextShiftDarkTheme.color.foreground).toBe("#f9fafb");
    expect(getThemeForMode("light").color.primary).toBe(
      nextShiftThemeTokens.color.primary
    );
    expect(getThemeForMode("dark").color.background).toBe(
      nextShiftDarkTheme.color.background
    );
  });

  it("resolves theme switching helpers", () => {
    expect(resolveThemeMode("light")).toBe("light");
    expect(resolveThemeMode("dark")).toBe("dark");
    expect(resolveThemeMode("system", true)).toBe("dark");
    expect(resolveThemeMode("system", false)).toBe("light");
    expect(getNextThemeMode("light")).toBe("dark");
    expect(getNextThemeMode("dark")).toBe("light");
    expect(getNextThemeMode("dark", { includeSystem: true })).toBe("system");
  });

  it("applies brand token overrides and asset contracts", () => {
    const brandOverride: BrandThemeOverride = {
      brand: {
        assets: {
          altText: "Acme logo",
          logo: "/light.svg",
          logoDark: "/dark.svg",
        },
        brandId: "acme",
        displayName: "Acme",
        supportEmail: "support@example.com",
      },
      tokens: {
        color: {
          primary: "#123456",
          primaryForeground: "#ffffff",
        },
      },
    };

    const themed = createBrandTheme(nextShiftLightTheme, brandOverride);
    expect(themed.color.primary).toBe("#123456");
    expect(themed.color.primaryForeground).toBe("#ffffff");
    expect(themed.color.background).toBe(nextShiftLightTheme.color.background);
    expect(getBrandAsset(brandOverride, "logo", "dark")).toBe("/dark.svg");
    expect(getBrandAsset(brandOverride, "altText")).toBe("Acme logo");
  });

  it("merges token overrides without changing unrelated token branches", () => {
    const merged = mergeThemeTokens(nextShiftLightTheme, {
      radius: { lg: "0.375rem" },
    });

    expect(merged.radius.lg).toBe("0.375rem");
    expect(merged.spacing["4"]).toBe(nextShiftLightTheme.spacing["4"]);
    expect(merged.color.primary).toBe(nextShiftLightTheme.color.primary);
  });

  it("renders ThemeProvider with root attributes and CSS variables", () => {
    const brandOverride: BrandThemeOverride = {
      brand: { brandId: "acme", displayName: "Acme" },
      tokens: { color: { primary: "#123456" } },
    };

    const markup = renderToStaticMarkup(
      <ThemeProvider mode="dark" brandOverride={brandOverride}>
        <Button>Inside theme</Button>
      </ThemeProvider>
    );

    expect(markup).toContain('data-nextshift-theme-provider=""');
    expect(markup).toContain('data-nextshift-theme="dark"');
    expect(markup).toContain('data-nextshift-theme-mode="dark"');
    expect(markup).toContain('data-nextshift-brand="acme"');
    expect(markup).toContain("--nextshift-color-primary:#123456");
    expect(markup).toContain("Inside theme");
  });

  it("creates context values and persistence-compatible setters", () => {
    let selectedMode: ThemeMode = "light";
    const value: ThemeContextValue = createThemeContextValue({
      mode: selectedMode,
      setMode: (nextMode) => {
        selectedMode = nextMode;
      },
    });

    expect(value.mode).toBe("light");
    expect(value.resolvedMode).toBe("light");
    value.toggleMode();
    expect(selectedMode).toBe("dark");
  });

  it("creates theme CSS variables and root style helpers", () => {
    const variables = createThemeCssVariables(nextShiftLightTheme);
    const rootAttributes = getThemeRootAttributes({ mode: "system", systemPrefersDark: true });
    const rootStyle = getThemeRootStyle({ mode: "dark" });
    const surfaceStyle = getThemedSurfaceStyle(nextShiftDarkTheme);

    expect(variables["--nextshift-color-primary" as keyof typeof variables]).toBe(
      nextShiftThemeTokens.color.primary
    );
    expect(rootAttributes["data-nextshift-theme"]).toBe("dark");
    expect(rootAttributes["data-nextshift-theme-mode"]).toBe("system");
    expect(rootStyle["--nextshift-color-background" as keyof typeof rootStyle]).toBe(
      nextShiftDarkTheme.color.background
    );
    expect(surfaceStyle.background).toBe(nextShiftDarkTheme.color.background);
  });

  it("keeps DS-001 through DS-007 compatibility visible through exports", () => {
    expect(Button).toBeDefined();
    expect(AppShell).toBeDefined();
    expect(DashboardShell).toBeDefined();
    expect(LoadingOverlay).toBeDefined();
    expect(Sparkline).toBeDefined();
    expect(Landmark).toBeDefined();
    expect(renderToStaticMarkup(<Button>DS-002</Button>)).toContain("DS-002");
    expect(renderToStaticMarkup(<AppShell>DS-003</AppShell>)).toContain(
      "DS-003"
    );
    expect(renderToStaticMarkup(<DashboardShell>DS-004</DashboardShell>)).toContain(
      "DS-004"
    );
    expect(renderToStaticMarkup(<LoadingOverlay label="DS-005" />)).toContain(
      "DS-005"
    );
    expect(
      renderToStaticMarkup(<Sparkline points={[{ x: 0, y: 1 }]} />)
    ).toContain('data-nextshift-visualization="sparkline"');
    expect(
      renderToStaticMarkup(<Landmark roleName="main">DS-007</Landmark>)
    ).toContain('data-nextshift-accessibility="landmark"');
  });
});
