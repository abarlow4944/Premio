// columns for the User table
const TransactionColumns = [
  {
    accessorKey: "id",
    header: "Transaction ID",
  },
  {
    accessorKey: "utorid",
    header: "UTORid",
  },
  {
    accessorKey: "createdBy",
    header: "Employee ID",
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

export default TransactionColumns;