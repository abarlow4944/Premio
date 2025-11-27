import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { DualRangeSlider } from '@/components/ui/dual-range-slider';
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon, ChevronRightIcon, ChevronLeftIcon, ChevronUpIcon, ChevronDownIcon, PencilSquareIcon, TrashIcon, PlusIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'
import { Checkbox } from '@/components/ui/checkbox';
import Message from '../Message';

export default function DataTable({
    data,
    columns,
    count,
    query,
    setQuery,
    initialStableMax,
    selectionEnabled = false,
    onSelectionChange,
    enableEditing = true,
    onEditSelected,
    onDeleteSelected,
    onCreate,
    error,
    success,
    onRowSave // for saving edited row
}) {

    const [rowSelection, setRowSelection] = useState({});
    const [columnFilters, setColumnFilters] = useState({});
    const stableMaxRef = useRef({});

    // for editable rows
    const [internalData, setInternalData] = useState(data);
    const [editingRowId, setEditingRowId] = useState(null); //which row is being edited
    const [editingRowBackup, setEditingRowBackup] = useState(null) // to store original info in case user cancels edits

    useEffect(() => { //keep in sync
        setInternalData(data);
    }, [data]);

    function startEditingRow(row) {
        setEditingRowId(row.id) // table row ID
        setEditingRowBackup(row.original); // backup original data for cancel
    }

    function cancelEditingRow(){
        if(editingRowId !== null && editingRowBackup){
            setInternalData(old => // change the data back to the original
                old.map(row =>
                    String(row.id) === String(editingRowBackup.id) ? editingRowBackup : row
                )
            )
        }

        //clear edit mode
        setEditingRowId(null);
        setEditingRowBackup(null);
    }

    async function saveEditingRow(row) {
        const original = editingRowBackup; // the original data prior to edits
        let changed = null; // capture changed data outside setInternalData

        setInternalData((prev) => {
            const updated = prev.find(
                (r) => String(r.id) === String(row.original.id)
            ); // find row that was edited

            // compute changed fields
            const diff = { id: updated.id }; // the id of the row that was edited
            Object.keys(updated).forEach((key) => { // go through each field/column and check if they changed
                if (original && updated[key] !== original[key]) { // add the field to the dictionary if it changed
                    diff[key] = updated[key];
                }
            });

            changed = diff; // save for async call
            return prev; // don't modify internalData here
        });

        // wait for React to apply the state update
        await Promise.resolve();

        // try saving to backend
        try {
            await onRowSave(changed); // if it's a success, do nothing
        } catch (err) { // if there was an error, revert setInternalData to previous data
            if (original) {
                setInternalData((prev) =>
                    prev.map((r) => // for every row
                        String(r.id) === String(original.id) ? original : r
                    )
                );
            }
        }

        // clear edit mode no matter what
        setEditingRowId(null);
        setEditingRowBackup(null);
    }

    // set stableMaxRef from provided initial maxima
    useEffect(() => {
        if (!initialStableMax) return;
        const next = { ...stableMaxRef.current };
        Object.keys(initialStableMax).forEach(k => {
            const v = Number(initialStableMax[k]);
            if (!Number.isNaN(v)) {
                next[k] = Math.max(next[k] || 0, v);
            }
        });
        stableMaxRef.current = next;
    }, [initialStableMax]);

    const computedColumns = useMemo(() => {
    let cols = columns;

    // If selection is enabled, add the checkbox column at the start
    if (selectionEnabled) {
        const selectCol = {
        id: '__select',
        header: ({ table }) => (
            <Checkbox
            aria-label="Select all rows"
            checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(val) =>
                table.toggleAllPageRowsSelected(!!val)
            }
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
        };

        cols = [selectCol, ...cols];
    }

    if (enableEditing){
        // Add Actions column at the END
        const actionsCol = {
            id: '__actions',
            header: 'Actions',
            enableSorting: false,
            cell: ({ row }) => {
            const isEditing = editingRowId === row.id;
            return (
                <div className="flex items-center gap-2">
                {isEditing ? (
                    <>
                    {/* Save */}
                    <button
                        type="button"
                        onClick={() => saveEditingRow(row)}
                        className="text-green-600 hover:text-green-800"
                        aria-label="Save row"
                    >
                        <CheckCircleIcon className="size-5" />
                    </button>

                    {/* Cancel */}
                    <button
                        type="button"
                        onClick={cancelEditingRow}
                        className="text-red-600 hover:text-red-800"
                        aria-label="Cancel edit"
                    >
                        <XCircleIcon className="size-5" />
                    </button>
                    </>
                ) : (
                    <>
                    {/* Edit */}
                    <button
                        type="button"
                        onClick={() => startEditingRow(row)}
                        className="text-blue-600 hover:text-blue-800"
                        aria-label="Edit row"
                    >
                        <PencilSquareIcon className="size-5" />
                    </button>
                    </>
                )}
                </div>
            );
            },
        };
        // console.log(actionsCol);
        return [...cols, actionsCol];
    }
    else{
        return [...cols];
    }
   
    }, [columns, selectionEnabled, editingRowId]);


    const table = useReactTable({
        data: internalData,
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
        meta: { // for editable rows
            updateData: (rowIndex, columnId, value) => {
                setInternalData((old) =>
                    old.map((row, index) => {
                        if (index === rowIndex) {
                            return {
                                ...old[rowIndex],
                                [columnId]: value,
                            };
                        }
                        return row;
                    })
                )
            }
        }
    });

    // for checkboxes
    useEffect(() => {
        if (!selectionEnabled || !onSelectionChange) return;
        const selected = table.getSelectedRowModel().flatRows.map(r => r.original);
        onSelectionChange(selected);
    }, [rowSelection, selectionEnabled, onSelectionChange, table]);

    useEffect(() => {
        const initial = {};
        computedColumns.forEach((col) => {
            const key = col.accessorKey;
            if (!key) return;

            // range filters store separate min/max keys on the query
            if (col.filterType === 'range') {
                const minKey = `${key}Min`;
                const maxKey = `${key}Max`;
                if (query[minKey] !== undefined && query[minKey] !== null && query[minKey] !== '') {
                    initial[minKey] = String(query[minKey]);
                }
                if (query[maxKey] !== undefined && query[maxKey] !== null && query[maxKey] !== '') {
                    initial[maxKey] = String(query[maxKey]);
                }
            } else {
                if (query[key] !== undefined && query[key] !== null && query[key] !== '') {
                    initial[key] = String(query[key]);
                }
            }
        });
        // avoid overwriting if no change
        setColumnFilters((prev) => {
            const prevKeys = Object.keys(prev);
            const initKeys = Object.keys(initial);
            if (prevKeys.length === initKeys.length && initKeys.every(k => String(prev[k] || '') === String(initial[k] || ''))) {
                return prev;
            }
            return initial;
        });
    }, [query, computedColumns]);

    // lets filtering update the query after a debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            const keys = Object.keys(columnFilters);
            const nonEmpty = {};
            keys.forEach((k) => {
                const v = columnFilters[k];
                if (v !== undefined && v !== null && String(v).trim() !== '') {
                    nonEmpty[k] = v;
                }
            });

            setQuery((q) => {
                const next = { ...q, page: 1 };
                keys.forEach((k) => {
                    if (k in next) delete next[k];
                });
                return { ...next, ...nonEmpty };
            });
        }, 400);
        return () => clearTimeout(timer);
    }, [columnFilters, setQuery]);

    // for sorting
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
                            <Button
                                onClick={() => onCreate()}
                                className="inline-flex items-center gap-1 rounded-md border border-flag-red-500 px-2 py-1 text-xs font-medium text-flag-red-500 hover:bg-flag-red-500 hover:text-white transition"
                                aria-label="Create new item"
                                variant="outline"
                                size="sm"
                            >
                                <PlusIcon className="size-6" /> Create
                            </Button>
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
                            <Button
                                onClick={() => onEditSelected && onEditSelected(selectedRowObjects)}
                                className="inline-flex items-center gap-1 rounded-md border border-flag-red-500 px-2 py-1 text-xs font-medium text-flag-red-500 hover:bg-flag-red-500 hover:text-white transition"
                                aria-label="Edit selected row"
                                variant="outline"
                                size="sm"
                            >
                                <PencilSquareIcon className="size-6" /> Edit
                            </Button>
                        )}
                        {selectionEnabled && selectedCount >= 1 && (
                            <Button
                                onClick={() => onDeleteSelected && onDeleteSelected(selectedRowObjects)}
                                className="inline-flex items-center gap-1 rounded-md border border-red-600 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-600 hover:text-white transition"
                                aria-label="Delete selected row(s)"
                                variant="outline"
                                size="sm"
                            >
                                <TrashIcon className="size-6" /> Delete
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="rounded-xl shadow-sm overflow-auto">

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
                                        <Button
                                            onClick={() => handleSort(accessorKey, sortable)}
                                            className="inline-flex items-center gap-1 select-none hover:opacity-90"
                                            variant="ghost"
                                            size="sm"
                                        >
                                            {flexRender(def.header, header.getContext())}
                                            {isActive && order === 'asc' && (
                                                <ChevronUpIcon className="size-3.5" />
                                            )}
                                            {isActive && order === 'desc' && (
                                                <ChevronDownIcon className="size-3.5" />
                                            )}
                                        </Button>
                                    ) : (
                                        flexRender(def.header, header.getContext())
                                    )}
                                </th>
                            );
                        })}
                            </tr>
                    ))}
                        {table.getHeaderGroups().map((hg) => (
                            <tr key={`${hg.id}-filters`}>
                            {hg.headers.map((header) => {
                                const def = header.column.columnDef;
                                const accessorKey = def.accessorKey;
                                const hasSearch = accessorKey && (def.enableSearch || def.enableFilter || def.filterType === 'select' || def.filterType === 'range');
                                return (
                                    <th key={header.id} className="px-4 py-2 text-sm font-medium text-platinum-500 border-b">
                                        {hasSearch ? (
                                            def.filterType === 'select' && Array.isArray(def.filterOptions) ? (
                                                (() => {
                                                    const currentVal = columnFilters[accessorKey] || '';
                                                    const selectedOpt = def.filterOptions.find(o => (typeof o === 'string' ? o : o.value) === currentVal);
                                                    const displayLabel = selectedOpt ? (typeof selectedOpt === 'string' ? selectedOpt : selectedOpt.label) : 'All';
                                                    return (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button className="w-full flex items-center justify-between rounded-md p-2 text-sm text-left border-2 bg-strawberry-red-500 border-strawberry-red-600 text-white">
                                                                    <span className="text-white font-medium">{displayLabel}</span>
                                                                    <ChevronDownIcon className="size-4 text-white" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent className="w-full p-1">
                                                                <DropdownMenuItem className={`flex items-center justify-between px-3 py-2 ${currentVal === '' ? 'bg-strawberry-red-500 text-white' : 'hover:bg-strawberry-red-100'}`} onSelect={() => setColumnFilters(prev => ({ ...prev, [accessorKey]: '' }))}>
                                                                    <span className={currentVal === '' ? 'font-medium text-white' : 'text-space-indigo-500  hover:bg-strawberry-red-100'}>All</span>
                                                                    {currentVal === '' && <CheckIcon className="size-4 text-white" />}
                                                                </DropdownMenuItem>
                                                                {def.filterOptions.map((opt) => {
                                                                    const val = typeof opt === 'string' ? opt : opt.value;
                                                                    const lbl = typeof opt === 'string' ? opt : opt.label;
                                                                    const selected = currentVal === val;
                                                                    return (
                                                                        <DropdownMenuItem key={val} className={`flex items-center justify-between px-3 py-2 ${selected ? 'bg-strawberry-red-500 text-white' : ' hover:bg-strawberry-red-100'}`} onSelect={() => setColumnFilters(prev => ({ ...prev, [accessorKey]: val }))}>
                                                                            <span className={selected ? 'font-medium text-white' : 'text-space-indigo-500'}>{lbl}</span>
                                                                            {selected && <CheckIcon className="size-4 text-white" />}
                                                                        </DropdownMenuItem>
                                                                    )
                                                                })}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )
                                                })()
                                            ) : def.filterType === 'range' ? (
                                                (() => {
                                                    const keyMin = `${accessorKey}Min`;
                                                    const keyMax = `${accessorKey}Max`;
                                                    // compute max value from current page data (column max)
                                                    const nums = data.map(d => Number(d?.[accessorKey]) ).filter(n => !Number.isNaN(n));
                                                    const computedMax = nums.length ? Math.max(...nums, 1) : (def.filterMax ?? 100);

                                                    stableMaxRef.current[accessorKey] = Math.max(stableMaxRef.current[accessorKey] || 0, computedMax);
                                                    const trackMax = stableMaxRef.current[accessorKey];

                                                    const step = def.filterStep ?? (Number.isInteger(trackMax) ? 1 : Math.max( (trackMax / 100) , 1));
                                                    const currentMin = columnFilters[keyMin] !== undefined ? Number(columnFilters[keyMin]) : 0;
                                                    const currentMax = columnFilters[keyMax] !== undefined ? Number(columnFilters[keyMax]) : trackMax;
                                                    return (
                                                        <div className="space-y-2">
                                                            <DualRangeSlider
                                                                label={(v) => v}
                                                                value={[currentMin, Math.min(currentMax, trackMax)]}
                                                                onValueCommit={(vals) => {
                                                                    const precision = (String(step).includes('.') ? String(step).split('.')[1].length : 0);
                                                                    const format = (v) => precision > 0 ? Number(Number(v).toFixed(precision)) : Math.round(v);
                                                                    const [vMinRaw, vMaxRaw] = vals;
                                                                    const vMin = format(vMinRaw);
                                                                    const vMax = format(vMaxRaw);
                                                                    setColumnFilters(prev => ({ ...prev, [keyMin]: String(vMin), [keyMax]: String(vMax) }));
                                                                }}
                                                                min={0}
                                                                max={trackMax}
                                                                step={step}
                                                            />
                                                        </div>
                                                    )
                                                })()
                                            ) : (
                                                <input
                                                    type="text"
                                                    placeholder="Search..."
                                                    aria-label={`Search ${accessorKey}`}
                                                    value={columnFilters[accessorKey] || ''}
                                                    onChange={(e) => setColumnFilters(prev => ({ ...prev, [accessorKey]: e.target.value }))}
                                                    className="w-full rounded-md border-2 border-strawberry-red-600 bg-strawberry-red-500 text-white placeholder-strawberry-red-100 p-2 text-sm"
                                                />
                                            )
                                        ) : null}
                                    </th>
                                )
                            })}
                            </tr>
                        ))}
                </thead>

            {/* Body */}
                <tbody>
                    {table.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50">
                        {row.getVisibleCells().map((cell) => {
                            const isRowEditing = editingRowId === row.id;
                            const EditableComp = cell.column.columnDef.editableCell;
                            const isEditableCell = isRowEditing && EditableComp;

                            return (
                                <td key={cell.id} className="px-4 py-3 text-sm text-space-indigo-500">
                                    {isEditableCell ? (
                                        <EditableComp {...cell.getContext()} />): cell.column.columnDef.cell ? (
                                            flexRender( // use custom formatting (dates etc)
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )
                                        ) : ( cell.getValue() ) }
                                </td>
                            )
                            
                        })}
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