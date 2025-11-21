import { createContext, useContext, useState, useEffect, useCallback } from "react";

export const UserContext = createContext(null);

export function UserProvider({ children }) {
    const API_URL = import.meta.env.VITE_API_URL;
    const [role, setRole] = useState(null);
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [userError, setUserError] = useState(null);

    const reloadProfile = useCallback(async () => {
        setUserError(null);
        try {
            const res = await fetch(`${API_URL}/users/me`, {
                method: 'GET',
                credentials: 'include',
            });
            if (!res.ok) {
                if (res.status !== 401) {
                    const data = await res.json().catch(() => ({}));
                    setUserError(data.error || 'Failed to load user profile');
                }
                setUser(null);
                setRole(null);
                return;
            }
            const profile = await res.json();
            setUser(profile);
            setRole(profile.role);
        } catch (e) {
            setUserError(`Network error: ${e}`);
            setUser(null);
            setRole(null);
        }
    }, [API_URL]);

    useEffect(() => {
        (async () => {
            await reloadProfile();
            setLoadingUser(false);
        })();
    }, [reloadProfile]);

    return (
        <UserContext.Provider value={{ role, setRole, user, setUser, loadingUser, userError, reloadProfile }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}