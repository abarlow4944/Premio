import { useState } from "react";
 
export function InputDefault({label, value, type, onChange}) {
    
    return (
        <div>
            <label htmlFor="email" className="block text-sm/6 font-medium text-strawberry-red-500 text-left">{label}</label>
            <div className="mt-2">
            <input
                id={label}
                name={label}
                type={type}
                value={value}
                placeholder={label}
                onChange={onChange}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-strawberry-red-500 sm:text-sm/6"></input>
            </div>
        </div>

    );
}