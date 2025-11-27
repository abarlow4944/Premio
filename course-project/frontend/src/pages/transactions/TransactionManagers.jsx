import ModalForm from "../../components/Modal/ModalForm";
import ModalView from "../../components/Modal/ModalView";
import DataTable from "../../components/DataTable/DataTable";
import { getTransactionColumns } from "../../components/DataTable/Columns/TransactionColumns"
import { useState, useEffect } from "react";
import { useUser } from '../../contexts/UserContexts';
import { Button } from "../../components/ui/button";
import {getTransactionFields} from "../../components/Modal/FormFields/TransactionFields";

export default function TransactionPage() {
    const { role } = useUser();
    const [open, setOpen] = useState(false);
    const [rows, setRows] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [globalMaxes, setGlobalMaxes] = useState(null);
    const [modalMode, setModalMode] = useState(null);
    const[error, setError] = useState("")
    const[success, setSuccess] = useState("")
    const[isModalOpen, setIsModalOpen] = useState(false);
    const[modalText, setModalText] = useState("");
    
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
        setError("")
        setSuccess("")

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

    function closeModal(){
        setIsModalOpen(false);
        setModalText("");
    }

    // saving updated data
    const handleRowSaved = async (updatedRow) => { // called when an edit to the row is saved
        setError("")
        setSuccess("")
        console.log("suspicion :", updatedRow.suspicious);
        // send PATCH request
        const res = await fetch(`${API_URL}/transactions/${updatedRow.id}/suspicious`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ suspicious: updatedRow.suspicious})
        });

        const data = await res.json();
        if (!res.ok) {
            setError(`Could not update transactions: ${data.error}` || "Could not update transactions")
            console.warn('Could not update transactions:', data.error || res.status);
            throw new Error('Could not update transactions');
        }
        setSuccess("Successfully updated transactions")
    }
    
    // view row
    const handleViewRow = async (row) => {
        setError("");
        setSuccess("");
        setModalText("Retrieving...");
        setIsModalOpen(true);

        try {
            const res = await fetch(`${API_URL}/transactions/${row.id}`, {
                method: 'GET',
                credentials: 'include'  // ok
                // no body
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                setError(`Could not get transaction: ${errData.error || res.statusText}`);
                setModalText("Error loading transaction.");
                return;
            }

            const data = await res.json();
            console.log("DATA: ", data);
            setModalText(JSON.stringify(data, null, 2));
            setSuccess("Successfully fetched transaction");

        } catch (err) {
            console.error(err);
            setError("Failed to fetch transaction");
            setModalText("Error loading transaction.");
        }
    };
        
    return (
        <div className="p-6 space-y-4">
            {/* Page Title */}
            <div className="mb-[5vh]">
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
                columns={getTransactionColumns(role)}
                count={totalCount}
                query={query}
                setQuery={setQuery}
                initialStableMax={globalMaxes}
                onRowSave={handleRowSaved}
                error={error}
                success={success}
                onViewRow={handleViewRow}
                enableEditing={true}
            />

            {/* View Transaction */}
            <ModalView
                open={isModalOpen}
                onClose={closeModal}
                text={modalText}
            />
        </div>
    );
}
