"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
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
import { useGetAllMutation, usePostMutation } from "@/hooks/reducers/api"
import { useIonToast } from "@ionic/react"
import { useHistory } from "react-router"
import { clearCart } from "@/hooks/slices/cart"
import { getLocalStorageItem, setLocalStorageItem } from "@/utils/functions/local-storage"
import { driver } from "driver.js"

const BLOCKED_DATES = [
  startOfDay(addDays(new Date(), 2)).toISOString(),
  startOfDay(addDays(new Date(), 5)).toISOString(),
  startOfDay(addDays(new Date(), 10)).toISOString(),
]
const AVAILABLE_DATES = Array.from({ length: 60 }, (_, i) => {
  const date = startOfDay(addDays(new Date(), i))
  if (date.getDay() === 0) return null
  if (BLOCKED_DATES.some(blockedDate => isSameDay(parseISO(blockedDate), date))) return null
  return date.toISOString()
}).filter(Boolean) as string[]

const serviceTypes = [
  {
    id: "pickup",
    name: "Pickup",
    duration: 30,
    color: "bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200",
    description: "Recoja todos sus productos en tienda.",
  },
  {
    id: "vehiculo",
    name: "Entrega en vehículo",
    duration: 25,
    color: "bg-indigo-100 text-indigo-800 border-indigo-300 hover:bg-indigo-200",
    description: "Los productos le son entregados y cobrados en su vehículo si necesidad de bajarse.",
  },
]

const generateTimeSlots = (date: string, existingCitas: any[]) => {
  const baseDate = parseISO(date)
  const startHour = 9
  const endHour = 18
  const slotDuration = 15
  const now = new Date()
  const isToday = isSameDay(baseDate, now)

  const bookedSlots = existingCitas.map(cita => {
    const start = parseISO(cita.fecha)
    const end = addMinutes(start, 5)
    return { start, end }
  })

  const isSlotAvailable = (slotTime: Date) => {
    return !bookedSlots.some(({ start, end }) =>
      isWithinInterval(slotTime, { start, end }) ||
      isWithinInterval(addMinutes(slotTime, slotDuration), { start, end })
    )
  }

  const morningSlots = []
  for (let hour = startHour; hour < 13; hour++) {
    for (let minute = 0; minute < 60; minute += slotDuration) {
      const slotTime = new Date(baseDate)
      slotTime.setHours(hour, minute, 0, 0)

      if (isToday && isBefore(slotTime, now)) continue

      const isAvailable = isSlotAvailable(slotTime)

      morningSlots.push({
        id: `${hour}-${minute}`,
        time: slotTime.toISOString(),
        isAvailable,
      })
    }
  }

  const afternoonSlots = []
  for (let hour = 14; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += slotDuration) {
      const slotTime = new Date(baseDate)
      slotTime.setHours(hour, minute, 0, 0)

      if (isToday && isBefore(slotTime, now)) continue

      const isAvailable = isSlotAvailable(slotTime)

      afternoonSlots.push({
        id: `${hour}-${minute}`,
        time: slotTime.toISOString(),
        isAvailable,
      })
    }
  }

  return { morningSlots, afternoonSlots }
}

export function AppointmentCalendar() {
  const precio = getLocalStorageItem("sucursal").precio ?? useAppSelector((state) => state.app.sucursal.precio);
  const cartItems = useAppSelector((state: any) => state.cart.items.filter((item: any) => item.quantity > 0));

  const history = useHistory();
  const dispatch = useAppDispatch();

  const [PostData, { isLoading: isLoadingPost }] = usePostMutation();
  const [GetData, { isLoading: isLoadingGet }] = useGetAllMutation();

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [timeSlots, setTimeSlots] = useState<{ morningSlots: any[]; afternoonSlots: any[] }>({
    morningSlots: [],
    afternoonSlots: [],
  })
  const [present] = useIonToast();
  const formRef = useRef<HTMLDivElement>(null)

  // Función para iniciar el tour guiado
  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      steps: [
        {
          element: '#help-button',
          popover: {
            title: '¿Necesitas ayuda?',
            description: 'Siempre puedes volver a ver esta guía haciendo clic aquí.',
            side: "left",
            align: 'start'
          }
        },
        {
          element: '#calendar-header',
          popover: {
            title: 'Calendario de Citas',
            description: 'Aquí puedes seleccionar una fecha disponible para tu cita.',
            side: "bottom",
            align: 'start'
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
    });

    driverObj.drive();
  };

  // Mostrar tour automáticamente al cargar (solo primera vez)
  useEffect(() => {
    const hasSeenTour = getLocalStorageItem('hasSeenAppointmentTour');
    if (hasSeenTour !== true) {
      setTimeout(() => {
        startTour();
        setLocalStorageItem('hasSeenAppointmentTour', true);
      }, 1000);
    }
  }, []);

  useEffect(() => {
    if (selectedDate) {
      setLoadingSlots(true)

      GetData({
        url: "citas",
        filters: {
          "Filtros": [
            { "Key": "sucursal", "Value": precio }
          ],
          "Order": [{ "Key": "id", "Direction": "Desc" }]
        },
        pageSize: 100
      }).unwrap().then((response) => {
        const slots = generateTimeSlots(selectedDate, response.data || [])
        setTimeSlots(slots)
        setLoadingSlots(false)
      }).catch(() => {
        setLoadingSlots(false)
      })
    }
  }, [selectedDate])

  useEffect(() => {
    if (selectedService && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [selectedService])

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const handleDateClick = (date: Date) => {
    const dateString = startOfDay(date).toISOString()
    if (AVAILABLE_DATES.includes(dateString)) {
      setIsLoading(true)
      setSelectedSlot(null)
      setSelectedService(null)
      setSelectedDate(dateString)
      setTimeout(() => {
        setIsLoading(false)
      }, 600)
    }
  }

  const handleSelectSlot = (slotId: string) => {
    setSelectedSlot(slotId)
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }, 300)
  }

  const handleSelectService = (serviceId: string) => {
    setSelectedService(serviceId)
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: "smooth" })
      }
    }, 300)
  }
  const isDateAvailable = (date: Date) => {
    const dateString = startOfDay(date).toISOString()
    return AVAILABLE_DATES.includes(dateString)
  }

  const isDateBlocked = (date: Date) => {
    return BLOCKED_DATES.some((blockedDate) => isSameDay(parseISO(blockedDate), date))
  }

  const isPastDate = (date: Date) => {
    return isBefore(date, startOfDay(new Date()))
  }

  const getSlotById = (slotId: string) => {
    return [...timeSlots.morningSlots, ...timeSlots.afternoonSlots].find((slot) => slot.id === slotId)
  }

  const getServiceById = (serviceId: string) => {
    return serviceTypes.find((service) => service.id === serviceId)
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const daysInCalendar = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const handleCalendarKeyDown = (e: React.KeyboardEvent, day: Date) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleDateClick(day)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white text-gray-900 shadow-sm">
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="calendar-header" className="text-lg font-semibold">Agenda tu cita</h2>
          <div className="flex items-center space-x-2">
            <button
              id="help-button"
              onClick={startTour}
              className="flex items-center gap-1 rounded-full p-2 transition-colors hover:bg-gray-100"
              aria-label="Mostrar guía de ayuda"
            >
              <HelpCircle className="h-5 w-5" /> Ayuda
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between">
            <button
              id="date-step"
              onClick={() => setSelectedDate(null)}
              className={cn(
                "flex h-16 w-1/3 flex-col items-center justify-center rounded-l-lg border-r transition-colors",
                !selectedDate ? "bg-purple-50 text-purple-700" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                !selectedDate ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-500"
              )}>
                1
              </div>
              <div className="mt-1 text-sm font-medium">Fecha</div>
            </button>

            <button
              id="time-step"
              onClick={() => selectedDate && setSelectedSlot(null)}
              className={cn(
                "flex h-16 w-1/3 flex-col items-center justify-center border-r transition-colors",
                selectedDate && !selectedSlot ? "bg-purple-50 text-purple-700" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                selectedDate && (!selectedSlot || (selectedSlot && !selectedService)) ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-500"
              )}>
                2
              </div>
              <div className="mt-1 text-sm font-medium">Hora</div>
            </button>

            <button
              id="service-step"
              onClick={() => selectedDate && selectedSlot && setSelectedService(null)}
              className={cn(
                "flex h-16 w-1/3 flex-col items-center justify-center rounded-r-lg transition-colors",
                selectedDate && selectedSlot && !selectedService ? "bg-purple-50 text-purple-700" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                selectedDate && selectedSlot && selectedService ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-500"
              )}>
                3
              </div>
              <div className="mt-1 text-sm font-medium">Confirmar</div>
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="flex flex-col items-center rounded-lg bg-white p-6">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <p className="mt-2">Cargando...</p>
            </div>
          </div>
        )}

        {!selectedDate && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {format(currentMonth, "MMMM yyyy", { locale: es })}
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={handlePreviousMonth}
                  className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500">
              {["D", "L", "M", "X", "J", "V", "S"].map((day, index) => (
                <div key={index} className="py-2">
                  {day}
                </div>
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
                  <div key={dayIdx} className="relative">
                    <button
                      onClick={() => isCurrentMonth && isAvailable && handleDateClick(day)}
                      onKeyDown={(e) => isCurrentMonth && isAvailable && handleCalendarKeyDown(e, day)}
                      disabled={!isCurrentMonth || !isAvailable || isPast}
                      className={cn(
                        "flex h-10 w-full items-center justify-center rounded-md text-sm transition-colors",
                        !isCurrentMonth && "text-gray-300",
                        isCurrentMonth &&
                        !isAvailable &&
                        !isBlocked &&
                        !isPast &&
                        "text-gray-400 cursor-not-allowed",
                        isCurrentMonth && isPast && "bg-gray-100 text-gray-400 cursor-not-allowed",
                        isCurrentMonth &&
                        isAvailable &&
                        !isSelected &&
                        "bg-purple-100 text-purple-800 hover:bg-purple-200 cursor-pointer",
                        isBlocked && "bg-red-100 text-red-800 cursor-not-allowed",
                        isSelected && "bg-purple-600 text-white hover:bg-purple-700 cursor-pointer",
                        isDayToday && !isSelected && "ring-2 ring-purple-500 ring-offset-2"
                      )}
                    >
                      {format(day, "d")}
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded-full bg-white ring-2 ring-purple-500"></div>
                <span className="text-sm text-gray-600">Hoy</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded-full bg-purple-100"></div>
                <span className="text-sm text-gray-600">Disponible</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded-full bg-red-100"></div>
                <span className="text-sm text-gray-600">Bloqueado</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded-full bg-gray-100"></div>
                <span className="text-sm text-gray-600">No disponible</span>
              </div>
            </div>
          </div>
        )}

        {!selectedDate && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => {
                const firstAvailableDate = AVAILABLE_DATES[0]
                if (firstAvailableDate) {
                  setIsLoading(true)
                  setSelectedDate(firstAvailableDate)
                  setTimeout(() => {
                    setIsLoading(false)
                  }, 600)
                }
              }}
              className="flex items-center rounded-md bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
            >
              Siguiente
              <ChevronRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        )}

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

            {loadingSlots ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                <span className="ml-2">Cargando horarios disponibles...</span>
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

                {(timeSlots.morningSlots.length > 0 || timeSlots.afternoonSlots.length > 0) && (
                  <div className="mt-4 rounded-md bg-purple-50 p-3 text-sm text-purple-800">
                    <p className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-purple-600" />
                      Selecciona un horario para continuar con tu reserva
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {selectedDate &&
          !selectedSlot &&
          (timeSlots.morningSlots.length > 0 || timeSlots.afternoonSlots.length > 0) && (
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setSelectedDate(null)}
                className="flex items-center rounded-md bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Anterior
              </button>

              <button
                disabled={true}
                className="flex cursor-not-allowed items-center rounded-md bg-purple-600 px-4 py-2 text-white opacity-50"
              >
                Siguiente
                <ChevronRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          )}

        {selectedDate && selectedSlot && !selectedService && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-medium">Selecciona un servicio:</h4>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSelectedSlot(null)}
                  className="flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Cambiar horario
                </button>
              </div>
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
                  onClick={() => handleSelectService(service.id)}
                  className={cn(
                    "flex items-start justify-between rounded-md border p-3 text-left transition-colors",
                    service.color
                  )}
                >
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className="mt-1 text-sm opacity-80">Duración: {service.duration} minutos</div>
                    <div className="mt-1 text-sm opacity-80">{service.description}</div>
                  </div>
                  <Clock className="h-5 w-5 flex-shrink-0 text-purple-600" />
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedDate && selectedSlot && !selectedService && (
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setSelectedSlot(null)}
              className="flex items-center rounded-md bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Anterior
            </button>

            <button
              disabled={true}
              className="flex cursor-not-allowed items-center rounded-md bg-purple-600 px-4 py-2 text-white opacity-50"
            >
              Siguiente
              <ChevronRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        )}

        {selectedDate && selectedSlot && selectedService && (
          <div ref={formRef} id="confirmation-section">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-medium">Detalles de la cita:</h4>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSelectedService(null)}
                  className="flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Cambiar servicio
                </button>
              </div>
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

            <div className="space-y-4">
              <MainForm
                message_button={<>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirmar cita
                </>}
                actionType={""}
                valueAssign={[
                  "Aclaraciones",
                  "Telefono",
                  "Nombre",
                  "CodigoPostal",
                  "Estado",
                  "Ciudad",
                  "Direccion"
                ]}
                action={
                  async (values: any) => {
                    try {

                      const { data: Clientes } = await GetData({
                        url: "clientes",
                        filters: {
                          "Filtros": [
                            { "Key": "telefono", "Value": values.Telefono }
                          ],
                          "Order": [{ "Key": "id", "Direction": "Desc" }]
                        },
                        pageSize: 1
                      });
                      let clienteResponse: any;
                      if (!Clientes.data.length) {
                        const dataCliente: any = {
                          Cliente: [{
                            nombre: values.Nombre,
                            telefono: values.Telefono,
                            cp: values.CodigoPostal,
                            estado: values.Estado,
                            ciudad: values.Ciudad,
                            direccion: values.Direccion,
                          }]
                        }
                        clienteResponse = await PostData({ url: "clientes", data: dataCliente }).unwrap();
                      }
                      const clienteId = Clientes.data[0].id || clienteResponse.data.ids[0];

                      setLocalStorageItem("user", clienteId);
                      setLocalStorageItem("user-data", Clientes.data[0])

                      const time = format(parseISO(getSlotById(selectedSlot)?.time), "yyyy-MM-dd'T'HH:mm:ss", { locale: es });
                      const service = getServiceById(selectedService)?.name;

                      if (!time || !service) {
                        throw new Error('Missing required time or service information');
                      }

                      // Crear lista
                      const listaPayload: any = {
                        Lista: [{
                          Id_Cliente: clienteId,
                          Sucursal: 1,
                          Servicio: service,
                          Array_Lista: JSON.stringify(cartItems)
                        }]
                      };

                      const listaResponse = await PostData({ url: "listas", data: listaPayload });
                      const listaId = listaResponse.data.ids[0];

                      // Crear cita
                      const citaPayload: any = {
                        Citas: [{
                          Id_Cliente: clienteId,
                          Id_Usuario_Responsable: 1,
                          Fecha: time,
                          Plan: service,
                          Id_Lista: listaId,
                          Estado: "nuevo",
                          Sucursal: precio,
                        }]
                      };

                      await PostData({ url: "citas", data: citaPayload }).unwrap();
                      dispatch(clearCart())
                      present({
                        message: `Cita creada correctamente`,
                        duration: 3500,
                        cssClass: "custom-tertiary",
                        position: 'bottom',
                        buttons: [{
                          text: "ver",
                          side: 'end',
                          handler: () => {
                            history.replace('/loading');
                          }
                        }]
                      });
                    } catch (error) {
                      console.error("Error in appointment creation process:", error);
                      present({
                        message: `Error al generar cita`,
                        duration: 2500,
                        color: "danger",
                        position: 'bottom'
                      });
                    }
                  }
                }
                dataForm={CitasField()}
              />
            </div>
            <div className={cn("flex justify-between")}>
              <button
                onClick={() => setSelectedService(null)}
                className={cn("flex items-center rounded-md bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200")}
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