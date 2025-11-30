import { useState } from "react";
import { useUser } from "../../contexts/UserContexts";
import { useNavigate } from "react-router-dom";
import Message from "@/components/Message";
import EmailConfirmation from "./EmailConfirmation";


export default function ForgotPassword() {
    const API_URL = import.meta.env.VITE_API_URL; // API base URL 

    const[utorid, setUtorid] = useState("")
    const[error, setError] = useState("")
    const navigate = useNavigate();


    const handleResetEmail = async() =>{

        const res = await fetch(`${API_URL}/auth/resets`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-type": "application/json",
            },
            body: JSON.stringify({ utorid}), // convert a JS value into a JSON-formatted string
        });

        const data = await res.json(); // get reset token from backend

        if(!res.ok){ // handle login error
            setError(data.error || "Unable to send reset email")
            return;
        }
        else{ //redirect to email confirmation to show that an email was sent
            navigate(`/email-confirmation`)
        }
    }

    return (
    <>
        <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
            <img
                alt="Logo"
                src="./public/logo.png"
                className="mx-auto h-25 w-auto"
            />
            <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-flag-red-500">
                Forgot your password?
            </h2>
            <p className="mt-6 text-sm text-center text-gray-700">Enter your UTORid and we'll send you a link to reset your password.</p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
            <div className="space-y-6">
                <div>
                <label htmlFor="utorid" className="block text-sm/6 font-medium text-gray-900 text-left">
                    UTORid
                </label>
                <div className="mt-2">
                    <input
                    id="utorid"
                    name="utorid"
                    type="utorid"
                    autoComplete="utorid"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-strawberry-red-500 sm:text-sm/6"
                    onChange={(e) => setUtorid(e.target.value)}
                    />
                </div>
                </div>

                <div className="flex flex-row gap-2">
                <button
                    onClick={handleResetEmail}
                    className="flex w-full justify-center rounded-md bg-strawberry-red-500 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-strawberry-red-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-strawberry-red-500 hover:cursor-pointer"
                >
                    Send email
                </button>
                <button
                    onClick={() => navigate("/")}
                    className="flex w-full justify-center rounded-md bg-strawberry-red-500 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-strawberry-red-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-strawberry-red-500 hover:cursor-pointer"
                >
                    Back to login
                </button>
                </div>
            </div>
            
            {error && (
                <Message notCorner message={error} status="error" onClose={() => setError(null)}/>
            )}
            
            </div>


        </div>
    </>
    )


}