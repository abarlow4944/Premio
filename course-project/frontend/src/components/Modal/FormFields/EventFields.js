export const EventFieldSets = {
    manager: {
        create: [
            { name: "name", label: "Event Name", required: true },
            { name: "description", label: "Description", required: true },
            { name: "location", label: "Location", required: true },
            { name: "startTime", label: "Start Time", type: "datetime-local", required: true },
            { name: "endTime", label: "End Time", type: "datetime-local", required: true },
            { name: "capacity", label: "Capacity", type: "number", required: true },
            { name: "points", label: "Points Available", type: "number", required: true },
            { name: "organizerUtorid", label: "Organizer", type: "select", required: true },
        ]
    },
    superuser: {
        create: [
            { name: "name", label: "Event Name", required: true },
            { name: "description", label: "Description", required: true },
            { name: "location", label: "Location", required: true },
            { name: "startTime", label: "Start Time", type: "datetime-local", required: true },
            { name: "endTime", label: "End Time", type: "datetime-local", required: true },
            { name: "capacity", label: "Capacity", type: "number", required: true},
            { name: "points", label: "Points Available", type: "number", required: true },
            { name: "organizerUtorid", label: "Organizer", type: "select", required: false },
        ]
    }
}

export function getEventFields(role, mode){
    console.log(EventFieldSets[role]?.[mode] ?? [])
    return EventFieldSets[role]?.[mode] ?? [];
}
