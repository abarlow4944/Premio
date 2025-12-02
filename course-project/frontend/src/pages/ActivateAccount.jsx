import { useState } from "react";
import { useUser } from "../contexts/UserContexts";
import { useNavigate } from "react-router-dom";
import Message from "@/components/Message";

export default function ResetPassword() {
    const API_URL = import.meta.env.VITE_API_URL; // API base URL
    const[password, setPassword] = useState("")
    const[confirmPassword, setConfirmPassword] = useState("")
    const[error, setError] = useState("")
    const[success, setSuccess] = useState("")
    const navigate = useNavigate();

    const params = new URLSearchParams(window.location.search); // get the URL
    const utorid = params.get("utorid")

    const handleAccountActivation = async() =>{
        const params = new URLSearchParams(window.location.search); // get the URL
        const resetToken = params.get("token")
        const utorid = params.get("utorid")

        // check if passwords match
        if(password !== confirmPassword){
            setError("Passwords do not match")
            return;
        }

        const res = await fetch(`${API_URL}/auth/activate/${resetToken}`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-type": "application/json",
            },
            body: JSON.stringify({ "utorid": utorid, "password": password }), // convert a JS value into a JSON-formatted string
        });

        const data = await res.json(); // get reset token from backend
        
        if(!res.ok){
            setError(data.error || "Failed to activate account")
            return;
        }
        else{
            setSuccess("Successfully activated account")
            console.log("Successfully activated account")
            // wait 2 seconds before navigating to show success message
            setTimeout(() => {
                navigate("/");
            }, 2000);
        }
    }

    return (
    <>
        <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
            <img
                alt="Logo"
                src="/logo.png"
                className="mx-auto h-25 w-auto"
            />
            <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-flag-red-500">
                Activate Your Account
            </h2>
            <p className="mt-6 text-sm text-center text-gray-700">Enter your details to activate your account.</p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
            <div className="space-y-6">
                <div className="flex flex-col gap-4">

                {/* UTORid */}
                <div>
                    <label htmlFor="utorid" className="block text-sm/6 font-medium text-gray-900 text-left">
                        UTORid
                    </label>
                    <div className="mt-2">
                        <input
                        id="utorid"
                        name="utorid"
                        value={utorid}
                        readOnly={true}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-platinum-700 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 sm:text-sm/6"
                        />
                    </div>
                </div>

                {/* Password */}
                <div>
                    <label htmlFor="password" className="block text-sm/6 font-medium text-gray-900 text-left">
                        Password
                    </label>
                    <div className="mt-2">
                        <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        autoComplete="password"
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-strawberry-red-500 sm:text-sm/6"
                        onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                {/* Confirm password */}
                <div>
                    <label htmlFor="confirmPassword" className="block text-sm/6 font-medium text-gray-900 text-left">
                        Confirm password
                    </label>
                    <div className="mt-2">
                        <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="confirmPassword"
                        required
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-strawberry-red-500 sm:text-sm/6"
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                </div>

                </div>
                <div className="flex flex-row gap-2">
                    <button
                        onClick={handleAccountActivation}
                        className="flex w-full justify-center rounded-md bg-strawberry-red-500 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-strawberry-red-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-strawberry-red-500 hover:cursor-pointer"
                    >
                        Activate account
                    </button>
                </div>
                
            </div>
            
            {error && (
                <Message notCorner message={error} status="error" onClose={() => setError(null)}/>
            )}

            {success && (
                <Message notCorner message={success} status="success" onClose={() => setError(null)}/>
            )}
            
            </div>

        </div>
    </>
    )


}
