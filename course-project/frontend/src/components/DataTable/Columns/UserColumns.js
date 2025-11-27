import TableCell from "../TableCell";

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  }).format(d);
}

function formatBirthday(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour12: true
  }).format(d);
}

// columns for the User table
export function getUserColumns(role) {
  const isManager = role === 'manager' || role === 'superuser';
  if (isManager) {
    return [
    {
      accessorKey: "id",
      header: "ID",
      enableSorting: true,
    },
    {
      accessorKey: "utorid",
      header: "UTORid",
      enableSorting: true,
      enableSearch: true, 
    },
    {
      accessorKey: "name",
      header: "Name",
      enableSorting: true,
      enableSearch: true, 
    },
    {
      accessorKey: "role",
      header: "Role",
      enableSorting: true,
      filterType: 'select', 
      filterOptions: role === "manager"? [
        { label: 'Regular', value: 'regular' },
        { label: 'Cashier', value: 'cashier' },
      ] :
      [
        { label: 'Regular', value: 'regular' },
        { label: 'Cashier', value: 'cashier' },
        { label: 'Manager', value: 'manager' },
        { label: 'Superuser', value: 'superuser' },
      ],
      editableCell: TableCell,
      editType: "date" 
    },
    {
      accessorKey: "birthday",
      header: "Birthday",
      cell: ({ row }) => formatBirthday(row.original.birthday),
      enableSorting: true,
    },
    {
      accessorKey: "points",
      header: "Points",
      enableSorting: true,
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => formatDateTime(row.original.createdAt),
      enableSorting: true,
    },
    {
      accessorKey: "lastLogin",
      header: "Last Login",
      cell: ({ row }) => formatDateTime(row.original.lastLogin),
      enableSorting: true,
    },
    {
      accessorKey: "verified",
      header: "Verified",
      enableSorting: true,
      filterType: 'select', 
      filterOptions: [
        { label: 'True', value: 'true' },
        { label: 'False', value: 'false' },
      ]
    },
    {
      accessorKey: "activated",
      header: "Activated",
      enableSorting: true,
      filterType: 'select', 
      filterOptions: [
        { label: 'True', value: 'true' },
        { label: 'False', value: 'false' },
      ]
    },
    ];
  }
}
export const userColumns = getUserColumns('regular');