import type { Product } from "@shared/schema";
import { motion } from "framer-motion";
import { Link } from "wouter";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/portfolio/${product.id}`}>
      <motion.div 
        whileHover={{ y: -10 }}
        className="group cursor-pointer relative"
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
          {/* Image */}
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
          
          {/* Content */}
          <div className="absolute bottom-0 left-0 w-full p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <p className="text-primary text-xs tracking-[0.2em] uppercase mb-2 font-medium">
              {product.category}
            </p>
            <h3 className="text-xl md:text-2xl font-serif text-white mb-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <div className="h-0.5 w-0 group-hover:w-full bg-primary transition-all duration-500 ease-out" />
          </div>
        </div>
        
        {/* Border detail */}
        <div className="absolute inset-0 border border-primary/0 group-hover:border-primary/20 transition-colors pointer-events-none" />
      </motion.div>
    </Link>
  );
}
