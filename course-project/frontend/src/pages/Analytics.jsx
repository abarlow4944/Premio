import { useState, useEffect } from "react";
import { InputDefault } from "@/components/ui/Input";
import { useUser } from "@/contexts/UserContexts";
import { Button } from "@/components/ui/button";
import Message from "@/components/Message";
import LineGraph from "@/components/LineGraph";
import BarGraph from "@/components/BarGraph";
import { ListItem } from "@/components/ui/ListItem";


export default function Analytics() {
    const { user } = useUser();
    const [userData, setUserData] = useState([]);
    const [promoData, setPromoData] = useState([]);
    const [eventData, setEventData] = useState([]);
    const [topUsersData, setTopUsersData] = useState([]);
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
        // retrieve promos
        const res = await fetch(`${API_URL}/promotions`, {
            method: "GET",
            credentials: "include"
        });

        const promos = await res.json(); // response from endpoint 

        if(!res.ok){ // handle error
            setError(`Could not retrieve promotion data: ${promos.error}` || "Could not retrieve promotion data")
            console.log("Error:", promos.error)
            return
        }

        var promoCountData = []
        for (const promo of promos.results){
            const promoId = promo.id
            const promoName = promo.name

            // retrieve transactions that use the promo
            const res = await fetch(`${API_URL}/transactions?promotionId=${promoId}`, {
                method: "GET",
                credentials: "include"
            });

            const transactions = await res.json(); // response from endpoint

            if(!res.ok){ // handle error
                setError(`Could not retrieve transaction data: ${transaction.error}` || "Could not retrieve transaction data")
                console.log("Error:", transactions.error)
                return
            }
            
            const count = transactions.count; // the number of transactions that use the promo
            promoCountData.push({"id":promoId, "name": promoName, "count": count}) // create data structure {promoId, name, count}
        }

        // get the top 5 promotions
        const top5 = promoCountData 
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        console.log(top5)
        return top5
    }

    // get event data for ranking
    const fetchEventData = async () => {
        // retrieve promos
        const res = await fetch(`${API_URL}/events`, {
            method: "GET",
            credentials: "include"
        });

        const events = await res.json(); // response from endpoint 
        console.log(events.results)

        if(!res.ok){ // handle error
            setError(`Could not retrieve event data: ${events.error}` || "Could not retrieve event data")
            console.log("Error:", events.error)
            return
        }

        var eventCountData = []
        for (const event of events.results){
            const eventId = event.id
            const eventName = event.name
            
            const guestCount = event.guests.length; // the number of guests in that event
            eventCountData.push({"id":eventId, "name": eventName, "guestCount": guestCount}) // create data structure {eventId, name, guestCount}
        }

        // get the top 5 promotions
        const top5 = eventCountData 
            .sort((a, b) => b.guestCount - a.guestCount)
            .slice(0, 5);

        return top5
    }

    // get top 5 users by points
    const fetchTopUsers = async () => {
        try {
            // retrieve users
            const res = await fetch(`${API_URL}/users?limit=1000`, {
                method: "GET",
                credentials: "include"
            });

            const users = await res.json(); // response from endpoint (users)
            
            if(!res.ok){ // handle error
                setError(`Could not retrieve user data: ${users.error}` || "Could not retrieve user data")
                return []
            }

            if (!users.results || users.results.length === 0) {
                return []
            }
            
            // get top 5 users by points
            const top5Users = users.results
                .sort((a, b) => b.points - a.points)
                .slice(0, 5)
                .map((u, index) => ({
                    name: u.name,
                    utorid: u.utorid,
                    points: u.points
                }));

            return top5Users
        } catch (err) {
            console.error("Error fetching top users:", err);
            setError("Failed to fetch top users data");
            return []
        }
    }

    useEffect(() => {
        async function loadData() {
            const userResult = await fetchUserData();
            setUserData(userResult);

            const promoResult = await fetchPromoData();
            setPromoData(promoResult);

            const eventResult = await fetchEventData();
            setEventData(eventResult);

            const topUsersResult = await fetchTopUsers();
            setTopUsersData(topUsersResult);
        }
        loadData();
    }, []);

    
    const promoRows = promoData.map((row, index) => (
        <ListItem
            key={row.id}
            name={`${index + 1}. ${row.name}`}
            subName={`Promotion id: ${row.id}`}
            value={row.count}
        />
    ));

    const eventRows = eventData.map((row, index) => (
        <ListItem
            key={row.id}
            name={`${index + 1}. ${row.name}`}
            subName={`Event id: ${row.id}`}
            value={row.guestCount}
        />
    ));

    return (
        <div className="p-10 w-full max-w-[1400px] mx-auto">

            {/* Page Title */}
            <h1 className="text-center text-3xl font-semibold text-flag-red-500 mt-[6vh] mb-10">
                Analytics
            </h1>

            {/* 3-column grid: chart spans 2 columns */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* left: line graph and bar graph */}
                <div className="xl:col-span-2 flex flex-col gap-8">
                    {/* line graph */}
                    <div className="rounded-xl bg-white border border-gray-200 shadow p-8 h-[420px] flex flex-col">
                        <h2 className="text-xl font-semibold text-space-indigo-600 text-center mb-4">
                            Registered Users Over Time
                        </h2>

                        <div className="flex-1 min-h-0"> 
                            <LineGraph
                                data={userData}
                                xAxis="date"
                                yAxis="count"
                                name="Users"
                                label="Registered Users"
                            />
                        </div>
                    </div>

                    {/* bar graph - top 5 users by points */}
                    <div className="rounded-xl bg-white border border-gray-200 shadow p-8 h-[420px] flex flex-col">
                        <h2 className="text-xl font-semibold text-space-indigo-600 text-center mb-4">
                            Top 5 Users by Points
                        </h2>

                        <div className="flex-1 min-h-0"> 
                            <BarGraph
                                data={topUsersData}
                                xAxis="utorid"
                                yAxis="points"
                                name="Points"
                            />
                        </div>
                    </div>
                </div>

                {/* right: Rankings */}
                <div className="flex flex-col gap-8">

                    {/* top promotions */}
                    <div className="rounded-xl bg-white border border-gray-200 shadow p-6 h-[420px] flex flex-col overflow-y-auto">
                        <h2 className="text-lg font-semibold text-space-indigo-600 text-center mb-4">
                            Top 5 Popular Promotions
                        </h2>

                        <div className="flex justify-between pb-2 border-b border-gray-300 text-sm font-bold text-strawberry-red-500">
                            <span>Promotion</span>
                            <span>Transactions</span>
                        </div>

                        <ul className="divide-y divide-gray-200">
                            {promoRows}
                        </ul>
                    </div>

                    {/* top events */}
                    <div className="rounded-xl bg-white border border-gray-200 shadow p-6 h-[420px] flex flex-col overflow-y-auto">
                        <h2 className="text-lg font-semibold text-space-indigo-600 text-center mb-4">
                            Top 5 Popular Events
                        </h2>

                        <div className="flex justify-between pb-2 border-b border-gray-300 text-sm font-bold text-strawberry-red-500">
                            <span>Event</span>
                            <span>Guests</span>
                        </div>

                        <ul className="divide-y divide-gray-200">
                            {eventRows}
                        </ul>
                    </div>

                </div>
            </div>

            {/* error and success messages */}
            {error && (
                <Message notCorner message={error} status="error" onClose={() => setError(null)} />
            )}
            {success && (
                <Message notCorner message={success} status="success" onClose={() => setSuccess(null)} />
            )}

        </div>
    )
}
