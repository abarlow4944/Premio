import { useState, useEffect } from "react";
import { InputDefault } from "@/components/UI/Input";
import { useUser } from "@/contexts/UserContexts";
import { Button } from "@/components/UI/button";
import Message from "@/components/Message";
import LineGraph from "@/components/LineGraph";


export default function Analytics() {
    const { user } = useUser();
    const [userData, setUserData] = useState([]);
    const[error, setError] = useState("")
    const[success, setSuccess] = useState("")

    const API_URL = import.meta.env.VITE_API_URL; // API base URL 

    // format date
    function convertIsoToET(isoString) {
        const date = new Date(isoString);
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour12: false, // Use 24-hour format
            timeZone: 'America/New_York'
        }

        const formatter = new Intl.DateTimeFormat('en-US', options);
        const parts = formatter.formatToParts(date);

        const year = parts.find(p => p.type === 'year').value;
        const month = parts.find(p => p.type === 'month').value;
        const day = parts.find(p => p.type === 'day').value;

        return `${year}-${month}-${day}`;
    };

    // get user data for line graph
    const fetchUserData = async () => {
        // retrieve users
        const res = await fetch(`${API_URL}/users`, {
            method: "GET",
            credentials: "include"
        });

        const users = await res.json(); // response from endpoint (users)
        
        if(!res.ok){ // handle error
            setError(`Could not retrieve user data: ${data.error}` || "Could not retrieve user data")
            console.log("Error:", data.error)
            return
        }

        const dates = users.results.map(u => convertIsoToET(u.createdAt)) // get all of the dates

        const dailyCounts = {}; // count how many users were created on each date
        dates.forEach(d => {
            if (dailyCounts[d]){ // increment the count
                dailyCounts[d] ++;
            }
            else{ // initialize if this is the first occurance of the date
                dailyCounts[d] = 1
            }
        });

        const sortedDates = Object.keys(dailyCounts).sort(); // sort the dates

        let cumulative = 0 // how many users are in the system so far
        const timeline = sortedDates.map(d => { // create the data structure { date : # users }
            cumulative += dailyCounts[d];
            return { date: d, count: cumulative };
        });

        return timeline
    }

    // get promo data for ranking
    const fetchPromoData = async () => {
        // retrieve users
        const res = await fetch(`${API_URL}/promotions`, {
            method: "GET",
            credentials: "include"
        });

        const users = await res.json(); // response from endpoint (users)
        
        if(!res.ok){ // handle error
            setError(`Could not retrieve promotion data: ${data.error}` || "Could not retrieve promotion data")
            console.log("Error:", data.error)
            return
        }


    }

    useEffect(() => {
        async function loadData() {
            const result = await fetchUserData();
            setUserData(result);
        }
        loadData();
    }, []);

    return (
        <div className="flex p-6 space-y-4 w-[70vw] mx-auto justify-center flex-col">
            {/* Page Title */}
            <div>
                <h1 className="text-center text-2xl font-semibold text-flag-red-500 mt-[10vh]">Analytics</h1>
            </div>

            {/* Line Graph: users overtime */}
            <div className="space-y-4 rounded-md bg-platinum-50 border-2 border-platinum-100 shadow-md p-10 w-[70vw]">
                <div className="flex flex-col justify-center gap-2 align-center">
                    <h2 className="text-xl font-semibold text-space-indigo-500 text-center">
                        Registered Users Over Time
                    </h2>

                    {/* Line Graph */}
                    <LineGraph data={userData} xAxis="date" yAxis="count" name="Users" label="Registered Users" />
                </div>
            </div>

            {/* Ranking: top 5 users */}
            <div className="space-y-4 rounded-md bg-platinum-50 border-2 border-platinum-100 shadow-md p-10 w-[70vw]">
                <div className="flex flex-col justify-center gap-1">
                    <h2 className="text-xl font-semibold text-space-indigo-500 text-center">
                        Top 5 Users
                    </h2>
                    <p className="text-md font-semibold text-lavender-grey-500 text-center">
                        In terms of points
                    </p>
                </div>
                

                {/* Line Graph */}
                <div className="grid xl:grid-cols-3 lg:grid-cols-2 w-full gap-10 ">

                    {/* <GridItem title="Line Chart"> */}
                    <LineGraph data={userData} xAxis="date" yAxis="count" xAxisName="Date" yAxisName="Users" label="Registered Users" />
                    {/* </GridItem> */}
                </div>
            </div>

            {/* Ranking: top 5 popular events */}
            <div>

            </div>

            {/* Ranking: top 5 popular promotions */}
            <div>

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