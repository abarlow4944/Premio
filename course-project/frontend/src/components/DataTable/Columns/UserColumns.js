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
export const userColumns = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "utorid",
    header: "UTORid",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
  {
    accessorKey: "birthday",
    header: "Birthday",
    cell: ({ row }) => formatBirthday(row.original.birthday)
  },
  {
    accessorKey: "points",
    header: "Points",
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => formatDateTime(row.original.createdAt)
  },
  {
    accessorKey: "lastLogin",
    header: "Last Login",
    cell: ({ row }) => formatDateTime(row.original.lastLogin)
  },
  {
    accessorKey: "verified",
    header: "Verified",
  },
];
