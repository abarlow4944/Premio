import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../../components/DataTable/DataTable";
import ModalView from "../../components/Modal/ModalView";
import EditableGuestList from "../../components/Modal/EditableGuestList";
import Message from "../../components/Message";
import { getEventColumns } from "@/components/DataTable/Columns/EventColumns";
import { useUser } from "@/contexts/UserContexts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { XMarkIcon } from "@heroicons/react/24/outline";


export default function MyEvents() {
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
    const [viewMode, setViewMode] = useState('organized'); // 'organized' or 'guest'
    const [userData, setUserData] = useState(null);
    const [hasOrganizedEvents, setHasOrganizedEvents] = useState(false);
    const [modalTitle, setModalTitle] = useState("Event Details");
    const [awardPointsModalOpen, setAwardPointsModalOpen] = useState(false);
    const [currentEventForAward, setCurrentEventForAward] = useState(null);
    const [selectedGuest, setSelectedGuest] = useState("");
    const [pointsAmount, setPointsAmount] = useState("");
    const [awardToAll, setAwardToAll] = useState(false); // New state for award all guests option
    const [manageGuestsModalOpen, setManageGuestsModalOpen] = useState(false);
    const [currentEventForGuests, setCurrentEventForGuests] = useState(null);
    const [users, setUsers] = useState([]);
    const columns = useMemo(() => getEventColumns(role, viewMode === 'organized'), [role, viewMode]);

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

    // Fetch users list for guest selection
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

        fetchUsers();
    }, [API_URL]);

    // Fetch user data to check if they have organized events
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await fetch(`${API_URL}/users/me`, {
                    method: "GET",
                    credentials: "include"
                });

                if (res.ok) {
                    const data = await res.json();
                    setUserData(data);
                    setHasOrganizedEvents((data.organizedEvents || []).length > 0);
                    // If no organized events, switch to guest view
                    if ((data.organizedEvents || []).length === 0) {
                        setViewMode('guest');
                    }
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };

        fetchUserData();
    }, [API_URL]);

    // call fetchData each time query changes
    useEffect(() => {
        // retrieve the user data by making a HTTP request
        try {
            const fetchData = async () => {
                let dataToUse = userData;
                
                if (!dataToUse) {
                    const res = await fetch(`${API_URL}/users/me`, {
                        method: "GET",
                        credentials: "include"
                    });

                    dataToUse = await res.json();
                    
                    if(!res.ok){ // handle error
                        setError(`Could not retrieve events data: ${dataToUse.error}` || "Could not retrieve events data")
                        console.log("Error:", dataToUse.error)
                        return
                    }
                }

                // Combine organized and guest events based on viewMode
                let allEvents = [];
                if (viewMode === 'organized') {
                    allEvents = dataToUse.organizedEvents || [];
                } else if (viewMode === 'guest') {
                    allEvents = dataToUse.guestEvents || [];
                }

                let results = allEvents;

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

                // Client-side filtering for name, location, etc.
                if (query.name) {
                    results = results.filter(event => 
                        event.name.toLowerCase().includes(query.name.toLowerCase())
                    );
                }
                if (query.location) {
                    results = results.filter(event => 
                        event.location.toLowerCase().includes(query.location.toLowerCase())
                    );
                }

                // Calculate the max total points from all results for the range slider
                const allMaxPoints = allEvents.length > 0 
                    ? Math.max(...allEvents.map(e => (e.pointsRemain ?? 0) + (e.pointsAwarded ?? 0)))
                    : 0;
                setMaxTotalPoints(allMaxPoints);

                // Apply pagination
                const pageNum = Number(query.page);
                const limitNum = Number(query.limit);
                const skip = (pageNum - 1) * limitNum;
                const paginatedResults = results.slice(skip, skip + limitNum);

                setData(paginatedResults)
                setTotalCount(results.length)
            }

            fetchData();
        }
        catch(error){
            console.log("Error:", error)
        }
    }, [query, API_URL, viewMode]);

    const handleDeleteSelected = (rows) => {
        if (!selectionEnabled || !rows || rows.length === 0) return;
        setPendingDelete(rows);
    };

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
            
            // For organizers viewing organized events, show only guest list
            if (viewMode === 'organized' && role === 'regular') {
                setModalTitle("Award Points to Guests");
                const guestList = (data.guests || []).map(g => g.name || g.utorid).join('\n');
                setModalText(guestList || 'No guests');
            } else {
                setModalTitle("Event Details");
                setModalText(JSON.stringify(data, null, 2));
            }

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

    // Award points handler for organizers
    const handleAwardPoints = (event) => {
        setError("");
        setSuccess("");
        setCurrentEventForAward(event);
        setSelectedGuest("");
        setPointsAmount("");
        setAwardToAll(false);
        setAwardPointsModalOpen(true);
    };

    // Manage guests handler for organizers
    const handleManageGuests = (event) => {
        setError("");
        setSuccess("");
        setCurrentEventForGuests(event);
        setManageGuestsModalOpen(true);
    };

    function closeGuestsModal(){
        setManageGuestsModalOpen(false);
        setCurrentEventForGuests(null);
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

    // Award points submission handler
    const handleAwardPointsSubmit = async () => {
        setError("");
        setSuccess("");

        // Validate inputs
        if (!pointsAmount) {
            setError("Please enter points amount");
            return;
        }

        if (awardToAll && (!currentEventForAward.guests || currentEventForAward.guests.length === 0)) {
            setError("No guests to award points to");
            return;
        }

        if (!awardToAll && !selectedGuest) {
            setError("Please select a guest or choose to award all guests");
            return;
        }

        const amount = Number(pointsAmount);
        if (!Number.isInteger(amount) || amount <= 0) {
            setError("Points must be a positive integer");
            return;
        }

        if (awardToAll) {
            const totalPoints = amount * (currentEventForAward.guests || []).length;
            if (totalPoints > (currentEventForAward.pointsRemain || 0)) {
                setError(`Cannot award ${totalPoints} points total (${amount} × ${currentEventForAward.guests.length} guests). Only ${currentEventForAward.pointsRemain} points remaining`);
                return;
            }
        } else {
            if (amount > (currentEventForAward.pointsRemain || 0)) {
                setError(`Cannot award more than ${currentEventForAward.pointsRemain} points remaining`);
                return;
            }
        }

        try {
            if (awardToAll) {
                // Award points to all guests
                const guestsToAward = currentEventForAward.guests || [];
                let successCount = 0;
                let failedCount = 0;

                for (const guest of guestsToAward) {
                    const res = await fetch(`${API_URL}/events/${currentEventForAward.id}/transactions`, {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            type: "event",
                            utorid: guest.utorid,
                            amount: amount
                        })
                    });

                    if (res.ok) {
                        successCount++;
                    } else {
                        failedCount++;
                    }
                }

                if (failedCount > 0) {
                    setSuccess(`Awarded ${amount} points to ${successCount} guests (${failedCount} failed)`);
                } else {
                    setSuccess(`Successfully awarded ${amount} points to all ${successCount} guests`);
                }
            } else {
                // Award points to single guest
                const res = await fetch(`${API_URL}/events/${currentEventForAward.id}/transactions`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        type: "event",
                        utorid: selectedGuest,
                        amount: amount
                    })
                });

                const responseData = await res.json();
                if (!res.ok) {
                    setError(`Could not award points: ${responseData.error}` || "Could not award points");
                    return;
                }

                setSuccess(`Successfully awarded ${amount} points to guest`);
            }

            setAwardPointsModalOpen(false);

            // Refresh event data to show updated pointsRemain
            const updatedEventRes = await fetch(`${API_URL}/events/${currentEventForAward.id}`, {
                method: 'GET',
                credentials: 'include'
            });

            if (updatedEventRes.ok) {
                const updatedEvent = await updatedEventRes.json();
                setData(prevData =>
                    prevData.map(row =>
                        row.id === currentEventForAward.id ? updatedEvent : row
                    )
                );
            }
        } catch (err) {
            console.error(err);
            setError("Failed to award points");
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
                    <h1 className="text-2xl font-semibold text-flag-red-500 mt-[10vh]">My Events</h1>
                    <p className="text-sm text-space-indigo-500">
                        {viewMode === 'organized' ? 'View and manage your organized events.' : 'View events you have RSVPed to.'}
                    </p>
                </div>
            </div>

            {/* View Mode Toggle - only show if user has organized events */}
            {hasOrganizedEvents && (
                <div className="flex justify-center gap-2 mb-4">
                    <button
                        onClick={() => setViewMode('organized')}
                        className={`px-4 py-2 rounded-md font-medium transition-colors hover:cursor-pointer ${
                            viewMode === 'organized'
                                ? 'bg-strawberry-red-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        Organizing
                    </button>
                    <button
                        onClick={() => setViewMode('guest')}
                        className={`px-4 py-2 rounded-md font-medium transition-colors hover:cursor-pointer ${
                            viewMode === 'guest'
                                ? 'bg-strawberry-red-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        Attending
                    </button>
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
                setQuery={setQuery}
                error={error}
                success={success}
                onViewRow={viewMode === 'organized' ? handleViewRow : undefined}
                onAwardPoints={viewMode === 'organized' ? handleAwardPoints : undefined}
                onManageGuests={viewMode === 'organized' ? handleManageGuests : undefined}
                onRowSave={viewMode === 'organized' ? handleRowSaved : undefined}
                enableEditing={viewMode === 'organized'}
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
                title={modalTitle}
            />

            {/* Award Points Modal */}
            {awardPointsModalOpen && currentEventForAward && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="award-points-title"
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                >
                    <div
                        className="absolute inset-0"
                        aria-hidden="true"
                        onClick={() => setAwardPointsModalOpen(false)}
                    />
                    <Card className="relative z-10 w-full max-w-md bg-white border border-gray-200 shadow-xl">
                        <CardHeader>
                            <CardTitle id="award-points-title">Award Points</CardTitle>
                            <CardDescription>
                                Event: {currentEventForAward.name}
                            </CardDescription>
                            <CardDescription>
                                Points Remaining: {currentEventForAward.pointsRemain || 0}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Award All Guests Toggle */}
                            <div className="flex items-center gap-3">
                                <input
                                    id="award-all-toggle"
                                    type="checkbox"
                                    checked={awardToAll}
                                    onChange={(e) => setAwardToAll(e.target.checked)}
                                    className="w-4 h-4 text-strawberry-red-500 rounded focus:ring-2 focus:ring-strawberry-red-500"
                                />
                                <label htmlFor="award-all-toggle" className="text-sm font-medium text-gray-700">
                                    Award all {(currentEventForAward.guests || []).length} guests
                                </label>
                            </div>

                            {/* Guest Selection */}
                            {!awardToAll && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Guest
                                    </label>
                                    <Select value={selectedGuest} onValueChange={setSelectedGuest} disabled={awardToAll}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Choose a guest" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(currentEventForAward.guests || []).map((guest) => (
                                                <SelectItem key={guest.id} value={guest.utorid}>
                                                    {guest.name || guest.utorid}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Points Amount */}
                            <div>
                                <label htmlFor="points-amount" className="block text-sm font-medium text-gray-700 mb-1">
                                    Points to Award {awardToAll && `(per guest)`}
                                </label>
                                <input
                                    id="points-amount"
                                    type="number"
                                    min="1"
                                    value={pointsAmount}
                                    onChange={(e) => setPointsAmount(e.target.value)}
                                    placeholder="Enter points amount"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                                {awardToAll && pointsAmount && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Total: {Number(pointsAmount) * (currentEventForAward.guests || []).length} points
                                    </p>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setAwardPointsModalOpen(false)}
                                className="rounded-md px-4 py-2 text-md font-medium border border-gray-300 text-gray-700 hover:cursor-pointer hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleAwardPointsSubmit}
                                className="rounded-md px-4 py-2 text-md font-medium bg-strawberry-red-500 text-white hover:cursor-pointer hover:bg-strawberry-red-600 transition"
                            >
                                Award Points
                            </button>
                        </CardFooter>
                    </Card>
                </div>
            )}

            {/* Manage Guests Modal */}
            {manageGuestsModalOpen && currentEventForGuests && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="manage-guests-title"
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                >
                    <div
                        className="absolute inset-0"
                        aria-hidden="true"
                        onClick={closeGuestsModal}
                    />
                    <Card className="relative z-10 w-full max-w-md bg-white border border-gray-200 shadow-xl max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div>
                                <CardTitle id="manage-guests-title">Manage Guests</CardTitle>
                                <CardDescription>
                                    Event: {currentEventForGuests.name}
                                </CardDescription>
                            </div>
                            <button
                                type="button"
                                onClick={closeGuestsModal}
                                className="text-gray-400 hover:text-gray-600 transition hover:cursor-pointer "
                                aria-label="Close dialog"
                            >
                                <XMarkIcon className="size-5" />
                            </button>
                        </div>
                        <CardContent className="p-6">
                            <EditableGuestList
                                eventId={currentEventForGuests.id}
                                guests={currentEventForGuests.guests || []}
                                isManager={true}
                                users={users}
                                organizers={currentEventForGuests.organizers || []}
                                canRemoveGuests={false}
                                onGuestAdded={(utorid, action) => {
                                    // Update the current event data with new guest
                                    const newGuest = users.find(u => u.utorid === utorid);
                                    if (newGuest) {
                                        setCurrentEventForGuests(prev => ({
                                            ...prev,
                                            guests: [...(prev.guests || []), newGuest]
                                        }));
                                        // Also update the data table
                                        setData(prevData =>
                                            prevData.map(row =>
                                                row.id === currentEventForGuests.id
                                                    ? { ...row, guests: [...(row.guests || []), newGuest] }
                                                    : row
                                            )
                                        );
                                    }
                                }}
                                onGuestRemoved={(utorid, action) => {
                                    // This won't be used for organizers as they can't remove guests
                                    // But keeping it for consistency
                                }}
                            />
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>

    )
}
