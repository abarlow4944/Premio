import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { Button } from '@headlessui/react';
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon, ChevronRightIcon, ChevronLeftIcon, ChevronUpIcon, ChevronDownIcon, PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline'
import { Checkbox } from '@/components/ui/checkbox';
import Message from '../Message';

export default function DataTable({
    data,
    columns,
    count,
    query,
    setQuery,
    selectionEnabled = false,
    onSelectionChange,
    onEditSelected,
    onDeleteSelected,
    onCreate,
    error,
    success
}) {

    const [rowSelection, setRowSelection] = useState({});

    const computedColumns = useMemo(() => {
        if (!selectionEnabled) return columns;
        return [
            {
                id: '__select',
                header: ({ table }) => (
                    <Checkbox
                        aria-label="Select all rows"
                        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
                        onCheckedChange={(val) => table.toggleAllPageRowsSelected(!!val)}
                        className="translate-y-[1px]"
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        aria-label={`Select row ${row.id}`}
                        checked={row.getIsSelected()}
                        onCheckedChange={(val) => row.toggleSelected(!!val)}
                        className="translate-y-[1px]"
                    />
                ),
                enableSorting: false,
                size: 32,
            },
            ...columns,
        ];
    }, [columns, selectionEnabled]);

    const table = useReactTable({
        data,
        columns: computedColumns,
        pageCount: Math.ceil(count / query.limit), // number of pages
        manualPagination: true, // true bc we handle pagination ourselves
        state: {
            pagination: {
                pageIndex: query.page - 1, // page number (table uses 0-index)
                pageSize: query.limit, // number of rows per page
            },
            rowSelection,
        },
        onPaginationChange: (updater) => { // called when pagination state changes (any of the arrow buttons/dropped down is changed)
            const next = typeof updater === "function"
                ? updater({ // update pagination state
                    pageIndex: query.page - 1,
                    pageSize: query.limit
                })
                : updater;

            setQuery(q => ({ // trigger API fetch in backend to receive new data based on page & limit
                ...q, // keep all other fields the same
                page: next.pageIndex + 1, // update page and limit in backend
                limit: next.pageSize
            }));
        },
        getCoreRowModel: getCoreRowModel(),
        enableRowSelection: selectionEnabled,
        onRowSelectionChange: setRowSelection,
        getRowId: (original, index) => original.id !== undefined ? String(original.id) : String(index),
    });

    useEffect(() => {
        if (!selectionEnabled || !onSelectionChange) return;
        const selected = table.getSelectedRowModel().flatRows.map(r => r.original);
        onSelectionChange(selected);
    }, [rowSelection, selectionEnabled, onSelectionChange, table]);

    const handleSort = (accessorKey, sortable) => {
        if (!sortable || !accessorKey) return;
        setQuery(q => {
            const isSame = q.sortBy === accessorKey;
            const nextOrder = isSame ? (q.sortOrder === 'asc' ? 'desc' : 'asc') : 'asc';
            return { ...q, page: 1, sortBy: accessorKey, sortOrder: nextOrder };
        });
    };

    const selectedRowObjects = selectionEnabled ? table.getSelectedRowModel().flatRows.map(r => r.original) : [];
    const selectedCount = selectedRowObjects.length;

        return ( 
            <div>
            {/* Action Bar */}
            {(onCreate || selectionEnabled) && (
                <div className="mb-4 h-8 flex items-center justify-between gap-2">
                    {/* Left side: create button */}
                    <div className="flex items-center gap-2">
                        {onCreate && (
                            <button
                                type="button"
                                onClick={() => onCreate()}
                                className="inline-flex items-center gap-1 rounded-md border border-flag-red-500 px-2 py-1 text-xs font-medium text-flag-red-500 hover:bg-flag-red-500 hover:text-white transition"
                                aria-label="Create new item"
                            >
                                <PlusIcon className="size-6" /> Create
                            </button>
                        )}
                    </div>
                    
                    {/* Middle: Error/success messages */}
                    <div className="flex flex-col justify-center -mt-4">
                        {error && (
                            <Message message={error} status="error"/>
                        )}
                
                        {success && (
                            <Message message={success} status="success"/>
                        )}

                    </div>

                    {/* Right side: selection actions */}
                    <div className="flex items-center gap-2">
                        {selectionEnabled && selectedCount === 1 && (
                            <button
                                type="button"
                                onClick={() => onEditSelected && onEditSelected(selectedRowObjects)}
                                className="inline-flex items-center gap-1 rounded-md border border-flag-red-500 px-2 py-1 text-xs font-medium text-flag-red-500 hover:bg-flag-red-500 hover:text-white transition"
                                aria-label="Edit selected row"
                            >
                                <PencilSquareIcon className="size-6" /> Edit
                            </button>
                        )}
                        {selectionEnabled && selectedCount >= 1 && (
                            <button
                                type="button"
                                onClick={() => onDeleteSelected && onDeleteSelected(selectedRowObjects)}
                                className="inline-flex items-center gap-1 rounded-md border border-red-600 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-600 hover:text-white transition"
                                aria-label="Delete selected row(s)"
                            >
                                <TrashIcon className="size-6" /> Delete
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="rounded-xl shadow-sm overflow-hidden">

            {/* Header */}
            <table className="w-full table-auto">
                <thead className="bg-strawberry-red-500 text-left ">
                    {table.getHeaderGroups().map((hg) => (
                        <tr key={hg.id}>
                        {hg.headers.map((header) => {
                            const def = header.column.columnDef;
                            const accessorKey = def.accessorKey;
                            const sortable = def.enableSorting === false ? false : Boolean(accessorKey);
                            const isActive = sortable && query.sortBy === accessorKey;
                            const order = isActive ? (query.sortOrder || 'asc') : null;
                            return (
                                <th key={header.id} className="px-4 py-3 text-sm font-semibold text-platinum-500 border-b">
                                    {sortable ? (
                                        <button
                                            type="button"
                                            onClick={() => handleSort(accessorKey, sortable)}
                                            className="inline-flex items-center gap-1 select-none hover:opacity-90"
                                        >
                                            {flexRender(def.header, header.getContext())}
                                            {isActive && order === 'asc' && (
                                                <ChevronUpIcon className="size-3.5" />
                                            )}
                                            {isActive && order === 'desc' && (
                                                <ChevronDownIcon className="size-3.5" />
                                            )}
                                        </button>
                                    ) : (
                                        flexRender(def.header, header.getContext())
                                    )}
                                </th>
                            );
                        })}
                        </tr>
                    ))}
                </thead>

            {/* Body */}
                <tbody>
                    {table.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50">
                        {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="px-4 py-3 text-sm text-space-indigo-5000">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                        ))}
                        </tr>
                    ))}
                </tbody>
            </table>    
        </div>

        {/* Pagination */}
        {/* choosing number of items per page */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-space-indigo-500">
            <div className="flex items-center mb-4 sm:mb-0">
                <span className="mr-2">Items per page</span>
                <select
                    className="border border-2 border-strawberry-red-500 rounded-md shadow-sm focus:ring-strawberry-red-500 focus:border-strawberry-red-500 p-2 focus:border-2"
                    value={table.getState().pagination.pageSize}
                    onChange={e => { // update the page size when this is changed
                        table.setPageSize(Number(e.target.value))
                    }}
                    >
                    {[10, 20, 30, 40, 50].map(pageSize => (
                        <option key={pageSize} value={pageSize}>
                        {pageSize}
                        </option>
                    ))}
                </select>
            </div>
        

            {/* first two arrow buttons */}
            <div className="flex items-center space-x-2">
                <Button
                    className="p-2 rounded-md bg-platinum-50 text-flag-red-500 hover:bg-platinum-200 border border-flag-red-500 border-2"
                    onClick={() => table.firstPage()} // go to the front
                    disabled={!table.getCanPreviousPage()}
                    >
                    <ChevronDoubleLeftIcon className="stroke-2 size-4 text-flag-red-500"/>
                </Button>
                <Button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="p-2 rounded-md bg-platinum-50 text-flag-red-500 hover:bg-platinum-200 border border-flag-red-500 border-2"
                    >
                    <ChevronLeftIcon className="stroke-2 size-4 text-flag-red-500"/>
                </Button>

                {/* page number input */}
                <span className="flex items-center">
                    <input
                        min={1} // set minimum to 1
                        max={table.getPageCount()} // maximum is the number of pages
                        type="number"
                        value={table.getState().pagination.pageIndex + 1} // zero-indexed so add 1
                        onChange={(e) => { // when the input is changed
                            const page = e.target.value ? Number(e.target.value) - 1 : 0; // update the page (zero-indexed so subtract 1)
                            table.setPageIndex(page); //set the page index
                        }}
                        className="w-16 p-2 rounded-md border border-flag-red-500 text-center border-2 text-space-indigo-500"
                    />
                    <span className="ml-1 text-space-indigo-500"> of {table.getPageCount()}</span>
                </span>

                {/* last two arrow buttons */}
                <Button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="p-2 rounded-md bg-platinum-50 text-flag-red-500 hover:bg-platinum-200 border border-flag-red-500 border-2"
                    >
                    <ChevronRightIcon className="stroke-2 size-4 text-flag-red-500"/>
                </Button>
                <Button
                    onClick={() => table.lastPage()} // go to the back
                    disabled={!table.getCanNextPage()}
                    className="p-2 rounded-md bg-platinum-50 text-flag-red-500 hover:bg-platinum-200 border border-flag-red-500 border-2"
                    >
                    <ChevronDoubleRightIcon className="stroke-2 size-4 text-flag-red-500"/>
                </Button>

            </div>
        </div>
    </div>
    );
}