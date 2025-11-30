import { useState, useEffect, useMemo } from "react";
import DataTable from "../../components/DataTable/DataTable";
import { getPromoColumns } from "../../components/DataTable/Columns/PromoColumns";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../components/ui/card";
import { useUser } from "../../contexts/UserContexts";
import { getPromotionFields } from "@/components/Modal/FormFields/PromotionFields";
import ModalForm from "@/components/Modal/ModalForm";

export default function Promotions() {
    const API_URL = import.meta.env.VITE_API_URL; // API base URL 
    const { user, visualRole, role } = useUser();
    const currentRole = visualRole || role || user?.role || 'regular';

    const [data, setData] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [globalMaxes, setGlobalMaxes] = useState(null);

    const[error, setError] = useState("")
    const[success, setSuccess] = useState("")

    const columns = useMemo(() => getPromoColumns(currentRole), [currentRole]);
    const selectionEnabled = currentRole === 'manager' || currentRole === 'superuser';
    const [selectedPromos, setSelectedPromos] = useState([]);
    const [pendingDelete, setPendingDelete] = useState(null);

    // create promotion modal stuff
    const [open, setOpen] = useState(false);
    const [modalMode, setModalMode] = useState(null);

    // the filters we will be applying (params)
    const [query, setQuery] = useState({ 
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
        setError("")
        setSuccess("")

        // retrieve the promotions data by making a HTTP request
        try {
            const fetchData = async () => {
                const params = new URLSearchParams();

                // add necessary params to the URL
                if(query.name) params.append("name", query.name);
                if(query.description) params.append("description", query.description);
                if (query.type !== undefined && query.type !== '') params.append("type", query.type);
                if (query.minSpendingMin !== undefined && query.minSpendingMin !== '') params.append("minSpendingMin", query.minSpendingMin);
                if (query.minSpendingMax !== undefined && query.minSpendingMax !== '') params.append("minSpendingMax", query.minSpendingMax);
                if (query.rateMin !== undefined && query.rateMin !== '') params.append("rateMin", query.rateMin);
                if (query.rateMax !== undefined && query.rateMax !== '') params.append("rateMax", query.rateMax);
                if (query.pointsMin !== undefined && query.pointsMin !== '') params.append("pointsMin", query.pointsMin);
                if (query.pointsMax !== undefined && query.pointsMax !== '') params.append("pointsMax", query.pointsMax);
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
                    setError(`Could not retrieve promotions data: ${data.error}` || "Could not retrieve promotions data")
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

    // fetch db maxima once on mount to set initial slider max
    useEffect(() => {
        setError("")
        setSuccess("")
        let mounted = true;
        const fetchStats = async () => {
            try {
                const res = await fetch(`${API_URL}/promotions/stats`, {
                    method: 'GET',
                    credentials: 'include',
                });
                const body = await res.json();
                if (!res.ok) {
                    setError(`Could not fetch promotion stats: ${body.error}` || "Could not fetch promotion stats")
                    console.warn('Could not fetch promotion stats:', body.error || res.status);
                    return;
                }
                if (!mounted) return;
                setGlobalMaxes({
                    minSpending: Number(body.maxMinSpending ?? 0),
                    rate: Number(body.maxRate ?? 0),
                    points: Number(body.maxPoints ?? 0),
                });
            } catch (err) {
                setError(`Could not fetch promotion stats: ${body.error}` || "Could not fetch promotion stats")
                console.warn('Error fetching promotion stats:', err);
            }
        };
        fetchStats();
        return () => { mounted = false };
    }, []);

    // deleting promotion
    const performDeletion = async (rows) => {
        setError("")
        setSuccess("")
        if (!selectionEnabled || !rows || rows.length === 0) return;
        for (const r of rows) {
            try {
                const res = await fetch(`${API_URL}/promotions/${r.id}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                if (!res.ok && res.status !== 204) {
                    let body = {};
                    try { body = await res.json(); } catch {}
                    setError(`Could not complete deletion: ${body.error}` || "Could not complete deletion")
                    setPendingDelete(null);
                    return;
                }
            } catch (err) {
                setError(err.message || "Could not complete deletion")
            }
        }
        setQuery(q => ({ ...q }));
        setSelectedPromos([]);
        setPendingDelete(null);
        setSuccess("Successfully completed deletion")
    };

    const handleDeleteSelected = (rows) => {
        if (!selectionEnabled || !rows || rows.length === 0) return;
        setPendingDelete(rows);
    };

    // saving updated data
    const handleRowSaved = async (updatedRow) => { // called when an edit to the row is saved
        setError("")
        setSuccess("")

        // send PATCH request
        const res = await fetch(`${API_URL}/promotions/${updatedRow.id}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedRow)
        });

        const data = await res.json();
        if (!res.ok) {
            setError(`Could not update promotion: ${data.error}` || "Could not update promotion")
            console.warn('Could not update promotion:', data.error || res.status);
            throw new Error('Could not update promotion');
        }
        setSuccess("Successfully updated promotion")
    }

    // handle promotion creation
    const handleCreatePromotion = async(formData) => {
        setError("")
        setSuccess("")

        const payload = Object.entries({ // parse the form data
            name: formData.name,
            description: formData.description,
            type: formData.type,
            startTime: formData.startTime,
            endTime: formData.endTime,
            minSpending: formData.minSpending && Number(formData.minSpending),
            rate: formData.rate && Number(formData.rate),
            points: formData.points && Number(formData.points)
        }).reduce((acc, [key, value]) => {
            if (value !== "") acc[key] = value;   // remove empty strings
            return acc;
        }, {});

        // create promotion
        const res = await fetch(`${API_URL}/promotions`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json(); // response from endpoint
        
        if(!res.ok){ // handle error
            setError(`Could not create promotion: ${data.error}` || "Could not create promotion")
            console.log("Error:", data.error)
            return
        }

        setSuccess(`Successfully created promotion "${formData.name}"`)
    }

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

            {/* Create Promotion Modal */}
            <ModalForm
                open={open}
                setOpen={setOpen}
                formTitle="Create a Promotion"
                formDescription="Enter the new promotion's details"
                fields={getPromotionFields(role)}
                onSubmit={handleCreatePromotion}
                options={
                    {type: [{ label: 'Automatic', value: 'automatic' },
                    { label: 'One-time', value: 'one-time' }]}
                }
            />

            {/* Table */}
            {globalMaxes && (
                <DataTable
                    data={data}
                    columns={columns}
                    count={totalCount} // total number of rows
                    query={query} // the filters we are applying
                    setQuery={setQuery}
                    initialStableMax={globalMaxes}
                    selectionEnabled={selectionEnabled}
                    onSelectionChange={setSelectedPromos}
                    onDeleteSelected={handleDeleteSelected}
                    error={error}
                    success={success}
                    onRowSave={handleRowSaved} // for editing rows
                    onCreate={() => setOpen(true)}
                />
            )}

            {/* _ promotion(s) selected message */}
            {selectionEnabled && selectedPromos.length > 0 && (
                <div className="text-xs mt-2 text-gray-600">{selectedPromos.length} promotion(s) selected</div>
            )}
        </div>

    )
}