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
                        label: "Nombre(s)",
                        placeholder: "Nombre(s)",
                        require: false,
                        icon: <User />,
                    },
                    {
                        id: 1,
                        type: "INPUT",
                        name: "APELLIDOS",
                        label: "Apellido(s)",
                        placeholder: "Apellido(s)",
                        require: false,
                        icon: <User />,
                    },
                ]
        },
        {
            id: 2,
            type: "MAIL",
            name: "correo",
            label: "Correo electrónico",
            placeholder: "correo@electrónico.com",
            require: false,
            icon: <Mails />,
        },
        {
            id: 3,
            type: "PHONE",
            name: "telefono",
            label: "Numero de teléfono",
            placeholder: "646 123 45 67",
            require: false,
            icon: <Phone />,
        },
    ];
}