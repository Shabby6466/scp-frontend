'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

function insetClass(inset?: 'start' | 'end' | 'both') {
  return cn(
    (inset === 'start' || inset === 'both') && 'pl-4',
    (inset === 'end' || inset === 'both') && 'pr-4',
  );
}

export interface DataTableCardProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Card shell with optional title, description, and toolbar actions.
 * Place `DataTable.Table` (and body) inside `children`.
 */
function DataTableCard({ title, description, actions, children, className }: DataTableCardProps) {
  const hasHeader = title != null || description != null || actions != null;

  return (
    <Card className={cn('overflow-hidden border-border/80 shadow-elevated', className)}>
      {hasHeader ? (
        <CardHeader className="flex flex-col gap-3 space-y-0 border-b border-border/60 bg-muted/25 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 space-y-1">
            {title != null && title !== '' ? (
              <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
            ) : null}
            {description != null && description !== '' ? (
              <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
            ) : null}
          </div>
          {actions != null ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </CardHeader>
      ) : null}
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

/** Header row that does not use the default data-row hover background. */
function DataTableHeaderRow({ className, ...props }: React.ComponentProps<typeof TableRow>) {
  return <TableRow className={cn('hover:bg-transparent', className)} {...props} />;
}

function DataTableHead({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof TableHead> & {
  /** Extra horizontal padding aligned with app tables (first/last columns). */
  inset?: 'start' | 'end' | 'both';
}) {
  return <TableHead className={cn(insetClass(inset), className)} {...props} />;
}

function DataTableCell({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof TableCell> & {
  inset?: 'start' | 'end' | 'both';
}) {
  return <TableCell className={cn(insetClass(inset), className)} {...props} />;
}

export interface DataTableSkeletonRowsProps {
  columns: number;
  /** Number of placeholder rows (default 5). */
  rows?: number;
}

function DataTableSkeletonRows({ columns, rows = 5 }: DataTableSkeletonRowsProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: columns }).map((__, j) => (
            <DataTableCell
              key={j}
              inset={
                columns === 1
                  ? 'both'
                  : j === 0
                    ? 'start'
                    : j === columns - 1
                      ? 'end'
                      : undefined
              }
            >
              <div className="h-4 max-w-48 animate-pulse rounded bg-muted" />
            </DataTableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

/** Standard padding around an `EmptyState` inside a card table area. */
function DataTableEmptyWrap({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-4 py-12', className)}>{children}</div>;
}

/** Column-driven header row (pairs with {@link DataTableColumnRows}). */
export type DataTableColumnDef<T> = {
  id: string;
  header: React.ReactNode;
  headerClassName?: string;
  headInset?: 'start' | 'end' | 'both';
  cell: (row: T) => React.ReactNode;
  cellClassName?: string;
  cellInset?: 'start' | 'end' | 'both';
};

function DataTableColumnHeaderRow<T>({ columns }: { columns: DataTableColumnDef<T>[] }) {
  return (
    <DataTableHeaderRow>
      {columns.map((col) => (
        <DataTableHead key={col.id} inset={col.headInset} className={col.headerClassName}>
          {col.header}
        </DataTableHead>
      ))}
    </DataTableHeaderRow>
  );
}

function DataTableColumnRows<T>({
  data,
  columns,
  getRowKey,
}: {
  data: T[];
  columns: DataTableColumnDef<T>[];
  getRowKey: (row: T) => string;
}) {
  return (
    <>
      {data.map((row) => (
        <TableRow key={getRowKey(row)}>
          {columns.map((col) => (
            <DataTableCell key={col.id} inset={col.cellInset} className={col.cellClassName}>
              {col.cell(row)}
            </DataTableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

/**
 * App-wide table building blocks. Reuses `components/ui/table` with shared layout helpers.
 *
 * @example
 * ```tsx
 * import { DataTable } from '@/components/data/data-table';
 *
 * <DataTable.Card title="Users" description="People in this school." actions={<Link className={buttonVariants({ size: 'sm' })} href="/users">Add user</Link>}>
 *   <DataTable.Table>
 *     <DataTable.Header>
 *       <DataTable.HeaderRow>
 *         <DataTable.Head inset="start">Name</DataTable.Head>
 *         <DataTable.Head inset="end" className="text-right">Actions</DataTable.Head>
 *       </DataTable.HeaderRow>
 *     </DataTable.Header>
 *     <DataTable.Body>
 *       {rows.map((row) => (
 *         <DataTable.Row key={row.id}>
 *           <DataTable.Cell inset="start">{row.name}</DataTable.Cell>
 *           <DataTable.Cell inset="end" className="text-right">…</DataTable.Cell>
 *         </DataTable.Row>
 *       ))}
 *     </DataTable.Body>
 *   </DataTable.Table>
 * </DataTable.Card>
 * ```
 */
export const DataTable = {
  Card: DataTableCard,
  Table,
  Header: TableHeader,
  Body: TableBody,
  Footer: TableFooter,
  Row: TableRow,
  HeaderRow: DataTableHeaderRow,
  Head: DataTableHead,
  Cell: DataTableCell,
  Caption: TableCaption,
  SkeletonRows: DataTableSkeletonRows,
  EmptyWrap: DataTableEmptyWrap,
  ColumnHeaderRow: DataTableColumnHeaderRow,
  ColumnRows: DataTableColumnRows,
};
