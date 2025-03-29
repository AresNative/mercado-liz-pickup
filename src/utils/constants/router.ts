interface INavigation {
  name: string;
  href: string;
}

export const navigation: INavigation[] = [
  { name: "Tareas", href: "/scrum" },
  { name: "Calendario", href: "/calendar" },
  { name: "Reportes", href: "/report" },
  { name: "Resumen", href: "/grafic" },
  { name: "Test", href: "/model" },
];
