import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function NotFound() {
    return <div className="mt-10 min-h-full flex flex-col justify-center items-center gap-1">
        <ExclamationTriangleIcon className="size-12 text-red-500"/>
        <h1 className="semi-bold text-4xl text-strawberry-red-500 mb-2">Oops!</h1>
        <h1 className="semi-bold text-2xl text-space-indigo-500">404</h1>
        <h1 className="semi-bold text-2xl text-space-indigo-500">Page Not Found</h1>
        <h1 className="semi-bold text-l text-lavender-grey-600">The page you are looking for does not exist.</h1>
    </div>;
}
