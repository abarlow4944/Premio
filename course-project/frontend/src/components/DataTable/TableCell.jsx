import { useState, useEffect } from 'react';
import { InputDefault } from '../UI/Input';
import { formatDateTime } from './Columns/PromoColumns';
import  {DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem} from '../UI/dropdown-menu'
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

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
            if(columnData.accessorKey === "startTime" || columnData.accessorKey === "endTime"){ // if the field is for start/end times
                var formattedDate = formatDateTime(value)
                console.log("type of:", typeof(formattedDate))
            }
            return (
                <InputDefault
                    value={formattedDate ? formattedDate : value}
                    type={editType}
                    onChange={e => setValue(e.target.value)}
                    onBlur={onBlur}
                />
            )
        case "date":
            var formattedDate = formatDateTime(value)
            return <InputDefault
                value={formattedDate}
                type={editType}
                onChange={e => setValue(e.target.value)}
                onBlur={onBlur}
            />
        case "select":
            const options = columnData.filterOptions // get a list of the dropdown options

            return(
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="w-full flex items-center justify-between block mt-2 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-strawberry-red-500 sm:text-sm/6">
                            {value ? options.find(o => o.value === value)?.label : "Select..."}
                            <ChevronDownIcon className="size-4 text-space-indigo-500"/>
                        </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent>
                        {options.map((o) => {
                            const selected = value === o.value; // check if the option is the currently selected one
                            return (
                                <DropdownMenuItem
                                    key={o.value}
                                    className={`
                                        flex items-center justify-between px-3 py-2
                                        ${selected 
                                            ? "bg-strawberry-red-500 text-white" 
                                            : "hover:bg-strawberry-red-100"}
                                    `}
                                    onSelect={() => {
                                        setValue(o.value);
                                        commit(o.value);
                                    }}
                                >
                                    <span
                                        className={`
                                            ${selected 
                                                ? "font-medium text-white" 
                                                : "text-space-indigo-500"}
                                        `}
                                    >
                                        {o.label}
                                    </span>

                                    {selected && (
                                        <CheckIcon className="size-4 text-white" />
                                    )}
                                </DropdownMenuItem>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>

            )

    }


}