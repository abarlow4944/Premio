import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContexts";
import { useEffect } from "react";
import NotAuthorized from "@/pages/NotAuthorized";

export default function ProtectedRoute({ children, allowedRoles }) {
    const { role } = useUser();
    const navigate = useNavigate();

    

    if(role === null){ // if the user has no role (not logged in)
        navigate("/")
        return
    }
    if(allowedRoles && !allowedRoles.includes(role)){ // if the user doesn't have clearance
        return <NotAuthorized/>
    }

    return children
}