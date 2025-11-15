// --- IMPORTS ---
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
    useRegisterUserMutation
} from "@/hooks/reducers/auth";

import { usePedidosSignalR } from "./utils/signalr-pedidos";
import {
    setLocalStorageItem,
    getLocalStorageItem
} from "@/utils/functions/local-storage";

// --- INTERFACES ---
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

// --- COMPONENTE PRINCIPAL ---
const Checkout: React.FC<PageProps> = ({ onScroll }: PageProps) => {

    // --------------------------
    // SIGNALR
    // --------------------------
    const {
        connection,
        isConnected,
        notificarCambioLista
    } = usePedidosSignalR(
        (p) => console.log("Pedido actualizado:", p),
        (p) => console.log("Nuevo pedido:", p),
        (id) => console.log("Pedido borrado:", id),
        () => console.log("Refrescar")
    );

    // --------------------------
    // ESTADOS
    // --------------------------
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const [infoUser, setInfoUser] = useState<InfoUser>({});
    const [infoPago, setInfoPago] = useState<InfoPago>({});

    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [authLoading, setAuthLoading] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    const infoFormRef = useRef<any>(null);
    const pagoFormRef = useRef<any>(null);

    // --------------------------
    // CART
    // --------------------------
    const cart = useAppSelector((state: RootState) => state.cart);
    const { items = [] } = cart || {};

    const total = items.reduce((sum, item) => {
        const unit = item.descuento ? item.descuento : item.precio;
        return sum + (unit * item.quantity);
    }, 0);

    const serv = total * 0.05;
    const totalConServicio = total + serv;

    // --------------------------
    // MUTATIONS
    // --------------------------
    const [PostData] = usePostMutation();
    const [GetData] = useGetWithFiltersMutation();
    const [PutData] = usePutMutation();

    const [PostInt] = usePostIntelisisMutation();
    const [GetInt] = useGetWithFiltersGeneralInIntelisisMutation();

    const [loginUser] = useLoginUserMutation();
    const [registerUser] = useRegisterUserMutation();

    let newMovId: string = "";

    // --------------------------
    // AUTH AUTO
    // --------------------------
    const authenticateUser = async (userData: InfoUser): Promise<boolean> => {
        setAuthLoading(true);

        try {
            if (!userData.correo || !userData.telefono) {
                console.error("❌ Datos insuficientes para autenticar:", userData);
                setAuthLoading(false);
                return false;
            }

            console.log("🔐 Datos para login:", userData);

            const loginPayload = {
                Email: userData.correo,
                Password: userData.telefono
            };

            try {
                const r = await loginUser(loginPayload).unwrap();
                console.log("✅ Login ok:", r);
                setIsAuthenticated(true);
                return true;
            } catch {
                console.log("⚠ Login falló, intentando registro...");

                const regPayload = {
                    email: userData.correo,
                    password: userData.telefono,
                    rol: "cliente"
                };

                await registerUser(regPayload).unwrap();
                console.log("✅ Registrado correctamente");

                await loginUser(loginPayload).unwrap();
                console.log("✅ Login posterior al registro OK");

                setIsAuthenticated(true);
                return true;
            }
        } catch (err) {
            console.error("❌ Error autenticando:", err);
            return false;
        } finally {
            setAuthLoading(false);
        }
    };

    // token persistido
    useEffect(() => {
        const token = getLocalStorageItem("token");
        if (token) {
            setIsAuthenticated(true);
        }
    }, []);

    // --------------------------
    // OBTENER FORM DATA CORRECTAMENTE
    // (CON SUBMIT INTERNO)
    // --------------------------
    const getFormData = async (): Promise<{ user: InfoUser; pago: InfoPago }> => {
        let userData: InfoUser = {};
        let pagoData: InfoPago = {};

        // Asegurar que el formulario ejecute su submit interno
        await infoFormRef.current?.submitForm?.();
        await pagoFormRef.current?.submitForm?.();

        if (infoFormRef.current?.getFormData) {
            userData = infoFormRef.current.getFormData();
        }

        if (pagoFormRef.current?.getFormData) {
            pagoData = pagoFormRef.current.getFormData();
        }

        return {
            user: { ...infoUser, ...userData },
            pago: { ...infoPago, ...pagoData }
        };
    };

    // --------------------------
    // VALIDAR
    // --------------------------
    const isConfirmButtonEnabled = () => !!selectedDate && !!selectedTime;

    // --------------------------
    // BOTÓN PRINCIPAL
    // --------------------------
    const handleConfirmarCitaCompleta = async () => {
        setIsProcessing(true);
        try {
            // 🔥 AQUI SE OBTIENE LA DATA REAL DEL FORM
            const { user: currentUser, pago: currentPago } = await getFormData();

            console.log("📝 Datos usuario antes de login:", currentUser);

            if (!isAuthenticated) {
                const ok = await authenticateUser(currentUser);
                if (!ok) throw new Error("No se pudo autenticar.");
            }

            await handleConfirmarCitaIntelisis();
            await cargarCitasExistentes({ user: currentUser, pago: currentPago });

            alert("Cita creada.");

        } catch (e: any) {
            alert("Error: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // --------------------------
    // INSERTS INTELISIS
    // --------------------------
    const handleConfirmarCitaIntelisis = async () => {
        try {
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
                    // Preparar base y IDs consistentes
                    const ventaDId = parseInt(ventaId.toString()) + 1;
                    const baseRenglon = 2048;

                    // Insertar servicio de pickup primero (RenglonID = 1)
                    const servicioVentaD = {
                        ID: ventaDId,
                        Renglon: baseRenglon,
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
                    };

                    await PostInt({
                        table: "[TC032841E_Pruebas].dbo.VentaD",
                        data: servicioVentaD,
                        signal: undefined
                    });

                    // Insertar los items de la venta después del servicio
                    const ventaDList = items.map((item, idx) => {
                        const unitPrice = item.descuento ? item.descuento : item.precio;
                        const cantidad = item.quantity ?? 1;
                        return {
                            ID: ventaDId,
                            // Renglon continúa consecutivamente después del servicio
                            Renglon: baseRenglon + (idx + 1),
                            RenglonSub: 0,
                            // RenglonID también es consecutivo: servicio = 1, items = 2,3,...
                            RenglonID: idx + 2,
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

    // --------------------------
    // CREAR LISTA EN SISTEMA
    // --------------------------
    const cargarCitasExistentes: Citas = useCallback(async ({ user, pago }) => {

        if (!user || items.length === 0) throw new Error("Sin datos.");

        const dedupeKey = `pickup_${user.telefono}_${selectedDate}_${selectedTime}`;
        if (localStorage.getItem(dedupeKey)) return;

        let clienteId: any = null;

        // buscar cliente
        const r = await GetData({
            url: "v1/pickup/clientes",
            filtros: {
                Filtros: [{ Key: "telefono", Value: user.telefono }],
                Order: [{ Key: "id", Direction: "Desc" }]
            },
            pageSize: 1
        });

        const clientes = r?.data?.data ?? [];

        if (clientes.length > 0) {
            clienteId = clientes[0].id;
        } else {
            // crear
            const res = await PostData({
                url: "v1/pickup/clientes",
                data: {
                    nombre: user.nombre,
                    telefono: user.telefono,
                    email: user.correo
                }
            });

            clienteId = res?.data?.ids?.[0];
        }

        setLocalStorageItem("user", clienteId);

        // lista
        await PostData({
            url: "v1/pickup/listas",
            data: {
                id_cliente: clienteId,
                usuario_id: clienteId,
                sucursal_id: 1,
                nombre_lista: `${selectedDate} ${selectedTime}`,
                servicio: "Pickup",
                fecha_creacion: new Date().toISOString(),
                estado: "nuevo",
                array_lista: JSON.stringify(items)
            }
        });

        localStorage.setItem(dedupeKey, "1");

        if (isConnected && connection) {
            await notificarCambioLista("created", {
                listaId: `${selectedDate} ${selectedTime}`,
                clienteId,
                fecha: selectedDate,
                hora: selectedTime
            });
        }

    }, [GetData, PostData, items, selectedDate, selectedTime, isConnected, connection, notificarCambioLista]);


    // --------------------------
    // UI
    // --------------------------
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
                    <IconLiz fill={onScroll ? "#FFF" : "#7927F5"} width={55} />
                </IonToolbar>
            </IonHeader>

            <section className="flex flex-col md:flex-row-reverse gap-4 px-4 mt-6 max-w-6xl mx-auto">
                <div className="md:w-1/3">
                    <article className="bg-white rounded-xl border p-4 shadow-sm sticky top-4 z-50">
                        <h2 className="font-bold text-lg mb-4">Resumen del pedido</h2>

                        <p className="flex justify-between"><span>Subtotal</span>{formatValue(total, "currency")}</p>
                        <p className="flex justify-between"><span>Servicio</span>{formatValue(serv, "currency")}</p>
                        <hr className="my-3" />
                        <p className="flex justify-between font-semibold">
                            <span>Total</span>
                            {formatValue(totalConServicio, "currency")}
                        </p>

                        {isProcessing && <p>Procesando...</p>}

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

                <section className="flex flex-col gap-4 w-full md:w-2/3">
                    <Calendar selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
                    <TimeSlots selectedDate={selectedDate} selectedTime={selectedTime} setSelectedTime={setSelectedTime} />

                    <div className="border-2 rounded-lg p-4">
                        <h2 className="font-bold text-lg mb-2">Información</h2>
                        <MainForm
                            message_button=""
                            ref={infoFormRef}
                            actionType=""
                            dataForm={CheckOutField()}
                            onSuccess={(r) => setInfoUser(r)}
                            showButton={false}
                        />
                    </div>

                    <div className="border-2 rounded-lg p-4">
                        <h2 className="font-bold text-lg mb-1">Forma de pago</h2>
                        <MainForm
                            message_button=""
                            ref={pagoFormRef}
                            actionType=""
                            dataForm={CheckOutTarjetaField()}
                            onSuccess={(r) => setInfoPago(r)}
                            showButton={false}
                        />
                    </div>
                </section>
            </section>
        </IonContent>
    );
};

export default Checkout;
