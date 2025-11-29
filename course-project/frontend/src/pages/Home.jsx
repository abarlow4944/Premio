import { useUser } from '../contexts/UserContexts';
import RegularHome from './landing/RegularHome';
import CashierHome from './landing/CashierHome';
import ManagerHome from './landing/ManagerHome';
import SuperuserHome from './landing/SuperuserHome';
import Forbidden from './errorPages/Forbidden';

export default function Home() {
    // shows different homepages based on role
    const {visualRole, role} = useUser();
    const currentRole = visualRole || role;

    if (!currentRole){
        return (
            <div>
                Loading...
            </div>
        );
    }

    switch(currentRole){
        case "regular":
            return <RegularHome />;
        case "cashier":
            return <CashierHome />;
        case "manager":
            return <ManagerHome />;
        case "superuser":
            return <SuperuserHome />;
        default:
            return <Forbidden/>;
    }
}
