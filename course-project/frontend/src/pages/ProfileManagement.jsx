import { useState, useEffect } from "react";
import { InputDefault } from "@/components/ui/Input";
import { useUser } from "@/contexts/UserContexts";
import { Button } from "@/components/ui/Button";
import Message from "@/components/Message";

export default function ProfileManagement() {
    const { user } = useUser();
    console.log(user)
    const[error, setError] = useState("")
    const[success, setSuccess] = useState("")

    const [ oldPassword, setOldPassword] = useState("")
    const [ newPassword, setNewPassword] = useState("")
    const [name, setName] = useState(user.name)
    const [email, setEmail] = useState(user.email)

    const initialBirthday = user.birthday ? user.birthday : null
    const [birthday, setBirthday] = useState(initialBirthday)

    const API_URL = import.meta.env.VITE_API_URL; // API base URL 

    
    // handle save profile
    const handleProfileSave = async () => {
        setError("")
        setSuccess("")

        // make sure name/email are not blank 
        if(name === "" || email === ""){
            setSuccess("")
            setError("Name/birthday cannot be blank")
            return;
        }

        // update the user's details
        const res = await fetch(`${API_URL}/users/me`, {
            method: "PATCH",
            credentials: "include",
            headers: {
                "Content-type": "application/json",
            },
            body: JSON.stringify( { "name": name, "email": email, "birthday": birthday})
        });

        const data = await res.json();
            
        if(!res.ok){ // handle password changing error
            setSuccess("")
            setError(data.error || "Could not change details")

            //update context
            user.name = name;
            user.email = email;
            return;
        }
        else{
            setError("")
            setSuccess("Successfully made changes")
        }
    }

    // handle password save
    const handlePasswordSave = async () => {
        setError("")
        setSuccess("")

        // update the user's password
        const res = await fetch(`${API_URL}/users/me/password`, {
            method: "PATCH",
            credentials: "include",
            headers: {
                "Content-type": "application/json",
            },
            body: JSON.stringify( { "old": oldPassword, "new": newPassword })
        });

        const data = await res.json();
            
        if(!res.ok){ // handle password changing error
            setSuccess("")
            setError(data.error || "Could not change password")
            return;
        }
        else{
            setError("")
            setSuccess("Password successfully changed")
        }
    }

    return (
        <div className="flex p-6 space-y-4 w-[50vw] mx-auto justify-center flex-col">

            {/* Page Title */}
            <div>
                <h1 className="text-center text-2xl font-semibold text-flag-red-500 mt-[10vh]">Profile Management</h1>
                
            </div>

            {/* Container */}
            <div className="space-y-8">

                {/* Basic info section */}
                <div className="space-y-4 rounded-md bg-platinum-50 border-2 border-platinum-100 shadow-md p-10">
                    <h2 className="text-lg font-semibold text-space-indigo-500">
                    Profile Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <InputDefault
                        label="Name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    {/* UTORid */}
                    <div>
                        <p className="text-strawberry-red-500 text-sm/6 font-medium">UTORid</p>
                        <p className="text-gray-900 sm:text-sm/6 mt-2">{user.utorid}</p>
                    </div>

                    {/* Email */}
                    <InputDefault
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    {/* Birthday */}
                    <InputDefault
                        label="Birthday"
                        type="date"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                    />
                    </div>
                    
                    {/* Save changes button */}
                    <Button variant="default" size="lg" onClick={handleProfileSave}>Save Changes</Button>
                </div>

                {/* Password section */}
                <div className="space-y-4 rounded-md bg-platinum-50 border-2 border-platinum-100 shadow-md p-10">
                    <h2 className="text-lg font-semibold text-space-indigo-500">
                    Change Password
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Current password */}
                    <InputDefault
                        label="Current Password"
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                    />

                    {/* New password */}
                    <InputDefault
                        label="New Password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => {
                            setNewPassword(e.target.value)
                        }
                    }
                    />
                    </div>

                    {/* Save changes button */}
                    <Button variant="default" size="lg" onClick={handlePasswordSave}>Save Changes</Button>
                </div>
            </div>

        {error && (
            <Message message={error} status="error" onClose={() => setError(null)}/>
        )}

        {success && (
            <Message message={success} status="success" onClose={() => setError(null)}/>
        )}

        </div>
    )
}