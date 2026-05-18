"use client";
import { Modal } from "@/components/modal";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { FirestoreService } from "@/hooks/use-firebase";
import { getLocalStorageItem } from "@/utils/functions/local-storage";
import { Send, UserCircle } from "lucide-react";
import { usePutGeneralMutation } from "@/hooks/reducers/api";

export type Message = {
    id: string;
    text: string;
    userId: string;
    userName: string;
    timestamp: number;
    actions?: {
        label: string;
        action: "replace" | "remove";
        productId: string;
        productName: string;
    }[];
};

export type User = {
    id: string;
    nombre: string;
    telefono: string;
    lastSeen?: number;
};

interface ModalChatProps {
    telefonoClient: string | null;
    pedido?: any;
}

export const ModalChat = ({ telefonoClient, pedido }: ModalChatProps) => {
    // ID del usuario actual (soporte) desde localStorage
    const userId = useMemo(() => getLocalStorageItem("user-id"), []);
    const modalName = pedido
        ? `chat_${pedido?.cliente_telefono}_${pedido?.id}`
        : `chat_${telefonoClient}`;
    if (!modalName) return null;

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [users, setUsers] = useState<Record<string, User>>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [messagesService, setMessagesService] = useState<FirestoreService<Message> | null>(null);
    const [putGeneral] = usePutGeneralMutation();

    // Servicio de usuarios (colección raíz)
    const usersService = useMemo(() => new FirestoreService<User>("users"), []);

    const getModalTitle = () => {
        if (pedido?.nombre) {
            return `Chat con ${pedido.nombre} - #${pedido.id} - ${telefonoClient || "Sin teléfono"}`;
        }
        return telefonoClient ? `Chat - ${telefonoClient}` : "Chat General";
    };

    // Suscripción a usuarios
    useEffect(() => {
        if (!userId) return;

        const unsubscribeUsers = usersService.subscribe(
            [],
            (usersArray: User[]) => {
                const usersMap = usersArray.reduce((acc, user) => {
                    acc[user.id] = user;
                    return acc;
                }, {} as Record<string, User>);
                setUsers(usersMap);
            },
            (error: any) => console.error("Error en suscripción de usuarios:", error)
        );

        // Actualizar el estado del usuario actual (soporte)
        const updateCurrentUser = async () => {
            try {
                await usersService.update(userId, {
                    nombre: pedido?.nombre || "Soporte",
                    telefono: pedido?.cliente_telefono || telefonoClient || "",
                    lastSeen: Date.now(),
                });
            } catch (error) {
                console.error("Error actualizando usuario:", error);
            }
        };
        updateCurrentUser();

        return () => {
            unsubscribeUsers();
        };
    }, [userId, usersService, pedido, telefonoClient]);

    // Suscripción a mensajes (se reinicia cuando cambia el identificador del chat)
    const chatIdentifier = useMemo(() => {
        if (pedido && pedido.cliente_telefono && pedido.id) {
            return `chats/${pedido.cliente_telefono}/${pedido.id}`;
        }
        if (telefonoClient) {
            return `chats/${telefonoClient}/messages`;
        }
        return null;
    }, [pedido, telefonoClient]);

    useEffect(() => {
        if (!chatIdentifier) {
            setMessagesService(null);
            setMessages([]);
            return;
        }

        // Crear servicio para la subcolección correspondiente
        const msgService = new FirestoreService<Message>(chatIdentifier);
        setMessagesService(msgService);

        const unsubscribeMessages = msgService.subscribe(
            [],
            (messagesArray: Message[]) => {
                const sorted = [...messagesArray].sort((a, b) => a.timestamp - b.timestamp);
                setMessages(sorted);
            },
            (error: any) => console.error("Error en suscripción de mensajes:", error)
        );

        return () => {
            unsubscribeMessages();
        };
    }, [chatIdentifier]);

    // Scroll automático
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !messagesService) return;

        try {
            await messagesService.create({
                text: newMessage.trim(),
                userId: userId || "unknown",
                userName: "Soporte", // Nombre fijo para el soporte
                timestamp: Date.now(),
            });
            setNewMessage("");
        } catch (error) {
            console.error("Error al enviar mensaje:", error);
        }
    };

    const handleAction = async (action: string, productId: string, productName: string) => {
        if (!pedido || !messagesService) return;

        if (action === "remove") {
            const nuevosItems = pedido.items.filter((item: any) => item.id !== productId);
            const arrayListaActualizado = JSON.stringify(nuevosItems);
            try {
                await putGeneral({
                    table: "listas",
                    data: {
                        Data: { array_lista: arrayListaActualizado, fecha_actualizacion: new Date().toISOString() },
                        Filtros: [{ Key: "ID", Value: pedido.id, Operator: "=" }],
                    },
                }).unwrap();

                await messagesService.create({
                    text: `✅ Se ha eliminado "${productName}" de tu pedido.`,
                    userId: "unknown",
                    userName: "Soporte",
                    timestamp: Date.now(),
                });

                // Actualizar localmente el pedido (opcional, si se pasa por prop)
                pedido.items = nuevosItems;
            } catch (error) {
                console.error("Error al eliminar producto:", error);
                await messagesService.create({
                    text: `❌ Ocurrió un error al eliminar "${productName}". Por favor intenta más tarde.`,
                    userId: "unknown",
                    userName: "Soporte",
                    timestamp: Date.now(),
                });
            }
        } else if (action === "replace") {
            await messagesService.create({
                text: `🔄 Por favor, escribe el nombre del producto que deseas en lugar de "${productName}".`,
                userId: "unknown",
                userName: "Soporte",
                timestamp: Date.now(),
            });
        }
    };

    const formatTime = (timestamp: number) => {
        if (!timestamp) return "Ahora";
        return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    if (!telefonoClient) return null;

    return (
        <Modal modalName={modalName} title={getModalTitle()} maxWidth="md">
            <div className="flex flex-col relative h-[500px]">
                <div className="flex-1 overflow-y-auto p-4 pb-20">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
                            <UserCircle className="w-16 h-16 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-500">Chat vacío</h3>
                            <p className="text-gray-400 mt-1">
                                Envía un mensaje para iniciar la conversación
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {messages.map((message) => {
                                const isCurrentUser = message.userId === userId;
                                const user = users[message.userId] || { nombre: message.userName };

                                return (
                                    <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[85%] flex ${isCurrentUser ? "flex-row-reverse" : ""}`}>
                                            <div className="mx-2 flex items-end">
                                                <UserCircle className={`w-8 h-8 ${isCurrentUser ? "text-purple-500" : "text-gray-400"}`} />
                                            </div>
                                            <div>
                                                {!isCurrentUser && (
                                                    <div className="text-xs font-medium text-gray-600 mb-1 ml-1">
                                                        {user.nombre}
                                                    </div>
                                                )}
                                                <div className="flex flex-col">
                                                    <div
                                                        className={`
                                                            rounded-2xl px-4 py-3
                                                            ${isCurrentUser
                                                                ? "bg-purple-500 text-white rounded-br-none"
                                                                : "bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-200"
                                                            }
                                                        `}
                                                    >
                                                        {message.text}
                                                        {message.actions && message.actions.length > 0 && (
                                                            <div className="flex gap-2 mt-3">
                                                                {message.actions.map((action) => (
                                                                    <button
                                                                        key={action.action}
                                                                        onClick={() => handleAction(action.action, action.productId, action.productName)}
                                                                        className="px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                                                                    >
                                                                        {action.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className={`text-xs text-gray-500 mt-1 ${isCurrentUser ? "text-right" : "text-left"}`}>
                                                        {formatTime(message.timestamp)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                <div className="relative bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3">
                    <div className="flex items-center gap-2">
                        <input
                            value={newMessage}
                            placeholder="Escribe un mensaje..."
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-1 rounded-full bg-gray-100 px-4 py-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim()}
                            className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${newMessage.trim()
                                    ? "bg-purple-600 text-white hover:bg-purple-700"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                }`}
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};