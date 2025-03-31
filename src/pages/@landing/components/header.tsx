import { SwitchToggle } from "@/components/switch-mode"
import { IonHeader, IonRouterLink } from "@ionic/react"
import { Search } from "lucide-react"

const Input = ({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) => {
    return (
        <input
            className={`bg-white w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-900 dark:text-gray-100 ${className}`}
            {...props}
        />
    )
}

const HeaderCart: React.FC = () => {
    return (
        <IonHeader className="bg-white dark:bg-zinc-950 flex items-center p-2">
            <nav className="container mx-auto flex items-center justify-between">
                {/* Logo a la izquierda */}
                <div className="flex-shrink-0">
                    <IonRouterLink href="/" className="flex items-center">
                        <div className="h-8 w-8 rounded-br-lg rounded-tl-lg bg-indigo-600 text-white flex items-center justify-center text-lg font-bold">
                            <span className='pl-2 pt-4'>ML</span>
                        </div>
                    </IonRouterLink>
                </div>

                {/* Input centrado */}
                <div className="flex-grow max-w-xl mx-4 relative">
                    <Input
                        type="text"
                        placeholder="Buscar productos..."
                        className="pl-3 pr-9 py-1.5 h-9 text-sm rounded-lg"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4">
                        <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    </div>
                </div>

                {/* Switch a la derecha */}
                <div className="flex-shrink-0">
                    <SwitchToggle />
                </div>
            </nav>
        </IonHeader>
    )
}

export default HeaderCart