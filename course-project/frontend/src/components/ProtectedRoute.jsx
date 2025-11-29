import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContexts";
import { useEffect } from "react";
import Forbidden from "@/pages/errorPages/Forbidden";

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, visualRole } = useUser();
    const role = visualRole || user?.role;

    const navigate = useNavigate();

    if(role === null){ // if the user has no role (not logged in)
        navigate("/")
        return
    }
    if(allowedRoles && !allowedRoles.includes(role)){ // if the user doesn't have clearance
        return <Forbidden/>
    }

    return children
}