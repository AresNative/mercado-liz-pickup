import { Field } from "@/utils/types/interfaces";
import { CalendarDays, CreditCard } from "lucide-react";

export function CheckOutTarjetaField(): Field[] {
    return [
        {
            id: 0,
            type: "SELECT",
            name: "pago",
            label: "Formas de pago",
            placeholder: "Selecciona un método de pago",
            require: false,
            icon: <CreditCard />,
            options: [
                { value: "Efectivo", label: "Pago en Efectivo" },
                { value: "Tarjeta Credito/Debito", label: "Pago con Tarjeta Credito/Debito" },
            ],
        },
        {
            id: 1,
            type: "INPUT",
            name: "numero_tarjeta",
            label: "Numero de tarjeta",
            placeholder: "1234 5678 9012 3456",
            require: false,
            icon: <CreditCard />,
        },
        {
            type: "Flex",
            name: "flex",
            label: "Flex",
            require: false,
            elements:
                [
                    {
                        id: 2,
                        type: "INPUT",
                        name: "vencimiento",
                        label: "Fecha de vencimiento",
                        placeholder: "MM/AA",
                        maxLength: 5,
                        require: false,
                        icon: <CalendarDays />,
                    },
                    {
                        id: 2,
                        type: "PASSWORD",
                        name: "CVC",
                        label: "CVC",
                        placeholder: "123",
                        maxLength: 3,
                        require: false,
                        icon: <CreditCard />,
                    }
                ]
        },
    ];
}