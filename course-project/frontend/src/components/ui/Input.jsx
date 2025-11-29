import { ChevronDownIcon } from '@heroicons/react/16/solid'

export function InputDefault({label, value, type, onChange, ...rest}) {

    if(type === "price"){ //input for prices
        return (
            <div>
            <label htmlFor="label" className="block text-sm/6 font-medium text-strawberry-red-500 text-left">{label}</label>
            <div className="mt-2">
            <div className="mt-2">
                <div className="flex items-center rounded-md bg-white pl-3 outline-1 -outline-offset-1 outline-gray-300 has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-strawberry-red-500">
                <div className="shrink-0 text-base text-platinum-700 select-none sm:text-sm/6">$</div>
                <input
                    id="price"
                    name="price"
                    type="number"
                    placeholder="0.00"
                    className="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                    min="0.00"
                    step="0.01"
                />
                <div className="grid shrink-0 grid-cols-1 focus-within:relative">
                    <select
                    id="currency"
                    name="currency"
                    aria-label="Currency"
                    className="col-start-1 row-start-1 w-full appearance-none rounded-md py-1.5 pr-7 pl-3 text-base text-platinum-700 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-strawberry-red-500 sm:text-sm/6"
                    >
                    <option>USD</option>
                    <option>CAD</option>
                    <option>EUR</option>
                    </select>
                    <ChevronDownIcon
                    aria-hidden="true"
                    className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-platinum-700 sm:size-4"
                    />
                </div>
                </div>
            </div>
            </div>
        </div>
        )
    }
    else{
        return (
            <div>
                <label htmlFor="label" className="block text-sm/6 font-medium text-strawberry-red-500 text-left">{label}</label>
                <div className="mt-2">
                <input
                    id={label}
                    name={label}
                    type={type}
                    value={value}
                    placeholder={label}
                    onChange={onChange}
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-strawberry-red-500 sm:text-sm/6" {...rest}></input>
                </div>
            </div>
        );
    }
}