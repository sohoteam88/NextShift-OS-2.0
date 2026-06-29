import * as React from "react";
import {
  getTableCellStyle,
  getTableStyle,
  mergeStyles,
} from "../styles";

export interface TableProps
  extends React.TableHTMLAttributes<HTMLTableElement> {
  readonly emptyState?: React.ReactNode;
  readonly isEmpty?: boolean;
  readonly columnCount?: number;
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  (
    { emptyState, isEmpty = false, columnCount = 1, children, className, style, ...props },
    ref
  ) => (
    <table
      ref={ref}
      className={className}
      style={mergeStyles(getTableStyle(), style)}
      {...props}
    >
      {children}
      {isEmpty && emptyState ? (
        <tbody>
          <tr>
            <td colSpan={columnCount} style={getTableCellStyle("cell")}>
              {emptyState}
            </td>
          </tr>
        </tbody>
      ) : null}
    </table>
  )
);

Table.displayName = "Table";

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ children, ...props }, ref) => (
  <thead ref={ref} {...props}>
    {children}
  </thead>
));

TableHeader.displayName = "TableHeader";

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ children, ...props }, ref) => (
  <tbody ref={ref} {...props}>
    {children}
  </tbody>
));

TableBody.displayName = "TableBody";

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ children, ...props }, ref) => (
  <tr ref={ref} {...props}>
    {children}
  </tr>
));

TableRow.displayName = "TableRow";

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ children, style, ...props }, ref) => (
  <th ref={ref} style={mergeStyles(getTableCellStyle("head"), style)} {...props}>
    {children}
  </th>
));

TableHead.displayName = "TableHead";

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ children, style, ...props }, ref) => (
  <td ref={ref} style={mergeStyles(getTableCellStyle("cell"), style)} {...props}>
    {children}
  </td>
));

TableCell.displayName = "TableCell";
