import { useState, useEffect, useMemo } from "react";
import DataTable from "../components/DataTable/DataTable";
import { getPromoColumns } from "../components/DataTable/Columns/PromoColumns";
import { useUser } from "../contexts/UserContexts";

export default function Promotions() {
    const API_URL = import.meta.env.VITE_API_URL; // API base URL 
    const { user } = useUser();

    const [data, setData] = useState([]);
    const [totalCount, setTotalCount] = useState(0);

    const [query, setQuery] = useState({ // the filters we will be applying (params)
        name: "",
        role: "",
        verified: "",
        activated: "",
        sortBy: "",
        sortOrder: "asc",
        page: 1,
        limit: 10
    })

    // call fetchData each time query changes
    useEffect(() => {
        // retrieve the promotions data by making a HTTP request
        try {
            const fetchData = async () => {
                const params = new URLSearchParams();

                // add necessary params to the URL
                if(query.name) params.append("name", query.name);
                if(query.endTime) params.append("endTime", query.endTime);
                if(query.sortBy) params.append("sortBy", query.sortBy);
                if(query.sortOrder) params.append("sortOrder", query.sortOrder);

                params.append("page", query.page)
                params.append("limit", query.limit)

                // retrieve promotions
                const res = await fetch(`${API_URL}/promotions?${params}`, {
                    method: "GET",
                    credentials: "include"
                });

                const data = await res.json(); // response from endpoint
                
                if(!res.ok){ // handle error
                    console.log("Error:", data.error)
                    return
                }

                setData(data.results)
                setTotalCount(data.count)
            }

            fetchData();
        }
        catch(error){
            console.log("Error:", error)
        }
    }, [query]);

    const columns = useMemo(() => getPromoColumns(user?.role || 'regular'), [user?.role]);

    return (
        <div className="p-6 space-y-4">
            {/* Page Title */}
            <div className="mb-[10vh]">
                <h1 className="text-center text-2xl font-semibold text-flag-red-500 mt-[10vh]">Promotions</h1>
                <p className="text-center text-sm text-space-indigo-500">
                View and manage all available promotions.
                </p>
            </div>
            <DataTable
                data={data}
                columns={columns}
                count={totalCount} // total number of rows
                query={query} // the filters we are applying
                setQuery={setQuery}
            />
        
        </div>

    )
}