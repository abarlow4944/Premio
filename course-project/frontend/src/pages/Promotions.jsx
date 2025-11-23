import { useState, useEffect, useMemo } from "react";
import DataTable from "../components/DataTable/DataTable";
import { getPromoColumns } from "../components/DataTable/Columns/PromoColumns";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";
import { useUser } from "../contexts/UserContexts";

export default function Promotions() {
    const API_URL = import.meta.env.VITE_API_URL; // API base URL 
    const { user } = useUser();

    const [data, setData] = useState([]);
    const [totalCount, setTotalCount] = useState(0);

    const [query, setQuery] = useState({ // the filters we will be applying (params)
        name: "",
        role: "",
        verified: "",
        activated: "",
        sortBy: "",
        sortOrder: "asc",
        page: 1,
        limit: 10
    })

    // call fetchData each time query changes
    useEffect(() => {
        // retrieve the promotions data by making a HTTP request
        try {
            const fetchData = async () => {
                const params = new URLSearchParams();

                // add necessary params to the URL
                if(query.name) params.append("name", query.name);
                if(query.endTime) params.append("endTime", query.endTime);
                if(query.sortBy) params.append("sortBy", query.sortBy);
                if(query.sortOrder) params.append("sortOrder", query.sortOrder);

                params.append("page", query.page)
                params.append("limit", query.limit)

                // retrieve promotions
                const res = await fetch(`${API_URL}/promotions?${params}`, {
                    method: "GET",
                    credentials: "include"
                });

                const data = await res.json(); // response from endpoint
                
                if(!res.ok){ // handle error
                    console.log("Error:", data.error)
                    return
                }

                setData(data.results)
                setTotalCount(data.count)
            }

            fetchData();
        }
        catch(error){
            console.log("Error:", error)
        }
    }, [query]);

    const role = user?.role || 'regular';
    const columns = useMemo(() => getPromoColumns(role), [role]);
    const selectionEnabled = role === 'manager';
    const [selectedPromos, setSelectedPromos] = useState([]);
    const [pendingDelete, setPendingDelete] = useState(null);

    const performDeletion = async (rows) => {
        if (!selectionEnabled || !rows || rows.length === 0) return;
        const failures = [];
        for (const r of rows) {
            try {
                const res = await fetch(`${API_URL}/promotions/${r.id}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                if (!res.ok && res.status !== 204) {
                    let body = {};
                    try { body = await res.json(); } catch {}
                    failures.push({ id: r.id, error: body.error || `Status ${res.status}` });
                }
            } catch (err) {
                failures.push({ id: r.id, error: err.message });
            }
        }
        setQuery(q => ({ ...q }));
        setSelectedPromos([]);
        setPendingDelete(null);
    };

    const handleDeleteSelected = (rows) => {
        if (!selectionEnabled || !rows || rows.length === 0) return;
        setPendingDelete(rows);
    };

    return (
        <div className="p-6 space-y-4">
            {/* Page Title */}
            <div className="mb-[5vh]">
                <h1 className="text-center text-2xl font-semibold text-flag-red-500 mt-[10vh]">Promotions</h1>
                <p className="text-center text-sm text-space-indigo-500">
                View and manage all available promotions.
                </p>
            </div>
            {/* Deletion Confirmation Modal */}
            {pendingDelete && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-title"
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                >
                    <div
                        className="absolute inset-0 bg-black/40"
                        aria-hidden="true"
                        onClick={() => setPendingDelete(null)}
                    />
                    <Card className="relative z-10 w-full max-w-lg bg-white border border-gray-200 shadow-xl">
                        <CardHeader className="pr-12">
                            <CardTitle id="delete-title">Confirm Deletion</CardTitle>
                            <CardDescription>
                                You are about to delete {pendingDelete.length} promotion{pendingDelete.length > 1 ? 's' : ''}. This action cannot be undone. Promotions that have already started will not be affected.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside text-md text-space-indigo-500 max-h-48 overflow-auto pr-2">
                                {pendingDelete.slice(0,15).map(p => (
                                    <li key={p.name}>{p.name}</li>
                                ))}
                                {pendingDelete.length > 15 && (
                                    <li className="italic">...and {pendingDelete.length - 15} more</li>
                                )}
                            </ul>
                        </CardContent>
                        <CardFooter className="justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setPendingDelete(null)}
                                className="rounded-md px-3 py-1 text-md font-medium border border-platinum-500 text-space-indigo-500 hover:bg-platinum-200 transition"
                            >Cancel</button>
                            <button
                                type="button"
                                onClick={() => performDeletion(pendingDelete)}
                                className="rounded-md px-3 py-1 text-md font-medium border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition"
                            >Delete</button>
                        </CardFooter>
                    </Card>
                </div>
            )}
            <DataTable
                data={data}
                columns={columns}
                count={totalCount} // total number of rows
                query={query} // the filters we are applying
                setQuery={setQuery}
                selectionEnabled={selectionEnabled}
                onSelectionChange={setSelectedPromos}
                onDeleteSelected={handleDeleteSelected}
                onCreate={() => {
                    // placeholder for creating a new promotion
                }}
            />
            {selectionEnabled && selectedPromos.length > 0 && (
                <div className="text-xs mt-2 text-gray-600">{selectedPromos.length} promotion(s) selected</div>
            )}
        
        </div>

    )
}