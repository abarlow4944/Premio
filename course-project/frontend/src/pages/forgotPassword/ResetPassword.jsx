import { useState } from "react";
import { useUser } from "../../contexts/UserContexts";
import { useNavigate } from "react-router-dom";
import Message from "@/components/Message";



export default function ResetPassword() {
    const API_URL = import.meta.env.VITE_API_URL; // API base URL
    const[newPassword, setNewPassword] = useState("")
    const[confirmPassword, setConfirmPassword] = useState("")
    const[error, setError] = useState("")
    const[success, setSuccess] = useState("")
    const navigate = useNavigate();

    const handleResetPassword = async() =>{
        const params = new URLSearchParams(window.location.search); // get the URL
        const resetToken = params.get("token")
        const utorid = params.get("utorid")

        // check if passwords match
        if(newPassword !== confirmPassword){
            setError("Passwords do not match")
            return;
        }

        const res = await fetch(`${API_URL}/auth/resets/${resetToken}`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-type": "application/json",
            },
            body: JSON.stringify({ "utorid": utorid, "password": newPassword }), // convert a JS value into a JSON-formatted string
        });

        const data = await res.json(); // get reset token from backend
        
        if(!res.ok){ // handle password reset
            setError(data.error || "Failed to reset password")
            return;
        }
        else{
            setSuccess("Successfully reset password")
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
                src="./public/logo.png"
                className="mx-auto h-25 w-auto"
            />
            <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-flag-red-500">
                Reset your password
            </h2>
            <p className="mt-6 text-sm text-center text-gray-700">Enter a new password to reset your account's password.</p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
            <div className="space-y-6">
                <div className="flex flex-col gap-4">
                {/* New password */}
                <div>
                    <label htmlFor="newPassword" className="block text-sm/6 font-medium text-gray-900 text-left">
                        New password
                    </label>
                    <div className="mt-2">
                        <input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        autoComplete="newPassword"
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-strawberry-red-500 sm:text-sm/6"
                        onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>
                </div>

                {/* Confirm password */}
                <div>
                    <label htmlFor="confirmPassword" className="block text-sm/6 font-medium text-gray-900 text-left">
                        Confirm new password
                    </label>
                    <div className="mt-2">
                        <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="confirmPassword"
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-strawberry-red-500 sm:text-sm/6"
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                </div>

                </div>
                <div className="flex flex-row gap-2">
                    <button
                        onClick={handleResetPassword}
                        className="flex w-full justify-center rounded-md bg-strawberry-red-500 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-strawberry-red-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-strawberry-red-500 hover:cursor-pointer"
                    >
                        Reset password
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

            {success && (
                <Message notCorner message={success} status="success" onClose={() => setError(null)}/>
            )}
            
            </div>




        </div>
    </>
    )


}