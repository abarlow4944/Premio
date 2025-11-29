export const TransactionFieldSets = {
    cashier: {
        create: [
            { name: "utorid", label: "UTORid", type: "text", required: true },
            { name: "type", label: "Type", type: "text", required: true, value: "purchase", readOnly: true },
            { name: "spent", label: "Price", type: "price", required: true },
            { name: "promotionIds", type: "number", label: "Promotion ID", multiNumber: true },
            { name: "remark", label: "Remark", type: "text"}
        ]
    },
    manager: {
        create: [
            { name: "utorid", label: "UTORid", required: true, type: "text" },
            { name: "type", label: "Type", required: true, value: "purchase", readOnly: true, type: "text" },
            { name: "spent", label: "Price", type: "price", required: true },
            { name: "promotionIds", label: "Promotion ID", multiNumber: true, type: "number" },
            { name: "remark", label: "Remark", type: "text" }
        ],
        adjust: [
            { name: "utorid", label: "UTORid", required: true, type: "text" },
            { name: "type", label: "Type", required: true, value: "adjustment", readOnly: true, type: "text" },
            { name: "amount", label: "Points", type: "number", required: true, min:0 },
            { name: "relatedId", label: "Transaction ID", type: "number", required: true },
            { name: "promotionIds", label: "Promotion ID", multiNumber: true, type: "number" },
            { name: "remark", label: "Remark", type: "text" }
        ]
    },
    superuser: {
        create: [
            { name: "utorid", label: "UTORid", required: true, type: "text" },
            { name: "type", label: "Type", required: true, value: "purchase", readOnly: true, type: "text" },
            { name: "spent", label: "Price", type: "price", required: true },
            { name: "promotionIds", label: "Promotion ID", multiNumber: true, type: "number" },
            { name: "remark", label: "Remark", type: "text" }
        ],
        adjust: [
            { name: "utorid", label: "UTORid", required: true, type: "text" },
            { name: "type", label: "Type", required: true, value: "adjustment", readOnly: true, type: "text" },
            { name: "amount", label: "Points", type: "number", required: true },
            { name: "relatedId", label: "Transaction ID", type: "number", required: true },
            { name: "promotionIds", label: "Promotion ID", multiNumber: true, type: "number" },
            { name: "remark", label: "Remark", type: "text" }
        ]
    },
    regular: {
        redeem: [
            { name: "type", label: "Purpose", required: true, value: "redemption", readOnly: true, type: "text" },
            { name: "amount", label: "Points", type: "number", required: true, min:0 },
            { name: "remark", label: "Remark", type: "text" },            
        ]
    }
}

export function getTransactionFields(role, mode){
    console.log(TransactionFieldSets[role]?.[mode] ?? [])
    return TransactionFieldSets[role]?.[mode] ?? [];
}