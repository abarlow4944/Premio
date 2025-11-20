import { createContext, useContext, useState } from "react";

export const UserContext = createContext(null); 

export function UserProvider({ children }) {
    // regular, cashier, managers, superuser
    const [role, setRole] = useState(null); 
    return (
        <UserContext.Provider value={{ role, setRole }}> 
        {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}