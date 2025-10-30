import React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown, Download, Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToCSV } from '@/lib/csv';

type RowAction<TData> = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (row: TData) => void;
  tone?: 'default' | 'danger';
};

type DataTableProps<TData, TValue> = {
  columns: any[];
  data: TData[];
  onRowClick?: (row: TData) => void;
  rowActions?: RowAction<TData>[];
  enableExport?: boolean;
  enableSearch?: boolean;
  exportFilename?: string;
  className?: string;
  getRowId?: (r: TData) => string;
};

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  rowActions = [],
  enableExport = true,
  enableSearch = true,
  exportFilename = 'data',
  className,
  getRowId = (r: any) => (r?.id ?? r?._id ?? String(Math.random())),
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState('');

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility, globalFilter },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
    getRowId: (row) => getRowId(row as unknown as TData),
  });

  const filteredCount = table.getFilteredRowModel().rows.length;
  const pageRows = table.getRowModel().rows;

  return (
    <div
      className={cn(
        'flex flex-col h-full rounded-xl border shadow-sm transition',
        'bg-white border-gray-200 dark:bg-darkSurface-elevated dark:border-darkSurface-border',
        'dark:shadow-[0_0_20px_rgba(0,0,0,0.35)]',
        className
      )}
    >
      {/* Toolbar */}
      <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-darkSurface-border bg-gray-50 dark:bg-darkSurface-header/90 backdrop-blur-sm'>
        <div className='flex items-center gap-4 text-sm'>
          <div className='flex items-center text-gray-700 dark:text-gray-300'>
            <Filter className='h-4 w-4 mr-2 text-primary-500' />
            {filteredCount} of {data.length} rows
          </div>
          {enableSearch && (
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
              <input
                type='text'
                placeholder='Search...'
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className='pl-9 pr-4 py-2 w-64 text-sm rounded-md border border-gray-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-base text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
              />
            </div>
          )}
        </div>

        {enableExport && (
          <button
            onClick={() =>
              exportToCSV({
                filename: exportFilename,
                data: table.getRowModel().rows.map((r) => r.original),
              })
            }
            className='inline-flex items-center px-4 py-2 rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 transition'
          >
            <Download className='h-5 w-5 mr-2' /> Export
          </button>
        )}
      </div>

      {/* Table */}
      <div className='flex-1 overflow-auto'>
        <table className='min-w-full table-fixed text-sm'>
          <thead className='sticky top-0 bg-gray-100 dark:bg-darkSurface-header text-gray-700 dark:text-gray-200 uppercase text-xs'>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className='px-6 py-3 font-semibold tracking-wide border-b border-gray-200 dark:border-darkSurface-border select-none'
                    onClick={
                      h.column.getCanSort()
                        ? h.column.getToggleSortingHandler()
                        : undefined
                    }
                  >
                    <div className='flex items-center gap-2'>
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {h.column.getCanSort() && (
                        <span className='flex flex-col leading-none'>
                          <ChevronUp
                            className={cn(
                              'h-3 w-3',
                              h.column.getIsSorted() === 'asc'
                                ? 'text-primary-500'
                                : 'text-gray-400'
                            )}
                          />
                          <ChevronDown
                            className={cn(
                              'h-3 w-3 -mt-1',
                              h.column.getIsSorted() === 'desc'
                                ? 'text-primary-500'
                                : 'text-gray-400'
                            )}
                          />
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                {rowActions.length > 0 && (
                  <th className='px-6 py-3 font-semibold tracking-wide border-b border-gray-200 dark:border-darkSurface-border text-right'>
                    Actions
                  </th>
                )}
              </tr>
            ))}
          </thead>

          <tbody className='divide-y divide-gray-200 dark:divide-darkSurface-border'>
            {pageRows.length ? (
              pageRows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className={cn(
                    'hover:bg-primary-50 dark:hover:bg-darkSurface-hover transition-colors',
                    onRowClick ? 'cursor-pointer' : ''
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className='px-6 py-4 text-gray-900 dark:text-gray-200 whitespace-nowrap'>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                  {rowActions.length > 0 && (
                    <td className='px-6 py-4'>
                      <div className='flex items-center justify-end gap-2'>
                        {rowActions.map((a) => (
                          <button
                            key={a.id}
                            onClick={(e) => {
                              e.stopPropagation(); // prevent row click
                              a.onClick(row.original as TData);
                            }}
                            className={cn(
                              'inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs border',
                              a.tone === 'danger'
                                ? 'text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30'
                                : 'text-gray-700 border-gray-200 hover:bg-gray-50 dark:hover:bg-darkSurface-hover'
                            )}
                            title={a.label}
                          >
                            {a.icon}
                            <span>{a.label}</span>
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (rowActions.length > 0 ? 1 : 0)}
                  className='px-6 py-12 text-center text-gray-500 dark:text-gray-400'
                >
                  No results found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className='p-4 border-t border-gray-200 dark:border-darkSurface-border bg-gray-50 dark:bg-darkSurface-header/90 text-sm text-gray-700 dark:text-gray-300'>
        Showing {filteredCount} items
      </div>
    </div>
  );
}
