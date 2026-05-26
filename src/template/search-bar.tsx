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
    showBackButton?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
    mobileScreen,
    isScrolled,
    onSearchChange,
    showBackButton
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
        <section className={cn("relative w-10/12 mx-auto", isScrolled ? "shadow-sm border-gray-300" : "mt-2")}>
            <IonSearchbar
                className={cn("mx-auto", (isScrolled || showBackButton) && "custom-search-barr")}
                color={(isScrolled || showBackButton) ? "" : "light"}
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