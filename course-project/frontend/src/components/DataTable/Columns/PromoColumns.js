// columns for the Promotion table

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

// Viewable columns depends on user role
// regular => name, endTime
// manager/superuser => all promotion fields
export function getPromoColumns(role) {
  const isManager = role === 'manager' || role === 'superuser';
  if (!isManager) {
    return [
      { accessorKey: 'name', header: 'Name', enableSorting: true },
      { accessorKey: 'endTime', header: 'End Time', enableSorting: true, cell: ({ row }) => formatDateTime(row.original.endTime) },
    ];
  }
  return [
    { accessorKey: 'name', header: 'Name', enableSorting: true },
    { accessorKey: 'type', header: 'Type', enableSorting: true },
    { accessorKey: 'startTime', header: 'Start Time', enableSorting: true, cell: ({ row }) => formatDateTime(row.original.startTime) },
    { accessorKey: 'endTime', header: 'End Time', enableSorting: true, cell: ({ row }) => formatDateTime(row.original.endTime) },
    { accessorKey: 'minSpending', header: 'Min Spending', enableSorting: true, cell: ({ row }) => row.original.minSpending ?? '—' },
    { accessorKey: 'rate', header: 'Rate', enableSorting: true, cell: ({ row }) => row.original.rate ?? '—' },
    { accessorKey: 'points', header: 'Points', enableSorting: true, cell: ({ row }) => row.original.points ?? 0 },
  ];
}

export const promoColumns = getPromoColumns('regular');
