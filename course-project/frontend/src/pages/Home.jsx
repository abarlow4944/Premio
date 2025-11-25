import { useUser } from '../contexts/UserContexts';
import RegularHome from './landing/RegularHome';
import CashierHome from './landing/CashierHome';
import ManagerHome from './landing/ManagerHome';
import SuperuserHome from './landing/SuperuserHome';

export default function Home() {
    const {role} = useUser();

    if (!role){
        console.log("no role");
        return (
            <div>
                Loading...
            </div>
        );
    }
    console.log("role is " + role); 

    switch(role){
        case "regular":
            return <RegularHome />;
        case "cashier":
            return <CashierHome />;
        case "manager":
            return <ManagerHome />;
        case "superuser":
            return <SuperuserHome />;
        default:
            return <div>40X PAGE TO BE CREATED</div>;
    }
}
