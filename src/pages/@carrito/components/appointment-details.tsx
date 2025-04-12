"use client"

import { useState } from "react"
import { format, parseISO, addMinutes } from "date-fns"
import { es } from "date-fns/locale"
import {
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonButton,
  IonIcon,
  IonTextarea,
  IonBadge,
  IonAlert,
} from "@ionic/react"
import {
  calendar,
  time,
  person,
  call,
  mail,
  document,
  close,
  checkmarkCircle,
  closeCircle,
  alertCircle,
  create,
  save,
  chatbubble,
  print,
  timeOutline,
} from "ionicons/icons"
import { cn } from "@/lib/utils"

interface AppointmentDetailsProps {
  appointment: any
  darkMode: boolean
  onClose: () => void
  onStatusChange: (appointmentId: string, newStatus: string) => void
  onNotesUpdate: (appointmentId: string, notes: string) => void
  statuses: Array<{ id: string; name: string; color: string }>
}

export function AppointmentDetails({
  appointment,
  darkMode,
  onClose,
  onStatusChange,
  onNotesUpdate,
  statuses,
}: AppointmentDetailsProps) {
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [notes, setNotes] = useState(appointment.notes)
  const [showConfirmCancel, setShowConfirmCancel] = useState(false)

  // Obtener nombre de estado
  const getStatusName = (status: string) => {
    const statusObj = statuses.find((s) => s.id === status)
    return statusObj?.name || status
  }

  // Obtener color de estado
  const getStatusColor = (status: string) => {
    const statusObj = statuses.find((s) => s.id === status)
    return statusObj?.color || "bg-gray-100 text-gray-700 border-gray-300"
  }

  // Manejar cambio de estado
  const handleStatusChange = (newStatus: string) => {
    onStatusChange(appointment.id, newStatus)

    // Si estamos cancelando, ocultar el diálogo de confirmación
    if (newStatus === "cancelled") {
      setShowConfirmCancel(false)
    }
  }

  // Manejar guardado de notas
  const handleSaveNotes = () => {
    onNotesUpdate(appointment.id, notes)
    setIsEditingNotes(false)
  }

  // Calcular hora de fin de la cita
  const endTime = addMinutes(parseISO(appointment.date), appointment.duration)

  return (
    <IonCard className={cn("rounded-xl shadow-sm", darkMode ? "bg-gray-900" : "bg-white")}>
      <IonCardHeader>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium">Detalles de la Cita</h3>
          <IonButton
            fill="clear"
            onClick={onClose}
            className={cn("rounded-full p-1", darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100")}
            aria-label="Cerrar detalles"
          >
            <IonIcon icon={close} />
          </IonButton>
        </div>
      </IonCardHeader>

      <IonCardContent>
        {/* Información de la cita */}
        <div
          className={cn(
            "mb-4 rounded-md border p-4",
            darkMode ? "border-gray-800 bg-gray-800/50" : "border-gray-200 bg-gray-50",
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  appointment.status === "completed"
                    ? "bg-green-100"
                    : appointment.status === "cancelled"
                      ? "bg-red-100"
                      : "bg-blue-100",
                )}
              >
                {appointment.status === "completed" ? (
                  <IonIcon icon={checkmarkCircle} className="h-5 w-5 text-green-600" />
                ) : appointment.status === "cancelled" ? (
                  <IonIcon icon={closeCircle} className="h-5 w-5 text-red-600" />
                ) : (
                  <IonIcon icon={timeOutline} className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium">{appointment.id}</div>
                <div className={cn("text-xs", darkMode ? "text-gray-400" : "text-gray-500")}>
                  Creada el {format(parseISO(appointment.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
                </div>
              </div>
            </div>
            <IonBadge
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                getStatusColor(appointment.status),
                darkMode && "bg-opacity-20 border-opacity-30",
              )}
            >
              {getStatusName(appointment.status)}
            </IonBadge>
          </div>
        </div>

        {/* Información del paciente */}
        <div className="mb-4">
          <h4 className={cn("mb-2 text-sm font-medium", darkMode ? "text-gray-300" : "text-gray-700")}>
            Información del Paciente
          </h4>
          <div className={cn("rounded-md border p-4", darkMode ? "border-gray-800" : "border-gray-200")}>
            <div className="flex items-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  darkMode ? "bg-gray-800" : "bg-gray-100",
                )}
              >
                <IonIcon icon={person} />
              </div>
              <div className="ml-3">
                <div className="font-medium">{appointment.patientName}</div>
                <div className="mt-1 flex flex-col space-y-1">
                  <div className="flex items-center">
                    <IonIcon icon={mail} className={cn("mr-1 h-4 w-4", darkMode ? "text-gray-400" : "text-gray-500")} />
                    <span className={cn("text-sm", darkMode ? "text-gray-300" : "text-gray-600")}>
                      {appointment.patientEmail}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <IonIcon icon={call} className={cn("mr-1 h-4 w-4", darkMode ? "text-gray-400" : "text-gray-500")} />
                    <span className={cn("text-sm", darkMode ? "text-gray-300" : "text-gray-600")}>
                      {appointment.patientPhone}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detalles de la cita */}
        <div className="mb-4">
          <h4 className={cn("mb-2 text-sm font-medium", darkMode ? "text-gray-300" : "text-gray-700")}>
            Detalles de la Cita
          </h4>
          <div className={cn("rounded-md border p-4", darkMode ? "border-gray-800" : "border-gray-200")}>
            <div className="space-y-3">
              <div className="flex items-start">
                <IonIcon icon={calendar} className={cn("mr-2 h-5 w-5", darkMode ? "text-gray-400" : "text-gray-500")} />
                <div>
                  <div className={cn("text-sm", darkMode ? "text-gray-300" : "text-gray-700")}>Fecha</div>
                  <div className="font-medium">
                    {format(parseISO(appointment.date), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                  </div>
                </div>
              </div>

              <div className="flex items-start">
                <IonIcon icon={time} className={cn("mr-2 h-5 w-5", darkMode ? "text-gray-400" : "text-gray-500")} />
                <div>
                  <div className={cn("text-sm", darkMode ? "text-gray-300" : "text-gray-700")}>Horario</div>
                  <div className="font-medium">
                    {format(parseISO(appointment.date), "HH:mm", { locale: es })} -{" "}
                    {format(endTime, "HH:mm", { locale: es })} ({appointment.duration} min)
                  </div>
                </div>
              </div>

              <div className="flex items-start">
                <IonIcon icon={document} className={cn("mr-2 h-5 w-5", darkMode ? "text-gray-400" : "text-gray-500")} />
                <div>
                  <div className={cn("text-sm", darkMode ? "text-gray-300" : "text-gray-700")}>Servicio</div>
                  <div className="font-medium">{appointment.serviceName}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notas */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className={cn("text-sm font-medium", darkMode ? "text-gray-300" : "text-gray-700")}>Notas</h4>
            {!isEditingNotes ? (
              <IonButton
                fill="clear"
                size="small"
                onClick={() => setIsEditingNotes(true)}
                className={cn(
                  "flex items-center rounded-md px-2 py-1 text-xs",
                  darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-100 hover:bg-gray-200",
                )}
              >
                <IonIcon icon={create} slot="start" />
                Editar
              </IonButton>
            ) : (
              <div className="flex space-x-2">
                <IonButton
                  fill="clear"
                  size="small"
                  onClick={() => {
                    setNotes(appointment.notes)
                    setIsEditingNotes(false)
                  }}
                  className={cn(
                    "flex items-center rounded-md px-2 py-1 text-xs",
                    darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-100 hover:bg-gray-200",
                  )}
                >
                  <IonIcon icon={close} slot="start" />
                  Cancelar
                </IonButton>
                <IonButton
                  size="small"
                  onClick={handleSaveNotes}
                  className="flex items-center rounded-md bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                >
                  <IonIcon icon={save} slot="start" />
                  Guardar
                </IonButton>
              </div>
            )}
          </div>

          {isEditingNotes ? (
            <IonTextarea
              value={notes}
              onIonChange={(e) => setNotes(e.detail.value || "")}
              rows={4}
              className={cn(
                "w-full rounded-md border p-3 text-sm",
                darkMode
                  ? "border-gray-700 bg-gray-800 text-white focus:border-blue-600"
                  : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
              )}
              placeholder="Añadir notas sobre esta cita..."
            />
          ) : (
            <div className={cn("rounded-md border p-3", darkMode ? "border-gray-800" : "border-gray-200")}>
              {notes ? (
                <p className="text-sm">{notes}</p>
              ) : (
                <p className={cn("text-sm italic", darkMode ? "text-gray-500" : "text-gray-400")}>
                  No hay notas para esta cita
                </p>
              )}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="space-y-3">
          <h4 className={cn("text-sm font-medium", darkMode ? "text-gray-300" : "text-gray-700")}>Acciones</h4>

          <IonAlert
            isOpen={showConfirmCancel}
            onDidDismiss={() => setShowConfirmCancel(false)}
            header="¿Estás seguro de cancelar esta cita?"
            message="Esta acción no se puede deshacer."
            buttons={[
              {
                text: "No, mantener cita",
                role: "cancel",
                cssClass: darkMode ? "text-gray-300" : "text-gray-700",
                handler: () => setShowConfirmCancel(false),
              },
              {
                text: "Sí, cancelar cita",
                cssClass: "text-red-600",
                handler: () => handleStatusChange("cancelled"),
              },
            ]}
            cssClass={darkMode ? "alert-dark-mode" : ""}
          />

          <div className="grid grid-cols-2 gap-2">
            {appointment.status !== "completed" && (
              <IonButton
                fill="outline"
                onClick={() => handleStatusChange("completed")}
                className={cn(
                  "flex items-center justify-center rounded-md border px-3 py-2 text-sm transition-colors",
                  darkMode
                    ? "border-green-800 bg-green-900/20 text-green-400 hover:bg-green-900/30"
                    : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
                )}
              >
                <IonIcon icon={checkmarkCircle} slot="start" />
                Marcar como completada
              </IonButton>
            )}

            {appointment.status !== "cancelled" && (
              <IonButton
                fill="outline"
                onClick={() => setShowConfirmCancel(true)}
                className={cn(
                  "flex items-center justify-center rounded-md border px-3 py-2 text-sm transition-colors",
                  darkMode
                    ? "border-red-800 bg-red-900/20 text-red-400 hover:bg-red-900/30"
                    : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
                )}
              >
                <IonIcon icon={closeCircle} slot="start" />
                Cancelar cita
              </IonButton>
            )}

            {appointment.status !== "confirmed" &&
              appointment.status !== "completed" &&
              appointment.status !== "cancelled" && (
                <IonButton
                  fill="outline"
                  onClick={() => handleStatusChange("confirmed")}
                  className={cn(
                    "flex items-center justify-center rounded-md border px-3 py-2 text-sm transition-colors",
                    darkMode
                      ? "border-blue-800 bg-blue-900/20 text-blue-400 hover:bg-blue-900/30"
                      : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
                  )}
                >
                  <IonIcon icon={checkmarkCircle} slot="start" />
                  Confirmar cita
                </IonButton>
              )}

            {appointment.status === "completed" && (
              <IonButton
                fill="outline"
                onClick={() => handleStatusChange("no-show")}
                className={cn(
                  "flex items-center justify-center rounded-md border px-3 py-2 text-sm transition-colors",
                  darkMode
                    ? "border-yellow-800 bg-yellow-900/20 text-yellow-400 hover:bg-yellow-900/30"
                    : "border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100",
                )}
              >
                <IonIcon icon={alertCircle} slot="start" />
                Marcar como no asistió
              </IonButton>
            )}

            <IonButton
              fill="outline"
              className={cn(
                "flex items-center justify-center rounded-md border px-3 py-2 text-sm transition-colors",
                darkMode
                  ? "border-gray-700 bg-gray-800 text-white hover:bg-gray-700"
                  : "border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100",
              )}
            >
              <IonIcon icon={chatbubble} slot="start" />
              Enviar recordatorio
            </IonButton>

            <IonButton
              fill="outline"
              className={cn(
                "flex items-center justify-center rounded-md border px-3 py-2 text-sm transition-colors",
                darkMode
                  ? "border-gray-700 bg-gray-800 text-white hover:bg-gray-700"
                  : "border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100",
              )}
            >
              <IonIcon icon={print} slot="start" />
              Imprimir detalles
            </IonButton>
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  )
}
