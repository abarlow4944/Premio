// columns for the Promotion table

function formatEndTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  // Example: Dec 21, 2025 12:19 AM UTC
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

export const promoColumns = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "endTime",
    header: "End Time",
    cell: ({ row }) => formatEndTime(row.original.endTime),
  },
];
