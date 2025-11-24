import { useState, useEffect } from "react";
import DataTable from "../../components/DataTable/DataTable";
import { eventColumns } from "@/components/DataTable/Columns/EventColumns";
import { getEventColumns } from "@/components/DataTable/Columns/EventColumns";
import { useUser } from "@/contexts/UserContexts";


export default function Events() {
    const API_URL = import.meta.env.VITE_API_URL; // API base URL 
    const { user } = useUser();

    const role = user.role;

    const [data, setData] = useState([]);
    const [totalCount, setTotalCount] = useState(0);

    const [query, setQuery] = useState({ // the filters we will be applying (params)
        name: "",
        location: "",
        started: "",
        ended: "",
        showFull: false,
        published: null,
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
                if(query.role) params.append("location", query.location);
                if(query.verified) params.append("started", query.started);
                if(query.activated) params.append("ended", query.ended);
                if(query.activated) params.append("showFull", query.showFull);
                if(query.activated) params.append("published", query.published);

                params.append("page", query.page)
                params.append("limit", query.limit)
              

                // retrieve users
                const res = await fetch(`${API_URL}/events?${params}`, {
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
                <h1 className="text-center text-2xl font-semibold text-flag-red-500 mt-[10vh]">Events</h1>
                <p className="text-center text-sm text-space-indigo-500">
                View and manage all events in the system.
                </p>
            </div>
            <DataTable
                data={data}
                columns={getEventColumns(role)}
                count={totalCount} // total number of rows
                query={query} // the filters we are applying
                setQuery={setQuery}
            />
        
        </div>

    )
}