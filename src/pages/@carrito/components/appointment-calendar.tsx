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
} from "date-fns"
import { es } from "date-fns/locale"
import {
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  Clock,
  Clock3,
  Check,
  Calendar,
  Users,
  FileText,
  AlertCircle,
  Info,
  ArrowLeft,
  Loader2,
  X,
  CheckCircle2,
  HelpCircle,
} from "lucide-react"

import { cn } from "@/utils/functions/cn"
import MainForm from "@/components/form/main-form"
import { CitasField } from "../constants/citas-field"

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
    id: "consulta",
    name: "Consulta general",
    duration: 30,
    color: "bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200",
    description: "Consulta médica general para diagnóstico y tratamiento de problemas comunes de salud.",
  },
  {
    id: "revision",
    name: "Revisión de rutina",
    duration: 45,
    color: "bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200",
    description: "Chequeo completo para evaluar tu estado de salud general y prevenir enfermedades.",
  },
  {
    id: "tratamiento",
    name: "Tratamiento especializado",
    duration: 60,
    color: "bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200",
    description: "Sesión de tratamiento para condiciones específicas que requieren atención especializada.",
  },
]

const generateTimeSlots = (date: string) => {
  const baseDate = parseISO(date)
  const startHour = 9
  const endHour = 18
  const slotDuration = 30
  const now = new Date()
  const isToday = isSameDay(baseDate, now)

  const morningSlots = []
  for (let hour = startHour; hour < 13; hour++) {
    for (let minute = 0; minute < 60; minute += slotDuration) {
      const slotTime = new Date(baseDate)
      slotTime.setHours(hour, minute, 0, 0)

      if (isToday && isBefore(slotTime, now)) {
        continue
      }

      const seed = date + hour + minute
      const pseudoRandom = Math.sin(Array.from(seed).reduce((acc, char) => acc + char.charCodeAt(0), 0)) * 10000
      const isAvailable = pseudoRandom % 10 > 3

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

      if (isToday && isBefore(slotTime, now)) {
        continue
      }

      const seed = date + hour + minute
      const pseudoRandom = Math.sin(Array.from(seed).reduce((acc, char) => acc + char.charCodeAt(0), 0)) * 10000
      const isAvailable = pseudoRandom % 10 > 3

      afternoonSlots.push({
        id: `${hour}-${minute}`,
        time: slotTime.toISOString(),
        isAvailable,
      })
    }
  }

  return { morningSlots, afternoonSlots }
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRegex = /^\+?[0-9]{8,15}$/

export function AppointmentCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [isBooking, setIsBooking] = useState(false)
  const [isBooked, setIsBooked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [timeSlots, setTimeSlots] = useState<{ morningSlots: any[]; afternoonSlots: any[] }>({
    morningSlots: [],
    afternoonSlots: [],
  })
  const [errors, setErrors] = useState<{
    name?: string
    email?: string
    phone?: string
  }>({})
  const [appointmentDetails, setAppointmentDetails] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  })
  const [showHelp, setShowHelp] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedDate) {
      setLoadingSlots(true)
      setTimeout(() => {
        const slots = generateTimeSlots(selectedDate)
        setTimeSlots(slots)
        setLoadingSlots(false)
      }, 600)
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

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case "name":
        return value.trim().length < 3 ? "El nombre debe tener al menos 3 caracteres" : undefined
      case "email":
        return !emailRegex.test(value) ? "Ingresa un correo electrónico válido" : undefined
      case "phone":
        return !phoneRegex.test(value) ? "Ingresa un número de teléfono válido" : undefined
      default:
        return undefined
    }
  }

  const handleBookAppointment = () => {
    const newErrors = {
      name: validateField("name", appointmentDetails.name),
      email: validateField("email", appointmentDetails.email),
      phone: validateField("phone", appointmentDetails.phone),
    }

    setErrors(newErrors)

    if (Object.values(newErrors).some((error) => error !== undefined)) {
      return
    }

    setIsBooking(true)
    setTimeout(() => {
      const isSuccess = Math.random() > 0.1
      if (isSuccess) {
        setIsBooking(false)
        setIsBooked(true)
      } else {
        setIsBooking(false)
      }
    }, 1500)
  }

  const handleReset = () => {
    setSelectedDate(null)
    setSelectedSlot(null)
    setSelectedService(null)
    setIsBooked(false)
    setErrors({})
    setAppointmentDetails({
      name: "",
      email: "",
      phone: "",
      notes: "",
    })
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
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const handleCalendarKeyDown = (e: React.KeyboardEvent, day: Date) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleDateClick(day)
    }
  }

  if (isBooked) {
    const slot = getSlotById(selectedSlot || "")
    const service = getServiceById(selectedService || "")

    return (
      <div className="rounded-xl border border-gray-200 bg-white text-gray-900 shadow-sm">
        <div className="flex flex-col items-center justify-center p-6 py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
            <Check className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="mt-4 text-xl font-medium">¡Cita agendada con éxito!</h3>
          <p className="mt-2 text-center text-gray-600">
            Hemos enviado un correo electrónico con los detalles de tu cita a {appointmentDetails.email}
          </p>

          <div className="mt-6 w-full max-w-md rounded-lg border border-purple-200 bg-purple-50 p-4">
            <div className="flex items-start">
              <Calendar className="mr-3 h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium">
                  {format(parseISO(selectedDate!), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                </p>
                <p className="text-gray-600">
                  {slot && format(parseISO(slot.time), "h:mm a", { locale: es })} -
                  {slot &&
                    service &&
                    format(addMinutes(parseISO(slot.time), service.duration), "h:mm a", { locale: es })}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-start">
              <FileText className="mr-3 h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium">Servicio</p>
                <p className="text-gray-600">{service?.name}</p>
              </div>
            </div>

            <div className="mt-3 flex items-start">
              <Users className="mr-3 h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium">Información de contacto</p>
                <p className="text-gray-600">{appointmentDetails.name}</p>
                <p className="text-gray-600">{appointmentDetails.email}</p>
                <p className="text-gray-600">{appointmentDetails.phone}</p>
              </div>
            </div>

            {appointmentDetails.notes && (
              <div className="mt-3 flex items-start">
                <FileText className="mr-3 h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium">Notas</p>
                  <p className="text-gray-600">{appointmentDetails.notes}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
            <button
              onClick={handleReset}
              className="flex items-center justify-center rounded-md bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Agendar otra cita
            </button>

            <button
              className="flex items-center justify-center rounded-md bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
            >
              <FileText className="mr-2 h-4 w-4" />
              Descargar comprobante
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white text-gray-900 shadow-sm">
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Agenda tu cita</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="rounded-full p-2 transition-colors hover:bg-gray-100"
              aria-label={showHelp ? "Ocultar ayuda" : "Mostrar ayuda"}
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
        </div>

        {showHelp && (
          <div className="mb-6 rounded-lg border border-purple-100 bg-purple-50 p-4 text-purple-800">
            <div className="flex items-start">
              <Info className="mr-3 h-5 w-5 flex-shrink-0 text-purple-600" />
              <div>
                <h3 className="font-medium">Cómo agendar una cita</h3>
                <ol className="mt-2 list-inside list-decimal space-y-1 text-sm">
                  <li>Selecciona una fecha disponible en el calendario (marcada en morado)</li>
                  <li>Elige un horario disponible entre las opciones mostradas</li>
                  <li>Selecciona el tipo de servicio que necesitas</li>
                  <li>Completa el formulario con tus datos personales</li>
                  <li>Confirma tu cita</li>
                </ol>
                <p className="mt-2 text-sm">
                  Si necesitas ayuda adicional, contacta con nosotros al <strong>+123 456 7890</strong>
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="mt-2 flex w-full items-center justify-center rounded-md bg-purple-100 p-2 text-sm transition-colors hover:bg-purple-200"
            >
              <X className="mr-2 h-4 w-4" />
              Cerrar ayuda
            </button>
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between">
            <button
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
              {daysInMonth.map((day, dayIdx) => {
                const isAvailable = isDateAvailable(day)
                const isBlocked = isDateBlocked(day)
                const isPast = isPastDate(day)
                const isSelected = selectedDate ? isSameDay(parseISO(selectedDate), day) : false
                const isDayToday = isToday(day)

                return (
                  <div key={dayIdx} className="relative">
                    <button
                      onClick={() => isAvailable && handleDateClick(day)}
                      onKeyDown={(e) => isAvailable && handleCalendarKeyDown(e, day)}
                      disabled={!isAvailable || isPast}
                      className={cn(
                        "flex h-10 w-full items-center justify-center rounded-md text-sm transition-colors",
                        !isSameMonth(day, currentMonth) && "text-gray-300",
                        isSameMonth(day, currentMonth) &&
                        !isAvailable &&
                        !isBlocked &&
                        !isPast &&
                        "text-gray-400 cursor-not-allowed",
                        isSameMonth(day, currentMonth) && isPast && "bg-gray-100 text-gray-400 cursor-not-allowed",
                        isSameMonth(day, currentMonth) &&
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
          <div ref={formRef}>
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
                actionType={"post-login"}
                dataForm={CitasField()}
                onSuccess={(result: any) => {
                  console.log(result);
                }}
              />
            </div>
            <div className={cn(isBooking ? "mt-6" : "", "flex justify-between")}>
              <button
                onClick={() => setSelectedService(null)}
                className={cn("flex items-center rounded-md bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200")}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Anterior
              </button>

              <button
                onClick={handleBookAppointment}
                disabled={
                  isBooking ||
                  !appointmentDetails.name ||
                  !appointmentDetails.email ||
                  !appointmentDetails.phone ||
                  !!errors.name ||
                  !!errors.email ||
                  !!errors.phone
                }
                className={cn(
                  "flex items-center rounded-md bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700",
                  (isBooking ||
                    !appointmentDetails.name ||
                    !appointmentDetails.email ||
                    !appointmentDetails.phone ||
                    !!errors.name ||
                    !!errors.email ||
                    !!errors.phone) &&
                  "cursor-not-allowed opacity-50",

                  isBooking ? "flex items-center rounded-md bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200" : "hidden"
                )}
              >
                {isBooking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Confirmar cita
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}