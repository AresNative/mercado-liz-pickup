import React, { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import categorias from "@/utils/constants/categorias";
import { clearFilters, dataFilter } from "@/hooks/reducers/filter";
import { useAppDispatch } from "@/hooks/selector";

const CategorySlider: React.FC = () => {
    const sliderRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);
    const dispatch = useAppDispatch();

    const todoCategory = categorias.find((c) => c.name === "TODO");
    const otherCategories = categorias.filter((c) => c.name !== "TODO");

    const scroll = (direction: "left" | "right") => {
        const container = sliderRef.current;
        if (!container) return;

        const scrollAmount = direction === "left" ? -180 : 180;
        container.scrollBy({ left: scrollAmount, behavior: "smooth" });

        setTimeout(() => {
            setShowLeftArrow(container.scrollLeft > 0);
            setShowRightArrow(
                container.scrollLeft <
                container.scrollWidth - container.clientWidth - 5
            );
        }, 200);
    };

    return (
        <section className="relative w-full py-3 flex items-center">

            {/* Flecha izquierda */}
            {showLeftArrow && (
                <button
                    onClick={() => scroll("left")}
                    className="
                        absolute left-0 z-10
                        bg-gray-200 border border-gray-400 shadow-sm
                        rounded-full p-1
                        hover:bg-gray-50 transition
                    "
                >
                    <ChevronLeft className="h-4 w-4 text-gray-600" />
                </button>
            )}

            {/* Contenedor principal */}
            <div className="flex items-center gap-3 w-full px-8">

                {/* TODO fijo y compacto */}
                {todoCategory && (
                    <button
                        onClick={() => dispatch(clearFilters())}
                        className="
                            flex flex-col items-center justify-center
                            w-[72px] h-[72px]
                            bg-purple-200 border border-gray-200 rounded-xl
                            shadow-sm hover:shadow-md hover:bg-gray-50
                            transition-all duration-200
                        "
                    >
                        <todoCategory.icon className="h-5 w-5 text-violet-600 mb-1" />
                        <span className="text-xs font-medium text-gray-700">
                            Todo
                        </span>
                    </button>
                )}

                {/* Slider */}
                <div
                    ref={sliderRef}
                    className="
                        flex gap-3 overflow-x-auto scrollbar-hide flex-1
                        scroll-smooth snap-x snap-mandatory
                    "
                    onScroll={(e) => {
                        const target = e.target as HTMLDivElement;
                        setShowLeftArrow(target.scrollLeft > 0);
                        setShowRightArrow(
                            target.scrollLeft <
                            target.scrollWidth - target.clientWidth - 5
                        );
                    }}
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {otherCategories.map((category, key) => (
                        <button
                            key={key}
                            onClick={() =>
                                dispatch(
                                    dataFilter({
                                        key: "key",
                                        value: category.name,
                                        type: "multi",
                                    })
                                )
                            }
                            className="
                                snap-start flex flex-col items-center justify-center
                                 w-[90px] h-[82px] flex-shrink-0
                                bg-purple-200 border border-gray-200 rounded-xl
                                shadow-sm hover:shadow-md hover:bg-gray-50
                                transition-all duration-200
                            "
                        >
                            <category.icon className="h-5 w-5 text-violet-600 mb-1" />
                            <span className="
                                        text-[11px] font-medium text-gray-700
                                        text-center break-words leading-[1.1]
                                        line-clamp-2
                                    ">
                                {category.name
                                    .toLowerCase()
                                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Flecha derecha */}
            {showRightArrow && (
                <button
                    onClick={() => scroll("right")}
                    className="
                        absolute right-0 z-10
                        bg-gray-200 border border-gray-400 shadow-sm
                        rounded-full p-1
                        hover:bg-gray-50 transition
                    "
                >
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                </button>
            )}
        </section>
    );
};

export default CategorySlider;
