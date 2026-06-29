import { describe, expect, it } from "vitest";
import {
  componentTokens,
  nextShiftThemeTokens,
  primitiveTokens,
  resolveSemanticToken,
  resolveToken,
  semanticTokens,
  type ComponentTokens,
  type PrimitiveTokens,
  type SemanticTokens,
  type ThemeTokens,
  type TokenPath,
  type TokenValue,
} from "../../src";

describe("design tokens", () => {
  it("defines primitive token categories", () => {
    expect(primitiveTokens.color.brand["600"]).toBe("#2563eb");
    expect(primitiveTokens.color.neutral["0"]).toBe("#ffffff");
    expect(primitiveTokens.spacing["4"]).toBe("1rem");
    expect(primitiveTokens.radius.md).toBe("0.375rem");
    expect(primitiveTokens.chart.categorical.length).toBeGreaterThan(4);
  });

  it("defines semantic color tokens", () => {
    expect(semanticTokens.color.background).toBe("#ffffff");
    expect(semanticTokens.color.foreground).toBe("#111827");
    expect(semanticTokens.color.primary).toBe("#2563eb");
    expect(semanticTokens.color.dangerForeground).toBe("#ffffff");
    expect(semanticTokens.color.focusRing).toBe("#3b82f6");
    expect(semanticTokens.overlay.background).toBe("rgba(255, 255, 255, 0.82)");
    expect(semanticTokens.overlay.scrim).toBe("rgba(17, 24, 39, 0.48)");
  });

  it("defines the theme token structure", () => {
    expect(nextShiftThemeTokens.color.background).toBe(
      semanticTokens.color.background
    );
    expect(nextShiftThemeTokens.spacing["4"]).toBe(primitiveTokens.spacing["4"]);
    expect(nextShiftThemeTokens.component.button.primary.background).toBe(
      semanticTokens.color.primary
    );
    expect(nextShiftThemeTokens.overlay.scrim).toBe(
      semanticTokens.overlay.scrim
    );
    expect(nextShiftThemeTokens.primitive.color.brand["600"]).toBe("#2563eb");
  });

  it("defines component-facing aliases", () => {
    expect(componentTokens.button.primary.foreground).toBe(
      semanticTokens.color.primaryForeground
    );
    expect(componentTokens.input.borderError).toBe(semanticTokens.color.danger);
    expect(componentTokens.card.padding).toBe(semanticTokens.spacing["6"]);
    expect(componentTokens.chart.categoricalPalette).toEqual(
      primitiveTokens.chart.categorical
    );
  });

  it("resolves token paths", () => {
    expect(resolveToken(nextShiftThemeTokens, "color.background")).toBe(
      "#ffffff"
    );
    expect(resolveToken(nextShiftThemeTokens, "spacing.4")).toBe("1rem");
    expect(resolveToken(nextShiftThemeTokens, "radius.md")).toBe("0.375rem");
    expect(resolveToken(nextShiftThemeTokens, "component.input.border")).toBe(
      "#e5e7eb"
    );
  });

  it("returns undefined or fallback for missing tokens", () => {
    expect(resolveToken(nextShiftThemeTokens, "color.missing")).toBeUndefined();
    expect(resolveToken(nextShiftThemeTokens, "color.missing", "fallback")).toBe(
      "fallback"
    );
    expect(resolveToken(nextShiftThemeTokens, "")).toBeUndefined();
    expect(resolveToken(nextShiftThemeTokens, "", "fallback")).toBe("fallback");
  });

  it("does not return token groups as leaf values", () => {
    expect(resolveToken(nextShiftThemeTokens, "color")).toBeUndefined();
    expect(resolveToken(nextShiftThemeTokens, "color", "fallback")).toBe(
      "fallback"
    );
  });

  it("freezes exported token objects", () => {
    expect(Object.isFrozen(primitiveTokens)).toBe(true);
    expect(Object.isFrozen(primitiveTokens.color.brand)).toBe(true);
    expect(Object.isFrozen(semanticTokens.color)).toBe(true);
    expect(Object.isFrozen(componentTokens.button.primary)).toBe(true);
    expect(Object.isFrozen(nextShiftThemeTokens.component)).toBe(true);
  });

  it("keeps public exports available", () => {
    const primitive: PrimitiveTokens = primitiveTokens;
    const semantic: SemanticTokens = semanticTokens;
    const component: ComponentTokens = componentTokens;
    const theme: ThemeTokens = nextShiftThemeTokens;
    const path: TokenPath = "color.background";
    const value: TokenValue | undefined = resolveSemanticToken(path);

    expect(primitive.color.brand["600"]).toBeDefined();
    expect(semantic.color.background).toBeDefined();
    expect(component.button.primary.background).toBeDefined();
    expect(theme.color.background).toBe(value);
  });
});
