// page.tsx (AJUSTADO - Opción 1)
import { PageProps } from "@/utils/types/page";
import { IonContent, IonHeader, IonToolbar, IonButton, IonAlert, IonBackButton, isPlatform } from "@ionic/react";
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
    usePutGeneralMutation
} from "@/hooks/reducers/api";

import {
    useLoginUserMutation,
    useRegisterUserMutation,
    useLogoutUserMutation
} from "@/hooks/reducers/auth";

// local-storage utils (ahora traemos remove y clear por si los usamos)
import {
    setLocalStorageItem,
    getLocalStorageItem,
    clearLocalStorage
} from "@/utils/functions/local-storage";

import { clearCart } from "@/hooks/slices/cart";
import { useHistory } from "react-router-dom";
import { safeCall } from "@/hooks/use-debounce";

// --- INTERFACES ---
interface UserInfo {
    telefono?: string;
    nombre?: string;
    email?: string;
    correo?: string;
    Nombre?: string;
    Apellidos?: string;
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
    database: "[TC032841E].dbo",//TC032841E || TC032841E_Pruebas
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

const getCurrentDateTime = () => {
    const now = new Date();
    return {
        date: now.toISOString().split('T')[0] + 'T00:00:00',
        timestamp: now.toISOString().slice(0, 23)
    };
};

// --- HELPERS para localStorage asincrónico (polling corto) ---
const waitForLocalStorage = async (key: string, timeout = 3000, interval = 150): Promise<any> => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        const v = getLocalStorageItem(key);
        if (v !== null && v !== undefined) return v;
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, interval));
    }
    return null;
};

const logoutAllLocal = () => {
    try {
        clearLocalStorage();
    } catch (e) {
        console.warn("No se pudo limpiar completamente localStorage:", e);
    }
};

// --- COMPONENTE PRINCIPAL ---
const Checkout: React.FC<PageProps> = ({ onScroll }: PageProps) => {
    // --- ESTADOS ---
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [userInfo, setUserInfo] = useState<UserInfo>({});
    const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({});
    const [authLoading, setAuthLoading] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [showPasswordAlert, setShowPasswordAlert] = useState<boolean>(false);

    // --- REFERENCIAS ---
    const userFormRef = useRef<{
        getFormData: () => any;
        submitForm: () => Promise<any>;
        getLiveValues: () => any;
    }>(null);

    const paymentFormRef = useRef<{
        getFormData: () => any;
        submitForm: () => Promise<any>;
        getLiveValues: () => any;
    }>(null);

    // --- HOOKS ---
    const dispatch = useAppDispatch();
    const history = useHistory();
    const cart = useAppSelector((state: RootState) => state.cart);
    const { items = [] } = cart || {};

    // API Mutations
    const [PostData] = usePostMutation();
    const [GetData] = useGetWithFiltersMutation();
    const [PutData] = usePutGeneralMutation();
    const [PostInt] = usePostIntelisisMutation();
    const [GetInt] = useGetWithFiltersGeneralInIntelisisMutation();
    const [loginUser] = useLoginUserMutation();
    const [registerUser] = useRegisterUserMutation();
    const [logoutUser] = useLogoutUserMutation();

    // --- CÁLCULOS ---
    const subtotal = calculateCartTotal(items);
    /* const serviceFee = subtotal * 0.05;//->calculo del 5% de servicio */
    const totalWithService = subtotal /* + serviceFee */;
    // --- FUNCIONES DE AUTENTICACIÓN MEJORADAS ---
    const hasUserChanged = (currentUserData: UserInfo): boolean => {
        const storedUserData = getLocalStorageItem("user-data");
        if (!storedUserData) return false;

        // Comparar datos críticos para determinar si el usuario cambió
        const criticalFields = ['correo', 'telefono', 'nombre'];
        return criticalFields.some(field =>
            currentUserData[field] && storedUserData[field] &&
            currentUserData[field] !== storedUserData[field]
        );
    };

    const resetAuthentication = async (currentUserData?: UserInfo): Promise<void> => {
        try {
            console.log("🔄 Reiniciando autenticación...");

            // Si detectamos que se ingresó un usuario distinto, limpiamos localStorage
            if (currentUserData && hasUserChanged(currentUserData)) {
                console.log("👤 Usuario detectado como diferente, limpiando sesión previa...");
                logoutAllLocal();
                return;
            }

            // Si hay user-id en localStorage, intentamos cerrar sesión en backend para limpieza
            const userId = getLocalStorageItem("user-id");
            if (userId) {
                // logoutUser desapilará cookies y en onQueryStarted limpia localStorage si está implementado
                try {
                    await safeCall(() => logoutUser(userId).unwrap(), "logout");
                } catch (e) {
                    console.warn("Logout backend falló (continuamos limpiando local):", e);
                }
            }

            logoutAllLocal();
            console.log("✅ Sesión cerrada correctamente (local).");
        } catch (error) {
            console.error("❌ Error al cerrar sesión:", error);
        }
    };

    // Guarda user-data y user-id/token de forma robusta (usado después de login/register)
    const persistAuthData = (userData: UserInfo, loginResponse: any) => {
        try {
            if (loginResponse?.token) {
                setLocalStorageItem("token", loginResponse.token);
            }
            if (loginResponse?.id) {
                setLocalStorageItem("user-id", loginResponse.id);
            } else if (loginResponse?.userId) {
                setLocalStorageItem("user-id", loginResponse.userId);
            } else if (loginResponse?.user?.id) {
                setLocalStorageItem("user-id", loginResponse.user.id);
            }

            // Guardar datos esenciales del usuario
            setLocalStorageItem("user-data", {
                Nombre: userData.nombre || userData.Nombre || null,
                APELLIDOS: userData.aPELLIDOS || userData.APELLIDOS || null,
                correo: userData.correo,
                telefono: userData.telefono,
            });
        } catch (e) {
            console.warn("No se pudo persistir auth data localmente:", e);
        }
    };

    const updateUserData = async (userData: UserInfo): Promise<boolean> => {
        try {
            if (!userData.correo || !userData.telefono) {
                console.error("❌ Datos insuficientes para actualizar usuario:", userData);
                return false;
            }

            console.log("📝 Actualizando datos del usuario:", userData);

            const existingUser = await safeCall(() => GetData({
                url: "usuarios",
                filtros: {
                    Filtros: [{ Key: "email", Value: userData.correo }],
                    Order: [{ Key: "id", Direction: "Desc" }]
                },
                pageSize: 1
            }), "consultar usuario");

            const users = existingUser?.data?.data ?? [];

            if (users.length > 0 && userData.correo !== users[0].email) {
                const userId = getLocalStorageItem("user-id");
                if (userId) {
                    await safeCall(() => PutData({
                        url: "usuarios",
                        data: {
                            Data: {
                                email: userData.correo
                            },
                            Filtros: [
                                {
                                    "Key": "ID",
                                    "Value": userId,
                                    "Operator": "="
                                }
                            ]
                        }
                    }), "actualizar usuario");
                    console.log("✅ Usuario actualizado correctamente");
                } else {
                    console.warn("No hay user-id para actualizar correo (se omitirá)");
                }
            }

            return true;
        } catch (error) {
            console.error("❌ Error al actualizar datos del usuario:", error);
            return false;
        }
    };

    // Autenticación robusta (login -> si falla register -> login de nuevo)
    const authenticateUser = async (userData: UserInfo): Promise<boolean> => {
        setAuthLoading(true);

        try {
            if (!userData.correo || !userData.telefono) {
                console.error("❌ Datos insuficientes para autenticar:", userData);
                return false;
            }

            console.log("🔐 Iniciando autenticación para:", userData.correo);

            // Si ya hay auth local y pertenece al mismo correo, reuse
            const storedUser = getLocalStorageItem("user-data");

            /* if (storedToken && storedUser && storedUser.correo === userData.correo && storedUserId) {
                console.log("🔁 Ya existe sesión local para este usuario — reutilizando.");
                setIsAuthenticated(true);
                return true;
            } */

            // Si hay sesión pero para otro usuario => limpiar
            if (storedUser && storedUser.correo && storedUser.correo !== userData.correo) {
                console.log("👤 Sesión local corresponde a otro usuario. Limpiando antes de autenticar.");
                await resetAuthentication(userData);
            }

            const loginPayload = {
                Email: userData.correo,
                Password: (userData.telefono || "").replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3'),
            };

            // Intento de login
            try {
                const loginResp: any = await safeCall(() => loginUser(loginPayload).unwrap(), "login usuario");
                console.log("✅ Login exitoso (backend).");
                // Persistir token/id/user-data en localStorage
                persistAuthData(userData, loginResp);

                // Asegurar que user-id quedó disponible (espera corta)
                const waitId = await waitForLocalStorage("user-id", 3000);
                if (!waitId) {
                    // intentar leer id desde loginResp
                    if (loginResp?.id || loginResp?.userId || loginResp?.user?.id) {
                        setLocalStorageItem("user-id", loginResp.id || loginResp.userId || loginResp.user?.id);
                    }
                }

                await updateUserData(userData);
                return true;
            } catch (loginError) {
                console.log("⚠ Login falló, intentando registro...", loginError);
                // Guardar user-data provisionalmente
                setLocalStorageItem("user-data", {
                    correo: userData.correo,
                    telefono: userData.telefono,
                    nombre: userData.nombre || userData.Nombre || null
                });

                const registerPayload = {
                    email: userData.correo,
                    password: (userData.telefono || "").replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3'),
                    nombre: userData.nombre || userData.Nombre || "Cliente",
                    rol: "cliente"
                };

                // Registrar usuario
                await safeCall(() => registerUser(registerPayload).unwrap(), "registro usuario");
                console.log("✅ Registrado correctamente.");

                // Después de registrar, intentar login de nuevo
                const loginResp2: any = await safeCall(() => loginUser(loginPayload).unwrap(), "login después de registrar");
                console.log("✅ Login posterior al registro exitoso");

                // Persistir datos
                persistAuthData(userData, loginResp2);

                // Esperar user-id si es necesario
                const waitId2 = await waitForLocalStorage("user-id", 3000);
                if (!waitId2 && (loginResp2?.id || loginResp2?.userId || loginResp2?.user?.id)) {
                    setLocalStorageItem("user-id", loginResp2.id || loginResp2.userId || loginResp2.user?.id);
                }

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
        }, 500);

        return () => clearInterval(interval);
    }, []);

    // --- VALIDACIÓN DEL BOTÓN DE CONFIRMACIÓN ---
    const isConfirmButtonEnabled = useCallback((): boolean => {
        const { userValues, paymentValues } = formValues;
        const userData = getLocalStorageItem("user-data");

        const hasDateTime = Boolean(selectedDate && selectedTime);
        const hasCartItems = items.length > 0;
        
        if (userData && hasDateTime && hasCartItems) return true;

        const hasUserData = Boolean(
            userValues.telefono &&
            (userValues.Nombre || userValues.nombre) &&
            userValues.correo
        );

        const hasPaymentData = Boolean(
            paymentValues.pago ?? /* === "Tarjeta Credito/Debito" ? (
                paymentValues.numero_tarjeta &&
                paymentValues.vencimiento &&
                paymentValues.cvv) : */ paymentValues.pago
        );

        const isValid = hasDateTime && hasUserData && hasPaymentData && hasCartItems;

        return isValid;
    }, [selectedDate, selectedTime, items.length, formValues]);

    // --- FUNCIONES INTELISIS CORREGIDAS ---
    const getLastSaleInfo = async () => {
        console.log("🔍 Buscando última venta en Intelisis...");

        try {
            const result = await safeCall(() => GetInt({
                table: `venta`,
                pageSize: 1,
                page: 1,
                filtros: {
                    Filtros: [
                        /* { Key: "Usuario", Value: INTELISIS_CONFIG.usuario }, 
                        { Key: "MovID", Value: "MAY-", Operator: "like" },
                        { Key: "Mov", Value: "Pedido" } */
                    ],
                    Order: [{ Key: "id", Direction: "desc" }]
                },
                signal: undefined,
            }), "consulta Intelisis (último Mov)");

            // Manejar diferentes estructuras de respuesta
            let apiData;
            if (result.data?.data) {
                apiData = result.data.data;
            } else if (result.data) {
                apiData = result.data;
            } else {
                apiData = result;
            }

            if (!Array.isArray(apiData)) {
                console.warn("⚠ Respuesta no es un array, intentando normalizar...", apiData);
                // Intentar extraer datos de diferentes estructuras
                if (apiData && typeof apiData === 'object') {
                    const possibleArrays = Object.values(apiData).find(val => Array.isArray(val));
                    apiData = possibleArrays || [apiData];
                } else {
                    apiData = [];
                }
            }

            if (apiData.length === 0) {
                console.warn("⚠ No se encontraron ventas anteriores, usando valores por defecto");
                // Valores por defecto para primera venta
                return {
                    saleId: 1000,
                    movId: "MAY-1000"
                };
            }

            const lastSale = apiData[0];
            console.log("📊 Última venta encontrada:", lastSale);

            // Buscar el ID y MovID en diferentes propiedades posibles
            const saleId = lastSale.id ?? lastSale.Id ?? lastSale.ID ?? lastSale.ventaId ?? 1000;
            const movId = lastSale.MovID ?? lastSale.MovId ?? lastSale.MOVID ?? "MAY-1000";

            if (saleId == null || movId == null) {
                console.warn("⚠ Datos de venta incompletos, usando valores por defecto");
                return {
                    saleId: 1000,
                    movId: "MAY-1000"
                };
            }

            console.log("✅ ID de venta:", saleId, "MovID:", movId);
            return { saleId, movId };
        } catch (error) {
            console.error("❌ Error crítico al obtener última venta:", error);
            // Valores por defecto en caso de error
            return {
                saleId: 1000,
                movId: "MAY-1000"
            };
        }
    };

    // --- FUNCIONES INTELISIS CORREGIDAS ---
    const insertIntelisisData = async (saleId: number, id:string) => {
        const { date, timestamp } = getCurrentDateTime();
        const baseId = parseInt(saleId.toString()) + 1;

        console.log("💾 Insertando datos en Intelisis con baseId:", baseId);

        // SOLUCIÓN: Insertar TODO en una sola transacción lógica
        const totalProductTaxes = items.reduce((sum, item) => {
            const qty = item.quantity || 1;
            const tax1 = Number(item.impuesto1 || 0);
            const tax2 = Number(item.impuesto2 || 0);
            return sum + ((tax1 + tax2) * qty);
        }, 0);
        // 1. Insertar Venta PRIMERO y esperar a que termine
        const saleData = {
            Empresa: INTELISIS_CONFIG.empresa,
            Mov: "Pedido",
            FechaEmision: date,
            UltimoCambio: timestamp,
            Concepto: "PICK UP",
            Moneda: INTELISIS_CONFIG.moneda,
            TipoCambio: 1,
            Usuario: INTELISIS_CONFIG.usuario,
            Estatus: "SINAFECTAR",
            Cliente: "MOSTRADOR",
            Almacen: INTELISIS_CONFIG.almacen,
            Importe: totalWithService, // ✅ Usar el total CON servicio
            Impuestos: totalProductTaxes, // suma de impuestos de los productos
            Saldo: totalWithService,
            CostoTotal: subtotal * 0.6,
            PrecioTotal: totalWithService, // ✅ Usar el total CON servicio
            ServicioExpress: true,
            Condicion: "CONTADO",
            Vencimiento: date,
            ZonaImpuesto: "Frontera",
            FormaPagoTipo: "Efectivo",
            Sucursal: 4,
            SucursalVenta: 4,
            SucursalOrigen: 4,
            ListaPreciosEsp: "(Precio Lista)",
            Referencia: id
        };

        const saleResult = await safeCall(() => PostInt({
            table: `Venta`,
            data: saleData,
            signal: undefined
        }), "Intelisis Venta");

        console.log("✅ Venta insertada:", saleResult);

        // 2. Insertar Mov
        const movData = {
            ID: baseId,
            Empresa: INTELISIS_CONFIG.empresa,
            Modulo: "VTAS",
            Mov: "Pedido",
            FechaEmision: date,
            FechaRegistro: date,
            Concepto: "PICK UP",
            Ejercicio: new Date().getFullYear(),
            Periodo: new Date().getMonth() + 1,
            Moneda: INTELISIS_CONFIG.moneda,
            TipoCambio: 1,
            Usuario: INTELISIS_CONFIG.usuario,
            Sucursal: 4,
        };

        await safeCall(() => PostInt({
            table: `Mov`,
            data: movData,
            signal: undefined
        }), "Intelisis Mov");

        // 3. Insertar Movimientos
        const movementsData = {
            ID: baseId,
            Empresa: INTELISIS_CONFIG.empresa,
            Modulo: "VTAS",
            Mov: "Pedido",
            FechaEmision: date,
            Moneda: INTELISIS_CONFIG.moneda,
            TipoCambio: 1,
            Importe: totalWithService, // ✅ Usar el total CON servicio
            Estatus: "SINAFECTAR",
            Impuestos: totalProductTaxes, // suma de impuestos de los productos
            Retencion: 0,
        };

        await safeCall(() => PostInt({
            table: `Movimientos`,
            data: movementsData,
            signal: undefined
        }), "Intelisis Movimientos");

        return baseId;
    };

    const insertSaleDetails = async (baseId: number) => {
        const { date } = getCurrentDateTime();
        const baseRow = 2048;

        // SOLUCIÓN: Insertar servicio pickup + items en secuencia
        // Procesar items de forma asincrónica primero
        const processedItems = await Promise.all(
            items.map(async (item, index) => {
                const unitPrice = item.descuento || item.precio;

                // Obtener el costo más reciente de compras en Intelisis
                const costResult = await safeCall(() => GetInt({
                    table: `CompraD`,
                    pageSize: 1,
                    filtros: {
                        Filtros: [
                            { Key: "Articulo", Value: item.articulo },
                            { Key: "Unidad", Value: item.unidad },
                            { Key: "Factor", Value: item.factor }
                        ],
                        Order: [{ Key: "id", Direction: "desc" }]
                    },
                    signal: undefined
                }), `consultar costo de ${item.articulo}`);

                let itemCost = unitPrice * 0.6; // Valor por defecto

                if (costResult?.data?.data?.[0]?.Costo) {
                    itemCost = costResult.data.data[0].Costo;
                } else if (costResult?.data?.[0]?.Costo) {
                    itemCost = costResult.data[0].Costo;
                }

                return {
                    ID: baseId,
                    Renglon: index * baseRow,
                    RenglonSub: 0,
                    RenglonID: index,
                    RenglonTipo: "N",
                    Cantidad: item.quantity,
                    Almacen: INTELISIS_CONFIG.almacen,
                    Codigo: /* String(item.codigo || "") */ "",
                    Articulo: String(item.articulo || ""),
                    Precio: unitPrice,
                    PrecioSugerido: unitPrice,
                    DescuentoLinea: 0,
                    Impuesto1: item.impuesto1,
                    Impuesto2: item.impuesto2,
                    Costo: itemCost,
                    Unidad: item.unidad || "Unidad",
                    Factor: item.factor || 1,
                    CantidadInventario: item.quantity * (item.factor || 1),//1784
                    FechaRequerida: date,
                    Sucursal: 4,
                    TipoImpuesto1: item.tipoImpuesto1,
                    TipoImpuesto2: item.tipoImpuesto2
                };
            })
        );

        const allItems = [
            // Servicio pickup primero
            /*  {
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
                 CantidadInventario: 1,
                 Unidad: "servicio",
                 Factor: 1,
                 FechaRequerida: date,
                 Sucursal: 4,
                 TipoImpuesto1: 'IVA8',
             }, */
            // Items del carrito después
            ...processedItems
        ];

        // Insertar todos los items secuencialmente
        for (const [index, itemData] of allItems.entries()) {
            const itemResult = await safeCall(() => PostInt({
                table: `VentaD`,
                data: itemData,
                signal: undefined
            }), `Intelisis VentaD item ${index + 1}`);
        }
    };

    const processIntelisisOrder = async (id: string): Promise<string> => {
        // ✅ VERIFICACIÓN: Asegurar que no hay proceso en curso
        if (isProcessing) {
            throw new Error("Ya hay un proceso de orden en curso");
        }

        try {
            const { saleId, movId } = await getLastSaleInfo();
            const baseId = await insertIntelisisData(saleId, id);
            await insertSaleDetails(baseId);

            return "✅ Todos los inserts en Intelisis realizados exitosamente";
        } catch (error: any) {
            console.error("❌ Error en processIntelisisOrder:", error);
            throw new Error(`Error en Intelisis: ${error.message}`);
        }
    };

    // Obtener userId de diferentes formas posibles (espera corta si no existe aún)
    const getUserId = async () => {
        // Intentar obtener de localStorage primero (inmediato)
        let storedUserId = getLocalStorageItem("user-id");
        if (storedUserId) {
            return storedUserId;
        }
        // Si no está, esperar un poco (por ejemplo después de un login/registro)
        storedUserId = await waitForLocalStorage("user-id", 3000);
        if (storedUserId) {
            return storedUserId;
        }

        // Buscar en user-data
        const userData = getLocalStorageItem("user-data");
        if (userData?.id) {
            return userData.id;
        }
        return null;
    };

    // --- FUNCIONES PRINCIPALES ---
    const savePickupAppointment = async ({ user, pago }: FormData) => {
        if (!user || items.length === 0) {
            throw new Error("Datos de usuario o carrito incompletos");
        }

        const userId = await getUserId();

        if (!userId) throw new Error("No se pudo identificar al usuario. Por favor inicia sesión nuevamente.")

        // Función para obtener fecha/hora local en formato ISO
        const getLocalISOString = () => {
            const date = new Date();
            const offset = date.getTimezoneOffset();
            const localDate = new Date(date.getTime() - (offset * 60 * 1000));
            return localDate.toISOString().slice(0, -1); // Remover la Z final
        };

        // Buscar cliente por email
        const clientResponse = await safeCall(() => GetData({
            url: "clientes",
            filtros: {
                Filtros: [{ Key: "email", Value: user.correo }],
                Order: [{ Key: "id", Direction: "Desc" }]
            },
            pageSize: 1
        }), "buscar cliente");

        const clients = clientResponse?.data?.data ?? [];
        let clientId: string | null = null;

        if (clients.length > 0) {
            clientId = clients[0].id;
        } else {

            // Crear nuevo cliente con hora local
            const createResponse = await safeCall(() => PostData({
                url: "clientes",
                data: {
                    nombre: `${user.Nombre || user.nombre} ${user.Apellidos || ""}`.trim(),
                    telefono: user.telefono,
                    email: user.correo,
                    fecha_registro: getLocalISOString(), // ← CORREGIDO
                    usuario_id: userId
                }
            }), "crear cliente");

            // ESTRATEGIA MEJORADA: Obtener clientId de múltiples formas
            const responseData = createResponse?.data;

            // Opción 1: IDs array
            if (responseData?.ids?.[0]) {
                clientId = responseData.ids[0];
            }
            // Opción 2: ID directo
            else if (responseData?.id) {
                clientId = responseData.id;
            }
            // Opción 3: Data nested
            else if (responseData?.data?.id) {
                clientId = responseData.data.id;
            }
            // Opción 4: Buscar cliente recién creado (espera breve)
            else {

                // Esperar un momento para que se propague la creación
                await new Promise(resolve => setTimeout(resolve, 2000));

                const searchResponse = await safeCall(() => GetData({
                    url: "clientes",
                    filtros: {
                        Filtros: [
                            { Key: "email", Value: user.correo },
                            { Key: "telefono", Value: user.telefono }
                        ],
                        Order: [{ Key: "id", Direction: "Desc" }]
                    },
                    pageSize: 1
                }), "buscar cliente recién creado");

                const newClients = searchResponse?.data?.data ?? [];

                if (newClients.length > 0) {
                    clientId = newClients[0].id;
                } else {
                    const finalSearch = await safeCall(() => GetData({
                        url: "clientes",
                        filtros: {
                            Filtros: [{ Key: "telefono", Value: user.telefono }],
                            Order: [{ Key: "id", Direction: "Desc" }]
                        },
                        pageSize: 1
                    }), "búsqueda final por teléfono");

                    const finalClients = finalSearch?.data?.data ?? [];

                    if (finalClients.length > 0) {
                        clientId = finalClients[0].id;
                    } else {
                        throw new Error("No se pudo crear o encontrar el cliente después de múltiples intentos");
                    }
                }
            }
        }

        // VERIFICACIÓN FINAL: Asegurar que tenemos un clientId válido
        if (!clientId) {
            throw new Error("No se pudo obtener un ID válido para el cliente después de todos los intentos");
        }

        // Guardar clientId en localStorage para futuras referencias
        setLocalStorageItem("user", clientId);

        // Preparar items para la lista de pickup
        const itemsWithPickupService = [
            /* {
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
            }, */
            ...items.map((item, index) => ({
                ...item,
                id: item.id || `item-${index}`,
                esServicio: false
            }))
        ];

        const fechaObjeto: any = new Date(selectedDate + " " + selectedTime);

        // Código reducido
        const isoLocal = new Date(fechaObjeto - fechaObjeto.getTimezoneOffset() * 60000).toISOString().slice(0, -1);
        // Crear lista de pickup con hora local
        const listaResponse = await safeCall(() => PostData({
            url: "listas",
            data: {
                id_cliente: clientId,
                usuario_id: userId,
                sucursal_id: 1,
                nombre_lista: `Pedido ${clientId}`,
                servicio: "Pickup",
                fecha_creacion: getLocalISOString(), // ← CORREGIDO
                fecha_entrega: isoLocal,
                estado: "nuevo",
                array_lista: JSON.stringify(itemsWithPickupService),
                tipo_pago: pago.pago
            }
        }), "crear lista pickup");
        return listaResponse.data.data.id; // Retornar el clientId para uso posterior si es necesario
    };

    // --- FUNCIONES PRINCIPALES CORREGIDAS ---
    const retryWithAuth = async (currentUserData: UserInfo, maxRetries: number = 2): Promise<boolean> => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                await resetAuthentication(currentUserData);

                const authSuccess = await authenticateUser(currentUserData);

                if (authSuccess) {
                    return true;
                }
            } catch (error) {
                console.error(`❌ Error en reintento ${attempt}:`, error);
            }
        }

        return false;
    };

    const confirmCompleteAppointment = async (): Promise<void> => {
        if (isProcessing) {
            return;
        }
        setIsProcessing(true);

        try {
            const formData = await getFormData();
            const authSuccess = await authenticateUser(formData.user);
            
            if (!authSuccess) {
                throw new Error("No se pudo autenticar");
            }

            // ORDEN CORREGIDO: Primero Intelisis, luego nuestra API
            const userId = await getUserId(); // Pre-cargar userId en background
            if (!userId) throw new Error("No se pudo identificar al usuario después de autenticar. Por favor intenta nuevamente.")
            const id = await savePickupAppointment(formData);
            await processIntelisisOrder(id);
            
            dispatch(clearCart());
            setShowPasswordAlert(true);
        } catch (error: any) {
            console.error("❌ Error en confirmación de cita:", error);
            const formData = await getFormData();
            const reauthSuccess = await retryWithAuth(formData.user, 1); // Solo 1 reintento

            if (reauthSuccess) {
                // En lugar de llamar recursivamente, repetimos la lógica principal
                try {
                    const formData = await getFormData();
                    const id = await savePickupAppointment(formData);
                    await processIntelisisOrder(id);

                    dispatch(clearCart());
                    return; // Éxito en el reintento
                } catch (retryError: any) {
                    console.error("❌ Error en reintento:", retryError);
                    alert(`Error: ${retryError.message || "No se pudo crear la cita después del reintento"}`);
                }
            } else {
                alert("Error: No se pudo reautenticar. Por favor intenta nuevamente.");
            }
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
            <IonAlert
                isOpen={showPasswordAlert}
                header="Información importante"
                message="Tu número de teléfono será tu contraseña para futuros accesos. Guárdalo para poder ingresar a tu cuenta."
                buttons={[{
                    text: "Entendido",
                    handler: () => {
                        history.push("/seguimiento");
                        setShowPasswordAlert(false);
                    }
                }]}
            />
            <section className="flex flex-col-reverse md:flex-row-reverse gap-4 px-4 my-8 max-w-6xl mx-auto">
                {/* RESUMEN DEL PEDIDO */}
                <div className="md:w-1/3">
                    <article className="bg-white rounded-xl border p-4 shadow-sm sticky top-4 z-50">
                        <h2 className="font-bold text-lg mb-4">Resumen del pedido</h2>

                        <div className="space-y-2">
                            <p className="flex justify-between">
                                <span>Subtotal</span>
                                {formatValue(subtotal, "currency")}
                            </p>
                            {/* <p className="flex justify-between">
                                <span>Servicio</span>
                                {formatValue(serviceFee, "currency")}
                            </p> */}
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
                            {isProcessing ? "Procesando..." :
                                authLoading ? "Autenticando..." :
                                    "Confirmar cita"}
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
interface FormSectionProps {
    title: string;
    formRef: React.RefObject<any>;
    formConfig: any;
    onSuccess: (data: any) => void;
}

const FormSection: React.FC<FormSectionProps> = ({ title, formRef, formConfig, onSuccess }) => (
    <div className="z-50 border-2 rounded-lg p-4">
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
