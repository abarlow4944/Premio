export default function EmailConfirmation() {
    return (
        <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
            <img
                alt="Logo"
                src="./public/logo.png"
                className="mx-auto h-25 w-auto"
            />
            <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-flag-red-500">
                Email Sent!
            </h2>
            <p className="mt-6 text-sm text-center text-gray-700">We just sent you an email to allow you to reset your password. The attached reset link will be valid for the next hour.</p>
            </div>


        </div>
    )
}