'use client';

import { DropDowState } from "@/hooks/reducers/drop-down";
import { useAppSelector } from "@/hooks/selector";
import { alertClasses } from "@/utils/constants/colors";
import { ArchiveRestore, CircleAlert } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function Alert() {
    const selector: DropDowState = useAppSelector((state) => state.dropDownReducer);
    const { type, icon, title, message, buttonText, action } = selector;
    const [show, setShow] = useState(false);
    const dialogRef = useRef<HTMLDialogElement | null>(null);

    const styles = alertClasses[type];

    const iconsMap = {
        archivo: <ArchiveRestore className={`${styles.text}`} />,
        alert: <CircleAlert className={`${styles.text}`} />
    };

    useEffect(() => {
        if (selector.message) {
            setShow(true);
            // Ocultar la alerta automáticamente después de 'duration' milisegundos
            const timer = setTimeout(() => {
                setShow(false);
            }, selector.duration);

            return () => clearTimeout(timer);
        }
    }, [selector]);

    const closeDialog = () => {
        setShow(false);
        dialogRef.current?.close();
    };

    const handleAction = () => {
        if (action) {
            action(); // Ejecutar la acción si está definida
        }
        setShow(false); // Cerrar la alerta
    };
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
                setShow(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <section
            className={
                show
                    ? "absolute inset-x-0 top-0 z-50 h-screen flex items-center justify-center backdrop-blur-lg bg-black bg-opacity-20"
                    : "hidden"
            }
        >
            <dialog
                id={selector.message}
                ref={dialogRef}
                open={show}
                className="max-w-lg w-full rounded-lg bg-white dark:bg-zinc-800 shadow-xl p-6 z-20 backdrop-blur-lg"
            >
                <div className="flex items-start space-x-4">
                    {/* Icono */}
                    <div
                        className={`flex items-center justify-center w-12 h-12 rounded-full ${styles.bg}`}
                    >
                        {iconsMap[icon] ?? null}
                    </div>
                    <div>
                        <h3 className={`text-lg font-semibold ${styles.text}`}>{title}</h3>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-200">{message}</p>
                    </div>
                </div>
                {buttonText && (
                    <div className="mt-6 flex justify-end space-x-4">
                        {/* Botón de Cancelar */}
                        <form method="dialog">
                            <button
                                onClick={closeDialog}
                                className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white border border-gray-300  dark:border-zinc-700 rounded-md hover:bg-zinc-50"
                            >
                                Cancel
                            </button>
                            {/* Botón de Deactivar */}
                            <button
                                onClick={handleAction}
                                className={`px-4 py-2 text-sm font-semibold ${styles.text} ${styles.bg} ring-1 ring-inset ${styles.ring} rounded-md ${styles.hover} transition-all`}
                            >
                                {buttonText}
                            </button>
                        </form>
                    </div>)}
            </dialog>
        </section>
    );
}
