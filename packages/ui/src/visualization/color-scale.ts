import { nextShiftThemeTokens } from "@nextshift/shared";
import type { VisualizationTone } from "../types";

export function getCategoricalColor(index: number): string {
  const palette = nextShiftThemeTokens.chart.categorical;
  return palette[index % palette.length];
}

export function getSequentialColor(index: number): string {
  const palette = nextShiftThemeTokens.chart.sequential;
  return palette[Math.max(0, Math.min(index, palette.length - 1))];
}

export function getToneColor(tone: VisualizationTone): string {
  if (tone === "positive") {
    return nextShiftThemeTokens.chart.positive;
  }

  if (tone === "negative") {
    return nextShiftThemeTokens.chart.negative;
  }

  if (tone === "info") {
    return nextShiftThemeTokens.color.info;
  }

  return nextShiftThemeTokens.chart.neutral;
}
