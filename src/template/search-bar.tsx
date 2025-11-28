// search-bar.tsx
import { searchData } from "@/hooks/reducers/filter";
import { useAppDispatch } from "@/hooks/selector";
import { cn } from "@/utils/functions/cn";
import { IonSearchbar } from "@ionic/react";
import { useCallback, useRef, useState } from "react";

interface SearchBarProps {
    mobileScreen?: boolean;
    isScrolled?: boolean;
    onSearchChange?: (searchTerm: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
    mobileScreen,
    isScrolled,
    onSearchChange
}) => {
    const dispatch = useAppDispatch();
    const [searchTerm, setSearchTerm] = useState("");

    // Manejar cambio en el término de búsqueda
    const handleSearchChange = useCallback((value: string) => {
        setSearchTerm(value);
        onSearchChange?.(value);
        dispatch(searchData(value));
    }, [dispatch, onSearchChange]);

    // Limpiar búsqueda
    const handleClearSearch = useCallback(() => {
        setSearchTerm("");
        dispatch(searchData(""));
        onSearchChange?.("");
    }, [dispatch, onSearchChange]);

    if (mobileScreen) {
        return null;
    }

    return (
        <section className={cn("relative w-[70%] ml-[20%]", isScrolled ? "mt-12 shadow-sm border-gray-300" : "mt-4")}>
            <IonSearchbar
                className={cn("w-full", isScrolled && "custom-search-barr")}
                color={isScrolled ? "" : "light"}
                value={searchTerm}
                onIonInput={(e) => handleSearchChange(e.detail.value!)}
                onIonClear={handleClearSearch}
                placeholder="Buscar productos..."
                enterkeyhint="search"
            />
        </section>
    );
};

export default SearchBar;