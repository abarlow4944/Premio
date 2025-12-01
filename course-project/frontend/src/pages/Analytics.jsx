import { useState, useEffect } from "react";
import { InputDefault } from "@/components/UI/Input";
import { useUser } from "@/contexts/UserContexts";
import { Button } from "@/components/UI/button";
import Message from "@/components/Message";
import LineGraph from "@/components/LineGraph";
import { ListItem } from "@/components/UI/ListItem";


export default function Analytics() {
    const { user } = useUser();
    const [userData, setUserData] = useState([]);
    const [promoData, setPromoData] = useState([]);
    const [eventData, setEventData] = useState([]);
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
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        console.log(top5)
        return top5
    }

    useEffect(() => {
        async function loadData() {
            const userResult = await fetchUserData();
            setUserData(userResult);

            const promoResult = await fetchPromoData();
            setPromoData(promoResult);

            const eventResult = await fetchEventData();
            setEventData(eventResult);
        }
        loadData();
    }, []);

    
    const promoRows = promoData.map(row => (
        <ListItem
            key={row.id}
            name={row.name}
            subName={`Promotion id: ${row.id}`}
            value={row.count}
        />
    ));

    const eventRows = eventData.map(row => (
        <ListItem
            key={row.id}
            name={row.name}
            subName={`Event id: ${row.id}`}
            value={row.guestCount}
        />
    ));

    return (
        <div className="flex p-6 space-y-4 w-[70vw] mx-auto justify-center flex-col">
            {/* Page Title */}
            <div>
                <h1 className="text-center text-2xl font-semibold text-flag-red-500 mt-[10vh]">Analytics</h1>
            </div>

            {/* Line Graph: users overtime */}
            <div className="space-y-4 rounded-md bg-platinum-50 border-2 border-platinum-100 shadow-md p-10 w-[70vw]">
                <div className="flex flex-col justify-center gap-2 items-center">
                    <h2 className="text-xl font-semibold text-space-indigo-500 text-center">
                        Registered Users Over Time
                    </h2>

                    {/* Line Graph */}
                    <LineGraph data={userData} xAxis="date" yAxis="count" name="Users" label="Registered Users" />
                </div>
            </div>

            {/* Ranking: top 5 promotions */}
            <div className="space-y-4 rounded-md bg-platinum-50 border-2 border-platinum-100 shadow-md p-10 ">
                <div className="flex flex-col justify-center gap-1 items-center">
                    <h2 className="text-xl font-semibold text-space-indigo-500 text-center">
                        Top 5 Popular Promotions
                    </h2>

                    {/* Header row */}
                    <div className="flex items-center justify-between px-1 pb-2 border-b border-gray-300">
                        <span className="text-m font-bold text-strawberry-red-500">Promotion</span>
                        <span className="text-m font-bold text-strawberry-red-500">Transactions</span>
                    </div>

                    {/* Ranking */}
                    <ul className="max-w-md divide-y divide-default">
                        {promoRows}   
                    </ul>
                </div>
            </div>

            {/* Ranking: top 5  events */}
            <div className="space-y-4 rounded-md bg-platinum-50 border-2 border-platinum-100 shadow-md p-10 ">
                <div className="flex flex-col justify-center gap-1 items-center">
                    <h2 className="text-xl font-semibold text-space-indigo-500 text-center">
                        Top 5 Popular Events
                    </h2>

                    {/* Header row */}
                    <div className="flex items-center justify-between px-1 pb-2 border-b border-gray-300">
                        <span className="text-m font-bold text-strawberry-red-500">Event</span>
                        <span className="text-m font-bold text-strawberry-red-500">Guests</span>
                    </div>

                    {/* Ranking */}
                    <ul className="max-w-md divide-y divide-default">
                        {eventRows}   
                    </ul>
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