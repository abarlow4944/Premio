import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContexts";
import { useEffect } from "react";
import Forbidden from "@/pages/errorPages/Forbidden";

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, visualRole, loadingUser } = useUser();
    const role = visualRole || user?.role;

    const navigate = useNavigate();

    // While loading user profile, show nothing (or a loading spinner)
    if(loadingUser){
        return <div className="flex items-center justify-center h-screen">Loading...</div>
    }

    if(role === null){ // if the user has no role (not logged in)
        navigate("/")
        return
    }
    if(allowedRoles && !allowedRoles.includes(role)){ // if the user doesn't have clearance
        return <Forbidden/>
    }

    return children
}