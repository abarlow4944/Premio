import { useState } from "react";
import { useUser } from "../contexts/UserContexts";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const API_URL = import.meta.env.VITE_API_URL; // API base URL 

    const[utorid, setUtorid] = useState("")
    const[password, setPassword] = useState("")
    const[error, setError] = useState("")
    const { role, setRole, user, setUser } = useUser();
    const navigate = useNavigate();

    const handleSubmit = async(e) =>{ // handle form submission
        // send data to backend
        setError("")

        try {
            e.preventDefault(); // stop browser from refreshing the page

            const res = await fetch(`${API_URL}/auth/tokens`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-type": "application/json",
                },
                body: JSON.stringify({ utorid, password }), // convert a JS value into a JSON-formatted string
            });

            const data = await res.json();
            
            if(!res.ok){ // handle login error
                setError(data.error || "Login failed")
                return;
            }

            setRole(data.role);

            // Fetch user profile using cookie-based auth
            try {
                const profileRes = await fetch(`${API_URL}/users/me`, {
                    method: "GET",
                    credentials: "include",
                });
                const profile = await profileRes.json();
                if (!profileRes.ok) {
                    setError(profile.error || "Failed to load user profile");
                    return;
                }
                setUser(profile);
                navigate("/home");
            } catch (e) {
                setError(`Profile fetch error: ${e}`);
            }
        }
        catch(error){
            setError(`Network error: ${error}`)
        }
    };

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
                Sign in to Premio
            </h2>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
            <form onSubmit={handleSubmit} method="POST" className="space-y-6">
                <div>
                <label htmlFor="utorid" className="block text-sm/6 font-medium text-gray-900 text-left">
                    UTORid
                </label>
                <div className="mt-2">
                    <input
                    id="utorid"
                    name="utorid"
                    type="utorid"
                    required
                    autoComplete="utorid"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-strawberry-red-500 sm:text-sm/6"
                    onChange={(e) => setUtorid(e.target.value)}
                    />
                </div>
                </div>

                <div>
                <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-sm/6 font-medium text-gray-900">
                    Password
                    </label>
                    <div className="text-sm">
                    <a href="#" className="font-semibold text-strawberry-red-500 hover:text-strawberry-red-400">
                        Forgot password?
                    </a>
                    </div>
                </div>
                <div className="mt-2">
                    <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-strawberry-red-500 sm:text-sm/6"
                    onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                </div>

                <div>
                <button
                    type="submit"
                    className="flex w-full justify-center rounded-md bg-strawberry-red-500 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-strawberry-red-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-strawberry-red-500 hover:cursor-pointer"
                >
                    Sign in
                </button>
                </div>
            </form>

            <p className="mt-10 text-center text-sm/6 text-gray-500">
                Not a member?{' '}
                <a href="#" className="font-semibold text-strawberry-red-500 hover:text-strawberry-red-400 hover:cursor-pointer">
                Make an account
                </a>
                
            </p>
            
            </div>

            {error && <p className="font-semibold text-flag-red-500 text-sm">{error}</p>}
        </div>
    </>
    )
}