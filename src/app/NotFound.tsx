const NotFound: React.FC = () => {
    return (
        <section className="bg-white dark:bg-gray-900 min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-800 dark:text-white">404</h1>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Page Not Found</p>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">The page you are looking for does not exist.</p>
                <a href="/" className="mt-6 inline-block px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700">Go Home</a>
            </div>
        </section>
    );
}

export default NotFound;