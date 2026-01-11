// src/shared/ui/data-table.tsx
import * as React from 'react';
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from '@tanstack/react-table';
import { Button } from './button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  page: number;        // 1-based
  pageSize: number;
  pageCount: number;   // 총 페이지 수(몰라요면 0 또는 -1)
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

export function DataTable<TData, TValue>({
  columns, data, loading = false, page, pageSize, pageCount,
  onPageChange, onPageSizeChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true, // 서버 정렬을 쓸 때도 정렬 UI는 표시
  });

  const canPrev = page > 1;
  const canNext = pageCount > 0 ? page < pageCount : true;

  return (
    <div className="space-y-3">
      {/* 상단 컨트롤 */}
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          {loading ? 'Loading…' : `현재 페이지 행: ${data.length}`}
        </div>

        <div className="flex items-center gap-2">
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
            <SelectTrigger className="h-9 w-[120px]">
              <SelectValue placeholder="Page size" />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((s) => (
                <SelectItem key={s} value={String(s)}>{s} / page</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => onPageChange(1)} disabled={!canPrev}>«</Button>
            <Button size="sm" variant="outline" onClick={() => onPageChange(page - 1)} disabled={!canPrev}>Prev</Button>
            <div className="px-2 text-sm tabular-nums">
              {pageCount > 0 ? `${page} / ${pageCount}` : `${page}`}
            </div>
            <Button size="sm" variant="outline" onClick={() => onPageChange(page + 1)} disabled={!canNext}>Next</Button>
            <Button size="sm" variant="outline" onClick={() => onPageChange(pageCount)} disabled={pageCount <= 0 || !canNext}>»</Button>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {columns.map((_, j) => (
                    <TableCell key={`sk-${i}-${j}`} className="h-10 animate-pulse bg-muted/40" />
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">
                  데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
