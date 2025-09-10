import { Field } from "@/utils/constants/interfaces";
import { getLocalStorageItem } from "@/utils/functions/local-storage";

export function CitasField(): Field[] {
  const user_data = getLocalStorageItem("user-data");
  return [
    {
      id: 1,
      type: "TEXT_AREA",
      name: "Aclaraciones",
      label: "Aclaraciones",
      placeholder: "Escribe aquí tus aclaraciones",
      require: false,
    },
    {
      id: 2,
      type: "PHONE",
      name: "Telefono",
      label: "Teléfono",
      placeholder: "Escribe aquí tu teléfono",
      require: true,
      valueDefined: user_data?.telefono || "",
    },
    {
      id: 3,
      type: "INPUT",
      name: "Nombre",
      label: "Nombre Completo",
      placeholder: "Escribe aquí tu nombre",
      require: true,
      valueDefined: user_data?.nombre || "",
    },
    {
      id: 4,
      type: "Flex",
      require: false,
      elements: [
        {
          type: "NUMBER",
          name: "CodigoPostal",
          label: "Código Postal",
          placeholder: "Escribe aquí tu código postal",
          maxLength: 5,
          require: false,
          valueDefined: user_data?.cp || "",
        },
        {
          type: "INPUT",
          name: "Estado",
          label: "Estado",
          placeholder: "Escribe aquí tu estado",
          require: false,
          valueDefined: user_data?.estado || "",
        },
        {
          type: "INPUT",
          name: "Ciudad",
          label: "Ciudad",
          placeholder: "Escribe aquí tu ciudad",
          require: false,
          valueDefined: user_data?.ciudad || "",
        },
      ],
    },
    {
      id: 5,
      type: "INPUT",
      name: "Direccion",
      label: "Dirección",
      placeholder: "Escribe aquí tu dirección",
      require: true,
      valueDefined: user_data?.direccion || "",
    },
    {
      id: 6,
      type: "SELECT",
      name: "Tipo_pago",
      label: "Tipo de pago",
      placeholder: "Selecciona un tipo de pago",
      options: [
        { label: "Efectivo", value: "Efectivo" },
        {
          label: "Tarjeta de crédito/débito",
          value: "Tarjeta de crédito/débito",
        },
        { label: "Transferencia bancaria", value: "Transferencia bancaria" },
        { label: "Pago móvil", value: "Pago móvil" },
      ],
      require: true,
      valueDefined: user_data?.tipo_pago || "",
    },
  ];
}
