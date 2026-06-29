import * as React from "react";
import { getAxisStyle, mergeStyles } from "../styles";

export interface AxisProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly labels: readonly string[];
  readonly orientation?: "horizontal" | "vertical";
}

export function Axis({
  labels,
  orientation = "horizontal",
  className,
  style,
  ...props
}: AxisProps): React.ReactElement {
  return (
    <div
      aria-hidden="true"
      className={className}
      data-nextshift-visualization="axis"
      data-orientation={orientation}
      style={mergeStyles(
        getAxisStyle(),
        {
          display: "flex",
          flexDirection: orientation === "horizontal" ? "row" : "column",
          justifyContent: "space-between",
        },
        style
      )}
      {...props}
    >
      {labels.map((label) => (
        <span key={label}>{label}</span>
      ))}
    </div>
  );
}
