import React from "react";
import { IonRouterLink, IonButton, IonImg } from "@ionic/react";
import { motion } from "framer-motion";
import { ShoppingCart, Star } from "lucide-react";

interface Product {
    id: string;
    image?: string;
    title: string;
    discount?: number;
    category: string;
    price: number;
    originalPrice?: number;
}

interface ProductCardProps {
    product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    /* const dispatch = useDispatch<AppDispatch>(); */

    const handleAddToCart = () => {
        /* dispatch(addToCart({ ...product, quantity: 1 })); */
    };

    return (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <IonRouterLink routerLink={`/products/${product.id}`}>
                <div className="relative aspect-square overflow-hidden">
                    <IonImg
                        src={product.image || "/placeholder.svg?height=300&width=300"}
                        alt={product.title}
                        className="object-cover w-full h-full"
                    />
                    {product.discount && (
                        <div className="absolute top-2 left-2 bg-[#7C3AED] text-white text-xs font-bold px-2 py-1 rounded-full">
                            {product.discount}% OFF
                        </div>
                    )}
                </div>
            </IonRouterLink>

            <div className="p-3 border-t-2">
                <IonRouterLink routerLink={`/products/${product.id}`}>
                    <h3 className="font-medium text-base truncate">{product.title}</h3>
                </IonRouterLink>

                <div className="flex items-center mt-1 mb-2">
                    <div className="flex items-center text-[#8B5CF6]">
                        <Star className="h-3 w-3 fill-[#8B5CF6]" />
                        <span className="text-xs ml-1">4.8</span>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">• {product.category}</span>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <span className="font-bold text-base">${product.price.toFixed(2)}</span>
                        {product.originalPrice && (
                            <span className="text-xs text-gray-500 line-through ml-2">
                                ${product.originalPrice.toFixed(2)}
                            </span>
                        )}
                    </div>

                    <motion.div whileTap={{ scale: 0.95 }}>
                        <IonButton
                            size="small"
                            fill="solid"
                            color="tertiary"
                            onClick={handleAddToCart}
                            className="rounded-full px-3 h-8"
                        >
                            <ShoppingCart className="h-4 w-4" />
                        </IonButton>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;