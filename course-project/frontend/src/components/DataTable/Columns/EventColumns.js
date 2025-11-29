// columns for the Promotion table
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

// Viewable columns depends on user role
// regular => limited columns (name, description, location, startTime, endTime, capacity)
// manager/superuser => all columns including organizers, pointsAwarded, pointsRemain, published
export function getEventColumns(role) {
  const isManager = role === 'manager' || role === 'superuser';
  if (!isManager) {
    return [
      { accessorKey: 'name', header: 'Name', enableSorting: true, enableSearch: true  },
      { accessorKey: 'description', header: 'Description', enableSorting: true, enableSearch: true  },
      { accessorKey: 'location', header: 'Location', enableSorting: true, enableSearch: true  },
      { accessorKey: 'startTime', header: 'Start Time', enableSorting: true, cell: ({ row }) => formatDateTime(row.original.startTime) },
      { accessorKey: 'endTime', header: 'End Time', enableSorting: true, cell: ({ row }) => formatDateTime(row.original.endTime) }
    ];
  }
  return [
    { 
      accessorKey: 'name', 
      header: 'Name', 
      enableSorting: true,
      enableSearch: true,
      editableCell: TableCell,
      editType:"text",
    },
    { 
      accessorKey: 'location', 
      header: 'Location', 
      enableSorting: true,
      editableCell: TableCell,
      editType:"text",
      enableSearch: true
    },
    { 
      accessorKey: 'startTime', 
      header: 'Start Time', 
      enableSorting: true, 
      cell: ({ row }) => formatDateTime(row.original.startTime),
      editableCell: TableCell,
      editType: "date",
    },
    { 
      accessorKey: 'endTime', 
      header: 'End Time', 
      enableSorting: true, 
      cell: ({ row }) => formatDateTime(row.original.endTime),
      editableCell: TableCell,
      editType: "date",
    },
    { 
      accessorKey: 'capacity', 
      header: 'Capacity', 
      enableSorting: true, 
      cell: ({ row }) => row.original.capacity ?? '—',
      editableCell: TableCell,
      editType: "text",
      filterType: 'range'  
    },
    { 
      accessorKey: 'pointsRemain', 
      header: 'Points Remain', 
      enableSorting: true, 
      cell: ({ row }) => row.original.pointsRemain ?? '—',
      editableCell: TableCell,
      editType: "text",
      filterType: 'range'  
    },
    { 
      accessorKey: 'pointsAwarded', 
      header: 'Points Awarded', 
      enableSorting: true, 
      cell: ({ row }) => row.original.pointsAwarded ?? 0,
      editableCell: TableCell,
      editType: "text",
      filterType: 'range'  
    }, 
    { 
      accessorKey: 'published', 
      header: 'Published', 
      enableSorting: true,
      editableCell: TableCell,
      editType: "select",
      filterType: 'select',
      filterOptions: [
        { label: 'True', value: 'true' },
        { label: 'False', value: 'false' },
      ],
    },
  ];
}

export const eventColumns = getEventColumns('regular');
