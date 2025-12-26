import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SectionHeading } from "@/components/SectionHeading";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/hooks/use-products";
import { useState } from "react";
import { motion } from "framer-motion";

const CATEGORIES = ["All", "Marble", "Quartz", "Quartzite", "Travertine", "Onyx", "Semi-Precious"];

export default function Portfolio() {
  const [activeCategory, setActiveCategory] = useState("All");
  // Pass undefined if "All" to fetch everything, otherwise filter by category
  const { data: products, isLoading } = useProducts(activeCategory === "All" ? undefined : activeCategory);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      
      {/* Header */}
      <div className="pt-32 pb-16 bg-secondary/20">
        <div className="container mx-auto px-6 text-center">
          <SectionHeading subtitle="The Collection" title="Material Portfolio" />
          
          {/* Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2 text-sm uppercase tracking-wider border transition-all duration-300 ${
                  activeCategory === cat
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container mx-auto px-6 py-16">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-[3/4] bg-secondary animate-pulse rounded-sm" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products?.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
            {products?.length === 0 && (
              <div className="col-span-full text-center py-20 text-muted-foreground">
                No products found in this category.
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
