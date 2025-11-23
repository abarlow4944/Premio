import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContexts";
import { useEffect } from "react";

export default function ProtectedRoute({ children, allowedRoles }) {
    const { role } = useUser();
    const navigate = useNavigate();

    useEffect (() => {
        if(!role){ // if the user has no role (not logged in)
        navigate("/")
        }
    }, [role, navigate]);

    if (role === undefined) return null; 
    if(allowedRoles && !allowedRoles.includes(role)){ // if the user doesn't have clearance
        return <h1>Unauthorized (we need to make a page for this)</h1>
    }

    return children
}