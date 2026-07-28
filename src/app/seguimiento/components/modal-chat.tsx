// src/app/seguimiento/components/modal-chat.tsx
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Modal } from "@/components/modal";
import { getLocalStorageItem } from "@/utils/functions/local-storage";
import { Send, UserCircle } from "lucide-react";
import { usePutGeneralMutation } from "@/hooks/reducers/api";
import { Producto } from "@/utils/types/page";
import { usePedidosSignalR } from "../utils/signalr-pedidos";
import { ProductSelector } from "./product-selector";
import {
    useDeleteIntelisisMutation,
    useGetWithFiltersGeneralInIntelisisMutation,
    usePutIntelisisMutation,
} from "@/hooks/reducers/api_int";

// ─── Importar desde api-mongodb ──────────────────────
import {
    useGetMessagesQuery,
    useSendMessageMutation,
    Message,
    User,
} from "@/hooks/reducers/api-mongodb";

interface ModalChatProps {
    modalName: string;
    telefonoClient: string | null;
    pedido?: any;
}

export const ModalChat = ({
    modalName,
    telefonoClient,
    pedido: pedidoProp,
}: ModalChatProps) => {
    const userId = useMemo(() => getLocalStorageItem("user-id"), []);
    
    // Estados locales
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [currentPedido, setCurrentPedido] = useState(pedidoProp);
    const [showProductSelector, setShowProductSelector] = useState(false);
    const [pendingReplace, setPendingReplace] = useState<{
        productId: string;
        productName: string;
        cantidadOriginal: number;
    } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [putGeneral] = usePutGeneralMutation();
    const [GetInt] = useGetWithFiltersGeneralInIntelisisMutation();
    const [PutData] = usePutIntelisisMutation();
    const [deleteData] = useDeleteIntelisisMutation();

    // ─── SignalR ────────────────────────────────────────
    const onPedidoActualizado = useCallback(
        (pedidoActualizado: any) => {
            if (pedidoActualizado.id === currentPedido?.id) {
                setCurrentPedido(pedidoActualizado);
            }
        },
        [currentPedido?.id]
    );

    const onRefrescarDatos = useCallback(() => {
        console.log("SignalR solicita refrescar datos del pedido");
    }, []);

    const { isConnected, unirseAPedido, notificarCambioLista } =
        usePedidosSignalR(
            onPedidoActualizado,
            () => { },
            () => { },
            onRefrescarDatos
        );

    const joinedPedidoIdRef = useRef<string | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (!isConnected || !currentPedido?.id) return;
        if (joinedPedidoIdRef.current === currentPedido.id) return;

        const join = async () => {
            try {
                await unirseAPedido(currentPedido.id);
                if (mountedRef.current) {
                    joinedPedidoIdRef.current = currentPedido.id;
                    console.log(`✅ Unido al grupo del pedido ${currentPedido.id}`);
                }
            } catch (error) {
                console.error("Error uniéndose a grupos:", error);
                // Reintentar una vez después de 1 segundo
                setTimeout(() => {
                    if (
                        mountedRef.current &&
                        isConnected &&
                        currentPedido?.id &&
                        joinedPedidoIdRef.current !== currentPedido.id
                    ) {
                        unirseAPedido(currentPedido.id)
                            .then(() => {
                                if (mountedRef.current)
                                    joinedPedidoIdRef.current = currentPedido.id;
                            })
                            .catch((e) => console.error("Reintento fallido:", e));
                    }
                }, 1000);
            }
        };

        join();
    }, [isConnected, currentPedido?.id, unirseAPedido]);

    // ─── Chat ID ────────────────────────────────────────
    const chatId = useMemo(() => {
        if (currentPedido && currentPedido.cliente_telefono && currentPedido.id) {
            return `${currentPedido.cliente_telefono}_${currentPedido.id}`;
        }
        if (telefonoClient) {
            return `${telefonoClient}_general`;
        }
        return null;
    }, [currentPedido, telefonoClient]);

    // ─── RTK Query: obtener mensajes (sin polling) ───
    const { data: messagesData, refetch } = useGetMessagesQuery(chatId!, {
        skip: !chatId,
        pollingInterval: 0,
    });

    // Sincronizar mensajes desde RTK
    useEffect(() => {
        if (messagesData) {
            const sorted = [...messagesData].sort((a, b) => a.timestamp - b.timestamp);
            setMessages(sorted);
        }
    }, [messagesData]);

    useEffect(() => {
        setCurrentPedido(pedidoProp);
    }, [pedidoProp]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ─── Enviar mensaje (RTK Mutation) ────────────────
    const [sendMessageMutation] = useSendMessageMutation();

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !chatId) return;
        try {
            await sendMessageMutation({
                chatId,
                text: newMessage.trim(),
                userId: userId || "unknown",
                userName: "Soporte",
            }).unwrap();
            setNewMessage("");
        } catch (error) {
            console.error("Error al enviar mensaje:", error);
        }
    };

    // ─── Intelisis ──────────────────────────────────────
    const consultarDataIntelisis = async () => {
        const responseVenta = await GetInt({
            table: "venta",
            page: 1,
            pageSize: 1,
            filtros: {
                Filtros: [
                    { Key: "Referencia", Value: pedidoProp.id, Operator: "like" },
                    { Key: "Concepto", Value: "PICK UP", Operator: "=" },
                ],
            },
            signal: undefined,
        }).unwrap();

        const venta = responseVenta.data;
        const ventaD = await GetInt({
            table: "ventaD",
            page: 1,
            pageSize: 1,
            filtros: {
                Filtros: [{ Key: "id", Value: venta[0].ID, Operator: "=" }],
            },
            signal: undefined,
        }).unwrap();

        return { venta: venta, ventaD: ventaD.data };
    };

    // ─── Manejo de acciones (Eliminar / Reemplazar) ────
    const handleAction = async (
        action: string,
        productId: string,
        productName: string
    ) => {
        if (!currentPedido || !chatId) return;

        if (action === "remove") {
            const nuevosItems = currentPedido.items.filter(
                (item: any) => item.id !== productId
            );
            const arrayListaActualizado = JSON.stringify(nuevosItems);
            try {
                await putGeneral({
                    table: "listas",
                    data: {
                        Data: {
                            array_lista: arrayListaActualizado,
                            fecha_actualizacion: new Date().toISOString(),
                        },
                        Filtros: [{ Key: "ID", Value: currentPedido.id, Operator: "=" }],
                    },
                }).unwrap();

                await notificarCambioLista("remove", {
                    pedidoId: currentPedido.id,
                    productId,
                });

                await sendMessageMutation({
                    chatId,
                    text: `✅ Se ha eliminado "${productName}" de tu pedido.`,
                    userId: "unknown",
                    userName: "Soporte",
                }).unwrap();
                await deleteData({
                    table: "ventaD",
                    filtros: {
                        Filtros: [
                            { Key: "ID", Value: currentPedido.id, Operator: "=" },
                            { Key: "Articulo", Value: productId.split("-")[0], Operator: "=" },
                        ],
                    },
                })
                setCurrentPedido({ ...currentPedido, items: nuevosItems });
            } catch (error) {
                console.error("Error al eliminar producto:", error);
                await sendMessageMutation({
                    chatId,
                    text: `❌ Ocurrió un error al eliminar "${productName}". Por favor intenta más tarde.`,
                    userId: "unknown",
                    userName: "Soporte",
                }).unwrap();
            }
        } else if (action === "replace") {
            const oldItem = currentPedido.items.find(
                (item: any) => item.id === productId
            );
            setPendingReplace({
                productId,
                productName,
                cantidadOriginal: oldItem?.quantity || 1,
            });
                setShowProductSelector(true);
        }
    };

    // ─── Reemplazar producto ────────────────────────────
    const handleReplaceProduct = async (
        newProduct: Producto,
        nuevaCantidad: number
    ) => {
        if (!pendingReplace || !currentPedido || !chatId) return;
        const { productId: oldProductId, productName: oldProductName } =
            pendingReplace;

        if (nuevaCantidad > newProduct.cantidad) {
            await sendMessageMutation({
                chatId,
                text: `❌ La cantidad seleccionada (${nuevaCantidad}) supera el stock disponible (${newProduct.cantidad} ${newProduct.unidad}).`,
                userId: "unknown",
                userName: "Soporte",
            }).unwrap();
            setShowProductSelector(false);
            setPendingReplace(null);
            return;
        }

        const { venta, ventaD } = await consultarDataIntelisis();
        await PutData({
            table: "venta",
            data: {
                Data: {
                    Importe:
                        venta[0].Importe +
                        newProduct.precio * nuevaCantidad -
                        ventaD[0].Precio * pendingReplace.cantidadOriginal,
                    CostoTotal:
                        newProduct.costo + venta[0].CostoTotal - ventaD[0].Costo,
                    PrecioTotal:
                        newProduct.precio + venta[0].PrecioTotal - ventaD[0].Precio,
                    Impuestos:
                        (newProduct.impuesto1 ?? 0) +
                        (newProduct.impuesto2 ?? 0) +
                        venta[0].Impuestos -
                        ventaD[0].Impuesto1 -
                        ventaD[0].Impuesto2,
                },
                Filtros: [{ Key: "ID", Value: venta[0].ID, Operator: "=" }],
            },
        }).unwrap();

        const resultado = oldProductId.split("-");
        await PutData({
            table: "ventaD",
            data: {
                Data: {
                    precio: newProduct.precio,
                    articulo: newProduct.articulo,
                    costo: newProduct.costo,
                    unidad: newProduct.unidad,
                    factor: newProduct.factor,
                    cantidad: newProduct.quantity,
                    impuesto1: newProduct.impuesto1,
                    impuesto2: newProduct.impuesto2,
                },
                Filtros: [
                    { Key: "ID", Value: ventaD[0].ID, Operator: "=" },
                    { Key: "Articulo", Value: resultado[0], Operator: "=" },
                ],
            },
        }).unwrap();

        const nuevosItems = currentPedido.items.map((item: any) =>
            item.id === oldProductId
                ? {
                    ...item,
                    id: newProduct.id,
                    nombre: newProduct.nombre,
                    precio: newProduct.precio,
                    articulo: newProduct.articulo,
                    unidad: newProduct.unidad,
                    factor: newProduct.factor,
                    cantidad: newProduct.cantidad,
                    quantity: nuevaCantidad,
                    recolectado: item.recolectado ?? false,
                    noEncontrado: false,
                }
                : item
        );

        const arrayListaActualizado = JSON.stringify(nuevosItems);
        try {
            await putGeneral({
                table: "listas",
                data: {
                    Data: {
                        array_lista: arrayListaActualizado,
                        fecha_actualizacion: new Date().toISOString(),
                        estado: "proceso",
                    },
                    Filtros: [{ Key: "ID", Value: currentPedido.id, Operator: "=" }],
                },
            }).unwrap();

            await notificarCambioLista("replace", {
                pedidoId: currentPedido.id,
                oldProductId,
                newProduct,
                newQuantity: nuevaCantidad,
            });

            await sendMessageMutation({
                chatId,
                text: `✅ Se ha reemplazado "${oldProductName}" por "${newProduct.nombre}" (cantidad: ${nuevaCantidad} ${newProduct.unidad}).`,
                userId: "unknown",
                userName: "Soporte",
            }).unwrap();

            setCurrentPedido({ ...currentPedido, items: nuevosItems });
        } catch (error) {
            console.error("Error al reemplazar producto:", error);
            await sendMessageMutation({
                chatId,
                text: `❌ Error al reemplazar "${oldProductName}". Intenta de nuevo.`,
                userId: "unknown",
                userName: "Soporte",
            }).unwrap();
        } finally {
            setShowProductSelector(false);
            setPendingReplace(null);
        }
    };

    const cancelReplace = () => {
        setShowProductSelector(false);
        setPendingReplace(null);
    };

    const formatTime = (timestamp: number) => {
        if (!timestamp) return "Ahora";
        return new Date(timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getModalTitle = () => {
        if (currentPedido?.nombre) {
            return `Chat con ${currentPedido.nombre} - #${currentPedido.id} - ${telefonoClient || "Sin teléfono"}`;
        }
        return telefonoClient ? `Chat - ${telefonoClient}` : "Chat General";
    };

    if (!telefonoClient) return null;

    return (
        <Modal modalName={modalName} title={getModalTitle()} maxWidth="md">
            <div className="flex flex-col relative h-[500px]">
                {/* Lista de mensajes */}
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
                                return (
                                    <div
                                        key={message.id}
                                        className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[85%] flex ${isCurrentUser ? "flex-row-reverse" : ""}`}
                                        >
                                            <div className="mx-2 flex items-end">
                                                <UserCircle
                                                    className={`w-8 h-8 ${isCurrentUser ? "text-purple-500" : "text-gray-400"}`}
                                                />
                                            </div>
                                            <div>
                                                {!isCurrentUser && (
                                                    <div className="text-xs font-medium text-gray-600 mb-1 ml-1">
                                                        {message.userName || "Cliente"}
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
                                                                        onClick={() =>
                                                                            handleAction(
                                                                                action.action,
                                                                                action.productId,
                                                                                action.productName
                                                                            )
                                                                        }
                                                                        className="px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                                                                    >
                                                                        {action.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div
                                                        className={`text-xs text-gray-500 mt-1 ${isCurrentUser ? "text-right" : "text-left"}`}
                                                    >
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

                {/* Selector de productos con cantidad */}
                {showProductSelector && (
                    <div className="absolute bottom-20 left-0 right-0 p-2 bg-white border-t shadow-lg z-10">
                        <ProductSelector
                            onSelect={handleReplaceProduct}
                            onCancel={cancelReplace}
                            excludeProductId={pendingReplace?.productId}
                            initialCantidad={pendingReplace?.cantidadOriginal}
                        />
                    </div>
                )}

                {/* Input de mensaje */}
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