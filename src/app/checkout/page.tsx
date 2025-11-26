import { PageProps } from "@/utils/types/page";
import { IonContent, IonHeader, IonToolbar, IonButton } from "@ionic/react";
import { IconLiz } from "../productos/components/ionc-liz";
import { useAppSelector, useAppDispatch } from "@/hooks/selector";
import { RootState } from "@/hooks/store";
import { formatValue } from '@/utils/constants/format-values';
import MainForm from "@/components/form/main-form";
import { CheckOutField } from "./utils/checkoutfield";
import { CheckOutTarjetaField } from "./utils/tarjetacheckoutfiel";
import Calendar from "./components/calendar";
import Sucursales from "./components/map";
import { useCallback, useEffect, useRef, useState } from "react";
import TimeSlots from "./components/time";

// API
import {
    useGetWithFiltersGeneralInIntelisisMutation,
    usePostIntelisisMutation
} from "@/hooks/reducers/api_int";

import {
    useGetWithFiltersMutation,
    usePostMutation,
    usePutMutation
} from "@/hooks/reducers/api";

import {
    useLoginUserMutation,
    useRegisterUserMutation,
    useLogoutUserMutation
} from "@/hooks/reducers/auth";

import {
    setLocalStorageItem,
    getLocalStorageItem
} from "@/utils/functions/local-storage";

import { usePedidosSignalR } from "./utils/signalr-pedidos";
import { clearCart } from "@/hooks/slices/cart";

// --- INTERFACES ---
interface UserInfo {
    telefono?: string;
    nombre?: string;
    email?: string;
    correo?: string;
    [key: string]: any;
}

interface PaymentInfo {
    numeroTarjeta?: string;
    fechaExpiracion?: string;
    cvv?: string;
    [key: string]: any;
}

interface FormData {
    user: UserInfo;
    pago: PaymentInfo;
}

// --- CONSTANTES ---
const INTELISIS_CONFIG = {
    database: "[TC032841E_Pruebas].dbo",
    empresa: "SMM",
    almacen: "ALMMAYO",
    usuario: "SISTEMAS02",
    moneda: "Pesos"
} as const;

// --- UTILIDADES ---
const calculateCartTotal = (items: any[]) => {
    return items.reduce((sum, item) => {
        const unitPrice = item.descuento || item.precio;
        return sum + (unitPrice * item.quantity);
    }, 0);
};

const generateNewMovId = (lastMovId: string): string => {
    const movIdParts = lastMovId.split('-');
    const prefix = movIdParts[0];
    const currentNumber = parseInt(movIdParts[1]);
    return `${prefix}-${currentNumber + 1}`;
};

const getCurrentDateTime = () => {
    const now = new Date();
    return {
        date: now.toISOString().split('T')[0] + 'T00:00:00',
        timestamp: now.toISOString().slice(0, 23)
    };
};

// --- COMPONENTE PRINCIPAL ---
const Checkout: React.FC<PageProps> = ({ onScroll }: PageProps) => {
    // --- ESTADOS ---
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [userInfo, setUserInfo] = useState<UserInfo>({});
    const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({});
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [authLoading, setAuthLoading] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [shouldRedirect, setShouldRedirect] = useState<boolean>(false);

    // --- REFERENCIAS ---
    const userFormRef = useRef<{
        getFormData: () => any;
        submitForm: () => Promise<any>;
        getLiveValues: () => any; // ✅ Añade esta línea
    }>(null);

    const paymentFormRef = useRef<{
        getFormData: () => any;
        submitForm: () => Promise<any>;
        getLiveValues: () => any; // ✅ Añade esta línea
    }>(null);

    // --- HOOKS ---
    const dispatch = useAppDispatch();
    const cart = useAppSelector((state: RootState) => state.cart);
    const { items = [] } = cart || {};

    // SignalR
    const { connection, isConnected, notificarCambioLista } = usePedidosSignalR(
        (p) => console.log("Pedido actualizado:", p),
        (p) => console.log("Nuevo pedido:", p),
        (id) => console.log("Pedido borrado:", id),
        () => console.log("Refrescar")
    );

    // API Mutations
    const [PostData] = usePostMutation();
    const [GetData] = useGetWithFiltersMutation();
    const [PutData] = usePutMutation();
    const [PostInt] = usePostIntelisisMutation();
    const [GetInt] = useGetWithFiltersGeneralInIntelisisMutation();
    const [loginUser] = useLoginUserMutation();
    const [registerUser] = useRegisterUserMutation();
    const [logoutUser] = useLogoutUserMutation();

    // --- CÁLCULOS ---
    const subtotal = calculateCartTotal(items);
    const serviceFee = subtotal * 0.02;
    const totalWithService = subtotal + serviceFee;

    // --- EFECTOS ---
    useEffect(() => {
        const token = getLocalStorageItem("token");
        if (token) {
            setIsAuthenticated(true);
        }
    }, []);

    useEffect(() => {
        if (shouldRedirect) {
            console.log("✅ Redirigiendo a /seguimiento...");
            window.location.href = '/seguimiento';
        }
    }, [shouldRedirect]);

    // --- FUNCIONES DE AUTENTICACIÓN ---
    const resetAuthentication = async (): Promise<void> => {
        try {
            console.log("🔄 Reiniciando autenticación...");
            const userId = getLocalStorageItem("user-id");
            await logoutUser(userId).unwrap();
            setIsAuthenticated(false);
            console.log("✅ Sesión cerrada correctamente");
        } catch (error) {
            console.error("❌ Error al cerrar sesión:", error);
            setIsAuthenticated(false);
        }
    };

    const updateUserData = async (userData: UserInfo): Promise<boolean> => {
        try {
            if (!userData.correo || !userData.telefono) {
                console.error("❌ Datos insuficientes para actualizar usuario:", userData);
                return false;
            }

            console.log("📝 Actualizando datos del usuario:", userData);

            const existingUser = await GetData({
                url: "v1/users",
                filtros: {
                    Filtros: [{ Key: "email", Value: userData.correo }],
                    Order: [{ Key: "id", Direction: "Desc" }]
                },
                pageSize: 1
            });

            const users = existingUser?.data?.data ?? [];

            if (users.length > 0 && userData.correo !== users[0].email) {
                const userId = getLocalStorageItem("user-id");
                await PutData({
                    url: "v1/users",
                    id: userId,
                    data: { email: userData.correo }
                });
                console.log("✅ Usuario actualizado correctamente");
            }

            return true;
        } catch (error) {
            console.error("❌ Error al actualizar datos del usuario:", error);
            return false;
        }
    };

    const authenticateUser = async (userData: UserInfo): Promise<boolean> => {
        setAuthLoading(true);

        try {
            if (!userData.correo || !userData.telefono) {
                console.error("❌ Datos insuficientes para autenticar:", userData);
                return false;
            }

            console.log("🔐 Datos para login:", userData);

            const loginPayload = {
                Email: userData.correo,
                Password: userData.telefono
            };

            try {
                await loginUser(loginPayload).unwrap();
                console.log("✅ Login exitoso");
                setIsAuthenticated(true);
                await updateUserData(userData);
                return true;
            } catch {
                console.log("⚠ Login falló, intentando registro...");

                const registerPayload = {
                    email: userData.correo,
                    password: userData.telefono,
                    nombre: userData.nombre || "Cliente",
                    rol: "cliente"
                };

                await registerUser(registerPayload).unwrap();
                console.log("✅ Registrado correctamente");

                await loginUser(loginPayload).unwrap();
                console.log("✅ Login posterior al registro exitoso");

                setIsAuthenticated(true);
                await updateUserData(userData);
                return true;
            }
        } catch (error) {
            console.error("❌ Error en autenticación:", error);
            return false;
        } finally {
            setAuthLoading(false);
        }
    };

    // --- FUNCIONES DE DATOS DEL FORMULARIO ---
    const getFormData = async (): Promise<FormData> => {
        await userFormRef.current?.submitForm?.();
        await paymentFormRef.current?.submitForm?.();

        const userData = userFormRef.current?.getFormData?.() || {};
        const paymentData = paymentFormRef.current?.getFormData?.() || {};

        return {
            user: { ...userInfo, ...userData },
            pago: { ...paymentInfo, ...paymentData }
        };
    };

    // --- ESTADOS ADICIONALES ---
    const [formValues, setFormValues] = useState<{
        userValues: any;
        paymentValues: any;
    }>({ userValues: {}, paymentValues: {} });

    // --- EFECTO PARA OBTENER VALORES EN TIEMPO REAL ---
    useEffect(() => {
        const interval = setInterval(() => {
            const userValues = userFormRef.current?.getLiveValues?.() || {};
            const paymentValues = paymentFormRef.current?.getLiveValues?.() || {};

            setFormValues({ userValues, paymentValues });
        }, 500); // Actualiza cada 500ms

        return () => clearInterval(interval);
    }, []);

    // --- isConfirmButtonEnabled ACTUALIZADO ---
    const isConfirmButtonEnabled = useCallback((): boolean => {
        const { userValues, paymentValues } = formValues;

        const hasUserData = Boolean(
            userValues.telefono &&
            userValues.Nombre &&
            userValues.correo
        );

        const hasPaymentData = Boolean(
            paymentValues.pago === "Tarjeta Credito/Debito" ? (
                paymentValues.numero_tarjeta &&
                paymentValues.vencimiento &&
                paymentValues.cvv) : paymentValues.pago
        );

        const hasDateTime = Boolean(selectedDate && selectedTime);
        const hasCartItems = items.length > 0;

        const isValid = hasDateTime && hasUserData && hasPaymentData && hasCartItems;

        return isValid;
    }, [selectedDate, selectedTime, items.length, formValues]); // ✅ Depende de formValues

    // --- FUNCIONES INTELISIS (SIN MODIFICAR DATOS) ---
    const getLastSaleInfo = async () => {
        const result = await GetInt({
            table: `${INTELISIS_CONFIG.database}.venta`,
            pageSize: 1,
            page: 1,
            filtros: {
                Filtros: [
                    { Key: "Usuario", Value: INTELISIS_CONFIG.usuario },
                    { Key: "MovID", Value: "Null", Operator: "<>" }
                ],
                Order: [{ Key: "id", Direction: "desc" }]
            },
            signal: undefined,
        });

        if (!('data' in result) || !result.data) {
            throw new Error("No se pudo obtener información de ventas anteriores");
        }

        const apiData = Array.isArray(result.data.data) ? result.data.data : result.data;

        if (!Array.isArray(apiData) || apiData.length === 0) {
            throw new Error("No se encontró información de venta para generar el consecutivo");
        }

        const lastSale = apiData[0];
        const saleId = lastSale.id ?? lastSale.Id ?? lastSale.ID ?? lastSale.ventaId;
        const movId = lastSale.MovID ?? lastSale.MovId ?? lastSale.MOVID;

        if (saleId == null || movId == null) {
            throw new Error("Datos de venta incompletos");
        }

        return { saleId, movId };
    };

    const insertIntelisisData = async (newMovId: string, saleId: number) => {
        const { date, timestamp } = getCurrentDateTime();
        const baseId = parseInt(saleId.toString()) + 1;

        // 1. Insertar Venta
        const saleData = {
            Empresa: INTELISIS_CONFIG.empresa,
            Mov: "Pedido",
            MovID: newMovId,
            FechaEmision: date,
            UltimoCambio: timestamp,
            Concepto: "PICK UP",
            Moneda: INTELISIS_CONFIG.moneda,
            TipoCambio: 1,
            Usuario: INTELISIS_CONFIG.usuario,
            Estatus: "PENDIENTE",
            Cliente: "MOSTRADOR",
            Almacen: INTELISIS_CONFIG.almacen,
            Importe: subtotal,
            Impuestos: 0,
            Saldo: subtotal,
            CostoTotal: subtotal * 0.6,
            PrecioTotal: subtotal,
            ServicioExpress: true,
            Sucursal: 4
        };

        const saleResult = await PostInt({
            table: `${INTELISIS_CONFIG.database}.Venta`,
            data: saleData,
            signal: undefined
        });

        if ('error' in saleResult) {
            throw new Error(`Error en insert Venta: ${JSON.stringify(saleResult.error)}`);
        }

        // 2. Insertar Mov
        const movData = {
            ID: baseId,
            Empresa: INTELISIS_CONFIG.empresa,
            Modulo: "VTAS",
            Mov: "Pedido",
            MovID: newMovId,
            FechaEmision: date,
            FechaRegistro: date,
            Concepto: "PICK UP",
            Ejercicio: 2025,
            Periodo: new Date().getMonth() + 1,
            Moneda: INTELISIS_CONFIG.moneda,
            TipoCambio: 1,
            Usuario: INTELISIS_CONFIG.usuario,
            Sucursal: 4
        };

        const movResult = await PostInt({
            table: `${INTELISIS_CONFIG.database}.Mov`,
            data: movData,
            signal: undefined
        });

        if ('error' in movResult) {
            throw new Error(`Error en insert Mov: ${JSON.stringify(movResult.error)}`);
        }

        // 3. Insertar Movimientos
        const movementsData = {
            ID: baseId,
            Empresa: INTELISIS_CONFIG.empresa,
            Modulo: "VTAS",
            Mov: "Pedido",
            MovID: newMovId,
            FechaEmision: date,
            Moneda: INTELISIS_CONFIG.moneda,
            TipoCambio: 1,
            Importe: subtotal,
            Estatus: "PENDIENTE",
            Impuestos: subtotal * 0.16,
            Retencion: 0
        };

        const movementsResult = await PostInt({
            table: `${INTELISIS_CONFIG.database}.Movimientos`,
            data: movementsData,
            signal: undefined
        });

        if ('error' in movementsResult) {
            throw new Error(`Error en insert Movimientos: ${JSON.stringify(movementsResult.error)}`);
        }

        return baseId;
    };

    const insertSaleDetails = async (baseId: number, newMovId: string) => {
        const { date } = getCurrentDateTime();
        const baseRow = 2048;

        // Insertar servicio de pickup
        const serviceData = {
            ID: baseId,
            Renglon: baseRow,
            RenglonSub: 0,
            RenglonID: 1,
            RenglonTipo: "N",
            Cantidad: 1,
            Almacen: INTELISIS_CONFIG.almacen,
            Codigo: "SPICKUP",
            Articulo: "999911112",
            Precio: serviceFee,
            PrecioSugerido: serviceFee,
            DescuentoLinea: 0,
            Impuesto1: 8,
            Costo: '0.01',
            CantidadReservada: 1,
            Unidad: "servicio",
            Factor: 1,
            FechaRequerida: date,
            Sucursal: 4,
            TipoImpuesto1: 'IVA8',
        };

        const serviceResult = await PostInt({
            table: `${INTELISIS_CONFIG.database}.VentaD`,
            data: serviceData,
            signal: undefined
        });

        if ('error' in serviceResult) {
            throw new Error(`Error en insert Servicio: ${JSON.stringify(serviceResult.error)}`);
        }

        // Insertar items del carrito
        const saleItems = items.map((item, index) => {
            const unitPrice = item.descuento || item.precio;
            const quantity = item.quantity || 1;

            return {
                ID: baseId,
                Renglon: baseRow + (index + 1),
                RenglonSub: 0,
                RenglonID: index + 2,
                RenglonTipo: "N",
                Cantidad: quantity,
                Almacen: INTELISIS_CONFIG.almacen,
                Codigo: String(item.codigo || ""),
                Articulo: String(item.articulo || ""),
                Precio: unitPrice,
                PrecioSugerido: unitPrice,
                DescuentoLinea: 0,
                Impuesto1: item.impuesto1,
                Impuesto2: item.impuesto2,
                Costo: unitPrice * 0.6,
                CantidadReservada: quantity,
                Unidad: item.unidad || "Unidad",
                Factor: 1,
                CantidadInventario: quantity,
                FechaRequerida: date,
                Sucursal: 4,
                TipoImpuesto1: item.tipoImpuesto1,
                TipoImpuesto2: item.tipoImpuesto2
            };
        });

        for (const itemData of saleItems) {
            const itemResult = await PostInt({
                table: `${INTELISIS_CONFIG.database}.VentaD`,
                data: itemData,
                signal: undefined
            });

            if ('error' in itemResult) {
                throw new Error(`Error en insert Item: ${JSON.stringify(itemResult.error)}`);
            }
        }
    };

    const processIntelisisOrder = async (): Promise<string> => {
        console.log("🚀 Iniciando proceso Intelisis...");

        const { saleId, movId } = await getLastSaleInfo();
        console.log("📊 Venta obtenida:", saleId, movId);

        const newMovId = generateNewMovId(movId);
        console.log("🆕 Nuevo MovID generado:", newMovId);

        console.log("💾 Realizando inserts en Intelisis...");
        const baseId = await insertIntelisisData(newMovId, saleId);

        console.log("📦 Insertando detalles de venta...");
        await insertSaleDetails(baseId, newMovId);

        console.log("✅ Todos los inserts en Intelisis realizados exitosamente");
        return newMovId;
    };

    // --- FUNCIONES PRINCIPALES ---
    const retryWithAuth = async (maxRetries: number = 2): Promise<void> => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            console.log(`🔄 Reintento ${attempt}/${maxRetries}...`);

            await resetAuthentication();

            const { user: currentUser } = await getFormData();
            const authSuccess = await authenticateUser(currentUser);

            if (!authSuccess) {
                throw new Error("No se pudo reautenticar después del error");
            }

            console.log("✅ Reautenticación exitosa, reintentando operación...");
        }
    };

    const savePickupAppointment = useCallback(async ({ user, pago }: FormData) => {
        if (!user || items.length === 0) {
            throw new Error("Datos de usuario o carrito incompletos");
        }

        const duplicateKey = `pickup_${user.telefono}_${selectedDate}_${selectedTime}`;
        if (localStorage.getItem(duplicateKey)) {
            return;
        }

        // Buscar o crear cliente
        const clientResponse = await GetData({
            url: "v1/pickup/clientes",
            filtros: {
                Filtros: [{ Key: "telefono", Value: user.telefono }],
                Order: [{ Key: "id", Direction: "Desc" }]
            },
            pageSize: 1
        });

        const clients = clientResponse?.data?.data ?? [];
        const userId = getLocalStorageItem("user-id");
        let clientId: any = null;

        if (clients.length > 0) {
            clientId = clients[0].id;
        } else {
            const createResponse = await PostData({
                url: "v1/pickup/clientes",
                data: {
                    nombre: `${user.Nombre} ${user.Apellidos || ""}`.trim(),
                    telefono: user.telefono,
                    email: user.correo,
                    fecha_registro: new Date().toISOString(),
                    usuario_id: userId
                }
            });

            clientId = createResponse?.data?.ids?.[0];
        }

        setLocalStorageItem("user", clientId);

        // Crear array_lista que incluye los productos + servicio pick-up
        const itemsWithPickupService = [
            // Servicio pick-up como primer item
            {
                id: "servicio-pickup",
                codigo: "SPICKUP",
                articulo: "Servicio Pick-Up",
                nombre: `Servicio de recogida para ${selectedDate} ${selectedTime}`,
                precio: serviceFee,
                quantity: 1,
                unidad: "servicio",
                impuesto1: 8,
                tipoImpuesto1: "IVA8",
                esServicio: true,
                fecha_servicio: selectedDate,
                hora_servicio: selectedTime
            },
            // Items del carrito
            ...items.map(item => ({
                ...item,
                esServicio: false
            }))
        ];

        // Crear lista de pickup
        await PostData({
            url: "v1/pickup/listas",
            data: {
                id_cliente: clientId,
                usuario_id: userId,
                sucursal_id: 1,
                nombre_lista: `${selectedDate} ${selectedTime}`,
                servicio: "Pickup",
                fecha_creacion: new Date().toISOString(),
                estado: "nuevo",
                array_lista: JSON.stringify(itemsWithPickupService),
            }
        });

        localStorage.setItem(duplicateKey, "1");

        // Notificar via SignalR
        if (isConnected && connection) {
            await notificarCambioLista("created", {
                listaId: `${selectedDate} ${selectedTime}`,
                clientId,
                fecha: selectedDate,
                hora: selectedTime,
                servicio: "pickup",
                costoServicio: serviceFee,
                totalItems: itemsWithPickupService.length
            });
        }

        console.log("✅ Servicio pick-up agregado al array_lista correctamente");
    }, [GetData, PostData, items, selectedDate, selectedTime, isConnected, connection, notificarCambioLista, serviceFee, totalWithService, subtotal]);

    const confirmCompleteAppointment = async (): Promise<void> => {
        setIsProcessing(true);

        try {
            const formData = await getFormData();
            console.log("📝 Datos usuario antes de login:", formData.user);

            if (!isAuthenticated) {
                const authSuccess = await authenticateUser(formData.user);
                if (!authSuccess) {
                    throw new Error("No se pudo autenticar");
                }
            }

            try {
                await processIntelisisOrder();
                await savePickupAppointment(formData);

                setShouldRedirect(true);
                dispatch(clearCart());
            } catch {
                await retryWithAuth();
                await confirmCompleteAppointment();
            }
        } catch (error: any) {
            console.error("❌ Error en confirmación de cita:", error);
            alert(`Error: ${error.message || "No se pudo crear la cita"}`);
        } finally {
            setIsProcessing(false);
        }
    };

    // --- RENDER ---
    return (
        <IonContent
            fullscreen
            scrollEvents
            onIonScroll={(e) => {
                const isScrolled = e.detail.scrollTop > 10;
                onScroll?.(isScrolled);
            }}>

            <IonHeader collapse="condense" className="custom-toolbar h-fit absolute -top-0">
                <IonToolbar>
                    <a className='decoration-none cursor-pointer' href='/productos'>
                        <IconLiz fill={onScroll ? "#FFF" : "#7927F5"} width={55} />
                    </a>
                </IonToolbar>
            </IonHeader>

            <section className="flex flex-col-reverse md:flex-row-reverse gap-4 px-4 my-16 md:my-6 max-w-6xl mx-auto">
                {/* RESUMEN DEL PEDIDO */}
                <div className="md:w-1/3">
                    <article className="bg-white rounded-xl border p-4 shadow-sm sticky top-4 z-50">
                        <h2 className="font-bold text-lg mb-4">Resumen del pedido</h2>

                        <div className="space-y-2">
                            <p className="flex justify-between">
                                <span>Subtotal</span>
                                {formatValue(subtotal, "currency")}
                            </p>
                            <p className="flex justify-between">
                                <span>Servicio</span>
                                {formatValue(serviceFee, "currency")}
                            </p>
                            <hr className="my-3" />
                            <p className="flex justify-between font-semibold">
                                <span>Total</span>
                                {formatValue(totalWithService, "currency")}
                            </p>
                        </div>

                        {isProcessing && <p className="text-center mt-3">Procesando...</p>}

                        <IonButton
                            expand="block"
                            shape="round"
                            className="custom-tertiary mt-5"
                            onClick={confirmCompleteAppointment}
                            disabled={!isConfirmButtonEnabled() || isProcessing || authLoading}
                        >
                            {getButtonText(isProcessing, authLoading, shouldRedirect)}
                        </IonButton>
                    </article>

                    <Sucursales sucursalVista="(Precio Lista)" />
                </div>

                {/* FORMULARIOS */}
                <section className="flex flex-col gap-4 w-full md:w-2/3">
                    <Calendar
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                    />

                    <TimeSlots
                        selectedDate={selectedDate}
                        selectedTime={selectedTime}
                        setSelectedTime={setSelectedTime}
                    />

                    <FormSection
                        title="Información"
                        formRef={userFormRef}
                        formConfig={CheckOutField()}
                        onSuccess={setUserInfo}
                    />

                    <FormSection
                        title="Forma de pago"
                        formRef={paymentFormRef}
                        formConfig={CheckOutTarjetaField()}
                        onSuccess={setPaymentInfo}
                    />
                </section>
            </section>
        </IonContent>
    );
};

// --- COMPONENTES AUXILIARES ---
const getButtonText = (isProcessing: boolean, authLoading: boolean, shouldRedirect: boolean): string => {
    if (isProcessing) return "🔄 Procesando...";
    if (authLoading) return "🔐 Autenticando...";
    if (shouldRedirect) return "✅ Redirigiendo...";
    return "📅 Confirmar cita";
};

interface FormSectionProps {
    title: string;
    formRef: React.RefObject<any>;
    formConfig: any;
    onSuccess: (data: any) => void;
}

const FormSection: React.FC<FormSectionProps> = ({ title, formRef, formConfig, onSuccess }) => (
    <div className="border-2 rounded-lg p-4">
        <h2 className="font-bold text-lg mb-2">{title}</h2>
        <MainForm
            message_button=""
            ref={formRef}
            actionType=""
            dataForm={formConfig}
            onSuccess={onSuccess}
            showButton={false}
        />
    </div>
);

export default Checkout;