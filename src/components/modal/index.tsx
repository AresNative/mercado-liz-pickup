"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/utils/functions/cn"
import { useAppDispatch, useAppSelector } from "@/hooks/selector"
import { useEffect } from "react"
import { closeModalReducer } from "@/hooks/reducers/drop-down"

interface ModalProps {
    modalName: string
    title: string
    children: React.ReactNode
    maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full"
}

export function Modal({ modalName, title, children, maxWidth = "2xl" }: ModalProps) {
    // Handle escape key
    const dialogRef = React.useRef<HTMLDialogElement | null>(null);
    const dispatch = useAppDispatch();
    const isOpen = useAppSelector((state) => state.dropDownReducer.modals[modalName]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleBackdropClick()
        }

        if (isOpen) {
            document.addEventListener("keydown", handleEscape)
            // Prevent scrolling when modal is open
            document.body.style.overflow = "hidden"
        }

        return () => {
            document.removeEventListener("keydown", handleEscape)
            document.body.style.overflow = "unset"
        }
    }, [isOpen])

    const handleBackdropClick = () => {
        dispatch(closeModalReducer({ modalName }));
    };

    const maxWidthClasses = {
        sm: "sm:max-w-sm",
        md: "sm:max-w-md",
        lg: "sm:max-w-lg",
        xl: "sm:max-w-xl",
        "2xl": "sm:max-w-2xl",
        "3xl": "sm:max-w-3xl",
        "4xl": "sm:max-w-4xl",
        "5xl": "sm:max-w-5xl",
        full: "sm:max-w-full",
    }

    //if (!isOpen) return null
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
                handleBackdropClick();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    return (
        <>
            <dialog
                id={modalName}
                ref={dialogRef}
                open={isOpen}
                /* closedby="any" */
                className="fixed inset-0 z-50 max-w-lg w-full bg-transparent"
                aria-modal="true"
                aria-labelledby={`modal-${modalName}`}>

                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleBackdropClick} />


                <section
                    className={cn(
                        "relative transform overflow-hidden overflow-y-auto rounded-lg bg-white dark:bg-zinc-800 text-left shadow-xl transition-all sm:my-8",
                        maxWidthClasses[maxWidth],
                    )}
                >
                    {/* Close button */}
                    <form method="dialog" className="absolute right-4 top-4 z-10">
                        <button
                            className="rounded-md text-gray-400 hover:text-gray-500 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            onClick={handleBackdropClick}
                        >
                            <span className="sr-only">Close</span>
                            <X className="h-6 w-6" aria-hidden="true" />
                        </button>
                    </form>

                    {/* Content */}
                    <div className="bg-white dark:bg-zinc-800 px-4 pb-4 pt-5 sm:p-6">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                <h3 id="modal-title" className="text-gray-900 dark:text-white mb-4">
                                    {title}
                                </h3>
                                <div className="mt-2">{children}</div>
                            </div>
                        </div>
                    </div>
                </section>
            </dialog>
        </>
    )
}

