// components/Header.tsx
import { IconLiz } from '@/app/productos/components/ionc-liz';
import SearchBar from '@/template/search-bar';
import SearchResults from '@/template/search-result';
import { useAppSelector } from '@/hooks/selector';
import { RootState } from '@/hooks/store';
import { formatValue } from '@/utils/constants/format-values';
import { cn } from '@/utils/functions/cn';
import {
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonBackButton,
    IonBadge,
    IonItem,
} from '@ionic/react';
import { ShoppingCart } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
    isScrolled?: boolean;
    showMenuButton?: boolean;
    showScrollBarr?: boolean;
    showBackButton?: boolean;
    className?: string;
    defaultBack?: string;
    mobileScreen?: boolean;
}

const Header: React.FC<HeaderProps> = ({
    isScrolled = false,
    showMenuButton = true,
    showScrollBarr = false,
    showBackButton = false,
    className = '',
    defaultBack,
    mobileScreen
}) => {
    const mobile = mobileScreen;
    const [showSearchResults, setShowSearchResults] = useState(false);

    const cart = useAppSelector((state: RootState) => state.cart);
    const { items = [] } = cart || {};

    // Calcular el total correctamente
    const total = items.reduce((sum, item) => {
        return sum + ((item.descuento ? item.descuento : item.precio) * item.quantity);
    }, 0);

    // Manejar cambio de búsqueda
    const handleSearchChange = (searchTerm: string) => {
        setShowSearchResults(searchTerm.trim().length > 0);
    };

    return (
        <>
            <IonHeader
                className={cn(
                    `transition-all duration-300 safe-area-top`,
                    showBackButton || isScrolled
                        ? 'bg-white/70 border-b backdrop-blur-sm'
                        : 'bg-transparent',
                    className
                )}
            >
                <IonToolbar className='p-2 flex items-center relative'>
                    {showBackButton && (
                        <IonButtons slot="start">
                            <IonBackButton
                                defaultHref={defaultBack ?? "/"}
                                className={'text-purple-700'}
                                text="Atras"
                            />
                        </IonButtons>
                    )}

                    <section slot="end" className='flex flex-1 justify-center items-center mt-2 absolute left-0 right-0 top-0 z-50'>
                        {isScrolled && (
                            <a className='decoration-none cursor-pointer' href='/productos'>
                                <IconLiz className='mx-auto' fill={"#7927F5"} width={35} />
                            </a>
                        )}
                    </section>

                    {showScrollBarr && (
                        <SearchBar
                            mobileScreen={mobileScreen}
                            isScrolled={isScrolled}
                            onSearchChange={handleSearchChange}
                        />
                    )}

                    <IonButtons slot="end" className='flex items-center gap-2 cursor-pointer'>
                        {showMenuButton && (
                            <IonItem
                                lines="none"
                                routerLink="/carrito"
                                detail={false}
                                className="flex text-purple-800 hover:text-purple-700 relative"
                            >
                                <label className='flex flex-col items-center gap-1 cursor-pointer'>
                                    <ShoppingCart className={cn(
                                        showBackButton || isScrolled ? 'text-purple-700' : 'text-white',
                                        'size-5'
                                    )} />
                                    {total > 0 && (
                                        <p className={cn(
                                            showBackButton || isScrolled ? 'text-purple-700' : 'text-white',
                                            "text-xs"
                                        )}>
                                            {formatValue(total, "currency")}
                                        </p>
                                    )}
                                </label>
                                {items.length > 0 && (
                                    <IonBadge
                                        color="success"
                                        className="absolute text-purple-700 text-center -top-0 right-0 cursor-pointer"
                                    >
                                        {items.length}
                                    </IonBadge>
                                )}
                            </IonItem>
                        )}
                    </IonButtons>

                    {!mobile && showMenuButton && (
                        <IonButtons slot="end">
                            <IonMenuButton className={cn(
                                showBackButton || isScrolled ? 'text-purple-700' : 'text-white'
                            )} />
                        </IonButtons>
                    )}
                </IonToolbar>
            </IonHeader>

            {/* Resultados de búsqueda debajo del toolbar */}
            <SearchResults
                isVisible={showSearchResults}
                onClose={() => setShowSearchResults(false)}
            />
        </>
    );
};

export default Header;