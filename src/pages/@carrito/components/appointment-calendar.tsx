"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  parseISO,
  addDays,
  addMinutes,
  isBefore,
  startOfDay,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  formatISO,
} from "date-fns"
import { es } from "date-fns/locale"
import {
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  Clock,
  Clock3,
  Calendar,
  FileText,
  AlertCircle,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  HelpCircle,
} from "lucide-react"

import { cn } from "@/utils/functions/cn"
import MainForm from "@/components/form/main-form"
import { CitasField } from "../constants/citas-field"
import { useAppDispatch, useAppSelector } from "@/hooks/selector"
import { useGetWithFiltersMutation, usePostMutation } from "@/hooks/reducers/api"
import { useIonToast } from "@ionic/react"
import { useHistory } from "react-router"
import { clearCart } from "@/hooks/slices/cart"
import { getLocalStorageItem, setLocalStorageItem } from "@/utils/functions/local-storage"
import { driver } from "driver.js"

// Configuración de servicios
const serviceTypes = [
  {
    id: "pickup",
    name: "Pickup",
    active: true,
    duration: 5,
    color: "bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-purple-100",
    description: "Todos sus productos son preparados en tienda para que solo tenga que pasar a recogerlos.",
  },
  {
    id: "vehiculo",
    name: "Entrega en vehículo",
    active: true,
    duration: 5,
    color: "bg-indigo-100 text-indigo-800 border-indigo-300 hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-100",
    description: "Los productos le son entregados y cobrados en su vehículo si necesidad de bajarse.",
  },
  {
    id: "a_diomicilio",
    name: "Entrega a domicilio",
    active: false,
    duration: 30,
    color: "bg-cyan-100 text-cyan-800 border-cyan-300 hover:bg-cyan-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-cyan-100",
    description: "Los productos le son entregados en la puerta de su casa u oficina.",
  },
]

// Hook personalizado para la gestión de citas
const useCitas = () => {
  const [GetData] = useGetWithFiltersMutation()
  const [PostData] = usePostMutation()
  const precio = getLocalStorageItem("sucursal")?.precio ?? useAppSelector((state) => state.app?.sucursal?.precio)
  const cartItems = useAppSelector((state: any) => state.cart?.items?.filter((item: any) => item.quantity > 0) || [])

  const [citasExistentes, setCitasExistentes] = useState<any[]>([])
  const [loadingCitas, setLoadingCitas] = useState(false)
  const [errorCitas, setErrorCitas] = useState<string | null>(null)

  const cargarCitasExistentes = useCallback(async () => {
    setLoadingCitas(true)
    setErrorCitas(null)

    try {
      const response = await GetData({
        url: "v1/pickup/listas",
        filtros: {
          Filtros: [
            /* { Key: "sucursal", Value: precio } */
            { Key: "estado", Value: "nuevo", Operator: "Like" },
            { Key: "tipo_lista", Value: "compra", Operator: "Like" }
          ],
          Order: [{ Key: "id", Direction: "Desc" }]
        },
        pageSize: 100
      }).unwrap()
      setCitasExistentes(response.data || [])
    } catch (error) {
      console.error("Error cargando citas:", error)
      setErrorCitas("No se pudieron cargar las citas existentes")
    } finally {
      setLoadingCitas(false)
    }
  }, [GetData, precio])

  return {
    citasExistentes,
    loadingCitas,
    errorCitas,
    cargarCitasExistentes,
    PostData,
    GetData,
    precio,
    cartItems
  }
}

// Hook para generar slots de tiempo
const useTimeSlots = (selectedDate: string | null, citasExistentes: any[]) => {
  console.log(citasExistentes);

  const generateTimeSlots = useCallback((date: string, existingCitas: any[]) => {
    const baseDate = parseISO(date)
    const startHour = 9.5 // 9:30 AM
    const endHour = 16 // 4:00 PM
    const slotDuration = 30 // minutos
    const now = new Date()
    const isToday = isSameDay(baseDate, now)

    const bookedSlots = existingCitas.map(cita => {
      const start = parseISO(cita.nombre_lista) // Suponiendo que nombre_lista tiene el formato ISO
      const end = addMinutes(start, 5)
      return { start, end }
    })

    const isSlotAvailable = (slotTime: Date) => {
      return !bookedSlots.some(({ start, end }) =>
        isWithinInterval(slotTime, { start, end })
      )
    }

    const isValidSlot = (slotTime: Date) => {
      if (isToday && slotTime <= now) return false
      return true
    }

    const generateSlotsForPeriod = (startHour: number, endHour: number) => {
      const slots = []
      for (let hour = Math.floor(startHour); hour < endHour; hour++) {
        const startMinute = hour === 9 ? 30 : 0
        const endMinute = hour === 16 ? 30 : 60

        for (let minute = startMinute; minute < endMinute; minute += slotDuration) {
          const slotTime = new Date(baseDate)
          slotTime.setHours(hour, minute, 0, 0)

          if (!isValidSlot(slotTime)) continue

          const isAvailable = isSlotAvailable(slotTime)

          slots.push({
            id: `${hour}-${minute}`,
            time: slotTime.toISOString(),
            isAvailable,
          })
        }
      }
      return slots
    }

    const morningSlots = generateSlotsForPeriod(startHour, 13)
    const afternoonSlots = generateSlotsForPeriod(14, endHour + 0.5) // +0.5 para incluir 16:30

    return { morningSlots, afternoonSlots }
  }, [])

  const timeSlots = useMemo(() => {
    if (!selectedDate) return { morningSlots: [], afternoonSlots: [] }
    return generateTimeSlots(selectedDate, citasExistentes)
  }, [selectedDate, citasExistentes, generateTimeSlots])

  return timeSlots
}

// Hook para fechas disponibles
const useAvailableDates = () => {
  const availableDates = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => {
      const date = startOfDay(addDays(new Date(), i))
      // Excluir domingos (día 0)
      if (date.getDay() === 0) return null
      return date.toISOString()
    }).filter(Boolean) as string[]
  }, [])

  return availableDates
}

export function AppointmentCalendar() {
  const history = useHistory()
  const dispatch = useAppDispatch()
  const [present] = useIonToast()

  // Estados principales
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [blockedDatesDueToNoSlots, setBlockedDatesDueToNoSlots] = useState<string[]>([])

  const formRef = useRef<HTMLDivElement>(null)

  // Hooks personalizados
  const {
    citasExistentes,
    loadingCitas,
    errorCitas,
    cargarCitasExistentes,
    PostData,
    GetData,
    precio,
    cartItems
  } = useCitas()

  const timeSlots = useTimeSlots(selectedDate, citasExistentes)
  const availableDates = useAvailableDates()

  // Efecto para cargar citas existentes
  useEffect(() => {
    cargarCitasExistentes()
  }, [cargarCitasExistentes])

  // Efecto para verificar disponibilidad de slots
  useEffect(() => {
    if (selectedDate && !loadingCitas) {
      setIsLoading(true)

      const hasAvailableSlots = timeSlots.morningSlots.length > 0 || timeSlots.afternoonSlots.length > 0

      if (!hasAvailableSlots) {
        setBlockedDatesDueToNoSlots(prev =>
          prev.includes(selectedDate) ? prev : [...prev, selectedDate]
        )
      } else {
        setBlockedDatesDueToNoSlots(prev =>
          prev.filter(date => date !== selectedDate)
        )
      }

      setTimeout(() => setIsLoading(false), 300)
    }
  }, [selectedDate, timeSlots, loadingCitas])

  // Tour de ayuda
  const startTour = useCallback(() => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      showButtons: ['next', 'previous', 'close'],
      disableActiveInteraction: true,
      steps: [
        {
          element: '#help-button',
          popover: {
            title: '¿Necesitas ayuda?',
            description: 'Siempre puedes volver a ver esta guía haciendo clic aquí.',
            side: "top",
            align: 'center'
          }
        },
        {
          element: '#calendar-header',
          popover: {
            title: 'Calendario de Citas',
            description: 'Aquí puedes seleccionar una fecha disponible para tu cita.',
            side: "top",
            align: 'center',
          }
        },
        {
          element: '#date-step',
          popover: {
            title: 'Paso 1: Seleccionar Fecha',
            description: 'Primero selecciona una fecha disponible (marcada en morado).',
            side: "top",
            align: 'start'
          }
        },
        {
          element: '#time-step',
          popover: {
            title: 'Paso 2: Seleccionar Hora',
            description: 'Después elige un horario disponible.',
            side: "top",
            align: 'start'
          }
        },
        {
          element: '#service-step',
          popover: {
            title: 'Paso 3: Tipo de Servicio',
            description: 'Selecciona el tipo de servicio que necesitas.',
            side: "top",
            align: 'start'
          }
        },
        {
          element: '#confirmation-section',
          popover: {
            title: 'Paso 4: Confirmación',
            description: 'Finalmente completa tus datos y confirma la cita.',
            side: "top",
            align: 'start'
          }
        },
      ]
    })

    driverObj.drive()
  }, [])

  // Inicializar tour
  useEffect(() => {
    const hasSeenTour = getLocalStorageItem('hasSeenAppointmentTour')
    if (hasSeenTour !== true) {
      setTimeout(() => {
        startTour()
        setLocalStorageItem('hasSeenAppointmentTour', true)
      }, 1000)
    }
  }, [startTour])

  // Handlers
  const handlePreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  const handleDateClick = useCallback((date: Date) => {
    const dateString = startOfDay(date).toISOString()
    if (availableDates.includes(dateString) && !blockedDatesDueToNoSlots.includes(dateString)) {
      setIsLoading(true)
      setSelectedSlot(null)
      setSelectedService(null)
      setSelectedDate(dateString)
    }
  }, [availableDates, blockedDatesDueToNoSlots])

  const handleSelectSlot = useCallback((slotId: string) => {
    setSelectedSlot(slotId)
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 300)
  }, [])

  const handleSelectService = useCallback((serviceId: string) => {
    setSelectedService(serviceId)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 300)
  }, [])

  // Funciones de utilidad
  const isDateAvailable = useCallback((date: Date) => {
    const dateString = startOfDay(date).toISOString()
    return availableDates.includes(dateString) && !blockedDatesDueToNoSlots.includes(dateString)
  }, [availableDates, blockedDatesDueToNoSlots])

  const isDateBlocked = useCallback((date: Date) => {
    const dateString = startOfDay(date).toISOString()
    return date.getDay() === 0 || blockedDatesDueToNoSlots.includes(dateString)
  }, [blockedDatesDueToNoSlots])

  const isPastDate = useCallback((date: Date) => {
    return isBefore(date, startOfDay(new Date()))
  }, [])

  const getSlotById = useCallback((slotId: string) => {
    return [...timeSlots.morningSlots, ...timeSlots.afternoonSlots].find(slot => slot.id === slotId)
  }, [timeSlots])

  const getServiceById = useCallback((serviceId: string) => {
    return serviceTypes.find(service => service.id === serviceId)
  }, [])

  // Handler para crear cita
  const handleCreateAppointment = useCallback(async (values: any) => {
    try {
      let clienteId

      if (!selectedDate || !selectedSlot || !selectedService) {
        throw new Error('Información de cita incompleta')
      }

      // Buscar o crear cliente
      const { data: clientes } = await GetData({
        url: "v1/pickup/clientes",
        filtros: {
          Filtros: [{ Key: "telefono", Value: values.Telefono }],
          Order: [{ Key: "id", Direction: "Desc" }]
        },
        pageSize: 1
      })

      if (!clientes.data.length) {
        const dataCliente = {
          nombre: values.Nombre,
          telefono: values.Telefono,
          cp: values.CodigoPostal,
          estado: values.Estado,
          ciudad: values.Ciudad,
          direccion: values.Direccion,
        }
        const clienteResponse = await PostData({ url: "v1/pickup/clientes", data: dataCliente }).unwrap()
        clienteId = clienteResponse.data.ids[0]
      } else {
        clienteId = clientes.data[0].id
      }

      setLocalStorageItem("user", clienteId)
      setLocalStorageItem("user-data", clientes.data[0])

      // En la función handleCreateAppointment:
      const slotTime = getSlotById(selectedSlot)?.time;
      let nombreLista: string;

      if (slotTime) {
        const date = parseISO(slotTime);
        // Construir el formato con la T manualmente
        nombreLista = format(date, "yyyy-MM-dd") + " " + format(date, "HH:mm:ss.SSS");
      } else {
        nombreLista = new Date().toISOString();
      }

      const listaPayload = {
        id_cliente: clienteId,
        usuario_id: clienteId,
        sucursal_id: 1,
        nombre_lista: nombreLista,
        servicio: getServiceById(selectedService)?.name,
        fecha_creacion: new Date().toISOString(),
        estado: "nuevo",
        array_lista: JSON.stringify(cartItems)
      }

      const listaResponse = await PostData({ url: "v1/pickup/listas", data: listaPayload })
      console.log(listaResponse);

      const listaId = listaResponse.data.data.id;

      dispatch(clearCart())

      present({
        message: `Cita creada correctamente (ID: ${listaId})`,
        duration: 3500,
        cssClass: "custom-tertiary",
        position: 'bottom',
        buttons: [{
          text: "ver",
          side: 'end',
          handler: () => history.replace('/loading')
        }]
      })

      // Resetear formulario
      setSelectedDate(null)
      setSelectedSlot(null)
      setSelectedService(null)

    } catch (error) {
      console.error("Error creando cita:", error)
      present({
        message: "Error al generar cita",
        duration: 2500,
        color: "danger",
        position: 'bottom'
      })
    }
  }, [selectedDate, selectedSlot, selectedService, GetData, PostData, getServiceById, cartItems, precio, dispatch, present, history, getSlotById])

  // Renderizado del calendario
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const daysInCalendar = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const handleCalendarKeyDown = useCallback((e: React.KeyboardEvent, day: Date) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleDateClick(day)
    }
  }, [handleDateClick])

  return (
    <div className="rounded-xl border border-gray-200 bg-white text-gray-900 shadow-sm">
      <div className="p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 id="calendar-header" className="text-lg font-semibold">Agenda tu cita</h2>
          <button
            id="help-button"
            onClick={startTour}
            className="flex items-center gap-1 rounded-full p-2 transition-colors hover:bg-gray-100"
            aria-label="Mostrar guía de ayuda"
          >
            <HelpCircle className="h-5 w-5" /> Ayuda
          </button>
        </div>

        {/* Indicador de pasos */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {['Fecha', 'Hora', 'Confirmar'].map((step, index) => (
              <button
                key={step}
                id={`${step.toLowerCase()}-step`}
                onClick={() => {
                  if (index === 0) setSelectedDate(null)
                  else if (index === 1) selectedDate && setSelectedSlot(null)
                  else if (index === 2) selectedDate && selectedSlot && setSelectedService(null)
                }}
                className={cn(
                  "flex h-16 w-1/3 flex-col items-center justify-center transition-colors",
                  index === 0 ? "rounded-l-lg border-r" :
                    index === 2 ? "rounded-r-lg" : "border-r",
                  (index === 0 && !selectedDate) ||
                    (index === 1 && selectedDate && !selectedSlot) ||
                    (index === 2 && selectedDate && selectedSlot && !selectedService)
                    ? "bg-purple-50 text-purple-700"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                  (index === 0 && selectedDate) ||
                    (index === 1 && selectedSlot) ||
                    (index === 2 && selectedService)
                    ? "bg-purple-600 text-white"
                    : "bg-gray-200 text-gray-500"
                )}>
                  {index + 1}
                </div>
                <div className="mt-1 text-sm font-medium">{step}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="flex flex-col items-center rounded-lg bg-white p-6">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <p className="mt-2">Cargando...</p>
            </div>
          </div>
        )}

        {/* Paso 1: Selección de fecha */}
        {!selectedDate && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {format(currentMonth, "MMMM yyyy", { locale: es })}
              </h2>
              <div className="flex space-x-2">
                <button onClick={handlePreviousMonth} className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button onClick={handleNextMonth} className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500">
              {["D", "L", "M", "X", "J", "V", "S"].map((day) => (
                <div key={day} className="py-2">{day}</div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-1">
              {daysInCalendar.map((day, dayIdx) => {
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isAvailable = isDateAvailable(day)
                const isBlocked = isDateBlocked(day)
                const isPast = isPastDate(day)
                const isSelected = selectedDate ? isSameDay(parseISO(selectedDate), day) : false
                const isDayToday = isToday(day)

                return (
                  <button
                    key={dayIdx}
                    onClick={() => isCurrentMonth && isAvailable && handleDateClick(day)}
                    onKeyDown={(e) => isCurrentMonth && isAvailable && handleCalendarKeyDown(e, day)}
                    disabled={!isCurrentMonth || !isAvailable || isPast}
                    className={cn(
                      "flex h-10 w-full items-center justify-center rounded-md text-sm transition-colors",
                      !isCurrentMonth && "text-red-300",
                      isCurrentMonth && isPast && "bg-red-100 text-red-400 cursor-not-allowed",
                      isCurrentMonth && isAvailable && !isSelected && "bg-purple-100 text-purple-800 hover:bg-purple-200 cursor-pointer",
                      isBlocked && "bg-gray-100 text-gray-800 cursor-not-allowed",
                      isSelected && "bg-purple-600 text-white hover:bg-purple-700 cursor-pointer",
                      isDayToday && !isSelected && "ring-2 ring-purple-500 ring-offset-2"
                    )}
                  >
                    {format(day, "d")}
                  </button>
                )
              })}
            </div>

            {/* Leyenda */}
            <div className="mt-6 flex flex-wrap gap-4">
              {[
                { color: "bg-white ring-2 ring-purple-500", label: "Hoy" },
                { color: "bg-purple-100", label: "Disponible" },
                { color: "bg-gray-100", label: "No disponible" },
                { color: "bg-red-100", label: "Bloqueado" }
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className={`h-4 w-4 rounded-full ${item.color}`}></div>
                  <span className="text-sm text-gray-600">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Botón siguiente */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  const firstAvailableDate = availableDates[0]
                  if (firstAvailableDate) {
                    setIsLoading(true)
                    setSelectedDate(firstAvailableDate)
                  }
                }}
                className="flex items-center rounded-md bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
              >
                Siguiente
                <ChevronRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Paso 2: Selección de hora */}
        {selectedDate && !selectedSlot && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <CalendarIcon className="mr-2 h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-medium">
                  {format(parseISO(selectedDate), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Cambiar fecha
              </button>
            </div>

            {loadingCitas ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                <span className="ml-2">Cargando horarios disponibles...</span>
              </div>
            ) : errorCitas ? (
              <div className="flex flex-col items-center justify-center rounded-md border border-red-200 bg-red-50 p-8">
                <AlertCircle className="h-10 w-10 text-red-500" />
                <p className="mt-2 text-center font-medium text-red-700">{errorCitas}</p>
                <button
                  onClick={cargarCitasExistentes}
                  className="mt-4 rounded-md bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
                >
                  Reintentar
                </button>
              </div>
            ) : (
              <>
                {timeSlots.morningSlots.length > 0 && (
                  <div className="mb-6">
                    <h5 className="mb-2 flex items-center text-sm font-medium text-gray-600">
                      <Clock className="mr-1 h-4 w-4" /> Mañana
                    </h5>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                      {timeSlots.morningSlots.map((slot) => (
                        <button
                          key={slot.id}
                          disabled={!slot.isAvailable}
                          onClick={() => handleSelectSlot(slot.id)}
                          className={cn(
                            "flex items-center justify-center rounded-md border p-2 text-sm transition-colors",
                            "border-purple-200 hover:border-purple-500 hover:bg-purple-100",
                            !slot.isAvailable && "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                          )}
                        >
                          <Clock className="mr-1 h-3 w-3 text-purple-500" />
                          {format(parseISO(slot.time), "h:mm a", { locale: es })}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {timeSlots.afternoonSlots.length > 0 && (
                  <div>
                    <h5 className="mb-2 flex items-center text-sm font-medium text-gray-600">
                      <Clock3 className="mr-1 h-4 w-4" /> Tarde
                    </h5>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                      {timeSlots.afternoonSlots.map((slot) => (
                        <button
                          key={slot.id}
                          disabled={!slot.isAvailable}
                          onClick={() => handleSelectSlot(slot.id)}
                          className={cn(
                            "flex items-center justify-center rounded-md border p-2 text-sm transition-colors",
                            "border-purple-200 hover:border-purple-500 hover:bg-purple-100",
                            !slot.isAvailable && "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                          )}
                        >
                          <Clock className="mr-1 h-3 w-3 text-purple-500" />
                          {format(parseISO(slot.time), "h:mm a", { locale: es })}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {timeSlots.morningSlots.length === 0 && timeSlots.afternoonSlots.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-md border border-gray-200 bg-gray-50 p-8">
                    <AlertCircle className="h-10 w-10 text-yellow-500" />
                    <p className="mt-2 text-center font-medium">No hay horarios disponibles para esta fecha</p>
                    <p className="mt-1 text-center text-sm text-gray-500">
                      Por favor, selecciona otra fecha o contacta con nosotros
                    </p>
                    <button
                      onClick={() => setSelectedDate(null)}
                      className="mt-4 flex items-center rounded-md bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Cambiar fecha
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Navegación */}
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setSelectedDate(null)}
                className="flex items-center rounded-md bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Anterior
              </button>
              <button disabled className="flex cursor-not-allowed items-center rounded-md bg-purple-600 px-4 py-2 text-white opacity-50">
                Siguiente
                <ChevronRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Paso 3: Selección de servicio */}
        {selectedDate && selectedSlot && !selectedService && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-medium">Selecciona un servicio:</h4>
              <button
                onClick={() => setSelectedSlot(null)}
                className="flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Cambiar horario
              </button>
            </div>

            <div className="mb-4 rounded-md bg-gray-50 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">
                    {format(parseISO(selectedDate), "d MMM, yyyy", { locale: es })}
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">
                    {format(parseISO(getSlotById(selectedSlot)?.time || ""), "h:mm a", { locale: es })}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              {serviceTypes.map((service) => (
                <button
                  key={service.id}
                  disabled={!service.active || cartItems.length === 0}
                  onClick={() => handleSelectService(service.id)}
                  className={cn(
                    "flex items-start justify-between rounded-md border p-3 text-left transition-colors",
                    service.color
                  )}
                >
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className="mt-1 text-sm opacity-80">Demora maxima de entrega: {service.duration} minutos</div>
                    <div className="mt-1 text-sm opacity-80">{service.description}</div>
                  </div>
                  <Clock className="h-5 w-5 flex-shrink-0 text-purple-600" />
                </button>
              ))}
            </div>

            {/* Navegación */}
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setSelectedSlot(null)}
                className="flex items-center rounded-md bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Anterior
              </button>
              <button disabled className="flex cursor-not-allowed items-center rounded-md bg-purple-600 px-4 py-2 text-white opacity-50">
                Siguiente
                <ChevronRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Paso 4: Confirmación */}
        {selectedDate && selectedSlot && selectedService && (
          <div ref={formRef} id="confirmation-section">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-medium">Detalles de la cita:</h4>
              <button
                onClick={() => setSelectedService(null)}
                className="flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Cambiar servicio
              </button>
            </div>

            <div className="mb-4 rounded-md bg-gray-50 p-3">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">
                    {format(parseISO(selectedDate), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">
                    {format(parseISO(getSlotById(selectedSlot)?.time || ""), "h:mm a", { locale: es })} -
                    {format(
                      addMinutes(
                        parseISO(getSlotById(selectedSlot)?.time || ""),
                        getServiceById(selectedService)?.duration || 0
                      ),
                      "h:mm a",
                      { locale: es }
                    )}
                  </span>
                </div>
                <div className="flex items-center">
                  <FileText className="mr-2 h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">
                    {getServiceById(selectedService)?.name} ({getServiceById(selectedService)?.duration} min)
                  </span>
                </div>
              </div>
            </div>

            {/* Formulario de confirmación */}
            <div className="space-y-4">
              <MainForm
                message_button={<>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirmar cita
                </>}
                actionType=""
                valueAssign={[
                  "Aclaraciones",
                  "Telefono",
                  "Nombre",
                  "CodigoPostal",
                  "Estado",
                  "Ciudad",
                  "Direccion"
                ]}
                action={handleCreateAppointment}
                dataForm={CitasField()}
              />
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setSelectedService(null)}
                className="flex items-center rounded-md bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Anterior
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}