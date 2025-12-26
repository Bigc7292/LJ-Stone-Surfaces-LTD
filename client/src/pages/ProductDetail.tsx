import { useRoute } from "wouter";
import { useProduct } from "@/hooks/use-products";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Link } from "wouter";
import { ArrowLeft, Check } from "lucide-react";
import { motion } from "framer-motion";

export default function ProductDetail() {
  const [match, params] = useRoute("/portfolio/:id");
  const id = params ? parseInt(params.id) : 0;
  const { data: product, isLoading, isError } = useProduct(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s] mx-2"></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground">
        <h1 className="text-4xl font-serif mb-4">Product Not Found</h1>
        <Link href="/portfolio" className="text-primary hover:underline">Return to Portfolio</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      
      <div className="pt-28 pb-20 container mx-auto px-6">
        <Link href="/portfolio">
          <div className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 cursor-pointer text-sm tracking-widest uppercase">
            <ArrowLeft size={16} /> Back to Portfolio
          </div>
        </Link>
        
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
          {/* Image */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative aspect-[3/4] bg-secondary rounded-sm overflow-hidden"
          >
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
            {product.isFeatured && (
              <div className="absolute top-6 left-6 bg-primary text-black text-xs font-bold px-3 py-1 uppercase tracking-widest">
                Featured Selection
              </div>
            )}
          </motion.div>
          
          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col justify-center"
          >
            <span className="text-primary uppercase tracking-[0.3em] text-sm mb-4 font-bold">
              {product.category}
            </span>
            <h1 className="font-serif text-4xl md:text-6xl mb-8 leading-tight">{product.name}</h1>
            
            <div className="w-24 h-0.5 bg-primary/30 mb-8" />
            
            <p className="text-muted-foreground text-lg font-light leading-relaxed mb-10">
              {product.description}
            </p>
            
            <div className="space-y-4 mb-12">
              <h4 className="font-serif text-xl mb-4">Specifications</h4>
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-primary" />
                  <span>Premium Grade</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-primary" />
                  <span>Polished / Honed Finish</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-primary" />
                  <span>2cm & 3cm Slabs</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-primary" />
                  <span>Bookmatch Available</span>
                </div>
              </div>
            </div>
            
            <div className="bg-secondary/10 border border-white/5 p-8">
              <h3 className="font-serif text-2xl mb-2">Interested in this stone?</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Contact us to check current availability and schedule a viewing.
              </p>
              <Link href="/contact">
                <button className="w-full py-4 bg-primary text-black font-semibold uppercase tracking-widest hover:bg-white transition-colors">
                  Inquire Now
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
