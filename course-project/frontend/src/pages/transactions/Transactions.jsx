import ModalForm from "../../components/Modal/ModalForm";
import DataTable from "../../components/DataTable/DataTable";
import { useState, useEffect } from "react";
import { useUser } from '../../contexts/UserContexts';
import RegularTransaction from './TransactionRegular';
import CashierTransaction from './TransactionsCashier';
import ManagerTransaction from './TransactionManagers';
import Forbidden from "../errorPages/Forbidden";

export default function TransactionsHome() {
    const {visualRole, role} = useUser();
    const currentRole = visualRole || role;
    console.log("  ROLE IS: ", currentRole)

    if (!currentRole){
        console.log("no role");
        return (
            <div>
                Loading...
            </div>
        );
    }

    switch(currentRole){
        case "regular":
            return <RegularTransaction />;
        case "cashier":
            return <CashierTransaction />;
        case "manager":
            return <ManagerTransaction />;
        case "superuser":
            return <ManagerTransaction />;
        default:
            return <Forbidden/>;
    }
}
