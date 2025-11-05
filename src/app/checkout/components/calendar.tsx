import React, { useState } from "react";
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
    isBefore
} from "date-fns";
import { es } from "date-fns/locale";
import { chevronBackOutline, chevronForwardOutline } from "ionicons/icons";
import { IonIcon } from "@ionic/react";

const Calendar: React.FC = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // Funciones de navegación
    const handlePreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    // Reglas de días
    const handleDateClick = (date: Date) =>
        setSelectedDate(startOfDay(date).toISOString());
    const isPastDate = (date: Date) => isBefore(date, startOfDay(new Date()));
    const isDateBlocked = (date: Date) => date.getDay() === 0; // bloquea domingos
    const isDateAvailable = (date: Date) =>
        !isDateBlocked(date) && !isPastDate(date);

    // Generar días del mes actual
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const daysInCalendar = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd,
    });

    return (
        <div className="ion-padding">
            {/* Encabezado del mes */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-center">
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
                {["D", "L", "M", "X", "J", "V", "S"].map((day) => (
                    <div key={day}>{day}</div>
                ))}
            </div>

            {/* Celdas del calendario */}
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

                    // Determinar clases visuales
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

            {/* Leyenda */}
            <div className="flex justify-around mt-4 text-sm">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-purple-100 rounded-full" />
                    <span>Disponible</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-200 rounded-full" />
                    <span>No disponible</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-purple-600 rounded-full" />
                    <span>Seleccionado</span>
                </div>
            </div>
        </div>
    );
};

export default Calendar;