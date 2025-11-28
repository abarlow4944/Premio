import { useState, useEffect } from "react";
import { useUser } from '../../contexts/UserContexts';
import { Button } from "../../components/ui/button";
import {getTransactionFields} from "../../components/Modal/FormFields/TransactionFields";
import { Card } from "@/components/UI/Card";
import Message from "@/components/Message";
import { CardContent } from "@/components/UI/Card";
import { Typography } from "@mui/material";
import { InputDefault } from "@/components/UI/Input";

export default function TransactionPage() {
    
    const API_URL = import.meta.env.VITE_API_URL;
    const { role } = useUser();
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const fields = getTransactionFields(role, "create")

    
    const dataFields = Object.fromEntries(
        fields.map(f => [f.name, ""])
    );

    const [formData, setFormData] = useState(dataFields);

    useEffect(() => {
        const initData = Object.fromEntries(fields.map(f => [f.name, f.value ?? ""]));
        setFormData(initData);
    }, [fields]);

    const handleChange = (e) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    // handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("")
        setSuccess("")
        let promotionIdsArray = [];

        if (formData.promotionIds){ // extract numbers from promotionIds input and turn it into an array
            promotionIdsArray = formData.promotionIds.match(/\d+/g).map(Number);
        }

        try {
            const res = await fetch(`${API_URL}/transactions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({"utorid": formData.utorid, "type": "purchase", "spent": Number(formData.spent), "promotionIds": promotionIdsArray, "remark": formData.remark})
            })

            const result = await res.json();

            if (!res.ok) {
                setError(`Could not create transaction: ${result.error}` || "Could not create transaction")
                console.log("Error creating transaction:", result.error);
                return;
            }
        } 
        catch (err) {
            setError(`Could not create transaction: ${err}` || "Could not create transaction")
            console.log("Network error:", err);
            return
        }

        setSuccess("Successfully created transaction")
    }

    
    return (
        <div className="p-6 space-y-4">
            {/* Page Title */}
            <div className="mb-[10vh]">
                <h1 className="text-center text-2xl font-semibold text-flag-red-500 mt-[10vh]">
                    Transactions
                </h1>
                <p className="text-center text-sm text-space-indigo-500">
                    Create any transactions in the system.
                </p>
            </div>
            <div className="flex flex-col justify-center -mt-4">
                {error && (
                    <Message message={error} status="error"/>
                )}
        
                {success && (
                    <Message message={success} status="success"/>
                )}
            </div>

            {/* Transactions */}
            <Card sx={{ borderRadius: 3, boxShadow: 6 }} className="w-[40vw] mx-auto -mt-10 rounded-md bg-platinum-50 border-2 border-platinum-100 shadow-md p-10">
                <CardContent sx={{ p: 3, position: "relative" }}>


                    {/* Form title and description */}
                    <h2 className="text-center text-lg font-semibold text-flag-red-500">
                        Enter Transaction Details
                    </h2>

                    <h2 className="text-center text-sm text-space-indigo-500 mb-5">
                        Enter transaction details to create a purchase transaction.
                    </h2>
                    
                    
                    <form onSubmit={handleSubmit}>
                        {fields.map(f => (
                            <div key={f.name} style={{ marginBottom: 16 }}>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    {f.label}{f.required ? " *" : ""}
                                </Typography>

                                <InputDefault
                                    type={f.type || "text"}
                                    name={f.name}
                                    value={formData[f.name]}
                                    onChange={handleChange}
                                    required={f.required}
                                />

                            </div>
                        ))}

                        <Button variant="default" type="submit" fullWidth sx={{ mt: 1 }} >
                            Submit
                        </Button>
                    </form>

                </CardContent>
            </Card>

        </div>
    );
}
