import { useState, useEffect } from "react";
import { useUser } from '../../contexts/UserContexts';
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Message from "@/components/Message";
import { CardContent, Card } from "@/components/ui/card";
import { Typography } from "@mui/material";
import { InputDefault } from "@/components/ui/Input";

export default function TransactionPage() {
    
    const API_URL = import.meta.env.VITE_API_URL;
    const { role } = useUser();
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [transactionType, setTransactionType] = useState("purchase")
    const [pendingRedemptions, setPendingRedemptions] = useState([])
    const [selectedRedemptionId, setSelectedRedemptionId] = useState("")

    const [formData, setFormData] = useState({
        utorid: "",
        type: "purchase",
        spent: "",
        promotionIds: "",
        remark: ""
    });

    // Fetch pending redemptions when component mounts or when utorid changes
    useEffect(() => {
        if (transactionType === "redemption" && formData.utorid) {
            const fetchPendingRedemptions = async () => {
                try {
                    const res = await fetch(`${API_URL}/users/lookup/${encodeURIComponent(formData.utorid)}/redemptions`, {
                        credentials: 'include'
                    });
                    
                    if (!res.ok) {
                        const data = await res.json();
                        console.error('Error fetching redemptions:', data);
                        return;
                    }
                    
                    const data = await res.json();
                    setPendingRedemptions(data.results || []);
                } catch (err) {
                    console.error('Error fetching pending redemptions:', err);
                }
            };
            
            fetchPendingRedemptions();
        } else {
            setPendingRedemptions([]);
        }
    }, [transactionType, formData.utorid, API_URL]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleTypeChange = (value) => {
        setTransactionType(value);
        setFormData(prev => ({...prev, type: value}));
        setSelectedRedemptionId("");
        setPendingRedemptions([]);
    };

    // handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("")
        setSuccess("")
        
        if (transactionType === "purchase") {
            let promotionIdsArray = [];

            if (formData.promotionIds){ 
                promotionIdsArray = formData.promotionIds.match(/\d+/g).map(Number);
            }

            try {
                const res = await fetch(`${API_URL}/transactions`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        "utorid": formData.utorid, 
                        "type": "purchase", 
                        "spent": Number(formData.spent), 
                        "promotionIds": promotionIdsArray, 
                        "remark": formData.remark
                    })
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

            setSuccess("Successfully created purchase transaction")
        } else if (transactionType === "redemption") {
            if (!selectedRedemptionId) {
                setError("Please select a redemption request to process");
                return;
            }

            try {
                const res = await fetch(`${API_URL}/transactions/${selectedRedemptionId}/processed`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ processed: true })
                })

                const result = await res.json();

                if (!res.ok) {
                    setError(`Could not process redemption: ${result.error}` || "Could not process redemption")
                    console.log("Error processing redemption:", result.error);
                    return;
                }

                setSuccess("Successfully processed redemption")
                setSelectedRedemptionId("");
                
                // Refetch pending redemptions to update the list
                const params = new URLSearchParams();
                params.append('utorid', formData.utorid);
                const redemptionsRes = await fetch(`${API_URL}/users/lookup/${encodeURIComponent(formData.utorid)}/redemptions`, {
                    credentials: 'include'
                });
                
                if (redemptionsRes.ok) {
                    const redemptionsData = await redemptionsRes.json();
                    setPendingRedemptions(redemptionsData.results || []);
                }
            }
            catch (err) {
                setError(`Could not process redemption: ${err}` || "Could not process redemption")
                console.log("Network error:", err);
                return
            }
        }

        // Clear form after successful submission
        setFormData({
            utorid: "",
            type: "purchase",
            spent: "",
            promotionIds: "",
            remark: ""
        });
        setTransactionType("purchase");
    }

    
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
            <div className="mb-[2vh]">
                <h1 className="text-center text-2xl font-semibold text-flag-red-500 mt-[10vh]">
                    Process Transactions
                </h1>
                <p className="text-center text-sm text-space-indigo-500">
                    Process purchase and redemption transactions in the system.
                </p>
            </div>


            {/* Create transactions form*/}
            <Card sx={{ borderRadius: 3, boxShadow: 6 }} className="w-[40vw] mx-auto rounded-md bg-platinum-50 border-2 border-platinum-100 shadow-md p-10">
                <CardContent sx={{ p: 3, position: "relative" }}>


                    {/* Form title and description */}
                    <h2 className="text-center text-lg font-semibold text-flag-red-500">
                        Enter Transaction Details
                    </h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Transaction Type Select */}
                        <div>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                Transaction Type *
                            </Typography>
                            <Select value={transactionType} onValueChange={handleTypeChange}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select transaction type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="purchase">Purchase</SelectItem>
                                    <SelectItem value="redemption">Redemption</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* User UTORID - always shown */}
                        <div>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                UTORid *
                            </Typography>
                            <InputDefault
                                type="text"
                                name="utorid"
                                value={formData.utorid}
                                onChange={handleChange}
                                required
                                placeholder="Enter user's UTORid"
                            />
                        </div>

                        {/* Purchase-specific fields */}
                        {transactionType === "purchase" && (
                            <>
                                <div>
                                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                                        Amount Spent*
                                    </Typography>
                                    <InputDefault
                                        type="number"
                                        name="spent"
                                        value={formData.spent}
                                        onChange={handleChange}
                                        required
                                        placeholder="Enter amount spent"
                                    />
                                </div>

                                <div>
                                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                                        Promotion IDs
                                    </Typography>
                                    <InputDefault
                                        type="text"
                                        name="promotionIds"
                                        value={formData.promotionIds}
                                        onChange={handleChange}
                                        placeholder="Enter promotion IDs (comma or space separated)"
                                    />
                                </div>

                                <div>
                                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                                        Remark
                                    </Typography>
                                    <InputDefault
                                        type="text"
                                        name="remark"
                                        value={formData.remark}
                                        onChange={handleChange}
                                        placeholder="Optional remark"
                                    />
                                </div>
                            </>
                        )}

                        {/* Redemption-specific fields */}
                        {transactionType === "redemption" && (
                            <>
                                <div>
                                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                                        Pending Redemption Request *
                                    </Typography>
                                    {formData.utorid ? (
                                        pendingRedemptions.length > 0 ? (
                                            <Select value={selectedRedemptionId} onValueChange={setSelectedRedemptionId}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select a redemption request" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {pendingRedemptions.map((redemption) => (
                                                        <SelectItem key={redemption.id} value={String(redemption.id)}>
                                                            {redemption.amount} points - {redemption.remark || 'No remark'}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <p className="text-sm text-gray-500">No pending redemption requests for this user</p>
                                        )
                                    ) : (
                                        <p className="text-sm text-gray-500">Enter a UTORid to see pending redemptions</p>
                                    )}
                                </div>
                            </>
                        )}

                        <Button variant="default" type="submit" className="w-full mt-6">
                            Submit
                        </Button>
                    </form>

                </CardContent>
            </Card>

        </div>
    );
}
