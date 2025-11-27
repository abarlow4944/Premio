import TableCell from "../TableCell";

// columns for the User table
export function  getTransactionColumns(role) {
  const isManager = role === 'manager' || role === 'superuser';
  if (!isManager) {
      return [
        {
          accessorKey: "id",
          header: "Transaction ID",
          enableSorting: true,
          enableSearch: true 
        },
        {
          accessorKey: "utorid",
          header: "UTORid",
          enableSorting: true,
          enableSearch: true 
        },
        {
          accessorKey: "createdBy",
          header: "Created By",
          enableSorting: true,
          enableSearch: true
        },
        {
          accessorKey: "relatedId",
          header: "Reference ID",
          enableSorting: true,
          enableSearch: true,
          cell: ({ row }) => row.original.relatedId ?? '-' 
        },
        {
          accessorKey: "promotionId",
          header: "Promotion",
          cell: ({ row }) => {
              const ids = row.original.promotionIds;

              if (!ids || ids.length === 0) return "-";

              return ids.join(", ");
          },
          enableSearch: true,
          enableSorting: true, 
        },
        {
          accessorKey: "type",
          header: "Type",
          enableSorting: true, 
          filterType: 'select', 
          filterOptions: [
            { label: 'Purchase', value: 'purchase' },
            { label: 'Adjustment', value: 'adjustment' },
            { label: 'Event', value: 'event' },
            { label: 'Redemption', value: 'redemption' },
            { label: 'Transfer', value: 'transfer' },
          ], 
        },
        {
          accessorKey: "spent",
          header: "Price",
          cell: ({ row }) => row.original.spent ?? '-',
        },
        {
          accessorKey: "amount",
          header: "Points",
        },
        {
          accessorKey: "suspicious",
          header: "Suspricious",
          filterType: 'select', 
          filterOptions: [
            { label: 'True', value: 'true' },
            { label: 'False', value: 'false' },
          ],
          editableCell: TableCell,
          editType: "select"
        },
    ];
  }
  
  return [
    {
      accessorKey: "id",
      header: "Transaction ID",
    },
    {
      accessorKey: "promotionId",
      header: "Promotion",
      cell: ({ row }) => {
          const ids = row.original.promotionIds;

          if (!ids || ids.length === 0) return "-";

          return ids.join(", ");
      }
    },
    {
      accessorKey: "type",
      header: "Type",
    },
    {
      accessorKey: "amount",
      header: "Points",
    },
  ];
}
export const TransactionColumns = getTransactionColumns('regular');
export default TransactionColumns;