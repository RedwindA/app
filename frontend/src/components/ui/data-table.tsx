import { useId, type ReactNode } from "react";
import { flexRender, type Table as TableInstance } from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowsDownUpIcon,
} from "@phosphor-icons/react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { uiStrings } from "@/components/ui/strings";

/** Keep the count in a monospace span inside a centralized sentence. */
function withMonoCount(message: string, count: number) {
  const value = String(count);
  const index = message.indexOf(value);
  if (index < 0) return message;
  return (
    <>
      {message.slice(0, index)}
      <span className="font-mono">{value}</span>
      {message.slice(index + value.length)}
    </>
  );
}

/** TanStack owns the row model; the page owns data, state, filters and callbacks. */
export function DataTable<TData>({
  table,
  caption,
  toolbar,
  loading = false,
  error,
  onRetry,
  selectable = false,
  emptyTitle = uiStrings.dataTable.emptyTitle,
  emptyDescription = uiStrings.dataTable.emptyDescription,
  getRowLabel,
  strings,
}: {
  table: TableInstance<TData>;
  caption: string;
  toolbar?: ReactNode;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  selectable?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  getRowLabel?: (row: TData) => string;
  strings?: Partial<typeof uiStrings.dataTable>;
}) {
  const text = { ...uiStrings.dataTable, ...strings };
  const pageSizeId = useId();
  const rows = table.getRowModel().rows;
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  const columns = table.getVisibleLeafColumns().length + Number(selectable);
  const count = table.getRowCount();
  const pageCount = Math.max(1, table.getPageCount());
  const { pageIndex, pageSize } = table.getState().pagination;
  const page = Math.min(pageIndex + 1, pageCount);
  const unavailable = loading || !!error;
  return (
    <div className="min-w-0 space-y-4">
      {toolbar}
      {error && (
        <Alert variant="error" title={text.errorTitle}>
          {error}
          {onRetry && (
            <Button className="mt-2 block" variant="outline" onClick={onRetry}>
              {text.retry}
            </Button>
          )}
        </Alert>
      )}
      <div aria-busy={loading}>
        <Table
          containerProps={{
            tabIndex: 0,
            role: "region",
            "aria-label": caption,
          }}
        >
          <TableCaption className="mt-0 caption-top pb-3 text-left">
            {caption}
          </TableCaption>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {selectable && (
                  <TableHead scope="col" className="w-11">
                    <Checkbox
                      aria-label={text.selectPage}
                      checked={table.getIsAllPageRowsSelected()}
                      indeterminate={
                        table.getIsSomePageRowsSelected() &&
                        !table.getIsAllPageRowsSelected()
                      }
                      disabled={unavailable || rows.length === 0}
                      onCheckedChange={(checked) =>
                        table.toggleAllPageRowsSelected(checked)
                      }
                    />
                  </TableHead>
                )}
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const Icon =
                    sorted === "asc"
                      ? ArrowUpIcon
                      : sorted === "desc"
                        ? ArrowDownIcon
                        : ArrowsDownUpIcon;
                  return (
                    <TableHead
                      key={header.id}
                      scope="col"
                      colSpan={header.colSpan}
                      aria-sort={
                        header.column.getCanSort()
                          ? sorted === "asc"
                            ? "ascending"
                            : sorted === "desc"
                              ? "descending"
                              : "none"
                          : undefined
                      }
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          type="button"
                          className="flex min-h-11 w-full items-center gap-2 rounded-sm text-left whitespace-nowrap hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                          disabled={unavailable}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          <Icon aria-hidden className="size-3.5 shrink-0" />
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }, (_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={columns}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={columns}
                  className="py-8 text-center text-muted-foreground"
                >
                  {text.unavailable}
                </TableCell>
              </TableRow>
            ) : rows.length ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={row.getIsSelected() ? "bg-link/5" : undefined}
                >
                  {selectable && (
                    <TableCell>
                      <Checkbox
                        aria-label={text.selectRow(
                          getRowLabel?.(row.original) ?? row.id,
                        )}
                        checked={row.getIsSelected()}
                        disabled={!row.getCanSelect()}
                        onCheckedChange={(checked) =>
                          row.toggleSelected(checked)
                        }
                      />
                    </TableCell>
                  )}
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns}>
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle>{emptyTitle}</EmptyTitle>
                      <EmptyDescription>{emptyDescription}</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-xs text-muted-foreground">
          {loading ? (
            text.loading
          ) : error ? (
            text.loadFailed
          ) : (
            <>
              {withMonoCount(text.total(count), count)}
              {selectable &&
                withMonoCount(text.selected(selectedCount), selectedCount)}
            </>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <label htmlFor={pageSizeId}>{text.pageSize}</label>
            <Select
              value={pageSize}
              disabled={unavailable}
              onValueChange={(value) => {
                if (value !== null) table.setPageSize(value);
              }}
            >
              <SelectTrigger
                id={pageSizeId}
                aria-label={text.pageSizeLabel}
                className="h-11 w-20 text-foreground sm:h-[34px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from(new Set([5, 10, 20, pageSize]))
                  .sort((a, b) => a - b)
                  .map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <Pagination
            page={page}
            pageCount={pageCount}
            disabled={unavailable || count === 0}
            onPageChange={(next) => table.setPageIndex(next - 1)}
          />
        </div>
      </div>
    </div>
  );
}
