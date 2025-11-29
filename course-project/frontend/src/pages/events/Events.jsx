import { useState, useEffect, useMemo } from "react";
import DataTable from "../../components/DataTable/DataTable";
import ModalView from "../../components/Modal/ModalView";
import { getEventColumns } from "@/components/DataTable/Columns/EventColumns";
import { useUser } from "@/contexts/UserContexts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../components/ui/card";


export default function Events() {
    const API_URL = import.meta.env.VITE_API_URL; // API base URL 
    const { user, visualRole } = useUser();

    const role = visualRole || user?.role;

    const [data, setData] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const selectionEnabled = role === 'manager' || role === 'superuser';
    const [selectedEvents, setSelectedEvents] = useState([]);
    const [pendingDelete, setPendingDelete] = useState(null);
    const[error, setError] = useState("")
    const[success, setSuccess] = useState("")
    const[isModalOpen, setIsModalOpen] = useState(false);
    const[modalText, setModalText] = useState("");
    const columns = useMemo(() => getEventColumns(role), [role]);

    const [query, setQuery] = useState({ // the filters we will be applying (params)
        name: "",
        location: "",
        started: "",
        ended: "",
        showFull: false,
        published: null,
        sortBy: "",
        sortOrder: "asc",
        page: 1,
        limit: 10
    })

    // call fetchData each time query changes
    useEffect(() => {
        setError("")
        setSuccess("")
        // retrieve the user data by making a HTTP request
        try {
            const fetchData = async () => {
                const params = new URLSearchParams();

                // add necessary params to the URL
                if(query.name) params.append("name", query.name);
                if(query.description) params.append("description", query.description);
                if(query.location) params.append("location", query.location);
                if(query.startTime) params.append("startTime", query.startTime);
                if(query.endTime) params.append("endTime", query.endTime);
                if(query.capacity) params.append("capacity", query.capacity);
                if(query.points) params.append("points", query.points);
                if(query.published) params.append("published", query.published);
                if(query.sortBy) params.append("sortBy", query.sortBy);
                if(query.sortOrder) params.append("sortOrder", query.sortOrder);
                if(query.sortBy) params.append("sortBy", query.sortBy);
                if(query.sortOrder) params.append("sortOrder", query.sortOrder);

                // regular users can only see published events
                if(role === "regular") params.append("published", true)

                params.append("page", query.page)
                params.append("limit", query.limit)

                // retrieve users
                const res = await fetch(`${API_URL}/events?${params}`, {
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

    // deleting an event
    const performDeletion = async (rows) => {
        setError("")
        setSuccess("")
        if (!selectionEnabled || !rows || rows.length === 0) return;
        for (const r of rows) {
            try {
                const res = await fetch(`${API_URL}/events/${r.id}`, {
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
        setSelectedEvents([]);
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
        const res = await fetch(`${API_URL}/events/${updatedRow.id}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedRow)
        });

        const data = await res.json();
        if (!res.ok) {
            setError(`Could not update event: ${data.error}` || "Could not update event")
            console.warn('Could not update event:', data.error || res.status);
            throw new Error('Could not update event');
        }
        setSuccess("Successfully updated event")
    }

    // view row
    const handleViewRow = async (row) => {
        setError("");
        setSuccess("");
        setModalText("Retrieving...");
        setIsModalOpen(true);

        try {
            const res = await fetch(`${API_URL}/events/${row.id}`, {
                method: 'GET',
                credentials: 'include'
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                setError(`Could not get event: ${errData.error || res.statusText}`);
                setModalText("Error loading event.");
                return;
            }

            const data = await res.json();
            setModalText(JSON.stringify(data, null, 2));

        } catch (err) {
            console.error(err);
            setError("Failed to retrieve event");
            setModalText("Error loading event.");
        }
    };

    function closeModal(){
        setIsModalOpen(false);
        setModalText("");
    }

    return (
        <div className="p-6 space-y-4">
            {/* Page Title */}
            <div className="mb-[5vh]">
                <h1 className="text-center text-2xl font-semibold text-flag-red-500 mt-[10vh]">Events</h1>
                <p className="text-center text-sm text-space-indigo-500">
                View and manage all events in the system.
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
                                You are about to delete {pendingDelete.length} event{pendingDelete.length > 1 ? 's' : ''}. This action cannot be undone. Events that have been published will not be affected.
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

            {/* Table */}
            <DataTable
                data={data}
                columns={columns}
                count={totalCount} // total number of rows
                query={query} // the filters we are applying
                selectionEnabled={selectionEnabled}
                onSelectionChange={setSelectedEvents}
                onDeleteSelected={handleDeleteSelected}
                setQuery={setQuery}
                error={error}
                success={success}
                onRowSave={handleRowSaved} // for editing rows
                onViewRow={handleViewRow}
                enableEditing={selectionEnabled}
            />
        
            {/* _ event(s) selected message */}
            {selectionEnabled && selectedEvents.length > 0 && (
                <div className="text-xs mt-2 text-gray-600">{selectedEvents.length} event(s) selected</div>
            )}

            {/* View Event */}
            <ModalView
                open={isModalOpen}
                onClose={closeModal}
                text={modalText}
                title="Event Details"
            />
        </div>

    )
}