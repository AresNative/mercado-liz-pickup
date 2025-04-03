export interface Product {
  id: string;
  image?: string;
  title: string;
  discount?: number;
  category: string;
  price: number;
  originalPrice?: number;
}
// Sample products for demonstration
export const sampleProducts: Product[] = [
  {
    id: "1",
    image: "https://www.lacomer.com.mx/superc/img_art/7501055900039_3.jpg",
    title: "Leche Entera Alpura 1L",
    discount: 15,
    category: "ABARROTES",
    price: 25.9,
    originalPrice: 30.5,
  },
  {
    id: "2",
    image: "https://www.lacomer.com.mx/superc/img_art/7500810022061_3.jpg",
    title: "Pan Integral Bimbo 680g",
    category: "DESAYUNOS",
    price: 34.99,
  },
  {
    id: "3",
    image: "https://www.lacomer.com.mx/superc/img_art/7501013109733_3.jpg",
    title: "Jugo Jumex Naranja 1L",
    discount: 20,
    category: "JUGOS Y NECTARES",
    price: 29.9,
    originalPrice: 37.4,
  },
  {
    id: "4",
    image: "https://www.lacomer.com.mx/superc/img_art/1052_3.jpg",
    title: "Manzanas Washington kg",
    category: "FRUTAS Y VERDURAS",
    price: 24.99,
  },
  {
    id: "5",
    image: "https://www.lacomer.com.mx/superc/img_art/7501059224827_3.jpg",
    title: "Café Nescafé Clásico 500g",
    discount: 30,
    category: "CAFE FRASCO",
    price: 119.9,
    originalPrice: 170.0,
  },
  {
    id: "6",
    image: "https://www.lacomer.com.mx/superc/img_art/7501064107153_3.jpg",
    title: "Sixpack Corona 330ml",
    discount: 10,
    category: "CERVEZAS",
    price: 149.9,
    originalPrice: 165.0,
  },
  {
    id: "7",
    image: "https://www.lacomer.com.mx/superc/img_art/7501008063569_3.jpg",
    title: "Cereal Zucaritas Kellogg's 500g",
    discount: 25,
    category: "DESAYUNOS",
    price: 59.9,
    originalPrice: 79.9,
  },
  {
    id: "8",
    image: "https://www.lacomer.com.mx/superc/img_art/7500478034277_3.jpg",
    title: "Sabritas Original 230g",
    discount: 10,
    category: "BEBIDAS Y SNACKS",
    price: 24.5,
    originalPrice: 27.0,
  },
];
