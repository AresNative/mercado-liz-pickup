// components/Tabs.tsx
import { navigationAdmin, navigationDefault } from '@/utils/constants/router';
import { getLocalStorageItem } from '@/utils/functions/local-storage';
import {
    IonLabel,
    IonTabBar,
    IonTabButton,
    isPlatform,
    IonFabButton
} from '@ionic/react';
import { Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Tabs: React.FC = () => {
    const mobile = isPlatform('mobile');
    const userRole = getLocalStorageItem("user-role");
    const location = useLocation();

    const getNavigation = () => {
        if (!userRole) return navigationDefault;
        const navigationMap: any = {
            admin: navigationAdmin,
            // ... otros roles
        };
        return navigationMap[userRole] || navigationDefault;
    };

    if (!mobile) return null;

    const navigation = getNavigation();

    return (
        <section className='absolute w-full bottom-0'>
            <IonTabBar className='bg-white/70 backdrop-blur-sm z-1 border border-t' slot="bottom">
                {navigation.map((item: any, key: any) => {
                    const Icon = item.icon;
                    if (!Icon) return null;

                    // Determinar si esta pestaña está activa
                    const isActive = location.pathname === item.href ||
                        (item.href === '/' && location.pathname === '/home')

                    return (
                        <IonTabButton
                            key={key}
                            tab={item.tab}
                            href={item.href}
                            selected={isActive}
                        >
                            <Icon
                                size={20}
                                className="mx-3"
                            />
                            <IonLabel className="text-xs">{item.name}</IonLabel>
                        </IonTabButton>
                    );
                })}
            </IonTabBar>
            {location.pathname === "/productos" && (
                <div className="z-10 grid h-full w-10 bottom-7 mx-auto relative">
                    <IonFabButton className='absolute bottom-1 size-10 p-1 bg-white rounded-full border custom-tertiary'>
                        <Search className='size-6' />
                    </IonFabButton>
                </div>
            )}
        </section>
    );
};

export default Tabs;