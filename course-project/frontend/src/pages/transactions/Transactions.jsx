import ModalForm from "../../components/Modal/ModalForm";
import DataTable from "../../components/DataTable/DataTable";
import { useState, useEffect } from "react";
import { useUser } from '../../contexts/UserContexts';
import RegularTransaction from './TransactionRegular';
import CashierTransaction from './TransactionsCashier';
import ManagerTransaction from './TransactionManagers';

export default function Home() {
    const {role} = useUser();
    // const role = "cashier"

    if (!role){
        console.log("no role");
        return (
            <div>
                Loading...
            </div>
        );
    }

    switch(role){
        case "regular":
            return <RegularTransaction />;
        case "cashier":
            return <CashierTransaction />;
        case "manager":
            return <ManagerTransaction />;
        case "superuser":
            return <ManagerTransaction />;
        default:
            return <div>40X PAGE TO BE CREATED</div>;
    }
}
