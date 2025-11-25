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
// regular => cannot see published column 
// manager/superuser => can see published column
export function getEventColumns(role) {
  const isManager = role === 'manager' || role === 'superuser';
  if (!isManager) {
    return [
      { accessorKey: 'name', header: 'Name', enableSorting: true },
      { accessorKey: 'description', header: 'Description', enableSorting: true },
      { accessorKey: 'location', header: 'Location', enableSorting: true },
      { accessorKey: 'startTime', header: 'Start Time', enableSorting: true, cell: ({ row }) => formatDateTime(row.original.startTime) },
      { accessorKey: 'endTime', header: 'End Time', enableSorting: true, cell: ({ row }) => formatDateTime(row.original.endTime) },
      { accessorKey: 'capacity', header: 'Capacity', enableSorting: true, cell: ({ row }) => row.original.capacity ?? '—' },
      { accessorKey: 'points', header: 'Points', enableSorting: true, cell: ({ row }) => row.original.points ?? 0 },
    ];
  }
  return [
    { accessorKey: 'name', header: 'Name', enableSorting: true },
    { accessorKey: 'description', header: 'Description', enableSorting: true },
    { accessorKey: 'location', header: 'Location', enableSorting: true },
    { accessorKey: 'startTime', header: 'Start Time', enableSorting: true, cell: ({ row }) => formatDateTime(row.original.startTime) },
    { accessorKey: 'endTime', header: 'End Time', enableSorting: true, cell: ({ row }) => formatDateTime(row.original.endTime) },
    { accessorKey: 'capacity', header: 'Capacity', enableSorting: true, cell: ({ row }) => row.original.capacity ?? '—' },
    { accessorKey: 'points', header: 'Points', enableSorting: true, cell: ({ row }) => row.original.points ?? 0 },
    { accessorKey: 'published', header: 'Published', enableSorting: true},
  ];
}

export const eventColumns = getEventColumns('regular');
