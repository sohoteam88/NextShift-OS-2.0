import type { ChartValueFormatOptions } from "../types";

export function formatChartValue(
  value: number,
  options: ChartValueFormatOptions = {}
): string {
  const formatted = new Intl.NumberFormat(options.locale, {
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
    minimumFractionDigits: options.minimumFractionDigits,
  }).format(value);

  return `${options.prefix ?? ""}${formatted}${options.suffix ?? ""}`;
}

export function formatPercent(value: number, options: ChartValueFormatOptions = {}) {
  return formatChartValue(value, {
    ...options,
    maximumFractionDigits: options.maximumFractionDigits ?? 1,
    suffix: options.suffix ?? "%",
  });
}
