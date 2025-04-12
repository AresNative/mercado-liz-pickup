"use client"

import type React from "react"

import { useState } from "react"
import { format, parseISO, addMinutes } from "date-fns"
import { es } from "date-fns/locale"
import { Clock, Check, Calendar, Users, FileText, Clock3 } from "lucide-react"
import { cn } from "@/lib/utils"

// Sample data - in a real app, this would come from an API
const generateTimeSlots = (date: string) => {
  const baseDate = parseISO(date)
  const startHour = 9 // 9 AM
  const endHour = 18 // 6 PM
  const slotDuration = 30 // 30 minutes

  const slots = []

  // Morning slots (9 AM - 1 PM)
  const morningSlots = []
  for (let hour = startHour; hour < 13; hour++) {
    for (let minute = 0; minute < 60; minute += slotDuration) {
      const slotTime = new Date(baseDate)
      slotTime.setHours(hour, minute, 0, 0)

      // Randomly mark some slots as unavailable
      const isAvailable = Math.random() > 0.3

      morningSlots.push({
        id: `${hour}-${minute}`,
        time: slotTime.toISOString(),
        isAvailable,
      })
    }
  }

  // Afternoon slots (2 PM - 6 PM)
  const afternoonSlots = []
  for (let hour = 14; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += slotDuration) {
      const slotTime = new Date(baseDate)
      slotTime.setHours(hour, minute, 0, 0)

      // Randomly mark some slots as unavailable
      const isAvailable = Math.random() > 0.3

      afternoonSlots.push({
        id: `${hour}-${minute}`,
        time: slotTime.toISOString(),
        isAvailable,
      })
    }
  }

  return { morningSlots, afternoonSlots }
}

// Service types
const serviceTypes = [
  { id: "consulta", name: "Consulta general", duration: 30, color: "bg-blue-100 text-blue-700 border-blue-300" },
  { id: "revision", name: "Revisión de rutina", duration: 45, color: "bg-green-100 text-green-700 border-green-300" },
  {
    id: "tratamiento",
    name: "Tratamiento especializado",
    duration: 60,
    color: "bg-purple-100 text-purple-700 border-purple-300",
  },
]

interface TimeSlotsProps {
  selectedDate: string
}

export function TimeSlots({ selectedDate }: TimeSlotsProps) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [isBooking, setIsBooking] = useState(false)
  const [isBooked, setIsBooked] = useState(false)
  const [appointmentDetails, setAppointmentDetails] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  })

  const { morningSlots, afternoonSlots } = generateTimeSlots(selectedDate)

  const handleSelectSlot = (slotId: string) => {
    setSelectedSlot(slotId)
  }

  const handleSelectService = (serviceId: string) => {
    setSelectedService(serviceId)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setAppointmentDetails((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleBookAppointment = () => {
    setIsBooking(true)
    // Simulate API call
    setTimeout(() => {
      setIsBooking(false)
      setIsBooked(true)
    }, 1500)
  }

  const getSlotById = (slotId: string) => {
    return [...morningSlots, ...afternoonSlots].find((slot) => slot.id === slotId)
  }

  const getServiceById = (serviceId: string) => {
    return serviceTypes.find((service) => service.id === serviceId)
  }

  if (isBooked) {
    const slot = getSlotById(selectedSlot || "")
    const service = getServiceById(selectedService || "")

    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">¡Cita agendada!</h3>
        <div className="mt-4 w-full max-w-md rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-start">
            <Calendar className="mr-3 h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-gray-900">
                {format(parseISO(selectedDate), "EEEE d 'de' MMMM, yyyy", { locale: es })}
              </p>
              <p className="text-gray-600">
                {slot && format(parseISO(slot.time), "h:mm a", { locale: es })} -
                {slot && service && format(addMinutes(parseISO(slot.time), service.duration), "h:mm a", { locale: es })}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-start">
            <FileText className="mr-3 h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-gray-900">Servicio</p>
              <p className="text-gray-600">{service?.name}</p>
            </div>
          </div>

          <div className="mt-3 flex items-start">
            <Users className="mr-3 h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-gray-900">Información de contacto</p>
              <p className="text-gray-600">{appointmentDetails.name}</p>
              <p className="text-gray-600">{appointmentDetails.email}</p>
              <p className="text-gray-600">{appointmentDetails.phone}</p>
            </div>
          </div>

          {appointmentDetails.notes && (
            <div className="mt-3 flex items-start">
              <FileText className="mr-3 h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">Notas</p>
                <p className="text-gray-600">{appointmentDetails.notes}</p>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            setSelectedSlot(null)
            setSelectedService(null)
            setIsBooked(false)
            setAppointmentDetails({
              name: "",
              email: "",
              phone: "",
              notes: "",
            })
          }}
          className="mt-6 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          Agendar otra cita
        </button>
      </div>
    )
  }

  return (
    <div>
      {!selectedSlot ? (
        <>
          <h4 className="mb-4 font-medium text-gray-700">Horarios disponibles:</h4>

          {/* Morning slots */}
          <div className="mb-6">
            <h5 className="mb-2 flex items-center text-sm font-medium text-gray-600">
              <Clock className="mr-1 h-4 w-4" /> Mañana
            </h5>
            <div className="grid grid-cols-3 gap-2">
              {morningSlots.map((slot) => (
                <button
                  key={slot.id}
                  disabled={!slot.isAvailable}
                  onClick={() => handleSelectSlot(slot.id)}
                  className={cn(
                    "flex items-center justify-center rounded-md border p-2 text-sm",
                    !slot.isAvailable && "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400",
                    slot.isAvailable && "border-gray-200 hover:border-green-500 hover:bg-green-50",
                  )}
                >
                  <Clock className="mr-1 h-3 w-3 text-gray-400" />
                  {format(parseISO(slot.time), "h:mm a", { locale: es })}
                </button>
              ))}
            </div>
          </div>

          {/* Afternoon slots */}
          <div>
            <h5 className="mb-2 flex items-center text-sm font-medium text-gray-600">
              <Clock3 className="mr-1 h-4 w-4" /> Tarde
            </h5>
            <div className="grid grid-cols-3 gap-2">
              {afternoonSlots.map((slot) => (
                <button
                  key={slot.id}
                  disabled={!slot.isAvailable}
                  onClick={() => handleSelectSlot(slot.id)}
                  className={cn(
                    "flex items-center justify-center rounded-md border p-2 text-sm",
                    !slot.isAvailable && "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400",
                    slot.isAvailable && "border-gray-200 hover:border-green-500 hover:bg-green-50",
                  )}
                >
                  <Clock className="mr-1 h-3 w-3 text-gray-400" />
                  {format(parseISO(slot.time), "h:mm a", { locale: es })}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-md bg-blue-50 p-3 text-sm text-blue-700">
            <p className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              Selecciona un horario para continuar con tu reserva
            </p>
          </div>
        </>
      ) : !selectedService ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h4 className="font-medium text-gray-700">Selecciona un servicio:</h4>
            <button onClick={() => setSelectedSlot(null)} className="text-sm text-gray-500 hover:text-gray-700">
              Volver a horarios
            </button>
          </div>

          <div className="grid gap-3">
            {serviceTypes.map((service) => (
              <button
                key={service.id}
                onClick={() => handleSelectService(service.id)}
                className={cn(
                  "flex items-center justify-between rounded-md border p-3 text-left transition-colors",
                  service.color,
                )}
              >
                <div>
                  <div className="font-medium">{service.name}</div>
                  <div className="text-sm opacity-80">Duración: {service.duration} minutos</div>
                </div>
                <Clock className="h-5 w-5" />
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h4 className="font-medium text-gray-700">Detalles de la cita:</h4>
            <button onClick={() => setSelectedService(null)} className="text-sm text-gray-500 hover:text-gray-700">
              Cambiar servicio
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
            <div className="mt-2 flex items-center">
              <FileText className="mr-2 h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">
                {getServiceById(selectedService)?.name} ({getServiceById(selectedService)?.duration} min)
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                Nombre completo
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={appointmentDetails.name}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={appointmentDetails.email}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={appointmentDetails.phone}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label htmlFor="notes" className="mb-1 block text-sm font-medium text-gray-700">
                Notas adicionales (opcional)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={appointmentDetails.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleBookAppointment}
              disabled={isBooking || !appointmentDetails.name || !appointmentDetails.email || !appointmentDetails.phone}
              className={cn(
                "w-full rounded-md bg-green-600 py-3 text-white hover:bg-green-700",
                isBooking && "cursor-wait opacity-75",
                (!appointmentDetails.name || !appointmentDetails.email || !appointmentDetails.phone) &&
                  "cursor-not-allowed opacity-50",
              )}
            >
              {isBooking ? "Procesando..." : "Confirmar cita"}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
