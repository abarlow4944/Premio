import { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export default function EditableGuestList({ 
    eventId, 
    guests = [], 
    isManager = false, 
    users = [],
    organizers = [],
    onGuestRemoved,
    onGuestAdded,
    canRemoveGuests = true
}) {
    const [isAdding, setIsAdding] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [localGuests, setLocalGuests] = useState(guests);
    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        setLocalGuests(guests);
    }, [guests]);

    // Get list of users that aren't already guests and aren't organizers
    const availableUsers = users.filter(
        user => !localGuests.some(g => g.utorid === user.utorid) &&
                !organizers.some(o => o.utorid === user.utorid)
    );

    const handleAddGuest = async () => {
        if (!selectedUser) {
            console.error("No user selected");
            return;
        }

        setLoading(true);
        setError(null);

        const postUrl = `${API_URL}/events/${eventId}/guests`;
        console.log("Adding guest with URL:", postUrl, { eventId, selectedUser });

        try {
            const res = await fetch(postUrl, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ utorid: selectedUser.utorid })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                console.error("Failed to add guest. Response:", errData);
                setError(errData.error || "Failed to add guest");
                setLoading(false);
                return;
            }

            const data = await res.json();
            console.log("Guest added successfully:", data);
            
            // Add the guest to the local list immediately
            setLocalGuests(prev => [...prev, selectedUser]);
            
            onGuestAdded?.(selectedUser.utorid, 'added');
            setSelectedUser(null);
            setIsAdding(false);
            setLoading(false);
        } catch (err) {
            console.error("Error adding guest:", err);
            setError("Failed to add guest");
            setLoading(false);
        }
    };

    const handleRemoveGuest = async (utorid) => {
        // Find the user id by looking up the user in the users array
        const targetUser = users.find(u => u.utorid === utorid);
        if (!targetUser || !targetUser.id) {
            console.error("Target user not found or has no id", { utorid, targetUser, users });
            setError("User not found");
            return;
        }

        const userId = Number(targetUser.id);
        if (isNaN(userId)) {
            console.error("User ID is not a valid number", { targetUserId: targetUser.id, userId });
            setError("Invalid user ID");
            return;
        }

        setLoading(true);
        setError(null);

        const deleteUrl = `${API_URL}/events/${eventId}/guests/${userId}`;
        console.log("Deleting guest with URL:", deleteUrl, { eventId, userId, targetUser });

        try {
            const res = await fetch(deleteUrl, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                console.error("Failed to remove guest. Response:", errData);
                setError(errData.error || "Failed to remove guest");
                setLoading(false);
                return;
            }

            // Remove the guest from the local list immediately
            setLocalGuests(prev => prev.filter(g => g.utorid !== utorid));
            
            onGuestRemoved?.(utorid, 'removed');
        } catch (err) {
            console.error("Error removing guest:", err);
            setError("Failed to remove guest");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Guest List Display */}
            <div>
                
                {localGuests.length === 0 ? (
                    <p className="text-sm text-gray-500">No guests</p>
                ) : (
                    <ul className="space-y-2">
                        {localGuests.map((guest) => (
                            <li
                                key={guest.utorid}
                                className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md hover:bg-gray-100 transition"
                            >
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-700">{guest.name}</p>
                                    <p className="text-xs text-gray-500">{guest.utorid}</p>
                                </div>
                                {isManager && canRemoveGuests && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveGuest(guest.utorid)}
                                        disabled={loading}
                                        className="ml-2 p-1 text-red-500 hover:cursor-pointer hover:bg-red-50 rounded-md transition disabled:opacity-50"
                                        aria-label="Remove guest"
                                    >
                                        <XMarkIcon className="size-4" />
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Add Guest Section for Managers */}
            {isManager && (
                <div className="border-t border-gray-200 pt-4">
                    {!isAdding ? (
                        <button
                            type="button"
                            onClick={() => setIsAdding(true)}
                            disabled={availableUsers.length === 0 || loading}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-strawberry-red-500 hover:bg-strawberry-red-600 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <PlusIcon className="size-4" />
                            Add Guest
                        </button>
                    ) : (
                        <div className="space-y-3 p-3 bg-gray-50 rounded-md">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                    Select User
                                </label>
                                <Select value={selectedUser?.utorid || ''} onValueChange={(value) => {
                                    const user = availableUsers.find(u => u.utorid === value);
                                    setSelectedUser(user);
                                }}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a user" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableUsers.length === 0 ? (
                                            <div className="px-2 py-1.5 text-xs text-gray-500">
                                                No available users
                                            </div>
                                        ) : (
                                            availableUsers.map(user => (
                                                <SelectItem key={user.id} value={user.utorid}>
                                                    {user.name} ({user.utorid})
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {error && (
                                <p className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                                    {error}
                                </p>
                            )}

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleAddGuest}
                                    disabled={!selectedUser || loading}
                                    className="flex-1 px-3 py-1 text-sm font-medium text-white bg-strawberry-red-500 hover:bg-strawberry-red-600 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Adding...' : 'Add'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAdding(false);
                                        setSelectedUser(null);
                                        setError(null);
                                    }}
                                    disabled={loading}
                                    className="flex-1 px-3 py-1 text-sm hover:cursor-pointer font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-md transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
