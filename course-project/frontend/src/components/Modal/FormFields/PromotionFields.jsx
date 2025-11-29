export function getPromotionFields () {
    return [
        { name: "name", label: "Name", type: "text", required: true },
        { name: "description", label: "Description", type: "text", required: true },
        { name: "type", label: "Type", type: "select", required: true },
        { name: "startTime", label: "Start Time", type: "date", required: true },
        { name: "endTime", label: "End Time", type: "date", required: true },
        { name: "minSpending", label: "Minimum Spending", type: "number" },
        { name: "rate", label: "Rate", type: "number" },
        { name: "points", label: "Points", type: "number" }
    ]

}