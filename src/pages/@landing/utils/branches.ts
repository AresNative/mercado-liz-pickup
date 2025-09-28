import { Store, Warehouse } from "lucide-react";
/* 

INSERT INTO [dbo].[sucursal]
           ([nombre]
           ,[ubicacion]
           ,[telefono]
           ,[email])
     VALUES
           ('Mayoreo'
           ,'11 6, Francisco Zarco, 22750 Francisco Zarco, B.C.'
           ,'+52 646 596 9489'
           ,'gerencia01@mercadosliz.com')



*/
export const branches = [
  {
    id: 1,
    name: "Mayoreo",
    icon: Warehouse,
    address: "11 6, Francisco Zarco, 22750 Francisco Zarco, B.C.",
    status: "activo",
    precio: "(Precio Lista)",
  },
  {
    id: 2,
    name: "Liz",
    icon: Store,
    address:
      "Calle Principal 216, Francisco Zarco, 22750 Francisco Zarco, B.C.",
    status: "inactivo",
    precio: "(Precio 2)",
  },
  {
    id: 3,
    name: "Palmas",
    icon: Store,
    address: "México 3, Ampliación Valle de las Palmas, 21500 Espuela, B.C.",
    status: "inactivo",
    precio: "(Precio 4)",
  },
  {
    id: 4,
    name: "Testerazo",
    icon: Store,
    address: "Carretera Tecate Ensenada Km 49, Tecate, Baja California, 21570.",
    status: "inactivo",
    precio: "(Precio 3)",
  },
];
