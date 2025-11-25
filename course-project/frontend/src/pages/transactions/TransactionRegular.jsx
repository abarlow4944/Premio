import ModalForm from "../../components/Modal/ModalForm";
import DataTable from "../../components/DataTable/DataTable";
import TransactionColumns from "../../components/DataTable/Columns/TransactionColumns"
import { useState, useEffect } from "react";
import { useUser } from '../../contexts/UserContexts';
import { Button } from "../../components/ui/button";

export default function TransactionPage() {
    const { role } = useUser();
    const [open, setOpen] = useState(false);
    const [rows, setRows] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const API_URL = import.meta.env.VITE_API_URL;



    const [query, setQuery] = useState({
        utorid: "",
        type: "",
        amount: "",
        relatedId: "",
        promotionIds: "",
        remark: "",
        page: 1,
        limit: 10,
    });

    // Fetch table data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const params = new URLSearchParams();

                Object.entries(query).forEach(([key, val]) => {
                    if (val) params.append(key, val);
                });

                const res = await fetch(`${API_URL}/users/me/transactions?${params}`, {
                    method: "GET",
                    credentials: "include",
                });

                const text = await res.text();
                let data;
                try {
                    data = JSON.parse(text);
                } catch {
                    console.error("Not JSON:", text);
                    return;
                }

                if (!res.ok) {
                    console.error("Error:", data.error);
                    return;
                }

                setRows(data.results);
                setTotalCount(data.count);

            } catch (error) {
                console.error("Fetch error:", error);
            }
        };

        fetchData();
    }, [query]);

    return (
        <div className="p-6 space-y-4">
            {/* Page Title */}
            <div className="mb-[10vh]">
                <h1 className="text-center text-2xl font-semibold text-flag-red-500 mt-[10vh]">
                    Transaction History
                </h1>
                <p className="text-center text-sm text-space-indigo-500">
                    View all previous transactions.
                </p>
            </div>

            {/* Table */}
            <DataTable
                data={rows}
                columns={TransactionColumns}
                count={totalCount}
                query={query}
                setQuery={q => ({ ...q})}
            />
        </div>
    );
}
