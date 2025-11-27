import { useState, useEffect } from "react";
import DataTable from "../../components/DataTable/DataTable";
import { useUser } from "@/contexts/UserContexts";
import { getUserColumns } from "@/components/DataTable/Columns/UserColumns";


export default function Users() {
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

    const[error, setError] = useState("")
    const[success, setSuccess] = useState("")
    const role = user?.role || 'regular';
    const columns = useMemo(() => getUserColumns(role), [role]);

    // call fetchData each time query changes
    useEffect(() => {        
        setError("")
        setSuccess("")

        // retrieve the user data by making a HTTP request
        try {
            const fetchData = async () => {
                const params = new URLSearchParams();

                // add necessary params to the URL
                if(query.utorid) params.append("utorid", query.utorid);
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
                    setError(`Could not retrieve user data: ${data.error}` || "Could not retrieve user data")
                    console.log("Error:", data.error)
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

    // saving updated data
    const handleRowSaved = async (updatedRow) => { // called when an edit to the row is saved
        setError("")
        setSuccess("")

        // send PATCH request
        const res = await fetch(`${API_URL}/users/${updatedRow.id}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedRow)
        });

        const data = await res.json();
        if (!res.ok) {
            setError(`Could not update user: ${data.error}` || "Could not update user")
            console.warn('Could not update user:', data.error || res.status);
            throw new Error('Could not update user');
        }
        setSuccess("Successfully updated user")
    }

    return (
        <div className="p-6 space-y-4">
            {/* Page Title */}
            <div className="mb-[5vh]">
                <h1 className="text-center text-2xl font-semibold text-flag-red-500 mt-[10vh]">Users</h1>
                <p className="text-center text-sm text-space-indigo-500">
                    View and manage all users in the system.
                </p>
            </div>

            {/* Table */}
            <DataTable
                data={data}
                columns={columns}
                count={totalCount} // total number of rows
                query={query} // the filters we are applying
                setQuery={setQuery}
                error={error}
                success={success}
                onRowSave={handleRowSaved} // for editing rows
            />
        </div>

    )
}