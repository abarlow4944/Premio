export function getRegisterUserFields () {
    return [
        { name: "utorid", label: "UTORid", type: "text", required: true },
        { name: "name", label: "Name", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true }
    ]

}