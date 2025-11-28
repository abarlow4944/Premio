import { useState, useEffect, useMemo } from "react";
import DataTable from "../../components/DataTable/DataTable";
import { useUser } from "@/contexts/UserContexts";
import { getUserColumns } from "@/components/DataTable/Columns/UserColumns";
import { Button } from "@/components/UI/button";
import ModalForm from "../../components/Modal/ModalForm";
import ModalView from "../../components/Modal/ModalView";
import { getRegisterUserFields } from "@/components/Modal/FormFields/RegisterUserFields";
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
        sortBy: "",
        sortOrder: "asc",
        page: 1,
        limit: 10
    })

    const[error, setError] = useState("")
    const[success, setSuccess] = useState("")
    const role = visualRole || user?.role || 'regular';
    const columns = useMemo(() => getUserColumns(role), [role]);

    // go to the cashier's User page if the user is a cashier
    if(role === "cashier"){
        return <CashierUser />;
    }

    // modal stuff
    const[isModalOpen, setIsModalOpen] = useState(false);
    const[modalText, setModalText] = useState("");
    const [open, setOpen] = useState(false);

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

    // modal helper functions
    function closeModal(){
        setIsModalOpen(false);
        setModalText("");
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


    return (
        <div className="p-6 space-y-4">
            {/* Page Title */}
            <div className="mb-[5vh]">
                <h1 className="text-center text-2xl font-semibold text-flag-red-500 mt-[10vh]">Users</h1>
                <p className="text-center text-sm text-space-indigo-500">
                    View and manage all users in the system.
                </p>
            </div>

            <Button
                    className="bg-[var(--color-strawberry-red-500)] text-white"
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
                onCreate={role == "manager" ? () => {
                        // placeholder for creating a new promotion
                } : undefined}
                success={success}
                onRowSave={handleRowSaved} // for editing rows
            />
        </div>

    )
}