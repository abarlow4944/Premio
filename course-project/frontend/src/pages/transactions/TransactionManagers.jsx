import ModalForm from "../../components/Modal/ModalForm";
import DataTable from "../../components/DataTable/DataTable";
import TransactionColumns from "../../components/DataTable/Columns/TransactionColumns"
import { useState, useEffect } from "react";
import { useUser } from '../../contexts/UserContexts';
import { Button } from "../../components/ui/button";
import {getTransactionFields} from "../../components/Modal/FormFields/TransactionFields";

export default function TransactionPage() {
    const { role } = useUser();
    const [open, setOpen] = useState(false);
    const [rows, setRows] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [modalMode, setModalMode] = useState(null);
    const API_URL = import.meta.env.VITE_API_URL;

    const [query, setQuery] = useState({
        utorid: "",
        type: "",
        amount: "",
        relatedId: "",
        promotionIds: "",
        remark: "",
        sortBy: "",
        sortOrder: "asc",
        page: 1,
        limit: 10
    });

    // Fetch table data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const params = new URLSearchParams();

                Object.entries(query).forEach(([key, val]) => {
                    if (val) params.append(key, val);
                });

                const res = await fetch(`${API_URL}/transactions?${params}`, {
                    method: "GET",
                    credentials: "include",
                });

                const text = await res.text();
                let data;
                try {
                    data = JSON.parse(text);
                    console.log("GOT: ", data);
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
                    Transactions
                </h1>
                <p className="text-center text-sm text-space-indigo-500">
                    View and manage all transactions in the system.
                </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end mt-6 gap-3">
                {(
                <Button
                    className="bg-[var(--color-strawberry-red-500)] text-white"
                    onClick={() => {
                    setModalMode("create"); 
                    setOpen(true);
                    }}
                >
                    New Transaction
                </Button>
                )}

                {(
                <Button
                    className="bg-[var(--color-strawberry-red-500)] text-white"
                    onClick={() => {
                    setModalMode("adjust"); 
                    setOpen(true);
                    }}
                >
                    Adjust Transaction
                </Button>
                )}
            </div>

            {/* Modal */}
            {modalMode && (
            <ModalForm
                open={open}
                setOpen={setOpen}
                modalType="transactions"
                fields={getTransactionFields(role, modalMode)}
                onSubmit={async (data) => {
                    const formFields = getTransactionFields(role, modalMode);
                    const payload = {};

                    formFields.forEach((f) => {
                        let value = data[f.name];

                        if (f.multiNumber) {
                            const str = typeof value === "string" ? value.trim() : "";
                            payload[f.name] = str === ""
                                ? [] // empty input → empty array
                                : str.split(/[\s,]+/)
                                    .map(Number)
                                    .filter(n => !isNaN(n));
                        }
                        else if (f.type === "number") {
                            payload[f.name] = value ? Number(value) : 0; // or null if you prefer
                        }
                        else {
                            payload[f.name] = value ?? "";
                        }


                    });

                    try {
                        const res = await fetch(`${API_URL}/transactions`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify(payload),
                        });

                        const result = await res.json();
                        console.log("RAW: ", JSON.stringify(result))

                        if (!res.ok) {
                            console.error("Error creating transaction:", result.error);
                            return;
                        }

                        setRows(prev => [{ ...result }, ...prev.map(r => ({ ...r }))]);
                        setTotalCount(prev => prev + 1);
                        setOpen(false);
                        setModalMode(null); // reset after closing
                    } catch (err) {
                        console.error("Network error:", err);
                    }
                }}
            />
            )}

            {/* Table */}
            <DataTable
                data={rows}
                columns={TransactionColumns}
                count={totalCount}
                query={query}
                setQuery={setQuery}
                enableEditing={true}
                selectionEnabled={true}
            />
        </div>
    );
}
