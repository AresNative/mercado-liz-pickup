import React, { useState, useMemo, useCallback } from "react";
import {
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    format,
    isSameMonth,
    isSameDay,
    isToday,
    startOfDay,
    parseISO,
    isBefore,
    addMinutes,
    isWithinInterval,
} from "date-fns";
import { es } from "date-fns/locale";
import { chevronBackOutline, chevronForwardOutline, timeOutline } from "ionicons/icons";
import { IonIcon } from "@ionic/react";

/* --------------------------
   HOOK: Generador de horarios dinámicos
-------------------------- */
const useTimeSlots = (selectedDate: string | null, citasExistentes: any[]) => {
    const generateTimeSlots = useCallback((date: string, existingCitas: any[]) => {
        const baseDate = parseISO(date);
        const startHour = 9.5; // 9:30 AM
        const endHour = 16; // 4:00 PM
        const slotDuration = 30; // minutos
        const now = new Date();
        const isToday = isSameDay(baseDate, now);

        // 🔹 Bloques de citas ya reservadas
        const bookedSlots = existingCitas.map((cita) => {
            const start = parseISO(cita.nombre_lista); // fecha en formato ISO
            const end = addMinutes(start, 5);
            return { start, end };
        });

        const isSlotAvailable = (slotTime: Date) => {
            return !bookedSlots.some(({ start, end }) =>
                isWithinInterval(slotTime, { start, end })
            );
        };

        const isValidSlot = (slotTime: Date) => {
            if (isToday && slotTime <= now) return false;
            return true;
        };

        const generateSlotsForPeriod = (startHour: number, endHour: number) => {
            const slots = [];
            for (let hour = Math.floor(startHour); hour < endHour; hour++) {
                const startMinute = hour === 9 ? 30 : 0;
                const endMinute = hour === 16 ? 30 : 60;

                for (let minute = startMinute; minute < endMinute; minute += slotDuration) {
                    const slotTime = new Date(baseDate);
                    slotTime.setHours(hour, minute, 0, 0);

                    if (!isValidSlot(slotTime)) continue;

                    const isAvailable = isSlotAvailable(slotTime);
                    slots.push({
                        id: `${hour}-${minute}`,
                        time: slotTime.toISOString(),
                        isAvailable,
                    });
                }
            }
            return slots;
        };

        const morningSlots = generateSlotsForPeriod(startHour, 13);
        const afternoonSlots = generateSlotsForPeriod(14, endHour + 0.5);

        return { morningSlots, afternoonSlots };
    }, []);

    const timeSlots = useMemo(() => {
        if (!selectedDate) return { morningSlots: [], afternoonSlots: [] };
        return generateTimeSlots(selectedDate, citasExistentes);
    }, [selectedDate, citasExistentes, generateTimeSlots]);

    return timeSlots;
};

/* ---------------------------- COMPONENTE: Calendario + Horas---------------------------- */
const CalendarWithTimeSlots: React.FC = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    // 🔹 Citas existentes (simuladas, normalmente vienen del backend)
    const citasExistentes = [
        { nombre_lista: "2025-11-01T10:00:00.000Z" },
        { nombre_lista: "2025-11-01T11:30:00.000Z" },
    ];

    // 🔹 Hook de horarios disponibles
    const { morningSlots, afternoonSlots } = useTimeSlots(selectedDate, citasExistentes);

    // 🔹 Navegación del calendario
    const handlePreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    // 🔹 Selección de fecha
    const handleDateClick = (date: Date) => {
        setSelectedDate(startOfDay(date).toISOString());
        setSelectedTime(null);
    };

    // 🔹 Reglas visuales de calendario
    const isPastDate = (date: Date) => isBefore(date, startOfDay(new Date()));
    const isDateBlocked = (date: Date) => date.getDay() === 0; // Domingos
    const isDateAvailable = (date: Date) => !isDateBlocked(date) && !isPastDate(date);

    // 🔹 Rango de días del mes
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const daysInCalendar = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd,
    });

    // 🔹 Formateo
    const formatHour = (iso: string) => format(parseISO(iso), "hh:mm a");

    return (
        <div className="ion-padding">
            {/* 🗓️ CALENDARIO */}
            <div className="border-2 border-yellow-400 rounded-lg p-4 mb-6">
                <h2 className="text-lg font-bold mb-3">Selecciona fecha</h2>

                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-center capitalize">
                        {format(currentMonth, "MMMM yyyy", { locale: es })}
                    </h2>
                    <div className="flex gap-2">
                        <IonIcon
                            icon={chevronBackOutline}
                            onClick={handlePreviousMonth}
                            className="text-gray-600 text-2xl cursor-pointer"
                        />
                        <IonIcon
                            icon={chevronForwardOutline}
                            onClick={handleNextMonth}
                            className="text-gray-600 text-2xl cursor-pointer"
                        />
                    </div>
                </div>

                {/* Días de la semana */}
                <div className="grid grid-cols-7 text-center text-sm font-medium text-gray-500 mb-1">
                    {["D", "L", "M", "", "J", "V", "S"].map((day) => (
                        <div key={day}>{day}</div>
                    ))}
                </div>

                {/* Celdas de días */}
                <div className="grid grid-cols-7 gap-1 text-center">
                    {daysInCalendar.map((day, idx) => {
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isAvailable = isDateAvailable(day);
                        const isBlocked = isDateBlocked(day);
                        const isPast = isPastDate(day);
                        const isSelected = selectedDate
                            ? isSameDay(parseISO(selectedDate), day)
                            : false;
                        const isDayToday = isToday(day);

                        let classes = "py-2 rounded-md transition-all ";
                        if (!isCurrentMonth) classes += " text-gray-300";
                        else if (isPast) classes += " bg-red-100 text-red-400";
                        else if (isSelected) classes += " bg-purple-600 text-white";
                        else if (isDayToday) classes += " ring-2 ring-purple-500";
                        else if (isBlocked) classes += " bg-gray-200 text-gray-600";
                        else if (isAvailable) classes += " bg-purple-100 hover:bg-purple-200";

                        return (
                            <button
                                key={idx}
                                disabled={!isAvailable}
                                onClick={() => isAvailable && handleDateClick(day)}
                                className={classes}
                            >
                                {format(day, "d")}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 🕒 HORARIOS */}
            <div className="border-2 border-green-400 rounded-lg p-4 mb-6">
                <h2 className="text-lg font-bold mb-3">Selecciona hora</h2>

                {!selectedDate ? (
                    <p className="text-gray-500 text-sm">Selecciona una fecha primero</p>
                ) : (
                    <>
                        {morningSlots.length === 0 && afternoonSlots.length === 0 ? (
                            <p className="text-gray-500 text-sm">
                                No hay horarios disponibles para esta fecha
                            </p>
                        ) : (
                            <>
                                {/* Mañana */}
                                {morningSlots.length > 0 && (
                                    <>
                                        <p className="text-sm font-medium mb-2 text-purple-700">Mañana</p>
                                        <div className="grid grid-cols-3 gap-2 mb-4">
                                            {morningSlots.map((slot) => (
                                                <button
                                                    key={slot.id}
                                                    disabled={!slot.isAvailable}
                                                    onClick={() => setSelectedTime(slot.time)}
                                                    className={`p-2 rounded-md border text-sm flex items-center justify-center ${selectedTime === slot.time
                                                            ? "bg-purple-600 text-white border-purple-700"
                                                            : slot.isAvailable
                                                                ? "border-purple-200 hover:bg-purple-100 text-purple-700"
                                                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                                        }`}
                                                >
                                                    <IonIcon icon={timeOutline} className="mr-1" />
                                                    {formatHour(slot.time)}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {/* Tarde */}
                                {afternoonSlots.length > 0 && (
                                    <>
                                        <p className="text-sm font-medium mb-2 text-purple-700">Tarde</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {afternoonSlots.map((slot) => (
                                                <button
                                                    key={slot.id}
                                                    disabled={!slot.isAvailable}
                                                    onClick={() => setSelectedTime(slot.time)}
                                                    className={`p-2 rounded-md border text-sm flex items-center justify-center ${selectedTime === slot.time
                                                            ? "bg-purple-600 text-white border-purple-700"
                                                            : slot.isAvailable
                                                                ? "border-purple-200 hover:bg-purple-100 text-purple-700"
                                                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                                        }`}
                                                >
                                                    <IonIcon icon={timeOutline} className="mr-1" />
                                                    {formatHour(slot.time)}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default CalendarWithTimeSlots;


