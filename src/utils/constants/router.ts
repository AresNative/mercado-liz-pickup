import {
  House,
  Clock,
  ClipboardList,
  ChartArea,
  Banknote,
  ListCheck,
  Receipt,
  Truck,
  Info,
  ChartColumnStacked,
  Clock10,
  UserRound,
  UsersRound,
  FileDigit,
  ShoppingBasket,
  ShoppingBag,
} from "lucide-react";

export const navigationDefault = [
  {
    name: "Pantalla Inicial",
    href: "/",
    icon: House,
  },
  {
    name: "Pedidos",
    href: "/pedidos",
    icon: Clock,
  },
  {
    name: "Productos",
    href: "/productos",
    icon: ShoppingBag,
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
