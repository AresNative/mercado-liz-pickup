import { PageProps } from "@/utils/types/page";
import { IonContent, IonHeader, IonToolbar, IonButton } from "@ionic/react";
import { IconLiz } from "../productos/components/ionc-liz";
import { useAppSelector } from "@/hooks/selector";
import { RootState } from "@/hooks/store";
import { formatValue } from '@/utils/constants/format-values';
import MainForm from "@/components/form/main-form";
import { CheckOutField } from "./utils/checkoutfield";
import { CheckOutTarjetaField } from "./utils/tarjetacheckoutfiel";
import Calendar from "./components/calendar";
import Sucursales from "./components/map";
import { useCallback, useEffect, useRef, useState } from "react";
import TimeSlots from "./components/time";
import { useGetWithFiltersGeneralInIntelisisMutation, usePostIntelisisMutation } from "@/hooks/reducers/api_int";
import { useGetWithFiltersMutation, usePostMutation, usePutMutation } from "@/hooks/reducers/api";
import { usePedidosSignalR } from "./utils/signalr-pedidos";
import { setLocalStorageItem, getLocalStorageItem } from "@/utils/functions/local-storage";
import { useLoginUserMutation, useRegisterUserMutation } from "@/hooks/reducers/auth";

// Interfaces para tipar los datos
interface InfoUser {
    telefono?: string;
    nombre?: string;
    email?: string;
    [key: string]: any;
}

interface InfoPago {
    numeroTarjeta?: string;
    fechaExpiracion?: string;
    cvv?: string;
    [key: string]: any;
}

type Citas = (args: { user: any; pago: any }) => Promise<void>;

const Checkout: React.FC<PageProps> = ({ onScroll }: PageProps) => {
    // 🔶 SIGNAL-R -> manejo de tiempo real
    const handlePedidoActualizado = (pedido: any) => {
        console.log("Pedido actualizado:", pedido);
    };
    const handleNuevoPedido = (pedido: any) => {
        console.log("Nuevo pedido recibido:", pedido);
    };
    const handlePedidoEliminado = (pedidoId: number) => {
        console.log("Pedido eliminado:", pedidoId);
    }
    const handleRefrescarDatos = () => {
        console.log("Refrescando datos de pedidos...");
    }

    // ✅ CONEXIÓN SIGNAL-R Y GESTIÓN DE PEDIDOS
    const {
        connection,
        isConnected,
        unirseAPedido,
        salirDePedido,
        notificarCambioLista
    } = usePedidosSignalR(
        handlePedidoActualizado,
        handleNuevoPedido,
        handlePedidoEliminado,
        handleRefrescarDatos
    );

    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const [infoUser, setInfoUser] = useState<InfoUser>({});
    const [infoPago, setInfoPago] = useState<InfoPago>({});
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [authLoading, setAuthLoading] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    const infoFormRef = useRef<any>(null);
    const pagoFormRef = useRef<any>(null);

    const cart = useAppSelector((state: RootState) => state.cart);
    const { items = [] } = cart || {}; // Mejor manejo del estado inicial

    const total = items.reduce((sum, item) => {
        return sum + ((item.descuento ? item.descuento : item.precio) * item.quantity);
    }, 0);

    const serv = total * 0.05; //->calculo del 5% de servicio
    const totalConServicio = total + serv; //-> total mas servicio

    // ? mercados-liz
    const [PostData] = usePostMutation()
    const [GetData] = useGetWithFiltersMutation()
    const [PutData] = usePutMutation()
    //? intelisis
    const [PostInt] = usePostIntelisisMutation();
    const [GetInt] = useGetWithFiltersGeneralInIntelisisMutation();

    //? Auth mutations
    const [loginUser] = useLoginUserMutation();
    const [registerUser] = useRegisterUserMutation();

    let newMovId: string = "";

    // Función para autenticar o registrar usuario automáticamente
    const authenticateUser = async (userData: InfoUser): Promise<boolean> => {
        setAuthLoading(true);
        try {
            // Intentar login primero
            const loginPayload = {
                Email: userData.email,
                Password: userData.telefono // Usar teléfono como contraseña
            };

            try {
                const loginResult = await loginUser(loginPayload).unwrap();
                console.log("✅ Login exitoso:", loginResult);
                setIsAuthenticated(true);
                setAuthLoading(false);
                return true;
            } catch (loginError) {
                console.log("Login fallido, intentando registro...", loginError);

                // Si el login falla, registrar nuevo usuario
                const registerPayload = {
                    email: userData.email,
                    password: userData.telefono, // Usar teléfono como contraseña
                    rol: "cliente"
                };

                try {
                    const registerResult = await registerUser(registerPayload).unwrap();
                    console.log("✅ Registro exitoso:", registerResult);

                    // Intentar login después del registro
                    const loginAfterRegister = await loginUser(loginPayload).unwrap();
                    console.log("✅ Login después del registro:", loginAfterRegister);
                    setIsAuthenticated(true);
                    setAuthLoading(false);
                    return true;
                } catch (registerError) {
                    console.error("Error en registro:", registerError);
                    setAuthLoading(false);
                    return false;
                }
            }
        } catch (error) {
            console.error("Error en proceso de autenticación:", error);
            setAuthLoading(false);
            return false;
        }
    };

    // Verificar si hay token existente al cargar el componente
    useEffect(() => {
        const token = getLocalStorageItem("token");
        if (token) {
            setIsAuthenticated(true);
            console.log("✅ Usuario ya autenticado");
        }
    }, []);

    // Función para verificar si el botón debe estar habilitado
    const isConfirmButtonEnabled = (): boolean => {
        return !!(
            selectedDate &&
            selectedTime &&
            !authLoading &&
            !isProcessing
        );
    };

    // Función principal que orquesta todo el proceso en el orden correcto
    const handleConfirmarCitaCompleta = async () => {
        if (!selectedDate || !selectedTime) {
            alert("Por favor selecciona una fecha y hora para la cita.");
            return;
        }

        setIsProcessing(true);

        try {
            // 1. OBTENER DATOS DE FORMULARIOS
            console.log("📝 Obteniendo datos de formularios...");
            const userData = await obtenerDatosFormulario(infoFormRef);
            const pagoData = await obtenerDatosFormulario(pagoFormRef);

            if (!userData || !userData.email || !userData.telefono) {
                throw new Error("Por favor completa la información de usuario (email y teléfono)");
            }

            // 2. AUTENTICAR USUARIO (PRIMERO)
            console.log("🔐 Autenticando usuario...");
            let authSuccess = isAuthenticated;

            if (!isAuthenticated) {
                authSuccess = await authenticateUser(userData);
                if (!authSuccess) {
                    throw new Error("No se pudo autenticar al usuario. Por favor verifica tus datos.");
                }
            }

            // 3. INSERTAR EN INTELISIS (SEGUNDO - requiere autenticación)
            console.log("💾 Insertando en Intelisis...");
            await handleConfirmarCitaIntelisis();

            // 4. CREAR CITA EN SISTEMA PRINCIPAL (TERCERO)
            console.log("📅 Creando cita en sistema principal...");
            await cargarCitasExistentes({ user: userData, pago: pagoData });

            alert("✅ Cita confirmada exitosamente");

        } catch (error) {
            console.error("Error al confirmar cita:", error);
            alert(`❌ Error: ${error instanceof Error ? error.message : "Error al confirmar la cita. Por favor intenta nuevamente."}`);
        } finally {
            setIsProcessing(false);
        }
    };

    // Función auxiliar para obtener datos del formulario
    const obtenerDatosFormulario = async (formRef: React.RefObject<any>, fallbackState?: any): Promise<any> => {
        return new Promise((resolve) => {
            const form = formRef.current;
            // 1) Si el form es un HTMLFormElement (ref directa a <form>)
            if (form && form instanceof HTMLFormElement) {
                const formData = new FormData(form);
                const data: any = {};
                formData.forEach((value, key) => {
                    data[key] = value;
                });
                resolve(data);
                return;
            }

            // 2) Si el componente expone un método para obtener valores (p. ej. getValues, getFormData)
            if (form && typeof form.getValues === "function") {
                try {
                    const values = form.getValues();
                    resolve(values);
                    return;
                } catch (e) {
                    // continuar a fallback
                }
            }
            if (form && typeof form.getFormData === "function") {
                try {
                    const values = form.getFormData();
                    resolve(values);
                    return;
                } catch (e) { }
            }

            // 3) Si no hay ref o no expone método, usar el estado que actualiza el formulario (infoUser / infoPago)
            if (fallbackState && Object.keys(fallbackState).length > 0) {
                resolve(fallbackState);
                return;
            }

            // 4) No se pudo obtener datos
            resolve(null);
        });
    };

    // Función para insertar en Intelisis (requiere autenticación)
    const handleConfirmarCitaIntelisis = async () => {
        try {
            console.log("🔍 Obteniendo última venta para consecutivo...");

            // 1. Obtener la última venta para el consecutivo
            const result = await GetInt({
                table: `[TC032841E_Pruebas].dbo.venta`,
                pageSize: 1,
                page: 1,
                filtros: {
                    "Filtros": [
                        {
                            "Key": "Usuario",
                            "Value": "SISTEMAS02"
                        },
                        {
                            "Key": "MovID",
                            "Value": "Null",
                            "Operator": "<>"
                        }
                    ],
                    "Order": [
                        {
                            "Key": "id",
                            "Direction": "desc"
                        }
                    ]
                },
                signal: undefined,
            });

            if ('data' in result && result.data) {
                const apiResp: any = result.data;
                const apiData = Array.isArray(apiResp.data) ? apiResp.data : apiResp;

                let ventaId: number | string | null = null;
                let MovId: string | null = null;

                if (Array.isArray(apiData) && apiData.length > 0) {
                    ventaId = apiData[0].id ?? apiData[0].Id ?? apiData[0].ID ?? apiData[0].ventaId ?? null;
                    MovId = apiData[0].MovID ?? apiData[0].MovID ?? apiData[0].MOVID ?? apiData[0].MovId ?? null;
                } else if (typeof apiData === "object" && apiData !== null) {
                    ventaId = apiData.id ?? apiData.Id ?? apiData.ID ?? apiData.ventaId ?? null;
                    MovId = apiData.MovID ?? apiData.MovID ?? apiData.MOVID ?? apiData.MovId ?? null;
                }

                if (ventaId != null && MovId != null) {
                    console.log("📊 Venta obtenida:", ventaId, MovId);

                    // 2. Generar nuevo MovID (consecutivo +1)
                    const movIdParts = MovId.split('-');
                    const prefix = movIdParts[0];
                    const currentNumber = parseInt(movIdParts[1]);
                    newMovId = `${prefix}-${currentNumber + 1}`;

                    console.log("🆕 Nuevo MovID generado:", newMovId);

                    // 3. Realizar los inserts en Intelisis
                    console.log("💾 Realizando inserts en Intelisis...");

                    // Insert 1: Venta
                    const ventaData = {
                        Empresa: "SMM",
                        Mov: "Pedido",
                        MovID: newMovId,
                        FechaEmision: new Date().toISOString().split('T')[0] + 'T00:00:00',
                        UltimoCambio: new Date().toISOString().slice(0, 23),
                        Concepto: "PICK UP",
                        Moneda: "Pesos",
                        TipoCambio: 1,
                        Usuario: "SISTEMAS02",
                        Estatus: "PENDIENTE",
                        Cliente: "MOSTRADOR",
                        Almacen: "ALMMAYO",
                        Importe: total,
                        Impuestos: 0,
                        Saldo: total,
                        CostoTotal: total * 0.6,
                        PrecioTotal: total,
                        ServicioExpress: true,
                        Sucursal: 1
                    };

                    await PostInt({
                        table: "[TC032841E_Pruebas].dbo.Venta",
                        data: ventaData,
                        signal: undefined
                    });

                    // Insert 2: Mov
                    const movData = {
                        ID: parseInt(ventaId.toString()) + 1,
                        Empresa: "SMM",
                        Modulo: "VTAS",
                        Mov: "Pedido",
                        MovID: newMovId,
                        FechaEmision: new Date().toISOString().split('T')[0] + 'T00:00:00',
                        FechaRegistro: new Date().toISOString().split('T')[0] + 'T00:00:00',
                        Concepto: "PICK UP",
                        Ejercicio: 2025,
                        Periodo: new Date().getMonth() + 1,
                        Moneda: "Pesos",
                        TipoCambio: 1,
                        Usuario: "SISTEMAS02",
                        Sucursal: 1
                    };

                    await PostInt({
                        table: "[TC032841E_Pruebas].dbo.Mov",
                        data: movData,
                        signal: undefined
                    });

                    // Insert 3: Movimientos
                    const movimientosData = {
                        ID: parseInt(ventaId.toString()) + 1,
                        Empresa: "SMM",
                        Modulo: "VTAS",
                        Mov: "Pedido",
                        MovID: newMovId,
                        FechaEmision: new Date().toISOString().split('T')[0] + 'T00:00:00',
                        Moneda: "Pesos",
                        TipoCambio: 1,
                        Importe: total,
                        Estatus: "PENDIENTE",
                        Impuestos: total * 0.16,
                        Retencion: 0
                    };

                    await PostInt({
                        table: "[TC032841E_Pruebas].dbo.Movimientos",
                        data: movimientosData,
                        signal: undefined
                    });

                    // Insert 4: VentaD (Detalle de venta)
                    console.log("📦 Insertando detalles de venta...");
                    const ventaDList = items.map((item, idx) => {
                        const unitPrice = item.descuento ? item.descuento : item.precio;
                        const cantidad = item.quantity ?? 1;
                        return {
                            ID: parseInt(ventaId.toString()) + 1,
                            Renglon: 2048 + idx,
                            RenglonSub: 0,
                            RenglonID: idx + 1,
                            RenglonTipo: "N",
                            Cantidad: cantidad,
                            Almacen: "ALMMAYO",
                            Codigo: String(item.id ?? ""),
                            Articulo: String(item.articulo ?? ""),
                            Precio: unitPrice,
                            PrecioSugerido: unitPrice,
                            DescuentoLinea: 0,
                            Impuesto1: item.impuesto1,
                            Impuesto2: item.impuesto2,
                            Costo: unitPrice * 0.6,
                            CantidadReservada: cantidad,
                            Unidad: item.unidad ?? "Unidad",
                            Factor: 1,
                            CantidadInventario: cantidad,
                            FechaRequerida: new Date().toISOString().split('T')[0] + 'T00:00:00',
                            Sucursal: 1,
                            TipoImpuesto1: item.tipoImpuesto1,
                            TipoImpuesto2: item.tipoImpuesto2
                        };
                    });

                    for (const ventaDData of ventaDList) {
                        await PostInt({
                            table: "[TC032841E_Pruebas].dbo.VentaD",
                            data: ventaDData,
                            signal: undefined
                        });
                    }

                    // Insertar servicio de pickup
                    await PostInt({
                        table: "[TC032841E_Pruebas].dbo.VentaD",
                        data: {
                            ID: parseInt(ventaId.toString()) + 1,
                            Renglon: 2048,
                            RenglonSub: 0,
                            RenglonID: 1,
                            RenglonTipo: "N",
                            Cantidad: 1,
                            Almacen: "ALMMAYO",
                            Codigo: "SPICKUP",
                            Articulo: "999911112",
                            Precio: serv,
                            PrecioSugerido: serv,
                            DescuentoLinea: 0,
                            Impuesto1: 8,
                            Costo: '0.01',
                            CantidadReservada: 1,
                            Unidad: "servicio",
                            Factor: 1,
                            FechaRequerida: new Date().toISOString().split('T')[0] + 'T00:00:00',
                            Sucursal: 1,
                            TipoImpuesto1: 'IVA8',
                        },
                        signal: undefined
                    });

                    console.log("✅ Todos los inserts en Intelisis realizados exitosamente");
                    console.log("📋 Nuevo MovID:", newMovId);

                } else {
                    throw new Error("No se encontró información de venta para generar el consecutivo");
                }
            } else {
                throw new Error("No se pudo obtener información de ventas anteriores");
            }
        } catch (error) {
            console.error("❌ Error en Intelisis:", error);
            throw new Error(`Error al procesar en Intelisis: ${error instanceof Error ? error.message : "Error desconocido"}`);
        }
    };

    const cargarCitasExistentes: Citas = useCallback(async ({ user, pago }: { user: any; pago: any }) => {
        try {
            // Validaciones mínimas
            if (!user || !items || items.length === 0) {
                throw new Error("No hay usuario o items para crear la lista");
            }

            // Evitar inserciones duplicadas
            const dedupeKey = `pickup_lista_${user.telefono ?? user.email ?? "anon"}_${selectedDate}_${selectedTime}`;
            if (localStorage.getItem(dedupeKey)) {
                console.log("ℹ️ La lista ya fue creada previamente");
                return;
            }

            let clienteId: number | string | null = null;
            let clienteObj: any = null;

            // Buscar cliente existente
            if (user.telefono) {
                const getRes: any = await GetData({
                    url: "v1/pickup/clientes",
                    filtros: {
                        Filtros: [{ Key: "telefono", Value: user.telefono }],
                        Order: [{ Key: "id", Direction: "Desc" }]
                    },
                    pageSize: 1
                });

                const clientes = getRes?.data ?? null;
                if (clientes && Array.isArray(clientes.data) && clientes.data.length > 0) {
                    clienteObj = clientes.data[0];
                    clienteId = clienteObj.id;
                }
            }

            // Crear cliente si no existe
            if (!clienteId) {
                const dataCliente = {
                    nombre: user.nombre ?? "",
                    telefono: user.telefono ?? "",
                    email: user.email ?? ""
                };

                if (!dataCliente.nombre && !dataCliente.telefono && !dataCliente.email) {
                    throw new Error("No hay datos suficientes para crear un cliente");
                }

                const postRes: any = await PostData({ url: "v1/pickup/clientes", data: dataCliente });
                const createdId = postRes?.data?.ids?.[0] ?? postRes?.data?.id ?? postRes?.data?.clienteId ?? null;
                if (createdId) {
                    clienteId = createdId;
                    clienteObj = postRes?.data ?? { id: createdId, ...dataCliente };
                } else {
                    throw new Error("No se pudo crear el cliente");
                }
            }

            if (!clienteId) {
                throw new Error("No se pudo determinar el ID del cliente");
            }

            // Guardar info de usuario localmente
            setLocalStorageItem("user", clienteId);
            if (clienteObj) setLocalStorageItem("user-data", clienteObj);

            // Crear lista
            const listaPayload = {
                id_cliente: clienteId,
                usuario_id: clienteId,
                sucursal_id: 1,
                nombre_lista: `${selectedDate ?? ""} ${selectedTime ?? ""}`.trim(),
                servicio: "Pickup",
                fecha_creacion: new Date().toISOString(),
                estado: "nuevo",
                array_lista: JSON.stringify(items)
            };

            await PostData({ url: "v1/pickup/listas", data: listaPayload });

            // Marcar como creado para evitar duplicados
            localStorage.setItem(dedupeKey, "1");
            console.log("✅ Lista creada correctamente");

            // Notificar via SignalR
            if (isConnected && connection) {
                try {
                    await notificarCambioLista("created", {
                        listaId: listaPayload.nombre_lista,
                        clienteId: clienteId,
                        fecha: selectedDate,
                        hora: selectedTime
                    });
                    console.log("📢 Cambio notificado via SignalR");
                } catch (signalRError) {
                    console.error("Error notificando via SignalR:", signalRError);
                }
            }

        } catch (error) {
            console.error("❌ Error creando cita:", error);
            throw error;
        }
    }, [GetData, PostData, PutData, items, selectedDate, selectedTime, isConnected, connection, notificarCambioLista]);

    return (
        <IonContent
            fullscreen
            scrollEvents
            onIonScroll={(e) => {
                const isScrolled = e.detail.scrollTop > 10;
                onScroll?.(isScrolled);
            }}
        >
            <IonHeader collapse="condense"
                className="custom-toolbar h-fit absolute -top-0"
            >
                <IonToolbar>
                    <IconLiz fill={onScroll ? "#FFF" : "#7927F5"} width={55} />
                </IonToolbar>
            </IonHeader>

            {/*  Contenedor general */}
            <section className="flex flex-col md:flex-row-reverse gap-4 px-4 mt-6 max-w-6xl mx-auto">
                <div className="md:w-1/3">
                    {/*  Resumen del pedido */}
                    <article className="w-full bg-white rounded-xl border border-gray-200 p-4 shadow-sm h-fit z-50 sticky top-4">
                        <h2 className="font-bold text-lg mb-4">Resumen del pedido</h2>
                        <p className="flex justify-between"><span className="text-gray-500">Subtotal</span>{total > 0 && (formatValue(total, "currency"))}</p>
                        <p className="flex justify-between"><span className="text-gray-500">Tarifa de servicio</span> {formatValue(serv, "currency")}</p>
                        <hr className="my-3" />
                        <p className="flex justify-between font-semibold"><span>Total</span>{formatValue(totalConServicio, "currency")}</p>

                        {/* Estado de autenticación */}
                        <div className="mt-3 text-sm">
                            {authLoading ? (
                                <p className="text-blue-600">🔐 Autenticando usuario...</p>
                            ) : isAuthenticated ? (
                                <p className="text-green-600">✅ Usuario autenticado</p>
                            ) : (
                                <p className="text-orange-600">⚠️ Complete información de usuario</p>
                            )}
                        </div>

                        {/* Estado del proceso */}
                        {isProcessing && (
                            <p className="text-blue-600 text-sm mt-2">🔄 Procesando cita...</p>
                        )}

                        <IonButton
                            expand="block"
                            shape="round"
                            className="custom-tertiary mt-5"
                            onClick={handleConfirmarCitaCompleta}
                            disabled={!isConfirmButtonEnabled()}
                        >
                            {isProcessing ? "Procesando..." : authLoading ? "Autenticando..." : "Confirmar cita"}
                        </IonButton>
                    </article>

                    <Sucursales sucursalVista="(Precio Lista)" />
                </div>

                {/*  Secciones principales */}
                <section className="flex flex-col gap-4 w-full md:w-2/3">
                    <Calendar selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
                    <TimeSlots selectedDate={selectedDate} selectedTime={selectedTime} setSelectedTime={setSelectedTime} />
                    <div className="border-2 rounded-lg p-4">
                        <h2 className="font-bold text-lg mb-2">Información</h2>
                        <MainForm
                            ref={infoFormRef}
                            actionType=""
                            dataForm={CheckOutField()}
                            message_button=""
                            onSuccess={(result) => {
                                setInfoUser(result);
                            }}
                            showButton={false}
                        />
                    </div>
                    <div className="border-2 rounded-lg p-4">
                        <h2 className="font-bold text-lg mb-1">Forma de pago</h2>
                        <h3 className="text-sm mb-1">Ingresa los detalles de tu forma de pago para completar la compra.</h3>
                        <MainForm
                            ref={pagoFormRef}
                            actionType=""
                            dataForm={CheckOutTarjetaField()}
                            message_button=""
                            onSuccess={(result) => {
                                setInfoPago(result);
                            }}
                            showButton={false}
                        />
                    </div>
                </section>
            </section>

        </IonContent>
    );
};

export default Checkout;