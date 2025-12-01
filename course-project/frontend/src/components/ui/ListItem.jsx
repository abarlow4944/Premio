export function ListItem({ name, subName, value}){
    console.log(subName)
    return (
        <li className="py-3 border-b border-gray-200 last:border-none">
            <div className="flex items-center rtl:space-x-reverse">
                {/* Row data */}
                {/* Left side */}
                <div className="flex-1 min-w-0">
                    <p className="text-m font-bold text-strawberry-red-500 text-heading truncate">
                        {name}
                    </p>
                    <p className="text-sm text-body text-space-indigo-500 truncate">
                        {subName}
                    </p>
                </div>

                {/* Right side */}
                <div className="inline-flex items-center text-base font-semibold text-heading text-space-indigo-500">
                    {value}
                </div>
            </div>
        </li>
    )
};

