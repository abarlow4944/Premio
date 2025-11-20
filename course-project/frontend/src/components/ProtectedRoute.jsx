import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContexts";

export default function ProtectedRoute({ children, allowedRoles }) {
    const { role } = useUser();
    const navigate = useNavigate();

    if(!role){ // if the user has no role (not logged in)
        navigate("/")
    }
    if(allowedRoles && !allowedRoles.includes(role)){ // if the user doesn't have clearance
        return <h1>Unauthorized (we need to make a page for this)</h1>
    }

    return children
}