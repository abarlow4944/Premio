import { useState, useEffect } from 'react';
import { InputDefault } from '../UI/Input';

export default function TableCell({ row, column, table }) {
    const raw = row.getValue(column.id);
    const [value, setValue] = useState(raw)

    useEffect(() => {
        setValue(raw)
    }, [raw])

    const onBlur = () => {
        table.options.meta?.updateData(
            row.index,
            column.id,
            value
        )

    }

    return (
        <InputDefault
            value={value}
            onChange={e => setValue(e.target.value)}
            onBlur={onBlur}
        />
    )
}