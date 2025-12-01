import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

export default function Forbidden() {
    const navigate = useNavigate();

    return <div className="mt-10 min-h-full flex flex-col justify-center items-center gap-2">
        <ExclamationTriangleIcon className="size-12 text-red-500"/>
        <h1 className="semi-bold text-4xl text-strawberry-red-500 mb-2">Oops!</h1>
        <h1 className="semi-bold text-2xl text-space-indigo-500">403</h1>
        <h1 className="semi-bold text-2xl text-space-indigo-500">Forbidden</h1>
        <h1 className="semi-bold text-l text-lavender-grey-500">You do not have clearance to view this page.</h1>
        <button onClick={() => navigate('/home')} className="rounded-md bg-strawberry-red-500 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-strawberry-red-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-strawberry-red-500 hover:cursor-pointer">
            Go Home
        </button>
    </div>;
}
