import { useState, useEffect } from "react";
import { InputDefault } from "@/components/UI/Input";
import { useUser } from "@/contexts/UserContexts";
import { Button } from "@/components/UI/button";
import Message from "@/components/Message";
import LineGraph from "@/components/LineGraph/LineGraph";
import GridItem from "@/components/LineGraph/GridItem";

// user for line chart

export default function Analytics() {
    const { user } = useUser();

    const[error, setError] = useState("")
    const[success, setSuccess] = useState("")

    const API_URL = import.meta.env.VITE_API_URL; // API base URL 



    return (
        <div className="flex p-6 space-y-4 w-[50vw] mx-auto justify-center flex-col">

            {/* Page Title */}
            <div>
                <h1 className="text-center text-2xl font-semibold text-flag-red-500 mt-[10vh]">Analytics</h1>
            </div>

            {/* Container */}
            <div className="space-y-8">

                {/* Line Graph: users overtime */}
                <div className="space-y-4 rounded-md bg-platinum-50 border-2 border-platinum-100 shadow-md p-10">
                    <h2 className="text-lg font-semibold text-space-indigo-500">
                    Registered Users Over Time
                    </h2>

                    {/* Line Graph */}
                    <div className="flex min-h-screen flex-col items-center justify-center px-4 md:px-8 xl:px-10 py-44">
                        <div className="grid xl:grid-cols-3 lg:grid-cols-2 w-full gap-10 max-w-[1400px]">

                            <GridItem title="Line Chart">
                            <LineGraph />
                            </GridItem>
                        </div>
                    </div>


                </div>

                {/* Ranking: top 5 users */}
                <div className="space-y-4 rounded-md bg-platinum-50 border-2 border-platinum-100 shadow-md p-10">
                    <h2 className="text-lg font-semibold text-space-indigo-500">
                    Top 5 Users
                    </h2>
                    <h2 className="text-md font-semibold text-space-indigo-500">
                    In terms of points
                    </h2>
                </div>

                {/* Ranking: top 5 popular events */}
                <div>

                </div>

                {/* Ranking: top 5 popular promotions */}
                <div>

                </div>

                
            </div>

        {error && (
            <Message notCorner message={error} status="error" onClose={() => setError(null)}/>
        )}

        {success && (
            <Message notCorner message={success} status="success" onClose={() => setSuccess(null)}/>
        )}

        </div>
    )
}