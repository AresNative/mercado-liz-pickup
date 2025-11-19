import {
  House,
  Clock,
  ClipboardList,
  ChartArea,
  Receipt,
  Truck,
  ChartColumnStacked,
  Clock10,
  UsersRound,
  FileDigit,
  ShoppingBasket,
  ShoppingBag,
  UserCircle,
} from "lucide-react";

export const navigationDefault = [
  {
    name: "Pantalla Inicial",
    tab: "home",
    href: "/",
    icon: House,
  },
  {
    name: "Productos",
    tab: "productos",
    href: "/productos",
    icon: ShoppingBag,
  },
  {
    name: "Pedidos",
    tab: "pedidos",
    href: "/seguimiento",
    icon: Clock,
  },
  {
    name: "Cuentas",
    tab: "cuentas",
    href: "/cuentas",
    icon: UserCircle,
  },
];

export const navigationAdmin = [
  {
    name: "Reporteria",
    href: "/reporteria",
    icon: ChartArea,
  },
  {
    name: "Nominas",
    href: "/nominas",
    icon: Clock10,
  },
  {
    name: "Empleados",
    href: "/empleados",
    icon: UsersRound,
  },
  {
    name: "Subastas",
    href: "/subastas",
    icon: ChartColumnStacked,
  },
  {
    name: "Pick Up",
    href: "/pick-up",
    icon: Truck,
  },
  {
    name: "Articulos",
    href: "/articulos",
    icon: ShoppingBasket,
  },
  {
    name: "Proyectos",
    href: "/proyectos",
    icon: ClipboardList,
  },
  {
    name: "Contaduria",
    href: "/contaduria",
    icon: Receipt,
  },
  {
    name: "Polizas",
    href: "/polizas",
    icon: FileDigit,
  },
];
