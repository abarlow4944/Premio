import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";

export default function DataTable({data, columns}) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return ( 
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
                            <td key={cell.id} className="px-4 py-3 text-sm text-gray-600">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                        ))}
                        </tr>
                    ))}
                </tbody>
            </table>    
        </div>
    );
}