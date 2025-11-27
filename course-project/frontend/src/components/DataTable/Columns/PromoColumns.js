// columns for the Promotion table
import TableCell from "../TableCell";

// convert from string to ISO
export function formatDateTime(iso) { 
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
      { accessorKey: 'name', header: 'Name', enableSorting: true, enableSearch: true },
      { accessorKey: 'description', header: 'Description', enableSorting: true, enableSearch: true },
      { accessorKey: 'startTime', header: 'Start Time', enableSorting: true, cell: ({ row }) => formatDateTime(row.original.startTime) },
      { accessorKey: 'endTime', header: 'End Time', enableSorting: true, cell: ({ row }) => formatDateTime(row.original.endTime) },
      { accessorKey: 'minSpending', header: 'Min Spending', enableSorting: true, filterType: 'range', cell: ({ row }) => row.original.minSpending ?? '—' },
      { accessorKey: 'rate', header: 'Rate', enableSorting: true, filterType: 'range', filterStep: 0.01, cell: ({ row }) => row.original.rate ?? '—' },
      { accessorKey: 'points', header: 'Points', enableSorting: true, filterType: 'range', cell: ({ row }) => row.original.points ?? 0 },
    ];
  }
  return [
    { 
      accessorKey: 'name', 
      header: 'Name', 
      enableSorting: true, 
      enableSearch: true, 
      editableCell: TableCell,
      editType: "text" 
    },
    { 
      accessorKey: 'description', 
      header: 'Description', 
      enableSorting: true, 
      enableSearch: true, 
      editableCell: TableCell,
      editType: "text"
    },
    { 
      accessorKey: 'type', 
      header: 'Type', 
      enableSorting: true, 
      filterType: 'select', 
      filterOptions: [
        { label: 'Automatic', value: 'automatic' },
        { label: 'One-time', value: 'onetime' },
      ],
      editableCell: TableCell,
      editType: "select"
    },
    { 
      accessorKey: 'startTime', 
      header: 'Start Time', 
      enableSorting: true, 
      cell: ({ row }) => formatDateTime(row.original.startTime), 
      editableCell: TableCell,
      editType: "date" 
    },
    { 
      accessorKey: 'endTime', 
      header: 'End Time', 
      enableSorting: true, 
      cell: ({ row }) => formatDateTime(row.original.endTime), 
      editableCell: TableCell,
      editType: "date" 
    },
    { 
      accessorKey: 'minSpending', 
      header: 'Min Spending', 
      enableSorting: true, 
      filterType: 'range', 
      cell: ({ row }) => row.original.minSpending ?? '—', 
      editableCell: TableCell,
      editType: "text"
    },
    { 
      accessorKey: 'rate', 
      header: 'Rate', 
      enableSorting: true,
      cell: ({ row }) => row.original.rate ?? '—', 
      editableCell: TableCell,
      editType: "text" 
    },
    { 
      accessorKey: 'points', 
      header: 'Points', 
      enableSorting: true, 
      filterType: 'range', 
      cell: ({ row }) => row.original.points ?? 0, 
      editableCell: TableCell,
      editType: "text" 
    },
  ];
}

export const promoColumns = getPromoColumns('regular');
