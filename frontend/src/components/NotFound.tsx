import { Link } from "react-router";

const NotFound = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white">
            <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-24 h-24 bg-red-500 rounded-lg mb-6">
                    <span className="text-white text-4xl font-bold">404</span>
                </div>
                <h1 className="text-3xl font-semibold text-gray-800 mb-4">Page Not Found</h1>
                <p className="text-gray-600 mb-8 text-center max-w-xs">
                    Let's redirect you to our homepage
                </p>
                <Link
                    to="/"
                    className="px-8 py-4 border-2 border-red-500 text-red-500 rounded-lg shadow-md hover:bg-red-100 transition duration-200"
                >
                    Back to Home
                </Link>
            </div>
        </div>
    );
};

export default NotFound;