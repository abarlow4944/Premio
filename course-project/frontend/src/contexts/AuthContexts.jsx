import React, { createContext, useContext, useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);
const BACKEND_URL = import.meta.env.VITE_API_URL;
// TODO: get the BACKEND_URL.

/*
 * This provider should export a `user` context state that is 
 * set (to non-null) when:
 *     1. a hard reload happens while a user is logged in.
 *     2. the user just logged in.
 * `user` should be set to null when:
 *     1. a hard reload happens when no users are logged in.
 *     2. the user just logged out.
 */
export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    // const user = null; // TODO: Modify me.

    useEffect(() =>{
        // TODO: complete me, by retriving token from localStorage and make an api call to GET /user/me.
        const token = localStorage.getItem("token");
        if (!token) return;

        (async () => {
            try{
                const res = await fetch(`${API_URL}/user/me`, {
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

    /*
     * Logout the currently authenticated user.
     *
     * @remarks This function will always navigate to "/".
     */
    const logout = () => {
        // TODO: complete me
        localStorage.removeItem("token");
        setUser(null);
        navigate("/");
    };

    /**
     * Login a user with their credentials.
     *
     * @remarks Upon success, navigates to "/profile". 
     * @param {string} username - The username of the user.
     * @param {string} password - The password of the user.
     * @returns {string} - Upon failure, Returns an error message.
     */
    const login = async (username, password) => {
        // TODO: complete me
        try{
            const res = await fetch(`${API_URL}/login`, {
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

            const user_me = await fetch(`${API_URL}/user/me`, {
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
            navigate("/profile");
            return "";  
        }
        catch (err){
            console.log("Error: " + err);
            return "Internal Server Error."
        }
    };

    /**
     * Registers a new user. 
     * 
     * @remarks Upon success, navigates to "/".
     * @param {Object} userData - The data of the user to register.
     * @returns {string} - Upon failure, returns an error message.
     */
    const register = async (userData) => {
        // TODO: complete me
        const res = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(userData)
        });

        if(!res.ok){
            const error_msg = await res.json().catch(() => null);
            return error_msg?.message || "Registration Failed"
        }

        navigate("/success")
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
