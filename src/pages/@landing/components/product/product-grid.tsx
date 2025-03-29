import { motion } from "framer-motion";
import ProductCard from "./product-card";

const ProductGrid: React.FC = () => {

    return (
        <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {[{
                id: "1",
                image: "",
                title: "",
                discount: 0,
                category: "",
                price: 0,
                originalPrice: 0,
            }].map((product, index) => (
                <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                    <ProductCard product={product} />
                </motion.div>
            ))}
        </motion.div>
    );
};

export default ProductGrid;