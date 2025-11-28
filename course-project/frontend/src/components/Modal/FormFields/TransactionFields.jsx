export const TransactionFieldSets = {
    cashier: {
        create: [
            { name: "utorid", label: "UTORid", required: true },
            { name: "type", label: "Type", required: true, value: "purchase", disabled: true },
            { name: "spent", label: "Price", type: "number", required: true },
            { name: "promotionIds", label: "Promotion ID", multiNumber: true },
            { name: "remark", label: "Remark" }
        ]
    },
    manager: {
        create: [
            { name: "utorid", label: "UTORid", required: true },
            { name: "type", label: "Type", required: true, value: "purchase", disabled: true },
            { name: "spent", label: "Price", type: "number", required: true },
            { name: "promotionIds", label: "Promotion ID", multiNumber: true },
            { name: "remark", label: "Remark" }
        ],
        adjust: [
            { name: "utorid", label: "UTORid", required: true },
            { name: "type", label: "Type", required: true, value: "adjustment", disabled: true },
            { name: "amount", label: "Points", type: "number", required: true },
            { name: "relatedId", label: "Transaction ID", type: "number", required: true },
            { name: "promotionIds", label: "Promotion ID", multiNumber: true },
            { name: "remark", label: "Remark" }
        ]
    },
    superuser: {
        create: [
            { name: "utorid", label: "UTORid", required: true },
            { name: "type", label: "Type", required: true, value: "purchase", disabled: true },
            { name: "spent", label: "Price", type: "number", required: true },
            { name: "promotionIds", label: "Promotion ID", multiNumber: true },
            { name: "remark", label: "Remark" }
        ],
        adjust: [
            { name: "utorid", label: "UTORid", required: true },
            { name: "type", label: "Type", required: true, value: "adjustment", disabled: true },
            { name: "amount", label: "Points", type: "number", required: true },
            { name: "relatedId", label: "Transaction ID", type: "number", required: true },
            { name: "promotionIds", label: "Promotion ID", multiNumber: true },
            { name: "remark", label: "Remark" }
        ]
    },
    regular: {
        redeem: [
            { name: "type", label: "Purpose", required: true, value: "redemption", disabled: true },
            { name: "amount", label: "Points", type: "number", required: true },
            { name: "remark", label: "Remark" },            
        ]
    }
}

export function getTransactionFields(role, mode){
    console.log(TransactionFieldSets[role]?.[mode] ?? [])
    return TransactionFieldSets[role]?.[mode] ?? [];
}