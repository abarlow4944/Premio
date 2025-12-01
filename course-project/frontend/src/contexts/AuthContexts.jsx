import React, { createContext, useContext, useEffect, useState} from 'react';

const AuthContext = createContext(null);
const BACKEND_URL = import.meta.env.VITE_API_URL;
// TODO: get the BACKEND_URL.

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    // const user = null; // TODO: Modify me.

    useEffect(() =>{
        // TODO: complete me, by retriving token from localStorage and make an api call to GET /user/me.
        const token = localStorage.getItem("token");
        if (!token) return;

        (async () => {
            try{
                const res = await fetch(`${BACKEND_URL}/user/me`, {
                    headers: { Authorization: `Bearer ${token}`}
                });

                if (!res.ok){
                    localStorage.removeItem("token");
                    setUser(null);
                    return;
                }

                const data = await res.json();
                setUser(data.user);
            }
            catch{
                localStorage.removeItem("token");
                setUser(null)
            }
        })();
    }, [])

    const logout = () => {
        // TODO: complete me
        localStorage.removeItem("token");
        setUser(null);
    };

    const login = async (username, password) => {
        // TODO: complete me
        try{
            const res = await fetch(`${BACKEND_URL}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password }),
                credentials: "include"
            });

            const data = await res.json()
            if(!res.ok){
                return data.message || "Login Failed"
            }

            localStorage.setItem("token", data.token);

            const user_me = await fetch(`${BACKEND_URL}/user/me`, {
                headers: {
                    Authorization: `Bearer ${data.token}`
                }
            });

            if (!user_me.ok){
                localStorage.removeItem("token");
                setUser(null);
                return "Failed to fetch user profile";
            }
            const userData = await user_me.json();
            setUser(userData.user);
            return "";  
        }
        catch (err){
            console.log("Error: " + err);
            return "Internal Server Error."
        }
    };

    const register = async (userData) => {
        // TODO: complete me
        const res = await fetch(`${BACKEND_URL}/register`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(userData)
        });

        if(!res.ok){
            const error_msg = await res.json().catch(() => null);
            return error_msg?.message || "Registration Failed"
        }
        return "";
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
