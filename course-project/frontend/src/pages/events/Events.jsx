import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../../components/DataTable/DataTable";
import ModalView from "../../components/Modal/ModalView";
import ModalForm from "../../components/Modal/ModalForm";
import { getEventColumns } from "@/components/DataTable/Columns/EventColumns";
import { getEventFields } from "@/components/Modal/FormFields/EventFields";
import { useUser } from "@/contexts/UserContexts";
import Message from "../../components/Message";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../components/ui/card";


export default function Events() {
    const API_URL = import.meta.env.VITE_API_URL; // API base URL 
    const { user, visualRole } = useUser();
    const navigate = useNavigate();

    const role = visualRole || user?.role;

    const [data, setData] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [maxTotalPoints, setMaxTotalPoints] = useState(0);
    const selectionEnabled = role === 'manager' || role === 'superuser';
    const [selectedEvents, setSelectedEvents] = useState([]);
    const [pendingDelete, setPendingDelete] = useState(null);
    const[error, setError] = useState("")
    const[success, setSuccess] = useState("")
    const[isModalOpen, setIsModalOpen] = useState(false);
    const[modalText, setModalText] = useState("");
    const [open, setOpen] = useState(false);
    const [modalMode, setModalMode] = useState(null);
    const [users, setUsers] = useState([]);
    const [userOrganizedEventIds, setUserOrganizedEventIds] = useState(new Set());
    const [userGuestEventIds, setUserGuestEventIds] = useState(new Set());
    
    // Fetch user's organized and guest events to determine RSVP eligibility
    useEffect(() => {
        const fetchUserEvents = async () => {
            try {
                const res = await fetch(`${API_URL}/users/me`, {
                    method: "GET",
                    credentials: "include"
                });

                if (res.ok) {
                    const userData = await res.json();
                    const organizedIds = new Set((userData.organizedEvents || []).map(e => e.id));
                    const guestIds = new Set((userData.guestEvents || []).map(e => e.id));
                    setUserOrganizedEventIds(organizedIds);
                    setUserGuestEventIds(guestIds);
                }
            } catch (error) {
                console.error("Error fetching user events:", error);
            }
        };

        if (role === 'regular') {
            fetchUserEvents();
        }
    }, [API_URL, role]);
    
    // Check if an event can be RSVPed to
    const canRSVP = (event) => {
        return !userOrganizedEventIds.has(event.id) && !userGuestEventIds.has(event.id);
    };

    // RSVP handler for regular users
    const handleRSVP = async (event) => {
        // Check if user is already an organizer or guest
        if (!canRSVP(event)) {
            if (userOrganizedEventIds.has(event.id)) {
                setError("You are an organizer of this event");
            } else {
                setError("You are already attending this event");
            }
            return;
        }

        setError("");
        setSuccess("");
        
        try {
            const res = await fetch(`${API_URL}/events/${event.id}/guests/me`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json"
                }
            });

            const responseData = await res.json();
            
            if (!res.ok) {
                setError(`Could not RSVP to event: ${responseData.error}` || "Could not RSVP to event");
                console.warn('Could not RSVP:', responseData.error || res.status);
                return;
            }

            setSuccess(`Successfully RSVPed to ${event.name}`);
            // Update the guest events set
            setUserGuestEventIds(prev => new Set([...prev, event.id]));
            
        } catch (err) {
            console.error(err);
            setError("Failed to RSVP to event");
        }
    };

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

    // Clear success/error messages when role changes
    useEffect(() => {
        setError("");
        setSuccess("");
    }, [role]);

    // Fetch users list for organizer dropdown
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch(`${API_URL}/users?limit=1000`, {
                    method: "GET",
                    credentials: "include"
                });

                const data = await res.json();
                if (res.ok && data.results) {
                    setUsers(data.results);
                }
            } catch (err) {
                console.error("Error fetching users:", err);
            }
        };

        if (selectionEnabled) {
            fetchUsers();
        }
    }, [selectionEnabled, API_URL]);

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
                
                // Only send sortBy to backend if it's not 'points' (which is client-side only)
                if(query.sortBy && query.sortBy !== 'points') params.append("sortBy", query.sortBy);
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

                let results = data.results;

                // Client-side sorting for 'points' field (computed field: pointsRemain + pointsAwarded)
                if (query.sortBy === 'points') {
                    results = [...results].sort((a, b) => {
                        const aTotal = (a.pointsRemain ?? 0) + (a.pointsAwarded ?? 0);
                        const bTotal = (b.pointsRemain ?? 0) + (b.pointsAwarded ?? 0);
                        const diff = aTotal - bTotal;
                        return query.sortOrder === 'desc' ? -diff : diff;
                    });
                }

                // Client-side filtering for 'points' range (computed field: pointsRemain + pointsAwarded)
                if (query.pointsMin !== undefined || query.pointsMax !== undefined) {
                    const minPoints = query.pointsMin !== undefined ? Number(query.pointsMin) : -Infinity;
                    const maxPoints = query.pointsMax !== undefined ? Number(query.pointsMax) : Infinity;
                    results = results.filter(event => {
                        const total = (event.pointsRemain ?? 0) + (event.pointsAwarded ?? 0);
                        return total >= minPoints && total <= maxPoints;
                    });
                }

                // Filter out ended events for regular users
                if (role === "regular") {
                    const now = new Date();
                    results = results.filter(event => {
                        const eventEnd = new Date(event.endTime);
                        return eventEnd > now;
                    });
                }

                // Calculate the max total points from all results (before filtering) for the range slider
                const allMaxPoints = data.results.length > 0 
                    ? Math.max(...data.results.map(e => (e.pointsRemain ?? 0) + (e.pointsAwarded ?? 0)))
                    : 0;
                setMaxTotalPoints(allMaxPoints);

                setData(results)
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

        const responseData = await res.json();
        if (!res.ok) {
            setError(`Could not update event: ${responseData.error}` || "Could not update event")
            console.warn('Could not update event:', responseData.error || res.status);
            throw new Error('Could not update event');
        }

        // Update the local data with the server response
        setData(prevData => 
            prevData.map(row => 
                row.id === updatedRow.id ? { ...row, ...responseData } : row
            )
        );
        
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

    const handleCreateEvent = async (formData) => {
        setError("");
        setSuccess("");
        
        try {
            // Transform datetime-local values to ISO format
            const payload = {
                name: formData.name,
                description: formData.description,
                location: formData.location,
                startTime: new Date(formData.startTime).toISOString(),
                endTime: new Date(formData.endTime).toISOString(),
                capacity: formData.capacity ? parseInt(formData.capacity) : null,
                points: parseInt(formData.points)
            };

            const res = await fetch(`${API_URL}/events`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const responseData = await res.json();
            
            if (!res.ok) {
                setError(`Could not create event: ${responseData.error}` || "Could not create event");
                console.warn('Could not create event:', responseData.error || res.status);
                return;
            }

            // If organizer was selected, add them to the event
            if (formData.organizerUtorid) {
                const addOrganizerRes = await fetch(`${API_URL}/events/${responseData.id}/organizers`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ utorid: formData.organizerUtorid })
                });

                if (!addOrganizerRes.ok) {
                    console.warn('Could not add organizer to event');
                }
            }

            setSuccess("Event created successfully");
            setOpen(false);
            setModalMode(null);
            
            // Refresh the data
            setQuery(q => ({ ...q }));
            
        } catch (err) {
            console.error(err);
            setError("Failed to create event");
        }
    };

    return (
        <div className="p-6 space-y-4">
            {/* Error/Success Messages */}
            {error && (
                <div className="fixed top-[10vh] right-6 z-50 max-w-xs">
                    <Message 
                        status="error" 
                        message={error}
                        onClose={() => setError("")}
                    />
                </div>
            )}
            {success && (
                <div className="fixed top-[10vh] right-6 z-50 max-w-xs">
                    <Message 
                        status="success" 
                        message={success}
                        onClose={() => setSuccess("")}
                    />
                </div>
            )}
            
            {/* Page Title */}
            <div className="mb-[5vh]">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold text-flag-red-500 mt-[10vh]">Events</h1>
                    <p className="text-sm text-space-indigo-500">
                        {role === 'regular' ? 'View and RSVP to events.' : 'View and manage all events in the system.'}
                    </p>
                </div>
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
                initialStableMax={{ points: maxTotalPoints }}
                selectionEnabled={selectionEnabled}
                onSelectionChange={setSelectedEvents}
                onDeleteSelected={handleDeleteSelected}
                onCreate={selectionEnabled ? () => { setModalMode("create"); setOpen(true); } : undefined}
                setQuery={setQuery}
                error={error}
                success={success}
                onRowSave={handleRowSaved} // for editing rows
                onViewRow={handleViewRow}
                onRSVP={(visualRole === 'regular' || (visualRole === null && role === 'regular')) ? handleRSVP : undefined}
                canRSVP={(visualRole === 'regular' || (visualRole === null && role === 'regular')) ? canRSVP : undefined}
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

            {/* Create Event Modal */}
            {modalMode && (
                <ModalForm
                    open={open}
                    setOpen={setOpen}
                    modalType="events"
                    fields={getEventFields(role, modalMode)}
                    onSubmit={handleCreateEvent}
                    options={{
                        organizerUtorid: users.map(u => ({
                            value: u.utorid,
                            label: `${u.name} (${u.utorid})`
                        }))
                    }}
                />
            )}
        </div>

    )
}