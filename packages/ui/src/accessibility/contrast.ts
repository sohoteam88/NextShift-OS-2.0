import { nextShiftThemeTokens } from "@nextshift/shared";
import type * as React from "react";
import type { ContrastCompliance } from "../types";

function normalizeHex(hex: string): string {
  const trimmed = hex.replace("#", "").trim();
  if (trimmed.length === 3) {
    return trimmed
      .split("")
      .map((char) => `${char}${char}`)
      .join("");
  }
  return trimmed;
}

export function parseHexColor(hex: string): readonly [number, number, number] {
  const normalized = normalizeHex(hex);
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function toLinearChannel(value: number): number {
  const channel = value / 255;
  return channel <= 0.03928
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

export function getRelativeLuminance(hex: string): number {
  const [red, green, blue] = parseHexColor(hex).map(toLinearChannel);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function getContrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = getRelativeLuminance(foreground);
  const backgroundLuminance = getRelativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsContrast(
  foreground: string,
  background: string,
  options: {
    readonly compliance?: ContrastCompliance;
    readonly largeText?: boolean;
  } = {}
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const required =
    options.compliance === "AAA"
      ? options.largeText
        ? 4.5
        : 7
      : options.largeText
        ? 3
        : 4.5;

  return ratio >= required;
}

export function getHighContrastStyle(enabled = false): React.CSSProperties {
  const theme = nextShiftThemeTokens;
  return enabled
    ? {
        background: theme.color.background,
        borderColor: theme.color.foreground,
        color: theme.color.foreground,
      }
    : {};
}
