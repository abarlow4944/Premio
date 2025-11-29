import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function Forbidden() {
    return <div className="mt-10 min-h-full flex flex-col justify-center items-center gap-1">
        <ExclamationTriangleIcon className="size-12 text-red-500"/>
        <h1 className="semi-bold text-4xl text-strawberry-red-500 mb-2">Oops!</h1>
        <h1 className="semi-bold text-2xl text-space-indigo-500">403</h1>
        <h1 className="semi-bold text-2xl text-space-indigo-500">Forbidden</h1>
        <h1 className="semi-bold text-l text-lavender-grey-500">You do not have clearance to view this page.</h1>
    </div>;
}
