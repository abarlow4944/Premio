import ModalForm from "../../components/Modal/ModalForm";
import DataTable from "../../components/DataTable/DataTable";
import { getTransactionColumns } from "../../components/DataTable/Columns/TransactionColumns"
import { useState, useEffect, useMemo } from "react";
import { useUser } from '../../contexts/UserContexts';
import { BookmarkIcon } from "@heroicons/react/24/solid";

export default function TransactionPage() {
    const { visualRole, role } = useUser();
    const currentRole = visualRole || role;
    const [rows, setRows] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [globalMaxes, setGlobalMaxes] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const API_URL = import.meta.env.VITE_API_URL;



    const [query, setQuery] = useState({
        utorid: "",
        type: "",
        amount: "",
        relatedId: "",
        promotionIds: "",
        remark: "",
        sortBy: "bookmarked",
        sortOrder: "desc",
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

                // If using visual role, pass it to backend so filtering reflects visual role
                if (visualRole && visualRole !== role) {
                    params.append('asRole', visualRole);
                }

                const res = await fetch(`${API_URL}/users/me/transactions?${params}`, {
                    method: "GET",
                    credentials: "include",
                });

                const text = await res.text();
                let data;
                try {
                    data = JSON.parse(text);
                } catch {
                    return;
                }

                if (!res.ok) {
                    console.error("Error:", data.error);
                    return;
                }

                data.results.forEach((r) => {
                    r.spent = r.spent ? `$${r.spent.toFixed(2)}` : "-"
                })

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

    // Toggle bookmark
    const handleBookmarkToggle = async (row) => {
        setError("");
        setSuccess("");
        
        try {
            const res = await fetch(`${API_URL}/transactions/${row.id}/bookmark`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ bookmarked: !row.bookmarked })
            });

            const data = await res.json();
            if (!res.ok) {
                setError(`Could not update bookmark status: ${data.error}` || "Could not update bookmark status");
                console.warn('Could not update bookmark status:', data.error || res.status);
                return;
            }

            // Update the row in the table
            setRows(prev => prev.map(r => 
                r.id === row.id ? { ...r, bookmarked: !r.bookmarked } : r
            ));
            setSuccess("Successfully updated bookmark status");
        } catch (err) {
            setError(err.message || "Could not update bookmark status");
            console.error("Error:", err);
        }
    };

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
                <p className="text-center text-sm text-gray-500 mt-2 flex items-center justify-center gap-1">
                    <span>Bookmarked transactions are marked with a</span>
                    <BookmarkIcon className="size-4 text-red-600" />
                </p>
            </div>

            {/* Table */}
            <DataTable
                data={rows}
                columns={columns}
                count={totalCount}
                query={query}
                setQuery={setQuery}
                initialStableMax={globalMaxes}
                error={error}
                success={success}
                showBookmarks={true}
                onBookmarkToggle={handleBookmarkToggle}
            />
        </div>
    );
}
