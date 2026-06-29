import * as React from "react";
import {
  getLegendStyle,
  getLegendSwatchStyle,
  mergeStyles,
} from "../styles";
import type { LegendItem } from "../types";
import { getCategoricalColor } from "./color-scale";

export interface LegendProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly items: readonly LegendItem[];
}

export function Legend({
  items,
  className,
  style,
  ...props
}: LegendProps): React.ReactElement {
  return (
    <div
      className={className}
      data-nextshift-visualization="legend"
      style={mergeStyles(getLegendStyle(), style)}
      {...props}
    >
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`}>
          <span
            aria-hidden="true"
            style={getLegendSwatchStyle(item.color ?? getCategoricalColor(index))}
          />{" "}
          {item.label}
        </span>
      ))}
    </div>
  );
}
