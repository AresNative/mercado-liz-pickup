import React, { useState, useRef } from "react";
import { IonRouterLink } from "@ionic/react";
import {
    ChevronLeft,
    ChevronRight,
    Utensils,
    Shirt,
    Smartphone,
    Gift,
    Home,
    Tv,
    Baby,
    Scissors,
} from "lucide-react";

interface Category {
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
}

const CategorySlider: React.FC = () => {
    const sliderRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState<boolean>(false);
    const [showRightArrow, setShowRightArrow] = useState<boolean>(true);

    const categories: Category[] = [
        { name: "Food", icon: Utensils, href: "/categories/food" },
        { name: "Fashion", icon: Shirt, href: "/categories/fashion" },
        { name: "Electronics", icon: Smartphone, href: "/categories/electronics" },
        { name: "Gifts", icon: Gift, href: "/categories/gifts" },
        { name: "Home", icon: Home, href: "/categories/home" },
        { name: "Appliances", icon: Tv, href: "/categories/appliances" },
        { name: "Baby", icon: Baby, href: "/categories/baby" },
        { name: "Services", icon: Scissors, href: "/categories/services" },
    ];

    const scroll = (direction: "left" | "right") => {
        const container = sliderRef.current;
        if (container) {
            const scrollAmount = direction === "left" ? -200 : 200;
            container.scrollBy({ left: scrollAmount, behavior: "smooth" });

            setTimeout(() => {
                setShowLeftArrow(container.scrollLeft > 0);
                setShowRightArrow(
                    container.scrollLeft <
                    container.scrollWidth - container.clientWidth - 10
                );
            }, 300);
        }
    };

    return (
        <section className="flex items-center relative py-2">
            {showLeftArrow && (
                <button
                    onClick={() => scroll("left")}
                    className="absolute left-5 top-1/2 transform -translate-y-1/2 z-10 bg-slate-100 rounded-full shadow-md p-1"
                >
                    <ChevronLeft className="h-5 w-5 text-gray-500" />
                </button>
            )}

            <div
                ref={sliderRef}
                className="flex overflow-x-auto scrollbar-hide gap-4 px-2 py-2"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                onScroll={(e) => {
                    const target = e.target as HTMLDivElement;
                    setShowLeftArrow(target.scrollLeft > 0);
                    setShowRightArrow(
                        target.scrollLeft < target.scrollWidth - target.clientWidth - 10
                    );
                }}
            >
                {categories.map((category) => (
                    <IonRouterLink
                        key={category.name}
                        routerLink={category.href}
                        className="flex flex-col items-center min-w-[80px]"
                    >
                        <div className="p-2 min-w-16 flex flex-col rounded-lg bg-[#F5F3FF] items-center justify-center mb-2">
                            <category.icon className="h-6 w-6 text-[#8B5CF6]" />
                            <span className="text-xs">{category.name}</span>
                        </div>
                    </IonRouterLink>
                ))}
            </div>

            {showRightArrow && (
                <button
                    onClick={() => scroll("right")}
                    className="absolute right-5 top-1/2 transform -translate-y-1/2 z-10 bg-slate-100 rounded-full shadow-md p-1"
                >
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                </button>
            )}
        </section>
    );
};

export default CategorySlider;