"use client"

import type React from "react"

import { useState } from "react"
import { format, parseISO, isSameDay, isToday, isBefore } from "date-fns"
import { es } from "date-fns/locale"
import {
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonGrid,
  IonRow,
  IonCol,
  IonBadge,
} from "@ionic/react"
import { close, barChart, pieChart, calendar, people, time, arrowForward } from "ionicons/icons"
import { cn } from "@/lib/utils"

interface AppointmentStatsProps {
  appointments: any[]
  darkMode: boolean
  onClose: () => void
  selectedDate?: Date | null
}

export function AppointmentStats({ appointments, darkMode, onClose, selectedDate }: AppointmentStatsProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "daily" | "services">("overview")

  // Calcular estadísticas generales
  const now = new Date()
  const totalAppointments = appointments.length
  const completedAppointments = appointments.filter((apt) => apt.status === "completed").length
  const cancelledAppointments = appointments.filter((apt) => apt.status === "cancelled").length
  const upcomingAppointments = appointments.filter((apt) => !isBefore(parseISO(apt.date), now)).length
  const todayAppointments = appointments.filter((apt) => isToday(parseISO(apt.date))).length

  // Calcular estadísticas por servicio
  const serviceStats = appointments.reduce((acc: Record<string, number>, apt) => {
    acc[apt.serviceName] = (acc[apt.serviceName] || 0) + 1
    return acc
  }, {})

  // Ordenar servicios por cantidad
  const sortedServices = Object.entries(serviceStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5) // Top 5 servicios

  // Calcular estadísticas por estado
  const statusStats = appointments.reduce((acc: Record<string, number>, apt) => {
    acc[apt.status] = (acc[apt.status] || 0) + 1
    return acc
  }, {})

  // Calcular esta  => {
  //   acc[apt.status] = (acc[apt.status] || 0) + 1
  //   return acc
  // }, {})

  // Calcular estadísticas diarias (últimos 7 días)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date
  })

  const dailyStats = last7Days.map((day) => {
    const count = appointments.filter((apt) => isSameDay(parseISO(apt.date), day)).length
    return {
      date: day,
      count,
    }
  })

  // Obtener el nombre del estado
  const getStatusName = (status: string) => {
    const statusMap: Record<string, string> = {
      scheduled: "Agendada",
      confirmed: "Confirmada",
      completed: "Completada",
      cancelled: "Cancelada",
      "no-show": "No asistió",
    }
    return statusMap[status] || status
  }

  // Obtener color del estado
  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      scheduled: darkMode ? "bg-blue-900/30 border-blue-800" : "bg-blue-100 border-blue-300",
      confirmed: darkMode ? "bg-green-900/30 border-green-800" : "bg-green-100 border-green-300",
      completed: darkMode ? "bg-green-900/30 border-green-800" : "bg-green-100 border-green-300",
      cancelled: darkMode ? "bg-red-900/30 border-red-800" : "bg-red-100 border-red-300",
      "no-show": darkMode ? "bg-yellow-900/30 border-yellow-800" : "bg-yellow-100 border-yellow-300",
    }
    return colorMap[status] || (darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-300")
  }

  // Calcular el porcentaje más alto para la escala de gráficos
  const maxDailyCount = Math.max(...dailyStats.map((day) => day.count))
  const maxServiceCount = sortedServices.length > 0 ? sortedServices[0][1] : 0

  return (
    <IonCard className={cn("mb-6 rounded-xl shadow-sm", darkMode ? "bg-gray-900" : "bg-white")}>
      <IonCardHeader>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Estadísticas de Citas</h2>
          <IonButton
            fill="clear"
            onClick={onClose}
            className={cn("rounded-full p-1", darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100")}
            aria-label="Cerrar estadísticas"
          >
            <IonIcon icon={close} />
          </IonButton>
        </div>
      </IonCardHeader>

      <IonCardContent>
        {/* Tabs */}
        <IonSegment value={activeTab} onIonChange={(e) => setActiveTab(e.detail.value as any)}>
          <IonSegmentButton value="overview">
            <IonIcon icon={barChart} />
            <IonLabel>Resumen</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="daily">
            <IonIcon icon={calendar} />
            <IonLabel>Diario</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="services">
            <IonIcon icon={pieChart} />
            <IonLabel>Servicios</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {/* Contenido de las tabs */}
        {activeTab === "overview" && (
          <div className="mt-4">
            <IonGrid>
              <IonRow>
                <IonCol size="6" sizeMd="3">
                  <div className={cn("rounded-lg border p-4", darkMode ? "border-gray-800" : "border-gray-200")}>
                    <div className="flex items-center justify-between">
                      <div className={cn("rounded-md p-2", darkMode ? "bg-blue-900/20" : "bg-blue-50")}>
                        <IonIcon
                          icon={calendar}
                          className={cn("h-5 w-5", darkMode ? "text-blue-400" : "text-blue-600")}
                        />
                      </div>
                      <span className={cn("text-xs font-medium", darkMode ? "text-gray-400" : "text-gray-500")}>
                        Total
                      </span>
                    </div>
                    <div className="mt-3">
                      <h3 className="text-2xl font-bold">{totalAppointments}</h3>
                      <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>Citas</p>
                    </div>
                  </div>
                </IonCol>

                <IonCol size="6" sizeMd="3">
                  <div className={cn("rounded-lg border p-4", darkMode ? "border-gray-800" : "border-gray-200")}>
                    <div className="flex items-center justify-between">
                      <div className={cn("rounded-md p-2", darkMode ? "bg-green-900/20" : "bg-green-50")}>
                        <IonIcon
                          icon={time}
                          className={cn("h-5 w-5", darkMode ? "text-green-400" : "text-green-600")}
                        />
                      </div>
                      <span className={cn("text-xs font-medium", darkMode ? "text-gray-400" : "text-gray-500")}>
                        Hoy
                      </span>
                    </div>
                    <div className="mt-3">
                      <h3 className="text-2xl font-bold">{todayAppointments}</h3>
                      <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>Citas</p>
                    </div>
                  </div>
                </IonCol>

                <IonCol size="6" sizeMd="3">
                  <div className={cn("rounded-lg border p-4", darkMode ? "border-gray-800" : "border-gray-200")}>
                    <div className="flex items-center justify-between">
                      <div className={cn("rounded-md p-2", darkMode ? "bg-purple-900/20" : "bg-purple-50")}>
                        <IonIcon
                          icon={arrowForward}
                          className={cn("h-5 w-5", darkMode ? "text-purple-400" : "text-purple-600")}
                        />
                      </div>
                      <span className={cn("text-xs font-medium", darkMode ? "text-gray-400" : "text-gray-500")}>
                        Próximas
                      </span>
                    </div>
                    <div className="mt-3">
                      <h3 className="text-2xl font-bold">{upcomingAppointments}</h3>
                      <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>Citas</p>
                    </div>
                  </div>
                </IonCol>

                <IonCol size="6" sizeMd="3">
                  <div className={cn("rounded-lg border p-4", darkMode ? "border-gray-800" : "border-gray-200")}>
                    <div className="flex items-center justify-between">
                      <div className={cn("rounded-md p-2", darkMode ? "bg-green-900/20" : "bg-green-50")}>
                        <IonIcon
                          icon={people}
                          className={cn("h-5 w-5", darkMode ? "text-green-400" : "text-green-600")}
                        />
                      </div>
                      <span className={cn("text-xs font-medium", darkMode ? "text-gray-400" : "text-gray-500")}>
                        Completadas
                      </span>
                    </div>
                    <div className="mt-3">
                      <h3 className="text-2xl font-bold">{completedAppointments}</h3>
                      <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>Citas</p>
                    </div>
                  </div>
                </IonCol>
              </IonRow>
            </IonGrid>

            {/* Estadísticas por estado */}
            <div className="mt-6">
              <h3 className={cn("mb-3 text-sm font-medium", darkMode ? "text-gray-300" : "text-gray-700")}>
                Citas por Estado
              </h3>
              <div className="space-y-3">
                {Object.entries(statusStats).map(([status, count]) => (
                  <div key={status} className="flex items-center">
                    <div className="w-32 flex-shrink-0">
                      <IonBadge
                        className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          getStatusColor(status),
                        )}
                      >
                        {getStatusName(status)}
                      </IonBadge>
                    </div>
                    <div className="ml-2 flex-1">
                      <div className="flex items-center">
                        <div
                          className={cn(
                            "h-2 rounded-full",
                            status === "completed"
                              ? darkMode
                                ? "bg-green-600"
                                : "bg-green-500"
                              : status === "cancelled"
                                ? darkMode
                                  ? "bg-red-600"
                                  : "bg-red-500"
                                : status === "no-show"
                                  ? darkMode
                                    ? "bg-yellow-600"
                                    : "bg-yellow-500"
                                  : darkMode
                                    ? "bg-blue-600"
                                    : "bg-blue-500",
                          )}
                          style={{ width: `${(count / totalAppointments) * 100}%` }}
                        ></div>
                        <span className="ml-2 text-sm">{count}</span>
                      </div>
                    </div>
                    <div className="ml-2 w-12 text-right text-sm">{Math.round((count / totalAppointments) * 100)}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "daily" && (
          <div className="mt-4">
            <h3 className={cn("mb-3 text-sm font-medium", darkMode ? "text-gray-300" : "text-gray-700")}>
              Citas en los últimos 7 días
            </h3>

            <div className="mt-4 flex h-40 items-end justify-between space-x-2">
              {dailyStats.map((day) => (
                <div key={day.date.toISOString()} className="flex flex-1 flex-col items-center">
                  <div className="flex-1 w-full flex items-end justify-center">
                    <div
                      className={cn(
                        "w-full rounded-t-sm",
                        isToday(day.date)
                          ? darkMode
                            ? "bg-blue-600"
                            : "bg-blue-500"
                          : selectedDate && isSameDay(day.date, selectedDate)
                            ? darkMode
                              ? "bg-green-600"
                              : "bg-green-500"
                            : darkMode
                              ? "bg-gray-700"
                              : "bg-gray-300",
                      )}
                      style={{
                        height: `${maxDailyCount > 0 ? (day.count / maxDailyCount) * 100 : 0}%`,
                        minHeight: day.count > 0 ? "8px" : "0",
                      }}
                    ></div>
                  </div>
                  <div className="mt-2 text-xs">{format(day.date, "EEE", { locale: es })}</div>
                  <div
                    className={cn(
                      "text-xs font-medium",
                      isToday(day.date)
                        ? darkMode
                          ? "text-blue-400"
                          : "text-blue-600"
                        : selectedDate && isSameDay(day.date, selectedDate)
                          ? darkMode
                            ? "text-green-400"
                            : "text-green-600"
                          : darkMode
                            ? "text-gray-400"
                            : "text-gray-600",
                    )}
                  >
                    {day.count}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <h3 className={cn("mb-3 text-sm font-medium", darkMode ? "text-gray-300" : "text-gray-700")}>
                Detalles por día
              </h3>

              <div className={cn("rounded-lg border", darkMode ? "border-gray-800" : "border-gray-200")}>
                {dailyStats.map((day, index) => (
                  <div
                    key={day.date.toISOString()}
                    className={cn(
                      "flex items-center justify-between p-3",
                      index !== dailyStats.length - 1 &&
                        (darkMode ? "border-b border-gray-800" : "border-b border-gray-200"),
                      isToday(day.date) && (darkMode ? "bg-blue-900/10" : "bg-blue-50"),
                      selectedDate &&
                        isSameDay(day.date, selectedDate) &&
                        (darkMode ? "bg-green-900/10" : "bg-green-50"),
                    )}
                  >
                    <div className="flex items-center">
                      <IonIcon
                        icon={calendar}
                        className={cn(
                          "mr-2 h-4 w-4",
                          isToday(day.date)
                            ? darkMode
                              ? "text-blue-400"
                              : "text-blue-600"
                            : darkMode
                              ? "text-gray-400"
                              : "text-gray-500",
                        )}
                      />
                      <span
                        className={cn(
                          "font-medium",
                          isToday(day.date) && (darkMode ? "text-blue-400" : "text-blue-600"),
                        )}
                      >
                        {format(day.date, "EEEE d 'de' MMMM", { locale: es })}
                        {isToday(day.date) && " (Hoy)"}
                      </span>
                    </div>
                    <div className="text-sm font-medium">{day.count} citas</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "services" && (
          <div className="mt-4">
            <h3 className={cn("mb-3 text-sm font-medium", darkMode ? "text-gray-300" : "text-gray-700")}>
              Citas por Servicio
            </h3>

            <div className="space-y-3">
              {sortedServices.map(([service, count]) => (
                <div key={service} className="flex items-center">
                  <div className="w-40 flex-shrink-0 truncate">
                    <span className="text-sm font-medium">{service}</span>
                  </div>
                  <div className="ml-2 flex-1">
                    <div className="flex items-center">
                      <div
                        className={cn("h-2 rounded-full", darkMode ? "bg-blue-600" : "bg-blue-500")}
                        style={{ width: `${(count / maxServiceCount) * 100}%` }}
                      ></div>
                      <span className="ml-2 text-sm">{count}</span>
                    </div>
                  </div>
                  <div className="ml-2 w-12 text-right text-sm">{Math.round((count / totalAppointments) * 100)}%</div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <h3 className={cn("mb-3 text-sm font-medium", darkMode ? "text-gray-300" : "text-gray-700")}>
                Distribución de Servicios
              </h3>

              <div className="flex justify-center">
                <div className="relative h-48 w-48">
                  {/* Gráfico circular simplificado */}
                  <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                    {
                      Object.entries(serviceStats).reduce(
                        (acc, [service, count], index, array) => {
                          const total = array.reduce((sum, [_, c]) => sum + c, 0)
                          const percentage = (count / total) * 100

                          // Calcular ángulos para el arco
                          const previousPercentage = acc.previousPercentage
                          const startAngle = (previousPercentage / 100) * 360
                          const endAngle = ((previousPercentage + percentage) / 100) * 360

                          // Calcular puntos del arco
                          const startX = 50 + 40 * Math.cos((startAngle * Math.PI) / 180)
                          const startY = 50 + 40 * Math.sin((startAngle * Math.PI) / 180)
                          const endX = 50 + 40 * Math.cos((endAngle * Math.PI) / 180)
                          const endY = 50 + 40 * Math.sin((endAngle * Math.PI) / 180)

                          // Determinar si el arco es mayor a 180 grados
                          const largeArcFlag = percentage > 50 ? 1 : 0

                          // Colores para los segmentos
                          const colors = [
                            darkMode ? "#3b82f6" : "#3b82f6", // blue
                            darkMode ? "#10b981" : "#10b981", // green
                            darkMode ? "#8b5cf6" : "#8b5cf6", // purple
                            darkMode ? "#f59e0b" : "#f59e0b", // amber
                            darkMode ? "#ef4444" : "#ef4444", // red
                          ]

                          acc.paths.push(
                            <path
                              key={service}
                              d={`M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY} Z`}
                              fill={colors[index % colors.length]}
                              stroke={darkMode ? "#111827" : "#ffffff"}
                              strokeWidth="1"
                            />,
                          )

                          acc.previousPercentage += percentage
                          return acc
                        },
                        { paths: [] as React.ReactNode[], previousPercentage: 0 },
                      ).paths
                    }
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{totalAppointments}</div>
                      <div className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>Total</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {Object.entries(serviceStats).map(([service, count], index) => {
                  const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-amber-500", "bg-red-500"]

                  return (
                    <div key={service} className="flex items-center">
                      <div className={`h-3 w-3 rounded-full ${colors[index % colors.length]}`}></div>
                      <span className="ml-2 text-sm truncate">{service}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </IonCardContent>
    </IonCard>
  )
}
