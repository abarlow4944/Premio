import { CheckCircleIcon, XCircleIcon} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react';

export default function Message({status, message, onClose}){
    const [fadeOut, setFadeOut] = useState(false);
    var colour
    var icon

    // colour and message depends on status
    if(status === "success"){
        colour = "green"
        icon = CheckCircleIcon
    }
    else{
        colour = "red"
        icon = XCircleIcon
    }

    const colours = {
    green: {
        text: "text-green-600",
        bg: "bg-green-50",
        border: "border-green-200",
    },
    red: {
        text: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200",
    },
    };

    // Auto disappear after 2 seconds
    useEffect(() => {
        // start fade-out slightly before removal
        const timer1 = setTimeout(() => setFadeOut(true), 1700);
        const timer2 = setTimeout(() => onClose?.(), 2000); // set message to null once faded out

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, []);

    return (
        <p className={`mt-4 text-sm font-medium ${colours[colour].text} ${colours[colour].bg} border ${colours[colour].border} rounded-md py-2 px-4 text-center ${fadeOut ? "animate-fade-out" : ""}`}>
            {message}
        </p>
    )
}
