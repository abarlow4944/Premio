import React, { useState, useEffect } from 'react';
import TableCell from "../TableCell";
import { ColumnFiltering } from '@tanstack/react-table';
import { slider } from '@material-tailwind/react';

const relatedTxCache = {};

function SenderReceiverCell({ row }) {
  const t = row.original || {};
  // sender/receiver column only applies to transfer transactions
  if (t.type !== 'transfer') return '-';

  const [otherUtorid, setOtherUtorid] = useState(t.relatedUtorid || null);

  useEffect(() => {
    let mounted = true;
    const rid = t.relatedId;
    if (!rid) return;
    if (t.relatedUtorid) return;
    if (relatedTxCache[rid]) {
      setOtherUtorid(relatedTxCache[rid]);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/transactions/${rid}`, { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        console.log("Fetched related transaction: ", data);
        const ut = data.utorid;
        relatedTxCache[rid] = ut;
        if (mounted) setOtherUtorid(ut);
      } catch (e) {
        console.error("Error fetching related transaction: ", e);
      }
    })();

    return () => { mounted = false; };
  }, [t.relatedId]);

  const otherDisplay = otherUtorid ?? (t.relatedId ?? '-');
  const txUtorid = t.utorid;
  const createdBy = t.createdBy;
  const isSender = createdBy && txUtorid && createdBy === txUtorid;
  return isSender ? `Sent to: ${otherDisplay}` : `Received from: ${otherDisplay}`;
}

// columns for the Transaction table
export function  getTransactionColumns(role) {
  const isManager = role === 'manager' || role === 'superuser';
  if (isManager) {
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
          accessorKey: "remark",
          header: "Remark",
          enableSorting: true,
          enableSearch: true
        },
        {
          accessorKey: "promotionId",
          header: "Promotion",
          cell: ({ row }) => {
              const names = row.original.promotionNames;
              const ids = row.original.promotionIds;

              if ((!names || names.length === 0) && (!ids || ids.length === 0)) return "-";

              if (names && names.length > 0) return names.join(", ");
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
          enableSorting: true,
          filterType: 'range',
          cell: ({ row }) => row.original.spent ?? '-',
        },
        {
          accessorKey: "amount",
          header: "Points",
          enableSorting: true
        },
        {
          accessorKey: "suspicious",
          header: "Suspicious",
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
  
  // Regular users
  return [
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
      accessorKey: "senderReceiver",
      header: "Transfer Details",
      cell: ({ row }) => React.createElement(SenderReceiverCell, { row }),
      enableSorting: true,
      enableSearch: true
    },
    {
      accessorKey: "remark",
      header: "Remark",
      enableSorting: true,
      enableSearch: true
    },
    {
      accessorKey: "promotionId",
      header: "Promotion",
      cell: ({ row }) => {
          const names = row.original.promotionNames;
          const ids = row.original.promotionIds;

          if ((!names || names.length === 0) && (!ids || ids.length === 0)) return "-";

          if (names && names.length > 0) return names.join(", ");
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
      enableColumnFilter: true,
    },
    {
      accessorKey: "spent",
      header: "Price",
      enableSorting: true,
      filterType: 'range',
      cell: ({ row }) => row.original.spent ?? '-',
    },
    {
      accessorKey: "amount",
      header: "Points",
      enableSorting: true
    },
  ];
}
export default getTransactionColumns;