import React, { useState, useRef } from "react";
import {
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import categorias from "@/utils/constants/categorias";
import { clearFilters, dataFilter } from "@/hooks/reducers/filter";
import { useAppDispatch } from "@/hooks/selector";

const CategorySlider: React.FC = () => {
    const sliderRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState<boolean>(false);
    const [showRightArrow, setShowRightArrow] = useState<boolean>(true);

    const dispatch = useAppDispatch();
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
                {categorias.map((category, key) => (
                    <button
                        key={key}
                        onClick={() => {
                            if (category.name) dispatch(dataFilter({ key: "key", value: category.name, type: "multi" }));
                            if (!category.name) dispatch(clearFilters());
                        }}
                        className="flex flex-col items-center w-full h-full" // Altura 100% del grid
                    >
                        <div className="w-[100px] h-[80px] p-2 flex flex-col items-center justify-center gap-2 rounded-lg bg-[#F5F3FF] hover:bg-[#EDE9FE] transition-colors">
                            <category.icon className="h-6 w-6 text-[#8B5CF6] flex-shrink-0" />
                            <span className="text-xs font-medium text-gray-700 text-center break-words line-clamp-2">
                                {category.name && category.name.toLowerCase().replace(/\b\w/g, char => char.toUpperCase())}
                            </span>
                        </div>
                    </button>
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