import ModalForm from "../../components/Modal/ModalForm";
import DataTable from "../../components/DataTable/DataTable";
import TransactionColumns from "../../components/DataTable/Columns/TransactionColumns"
import { useState, useEffect } from "react";
import { useUser } from '../../contexts/UserContexts';

export default function TransactionPage(){
    const { role } = useUser();
    const [open, setOpen] = useState(false);
    const [rows, setRows] = useState([]);
    const [data, setData] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const allowedRoles = ["cashier", "manager", "superuser"];
    const allowed = allowedRoles.includes(role);

    const API_URL = import.meta.env.VITE_API_URL; // API base URL 
    console.log("API_URL: " + API_URL);
    const formFields = [
        { name: "utorid", label: "UtorID", required: true },
        { name: "type", label: "Type", required: true },
        { name: "amount", label: "Amount", type: "number", required: true },
        { name: "relatedId", label: "Transaction ID", type: "number", required: true},
        { name: "promotionIds", label: "Promotion ID", multiNumber: true}, // can separate values by commas or whitespace
        { name: "remark", label: "Remark"}
    ];

    const [query, setQuery] = useState({
        utorid: "",
        type: "",
        amount: "",
        relatedId: "",
        promotionIds: "",
        remark: "",
        page: 1,
        limit: 10
    })

    const handleSubmit = (data) => {
        const newRow = {
            id: rows.length + 1,
            ...data,
        };

        setRows((prev) => [...prev, newRow]);
        setOpen(false);
    };

    console.log("rendering transactions");
    
    useEffect(() =>{
        const fetchData = async() =>{
            try{
                const params = new URLSearchParams();

                if(query.utorid) params.append("utorid", query.utorid);
                if(query.type) params.append("type", query.type);
                if(query.amount) params.append("amount", query.amount);
                if(query.relatedId) params.append("relatedId", query.relatedId);
                if(query.promotionIds) params.append("promotionIds", query.promotionIds);
                
                const res = await fetch(`${API_URL}/transactions?${params}`, {
                    method: "GET",
                    credentials: "include"
                });

                const text = await res.text();
                console.log("RAW:", text);

                let data;
                try {
                    data = JSON.parse(text);
                } catch (err) {
                    console.error("Not JSON:", text);
                    return;
                }

                if(!res.ok){ // handle error
                    console.log("Error:", data.error)
                    return
                }

                setData(data.results)
                setTotalCount(data.count)
            }
            catch(error){
                console.log("in catch");
                console.log("Error:", error)
                return
            }
        };
        fetchData();

    }, [query]);

    return (
        <div>
            <h2>TRANSACTION PAGE</h2>
            <p>Working</p>
            {allowed && (
                <button onClick={() => setOpen(true)}>
                    New Transaction
                </button>
            )}

            <ModalForm
                open={open}
                setOpen={setOpen}
                modalType="Transaction"
                fields={formFields}
                onSubmit={handleSubmit}
            />
            <DataTable data={rows} columns={TransactionColumns} />
            
        </div>
    );
}