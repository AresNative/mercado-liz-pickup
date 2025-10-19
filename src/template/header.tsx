// components/Header.tsx
import { useAppSelector } from '@/hooks/selector';
import { RootState } from '@/hooks/store';
import { cn } from '@/utils/functions/cn';
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonMenuButton,
    IonBackButton,
    IonBadge,
    IonItem,
    IonLabel
} from '@ionic/react';
import { ShoppingCart } from 'lucide-react';

interface HeaderProps {
    title: string;
    showMenuButton?: boolean;
    showSearchButton?: boolean;
    showBackButton?: boolean;
    className?: string;
    isScrolled?: boolean;
    defaultBack?: string;
}

const Header: React.FC<HeaderProps> = ({
    title,
    isScrolled = false,
    showMenuButton = true,
    showSearchButton = false,
    showBackButton = false,
    className = '',
    defaultBack
}) => {

    const cart = useAppSelector((state: RootState) => state.cart);
    const { items } = cart || []; // Si cart es undefined/null, usamos array vacío
    return (
        <IonHeader
            className={cn(
                `transition-all duration-300 safe-area-top`,
                showBackButton || isScrolled
                    ? 'bg-white/70 border-b backdrop-blur-sm'
                    : 'bg-transparent',
                className
            )}
        >
            <IonToolbar className='p-2 flex items-center '>
                {showBackButton && (
                    <IonButtons slot="start">
                        <IonBackButton defaultHref={defaultBack ?? "/"} className={'text-purple-700'} text="Atras" />
                    </IonButtons>)}

                <IonTitle
                    className={cn(
                        "text-xl font-light tracking-tight",
                        showBackButton || isScrolled ? "text-purple-700" : "text-white",
                        showSearchButton ? "text-left" : "",
                    )}
                >
                    {title}
                </IonTitle>
                <IonButtons slot="end">
                    {showMenuButton && (<IonItem
                        lines="none"
                        routerLink="/carrito"
                        detail={false}  // <- Esta prop elimina el ícono de flecha
                        className="flex items-center text-purple-800 hover:text-purple-700 relative"
                    >
                        <IonLabel>
                            <ShoppingCart className={cn(showBackButton || isScrolled ? 'text-purple-700' : 'text-white', 'size-5')} />
                        </IonLabel>
                        {items.length > 0 && (
                            <IonBadge
                                color="success"
                                className="absolute text-white -top-0 right-2 text-xs"
                            >
                                {items.length}
                            </IonBadge>)}
                    </IonItem>)}
                </IonButtons>
                {showMenuButton && (
                    <IonButtons slot="end">
                        <IonMenuButton className={cn(showBackButton || isScrolled ? 'text-purple-700' : 'text-white')} />
                    </IonButtons>
                )}
            </IonToolbar>
        </IonHeader>
    );
};

export default Header;