export default function PromoBanner() {
    return (
        <div className="w-11/12 m-auto bg-gradient-to-r from-[#A855F7] to-[#37065f] text-white rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-lg mb-1">Ofertas Especiales</h3>
                    <p className="text-sm opacity-90">Ten el 20% de descuento en tu primer pedido!</p>
                    <button className="mt-3 bg-white text-[#A855F7] px-4 py-1 rounded-full text-sm font-medium">Compra Ahora</button>
                </div>
                <div className="text-4xl font-bold">
                    20%
                    <span className="block text-sm font-normal">OFF</span>
                </div>
            </div>
        </div>
    )
}

