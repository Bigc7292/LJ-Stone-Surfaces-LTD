
import type { Product } from "@shared/schema";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "wouter";
import { useRef, useState } from "react";

interface ProductCardProps {
  product: Product;
}

const MAGNIFIER_SIZE = 120; // The size of the circular lens
const ZOOM_LEVEL = 2.5;   // How much to zoom in

export function ProductCard({ product }: ProductCardProps) {
  const ref = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <Link href={`/portfolio/${product.id}`}>
      <motion.div
        ref={ref}
        whileHover={{ y: -8 }}
        className="group cursor-pointer relative"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMouseMove}
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
          <motion.img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            style={{ y, scale: 1.3, willChange: 'transform' }}
          />

          {/* Magnifier Lens */}
          <div
            style={{
              // Basic styles for the lens
              position: 'absolute',
              width: MAGNIFIER_SIZE,
              height: MAGNIFIER_SIZE,
              borderRadius: '50%',
              border: '2px solid hsl(var(--primary))',
              pointerEvents: 'none',
              // Hide it when not hovering
              opacity: isHovering ? 1 : 0,
              // Position it over the cursor
              top: `${mousePosition.y - MAGNIFIER_SIZE / 2}px`,
              left: `${mousePosition.x - MAGNIFIER_SIZE / 2}px`,
              // The magic: background properties for zoom
              backgroundImage: `url(${product.imageUrl})`,
              backgroundSize: `${100 * ZOOM_LEVEL}%`,
              backgroundPosition: `${-mousePosition.x * (ZOOM_LEVEL - 1) - 20}px ${-mousePosition.y * (ZOOM_LEVEL - 1) - 20}px`,
              backgroundRepeat: 'no-repeat',
              // Animate its appearance
              transition: 'opacity 0.2s ease',
            }}
          />

        </div>

        <div className="absolute inset-0 border border-primary/0 group-hover:border-primary/20 transition-colors pointer-events-none" />
      </motion.div>
    </Link>
  );
}
