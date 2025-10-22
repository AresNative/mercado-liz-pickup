// components/Tabs.tsx
import { navigationAdmin, navigationDefault } from '@/utils/constants/router';
import { cn } from '@/utils/functions/cn';
import { getLocalStorageItem } from '@/utils/functions/local-storage';
import {
    IonTabs,
    IonLabel,
    IonFooter,
    IonTab,
    IonToolbar,
    IonTabBar,
    IonTabButton
} from '@ionic/react';

interface TabsProps {
    isScrolled?: boolean;
    showBackButton?: boolean;
    className?: string;
    mobileScreen?: boolean;
}

const Tabs: React.FC<TabsProps> = ({
    isScrolled = false,
    showBackButton = false,
    className = '',
    mobileScreen
}) => {
    const mobile = mobileScreen;
    const userRole = getLocalStorageItem("user-role");
    const getNavigation = () => {
        if (!userRole) return navigationDefault;
        const navigationMap: any = {
            admin: navigationAdmin,
            // ... otros roles
        };
        return navigationMap[userRole];
    };

    if (!mobile) return null;

    return (
        <IonFooter className={cn('bg-white/70 border-b backdrop-blur-sm', className)}>
            <IonTabBar slot="bottom" className="flex justify-around">
                {getNavigation().map((item: any, key: any) => {
                    const Icon = item.icon;
                    if (!Icon) return
                    return (
                        <IonTabButton
                            key={key}
                            href={item.href}
                            className="hover:text-purple-500"
                        >
                            <Icon size={20} className="mx-3" />
                            <label className="text-xs">{item.name}</label>
                        </IonTabButton>
                    );
                })}
            </IonTabBar>
        </IonFooter>
    );
};

export default Tabs;