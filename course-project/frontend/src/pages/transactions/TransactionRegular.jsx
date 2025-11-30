import ModalForm from "../../components/Modal/ModalForm";
import DataTable from "../../components/DataTable/DataTable";
import { getTransactionColumns } from "../../components/DataTable/Columns/TransactionColumns"
import { useState, useEffect, useMemo } from "react";
import { useUser } from '../../contexts/UserContexts';
import { Button } from "../../components/ui/button";
import {getTransactionFields} from "../../components/Modal/FormFields/TransactionFields";

export default function TransactionPage() {
    const { visualRole, role } = useUser();
    const currentRole = visualRole || role;
    const [open, setOpen] = useState(false);
    const [rows, setRows] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [globalMaxes, setGlobalMaxes] = useState(null);
    const [modalMode, setModalMode] = useState(null);
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

    // Fetch transaction stats (max values for filters)
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`${API_URL}/transactions/stats/maxes`, {
                    method: "GET",
                    credentials: "include",
                });

                if (!res.ok) {
                    console.warn('Could not fetch transaction stats:', res.status);
                    return;
                }

                const body = await res.json();
                if (body.error) {
                    console.warn('Could not fetch transaction stats:', body.error);
                    return;
                }

                setGlobalMaxes({
                    amount: Number(body.maxAmount ?? 0),
                    spent: Number(body.maxSpent ?? 0),
                });
            } catch (err) {
                console.error('Error fetching transaction stats:', err);
            }
        };
        fetchStats();
    }, []);

    // Pass columns
    const columns = useMemo(() => getTransactionColumns(role), [role]);

    return (
        <div className="p-6 space-y-4">
            {/* Page Title */}
            <div className="mb-[5vh]">
                <h1 className="text-center text-2xl font-semibold text-flag-red-500 mt-[10vh]">
                    Transaction History
                </h1>
                <p className="text-center text-sm text-space-indigo-500">
                    View your transaction history.
                </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center mt-6 gap-3">
                {(
                <Button
                    className="bg-[var(--color-strawberry-red-500)] text-white"
                    onClick={() => {
                    setModalMode("redeem"); 
                    setOpen(true);
                    }}
                >
                    Redeem Transaction
                </Button>
                )}
            </div>

            {/* Modal */}
            {modalMode && (
            <ModalForm
                open={open}
                setOpen={setOpen}
                fields={getTransactionFields(currentRole, modalMode)}
                onSubmit={async (data) => {
                    const formFields = getTransactionFields(currentRole, modalMode);
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
                        else if (f.type === "number" || f.type === "price") {
                            payload[f.name] = value ? Number(value) : null; // or null if you prefer
                        }
                        else {
                            payload[f.name] = value ?? "";
                        }


                    });

                    try {
                        const res = await fetch(`${API_URL}/users/me/transactions`, {
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
                columns={columns}
                count={totalCount}
                query={query}
                setQuery={setQuery}
                initialStableMax={globalMaxes}
            />
        </div>
    );
}
