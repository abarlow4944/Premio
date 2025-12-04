import { useState, useEffect, useMemo } from "react";
import { useUser } from "@/contexts/UserContexts";
import { getUserColumns } from "@/components/DataTable/Columns/UserColumns";
import { Button } from "@/components/ui/button";
import { getRegisterUserFields } from "@/components/Modal/FormFields/RegisterUserFields";
import { Card, CardContent } from "@/components/ui/card";
import { InputDefault } from "@/components/ui/Input";
import { Typography } from "@mui/material";
import Message from "@/components/Message";


export default function Users() {
    const API_URL = import.meta.env.VITE_API_URL; // API base URL 

    const[error, setError] = useState("")
    const[success, setSuccess] = useState("")
    const fields = getRegisterUserFields()

    const dataFields = Object.fromEntries(
        fields.map(f => [f.name, ""])
    );

    const [formData, setFormData] = useState(dataFields);

    useEffect(() => {
        const initData = Object.fromEntries(fields.map(f => [f.name, f.value ?? ""]));
        setFormData(initData);
    }, [fields]);

    const handleChange = (e) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    };


    // user registration
    const handleUserRegistration = async (e) => {
        e.preventDefault()
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
            {/* Error/Success Messages */}
            {error && (
                <div className="fixed top-[10vh] right-6 z-50 max-w-xs">
                    <Message 
                        status="error" 
                        message={error}
                        onClose={() => setError("")}
                    />
                </div>
            )}
            {success && (
                <div className="fixed top-[10vh] right-6 z-50 max-w-xs">
                    <Message 
                        status="success" 
                        message={success}
                        onClose={() => setSuccess("")}
                    />
                </div>
            )}

            {/* Page Title */}
            <div className="mb-[2vh]">
                <h1 className="text-center text-2xl font-semibold text-flag-red-500 mt-[10vh]">Users</h1>
                <p className="text-center text-sm text-space-indigo-500">
                    Register new users.
                </p>
            </div>

            {/* Register a User Form */}
            <Card sx={{ borderRadius: 3, boxShadow: 6 }} className="w-[40vw] mx-auto rounded-md bg-platinum-50 border-2 border-platinum-100 shadow-md p-10">
                <CardContent sx={{ p: 3, position: "relative" }}>


                    {/* Form title and description */}
                    <h2 className="text-center text-lg font-semibold text-flag-red-500">
                        Enter User Details
                    </h2>

                    <h2 className="text-center text-sm text-space-indigo-500 mb-5">
                        Enter user details to register a new user.
                    </h2>
                    
                    
                    <form onSubmit={handleUserRegistration}>
                        {fields.map(f => (
                            <div key={f.name} style={{ marginBottom: 16 }}>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    {f.label}{f.required ? " *" : ""}
                                </Typography>

                                <InputDefault
                                    type={f.type || "text"}
                                    name={f.name}
                                    value={formData[f.name]}
                                    onChange={handleChange}
                                    required={f.required}
                                />

                            </div>
                        ))}

                        <Button variant="default" type="submit" fullWidth sx={{ mt: 1 }} >
                            Submit
                        </Button>
                    </form>

                </CardContent>
            </Card>
            

        </div>

    )
}
