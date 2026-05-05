const AccesDenied: React.FC = () => {
    return (
        <section className="bg-white dark:bg-gray-900 min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-800 dark:text-white">401</h1>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Access Denied</p>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">You do not have permission to access this page.</p>
                <a href="/" className="mt-6 inline-block px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700">Go Home</a>
            </div>
        </section>
    );
}

export default AccesDenied;