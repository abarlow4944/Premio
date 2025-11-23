import { useState, useEffect } from "react";
import DataTable from "../../components/DataTable/DataTable";
import { eventColumns } from "@/components/DataTable/Columns/EventColumns";


export default function Events() {
    const API_URL = import.meta.env.VITE_API_URL; // API base URL 

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
        // retrieve the user data by making a HTTP request
        try {
            const fetchData = async () => {
                const params = new URLSearchParams();

                // add necessary params to the URL
                if(query.name) params.append("name", query.name);
                if(query.role) params.append("role", query.role);
                if(query.verified) params.append("verified", query.verified);
                if(query.activated) params.append("activated", query.activated);

                params.append("page", query.page)
                params.append("limit", query.limit)
              
                if(query.sortBy) params.append("sortBy", query.sortBy)
                if(query.sortOrder) params.append("sortOrder", query.sortOrder)

                // retrieve users
                const res = await fetch(`${API_URL}/users?${params}`, {
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

    return (
        <div className="p-6 space-y-4">
            {/* Page Title */}
            <div className="mb-[5vh]">
                <h1 className="text-center text-2xl font-semibold text-flag-red-500 mt-[10vh]">Users</h1>
                <p className="text-center text-sm text-space-indigo-500">
                View and manage all users in the system.
                </p>
            </div>
            <DataTable
                data={data}
                columns={eventColumns}
                count={totalCount} // total number of rows
                query={query} // the filters we are applying
                setQuery={setQuery}
            />
        
        </div>

    )
}