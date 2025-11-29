export function getPromotionFields () {
    return [
        { name: "name", label: "Name", type: "text", required: true },
        { name: "description", label: "Description", type: "text", required: true },
        { name: "type", label: "Type", type: "select", options:[
            { label: 'Automatic', value: 'automatic' },
            { label: 'One-time', value: 'one-time' },
        ], required: true },
        { name: "startTime", label: "Start Time", type: "date", required: true },
        { name: "endTime", label: "End Time", type: "date", required: true },
        { name: "minSpending", label: "Minimum Spending", type: "price", min:0 },
        { name: "rate", label: "Rate", type: "number", min:0},
        { name: "points", label: "Points", type: "number", min:0 }
    ]

}