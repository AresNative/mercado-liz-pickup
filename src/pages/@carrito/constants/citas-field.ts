import { Field } from "@/utils/constants/interfaces";

export function CitasField(): Field[] {
  return [
    {
      id: 0,
      type: "DATE",
      name: "Fecha",
      label: "Fecha",
      placeholder: "Selecciona una fecha para la recolección",
      require: true,
    },
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
    },
    {
      id: 3,
      type: "INPUT",
      name: "Nombre",
      label: "Nombre Completo",
      placeholder: "Escribe aquí tu nombre",
      require: true,
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
        },
        {
          type: "INPUT",
          name: "Estado",
          label: "Estado",
          placeholder: "Escribe aquí tu estado",
          require: false,
        },
        {
          type: "INPUT",
          name: "Ciudad",
          label: "Ciudad",
          placeholder: "Escribe aquí tu ciudad",
          require: false,
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
    },
  ];
}
