export default function PromoBanner() {
    return (
        <div className="w-11/12 m-auto bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-lg mb-1">Special Offers</h3>
                    <p className="text-sm opacity-90">Get 20% off on your first order!</p>
                    <button className="mt-3 bg-white text-[#7C3AED] px-4 py-1 rounded-full text-sm font-medium">Shop Now</button>
                </div>
                <div className="text-4xl font-bold">
                    20%
                    <span className="block text-sm font-normal">OFF</span>
                </div>
            </div>
        </div>
    )
}

