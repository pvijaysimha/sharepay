import LoadingSpinner from "../components/LoadingSpinner";

export default function Loading() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center">
                <LoadingSpinner size="lg" color="blue" />
                <p className="mt-4 text-gray-500 font-medium">Loading...</p>
            </div>
        </div>
    );
}
