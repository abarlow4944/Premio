import { useState, useEffect } from 'react';
import { InputDefault } from '../UI/Input';
import { formatDateTime } from './Columns/PromoColumns';


// converting from ISO to YYYY-MM-DD-TIME
function convertIsoToET(isoString) {
  const date = new Date(isoString);
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false, // Use 24-hour format
    timeZone: 'America/New_York'
  };

  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(date);

  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  const hour = parts.find(p => p.type === 'hour').value;
  const minute = parts.find(p => p.type === 'minute').value;

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function convertToBoolean(v) {
  if (v === "true") return true;
  if (v === "false") return false;
  return v; // leave everything else unchanged
}

export default function TableCell({ row, column, table }) {
    const raw = row.getValue(column.id); // get data from row
    const [value, setValue] = useState(raw) // initialize data
    const columnData = column.columnDef;
    const editType = columnData.editType;

    useEffect(() => {
        setValue(raw)
    }, [raw])

    const onBlur = () => { // update data
        table.options.meta?.updateData(
            row.index,
            column.id,
            value
        )
    }

    // get diff edit options based on edit type (calendar, option dropdown etc)
    switch(editType){
        
        case "text":
            return (
                <InputDefault
                    value={value}
                    type={editType}
                    onChange={e => setValue(e.target.value)}
                    onBlur={onBlur}
                />
            )
        case "date": {
            const formattedDate = convertIsoToET(value); // convert date to YYYY-MM-DD format

            return (
                <input
                    type="datetime-local"
                    className="block w-full rounded-md mt-2 bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-strawberry-red-500 sm:text-sm/6"
                    value={formattedDate}
                    onChange={e => setValue(e.target.value)}
                    onBlur={onBlur}
                />
            );
        }
        case "select":
            const options = columnData.filterOptions // get a list of the dropdown options

            return (
               <select
                    className="block w-full rounded-md mt-2 bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-strawberry-red-500 sm:text-sm/6"
                    value={String(value)}
                    onChange={e => { 
                        const raw = e.target.value;
                        const selectedValue = convertToBoolean(raw);
                        setValue(selectedValue)
                    }}
                    onBlur={onBlur}
                    >
                    {options.map((o) => (
                        <option key={o.label} value={o.value}>
                            {o.value}
                        </option>
                    ))}
                </select>
            )

    }


}