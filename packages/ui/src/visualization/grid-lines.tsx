import * as React from "react";
import { getGridLineStroke } from "../styles";

export interface GridLinesProps extends React.SVGAttributes<SVGSVGElement> {
  readonly rows?: number;
  readonly columns?: number;
}

export function GridLines({
  rows = 4,
  columns = 4,
  ...props
}: GridLinesProps): React.ReactElement {
  const stroke = getGridLineStroke();
  const rowLines = Array.from({ length: rows + 1 }, (_, index) => index / rows);
  const columnLines = Array.from(
    { length: columns + 1 },
    (_, index) => index / columns
  );

  return (
    <svg
      aria-hidden="true"
      data-nextshift-visualization="grid-lines"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      {...props}
    >
      {rowLines.map((ratio) => (
        <line
          key={`row-${ratio}`}
          x1="0"
          x2="100"
          y1={ratio * 100}
          y2={ratio * 100}
          stroke={stroke}
          strokeWidth="0.5"
        />
      ))}
      {columnLines.map((ratio) => (
        <line
          key={`column-${ratio}`}
          x1={ratio * 100}
          x2={ratio * 100}
          y1="0"
          y2="100"
          stroke={stroke}
          strokeWidth="0.5"
        />
      ))}
    </svg>
  );
}
