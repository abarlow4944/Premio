import { useState, useEffect, useMemo } from "react";
import DataTable from "../../components/DataTable/DataTable";
import { useUser } from "@/contexts/UserContexts";
import { getUserColumns } from "@/components/DataTable/Columns/UserColumns";
import { Button } from "@/components/ui/button";
import ModalForm from "../../components/Modal/ModalForm";
import ModalView from "../../components/Modal/ModalView";
import { getRegisterUserFields } from "@/components/Modal/FormFields/RegisterUserFields";
import { FlagIcon, BookmarkIcon } from "@heroicons/react/24/solid";
import CashierUser from "./UserCashier"


export default function Users() {
    const API_URL = import.meta.env.VITE_API_URL; // API base URL 
    const { user, visualRole } = useUser();

    const [data, setData] = useState([]);
    const [totalCount, setTotalCount] = useState(0);

    const [query, setQuery] = useState({ // the filters we will be applying (params)
        name: "",
        role: "",
        verified: "",
        activated: "",
        sortBy: "bookmarked",
        sortOrder: "desc",
        page: 1,
        limit: 10
    })

    const[error, setError] = useState("")
    const[success, setSuccess] = useState("")
    const role = visualRole || user?.role || 'regular';
    const columns = useMemo(() => getUserColumns(role), [role]);
    
    // Organizers (regular users) can edit users, as well as managers and superusers
    const enableUserEditing = role === 'manager' || role === 'superuser' || role === 'regular';

    // go to the cashier's User page if the user is a cashier
    if(role === "cashier"){
        return <CashierUser />;
    }

    // modal stuff
    const [open, setOpen] = useState(false);

    // call fetchData each time query changes
    useEffect(() => {   

        // retrieve the user data by making a HTTP request
        try {
            const fetchData = async () => {
                const params = new URLSearchParams();

                // add necessary params to the URL
                if(query.utorid) params.append("utorid", query.utorid);
                if(query.name) params.append("name", query.name);
                if(query.email) params.append("email", query.email);
                if(query.role) params.append("role", query.role);
                if(query.verified) params.append("verified", query.verified);
                if(query.activated) params.append("activated", query.activated);
                if(query.suspicious) params.append("suspicious", query.suspicious);

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

    // user registration
    const handleUserRegistration = async (formData) => {
        setError("")
        setSuccess("")

        // register user
        const res = await fetch(`${API_URL}/users`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        });

        const data = await res.json(); // response from endpoint
        
        if(!res.ok){ // handle error
            setError(`Could not register user: ${data.error}` || "Could not register user")
            console.log("Error:", data.error)
            return
        }

        // atttempt to send activation email
        try{
            await handleActivationEmail(data.utorid)
        }
        catch(e){
            setError(`Could not send activation email: ${e}` || "Could not send activation email")
            console.log("Error:", e)
            return
        }

        setSuccess(`Successfully registered user ${formData.utorid}`)
    };

    // activation email
    const handleActivationEmail = async(utorid) =>{
        setError("")
        setSuccess("")

        const res = await fetch(`${API_URL}/auth/activate`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-type": "application/json",
            },
            body: JSON.stringify({utorid}), // convert a JS value into a JSON-formatted string
        });

        const data = await res.json(); // get reset token from backend

        if(!res.ok){ // handle email error
            setError(data.error || "Unable to send activation email")
            return;
        }
        else{ // email was sent
            console.log("Successfully sent activation email")
        }
    }

    // Toggle suspicious flag
    const handleSuspiciousFlagToggle = async (row) => {
        setError("");
        setSuccess("");
        
        try {
            const res = await fetch(`${API_URL}/users/${row.id}/suspicious`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ suspicious: !row.suspicious })
            });

            const data = await res.json();
            if (!res.ok) {
                setError(`Could not update suspicious status: ${data.error}` || "Could not update suspicious status");
                console.warn('Could not update suspicious status:', data.error || res.status);
                return;
            }

            // Update the row in the table
            setData(prev => prev.map(r => 
                r.id === row.id ? { ...r, suspicious: !r.suspicious } : r
            ));
            setSuccess("Successfully updated suspicious status");
        } catch (err) {
            setError(err.message || "Could not update suspicious status");
            console.error("Error:", err);
        }
    };

    // Toggle bookmark
    const handleBookmarkToggle = async (row) => {
        setError("");
        setSuccess("");
        
        try {
            const res = await fetch(`${API_URL}/users/${row.id}/bookmark`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ bookmarked: !row.bookmarked })
            });

            const data = await res.json();
            if (!res.ok) {
                setError(`Could not update bookmark status: ${data.error}` || "Could not update bookmark status");
                console.warn('Could not update bookmark status:', data.error || res.status);
                return;
            }

            // Update the row in the table
            setData(prev => prev.map(r => 
                r.id === row.id ? { ...r, bookmarked: !r.bookmarked } : r
            ));
            setSuccess("Successfully updated bookmark status");
        } catch (err) {
            setError(err.message || "Could not update bookmark status");
            console.error("Error:", err);
        }
    };


    return (
        <div className="p-6 space-y-4">
            {/* Page Title */}
            <div className="mb-[5vh]">
                <h1 className="text-center text-2xl font-semibold text-flag-red-500 mt-[10vh]">Users</h1>
                <p className="text-center text-sm text-space-indigo-500 mt-">
                    View and manage all users in the system.
                </p>
                <p className="text-center text-sm text-gray-500 mt-2 flex items-center justify-center gap-1">
                    <span>Suspicious users are marked with a</span>
                    <FlagIcon className="size-4 text-red-600" />
                    <span>and bookmarked users with a</span>
                    <BookmarkIcon className="size-4 text-red-600" />
                </p>
            </div>

            {/* Register User Button */}
            <Button
                className="bg-strawberry-red-500 text-platinum-500"
                onClick={() => {
                    setOpen(true);
                }}
            >
                Register a User
            </Button>

            {/* Register a User Modal */}
            <ModalForm
                open={open}
                setOpen={setOpen}
                formTitle="Register a User"
                formDescription="Enter the new user's details"
                fields={getRegisterUserFields(role)}
                onSubmit={handleUserRegistration}
            />
            

            {/* Table */}
            <DataTable
                data={data}
                columns={columns}
                count={totalCount} // total number of rows
                query={query} // the filters we are applying
                setQuery={setQuery}
                error={error}
                success={success}
                enableEditing={enableUserEditing}
                onRowSave={handleRowSaved} // for editing rows
                showSuspiciousFlag={true}
                onSuspiciousFlagToggle={handleSuspiciousFlagToggle}
                showBookmarks={true}
                onBookmarkToggle={handleBookmarkToggle}
            />
        </div>

    )
}
