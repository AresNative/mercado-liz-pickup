import { Field } from "@/utils/types/interfaces";
import { Mails, Phone, User } from "lucide-react";

export function CheckOutField(): Field[] {
    return [
        {
            type: "Flex",
            name: "flex",
            label: "Flex",
            require: false,
            elements:
                [
                    {
                        id: 0,
                        type: "INPUT",
                        name: "Nombre",
                        label: "Nombre",
                        placeholder: "Nombre(s)",
                        require: true,
                        icon: <User />,
                    },
                    {
                        id: 1,
                        type: "INPUT",
                        name: "APELLIDOS",
                        label: "Apellido",
                        placeholder: "Apellido(s)",
                        require: true,
                        icon: <User />,
                    },
                ]
        },
        {
            id: 2,
            type: "MAIL",
            name: "CORREO",
            label: "Correo electrónico",
            placeholder: "correo@electrónico.com",
            require: true,
            icon: <Mails />,
        },
        {
            id: 3,
            type: "PHONE",
            name: "TELÉFONO",
            label: "Numero de teléfono",
            placeholder: "646 123 45 67",
            require: true,
            icon: <Phone />,
        },
    ];
}