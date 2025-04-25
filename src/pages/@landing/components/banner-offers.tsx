"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/utils/functions/cn"

// Tipos para las diferentes configuraciones
export type PromoItem = {
    id: string
    type: "app" | "product" | "combo" | "default"
    title: string
    description: string
    buttonText: string
    buttonLink?: string
    discount?: string | number
    image?: string
    bgColor?: string
    textColor?: string
    buttonColor?: string
    buttonTextColor?: string
}

interface PromoBannerProps {
    items?: PromoItem[]
    autoPlay?: boolean
    interval?: number
    showControls?: boolean
    showIndicators?: boolean
}

export default function PromoBanner({
    items = [
        {
            id: "default",
            type: "default",
            title: "Ofertas Especiales",
            description: "Ten el 20% de descuento en tu primer pedido!",
            buttonText: "Compra Ahora",
            discount: "20%",
            bgColor: "bg-gradient-to-r from-[#A855F7] to-[#37065f]",
            textColor: "text-white",
            buttonColor: "bg-white",
            buttonTextColor: "text-[#A855F7]",
        },
    ],
    autoPlay = true,
    interval = 5000,
    showControls = true,
    showIndicators = true,
}: PromoBannerProps) {
    const [currentIndex, setCurrentIndex] = useState(0)

    // Función para avanzar al siguiente slide
    const nextSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex === items.length - 1 ? 0 : prevIndex + 1))
    }

    // Función para retroceder al slide anterior
    const prevSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex === 0 ? items.length - 1 : prevIndex - 1))
    }

    // Función para ir a un slide específico
    const goToSlide = (index: number) => {
        setCurrentIndex(index)
    }

    // Autoplay
    useEffect(() => {
        if (!autoPlay) return

        const interval_id = setInterval(() => {
            nextSlide()
        }, interval)

        return () => clearInterval(interval_id)
    }, [autoPlay, interval])

    // Renderizar el contenido según el tipo
    const renderContent = (item: PromoItem) => {
        switch (item.type) {
            case "app":
                return (
                    <div className="flex flex-col sm:flex-row items-center sm:justify-between">
                        <div className="w-full sm:flex-1 text-center sm:text-left mb-3 sm:mb-0">
                            <h3 className={`font-bold text-lg mb-1 ${item.textColor}`}>{item.title}</h3>
                            <p className={`text-sm opacity-90 ${item.textColor}`}>{item.description}</p>
                            <button
                                className={`mt-3 ${item.buttonColor} ${item.buttonTextColor} px-4 py-1 rounded-full text-sm font-medium`}
                            >
                                {item.buttonText}
                            </button>
                        </div>
                        {item.image && (
                            <div className="w-20 h-20 sm:w-24 sm:h-24 sm:ml-4">
                                <img
                                    src={item.image || "/placeholder.svg"}
                                    alt="App feature"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        )}
                    </div>
                )

            case "product":
                return (
                    <div className="flex flex-col sm:flex-row items-center sm:justify-between">
                        <div className="flex flex-col sm:flex-row items-center w-full">
                            {item.image && (
                                <div className="w-20 h-20 sm:w-24 sm:h-24 sm:mr-4 mb-3 sm:mb-0">
                                    <img src={item.image || "/placeholder.svg"} alt="Product" className="w-full h-full object-contain" />
                                </div>
                            )}
                            <div className="w-full sm:flex-1 text-center sm:text-left">
                                <h3 className={`font-bold text-lg mb-1 ${item.textColor}`}>{item.title}</h3>
                                <p className={`text-sm opacity-90 ${item.textColor}`}>{item.description}</p>
                                <button
                                    className={`mt-3 ${item.buttonColor} ${item.buttonTextColor} px-4 py-1 rounded-full text-sm font-medium`}
                                >
                                    {item.buttonText}
                                </button>
                            </div>
                        </div>
                        {item.discount && (
                            <div className={`text-4xl font-bold ${item.textColor} mt-3 sm:mt-0`}>
                                {item.discount}
                                <span className="block text-sm font-normal">OFF</span>
                            </div>
                        )}
                    </div>
                )

            case "combo":
                return (
                    <div className="flex flex-col sm:flex-row items-center sm:justify-between">
                        <div className="w-full sm:flex-1 text-center sm:text-left mb-3 sm:mb-0">
                            <h3 className={`font-bold text-lg mb-1 ${item.textColor}`}>{item.title}</h3>
                            <p className={`text-sm opacity-90 ${item.textColor}`}>{item.description}</p>
                            <button
                                className={`mt-3 ${item.buttonColor} ${item.buttonTextColor} px-4 py-1 rounded-full text-sm font-medium`}
                            >
                                {item.buttonText}
                            </button>
                        </div>
                        {item.discount && (
                            <div className={`text-4xl font-bold ${item.textColor}`}>
                                {item.discount}
                                <span className="block text-sm font-normal text-center">OFF</span>
                            </div>
                        )}
                    </div>
                )

            case "default":
            default:
                return (
                    <div className="flex flex-col sm:flex-row items-center sm:justify-between">
                        <div className="w-full sm:w-auto text-center sm:text-left mb-3 sm:mb-0">
                            <h3 className={`font-bold text-lg mb-1 ${item.textColor}`}>{item.title}</h3>
                            <p className={`text-sm opacity-90 ${item.textColor}`}>{item.description}</p>
                            <button
                                className={`mt-3 ${item.buttonColor} ${item.buttonTextColor} px-4 py-1 rounded-full text-sm font-medium`}
                            >
                                {item.buttonText}
                            </button>
                        </div>
                        {item.discount && (
                            <div className={`text-4xl font-bold ${item.textColor}`}>
                                {item.discount}
                                <span className="block text-sm font-normal text-center">OFF</span>
                            </div>
                        )}
                    </div>
                )
        }
    }

    return (
        <div className="relative w-11/12 m-auto mb-6">
            {/* Carrusel */}
            <div className="overflow-hidden rounded-xl relative ">
                <div
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {items.map((item, index) => (
                        <div
                            key={index}
                            className={cn("w-full flex-shrink-0 px-10", item.bgColor || "bg-gradient-to-r from-[#A855F7] to-[#37065f]")}
                        >
                            <div className="p-3 sm:p-4">{renderContent(item)}</div>
                        </div>
                    ))}
                </div>

                {/* Controles de navegación */}
                {showControls && items.length > 1 && (
                    <>
                        <button
                            onClick={prevSlide}
                            className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 rounded-full p-1.5 text-white z-10"
                            aria-label="Anterior"
                        >
                            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button
                            onClick={nextSlide}
                            className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 rounded-full p-1.5 text-white z-10"
                            aria-label="Siguiente"
                        >
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </>
                )}
            </div>

            {/* Indicadores */}
            {showIndicators && items.length > 1 && (
                <div className="flex justify-center mt-2 gap-1.5">
                    {items.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`w-2.5 h-2.5 rounded-full ${index === currentIndex ? "bg-[#A855F7]" : "bg-gray-300"}`}
                            aria-label={`Ir al slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
