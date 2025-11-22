import { useState, useCallback, useEffect, useRef } from 'react';
import { useReactTable, getCoreRowModel, flexRender, getPaginationRowModel } from "@tanstack/react-table";
import { Button } from '@headlessui/react';
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon, ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline'

export default function DataTable({data, columns, count}) {

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true, // turn off client-side pagination,
        getPaginationRowModel: getPaginationRowModel(),
        initialstate: {
            pagination: {
                pageIndex: 0, // initial page index (page number -> zero-indexed)
                pageSize: 10, // initial page size (how many rows in a page)
            }
        },
    });

    return ( 
        <div>
            {/* Table */}
        <div className="rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <table className="w-full table-auto">
                <thead className="bg-strawberry-red-500 text-left ">
                    {table.getHeaderGroups().map((hg) => (
                        <tr key={hg.id}>
                        {hg.headers.map((header) => (
                            <th key={header.id} className="px-4 py-3 text-sm font-semibold text-platinum-500 border-b">
                                {flexRender(header.column.columnDef.header, header.getContext())}
                            </th>
                        ))}
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
                    {[1, 20, 30, 40, 50].map(pageSize => (
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