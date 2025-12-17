"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/utils/functions/cn"

// Tipos para el banner general
export type BannerItem = {
    id: string
    backgroundColor?: string
    gradient?: string
    alt?: string
    link?: string
    content: {
        title?: string
        subtitle?: string
        description?: string
        buttonText?: string
        buttonLink?: string
        position?: "left" | "center" | "right"
        textColor?: string
        buttonColor?: string
        buttonTextColor?: string
    }
}

interface SimpleBannerProps {
    items: BannerItem[]
    autoPlay?: boolean
    interval?: number
    showControls?: boolean
    showIndicators?: boolean
    height?: string
    aspectRatio?: string
    className?: string
}

export default function SimpleBanner({
    items = [
        {
            id: "default",
            backgroundColor: "bg-gradient-to-r from-blue-500 to-purple-600",
            content: {
                title: "Título del Banner",
                subtitle: "Subtítulo opcional",
                description: "Descripción breve del contenido sin necesidad de imágenes",
                buttonText: "Ver más",
                position: "center",
                textColor: "text-white",
                buttonColor: "bg-white",
                buttonTextColor: "text-gray-900",
            }
        },
    ],
    autoPlay = true,
    interval = 5000,
    showControls = true,
    showIndicators = true,
    height = "h-64 sm:h-80",
    aspectRatio = "aspect-video",
    className = "",
}: SimpleBannerProps) {
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
        if (!autoPlay || items.length <= 1) return

        const interval_id = setInterval(() => {
            nextSlide()
        }, interval)

        return () => clearInterval(interval_id)
    }, [autoPlay, interval, items.length])

    // Renderizar contenido
    const renderContent = (item: BannerItem) => {
        const { title, subtitle, description, buttonText, buttonLink, position = "center", textColor = "text-white", buttonColor = "bg-white", buttonTextColor = "text-gray-900" } = item.content

        const positionClasses = {
            left: "text-left items-start",
            center: "text-center items-center",
            right: "text-right items-end"
        }

        return (
            <div className={cn(
                "w-full h-full flex flex-col justify-center p-6 sm:p-8",
                positionClasses[position]
            )}>
                {title && (
                    <span className={cn("text-2xl sm:text-4xl font-bold mb-2", textColor)}>
                        {title}
                    </span>
                )}
                {subtitle && (
                    <span className={cn("text-lg sm:text-xl font-medium mb-3", textColor)}>
                        {subtitle}
                    </span>
                )}
                {description && (
                    <p className={cn("text-base sm:text-lg mb-4 max-w-2xl", textColor)}>
                        {description}
                    </p>
                )}
                {buttonText && (
                    <a
                        href={buttonLink || "#"}
                        className={cn(
                            "inline-block px-6 py-2 rounded-lg font-medium transition-colors duration-200",
                            buttonColor,
                            buttonTextColor,
                            "hover:opacity-90"
                        )}
                    >
                        {buttonText}
                    </a>
                )}
            </div>
        )
    }

    return (
        <div className={cn("relative w-full m-auto mb-6", className)}>
            {/* Carrusel */}
            <div className={cn("overflow-hidden rounded-xl relative w-full", height, aspectRatio)}>
                <div
                    className="flex transition-transform duration-500 ease-in-out h-full"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {items.map((item, index) => (
                        <div
                            key={item.id}
                            className={cn(
                                "w-full flex-shrink-0 relative h-full p-8",
                                item.backgroundColor,
                                item.gradient
                            )}
                        >
                            {renderContent(item)}
                        </div>
                    ))}
                </div>

                {/* Controles de navegación */}
                {showControls && items.length > 1 && (
                    <>
                        <button
                            onClick={prevSlide}
                            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 rounded-full p-2 text-white z-20 transition-colors duration-200"
                            aria-label="Slide anterior"
                        >
                            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                        <button
                            onClick={nextSlide}
                            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 rounded-full p-2 text-white z-20 transition-colors duration-200"
                            aria-label="Slide siguiente"
                        >
                            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    </>
                )}
            </div>

            {/* Indicadores */}
            {showIndicators && items.length > 1 && (
                <div className="flex justify-center mt-4 gap-2">
                    {items.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={cn(
                                "w-3 h-3 rounded-full transition-all duration-300",
                                index === currentIndex
                                    ? "bg-gray-800 scale-110"
                                    : "bg-gray-300 hover:bg-gray-400"
                            )}
                            aria-label={`Ir al slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}