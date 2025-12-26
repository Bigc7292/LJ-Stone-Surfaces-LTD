import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SectionHeading } from "@/components/SectionHeading";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/hooks/use-products";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Star } from "lucide-react";

export default function Home() {
  const { data: products, isLoading } = useProducts();
  
  // Featured products only
  const featuredProducts = products?.filter(p => p.isFeatured).slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Navigation />

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image - Luxurious Marble Texture */}
        {/* luxury black marble texture */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://pixabay.com/get/g8943bcb9c90f86abb9567823fa90b13aca4b588f35831d16890734a11d12faddfd5934a9d873e335c6636488eac0f6ee9686fedd4caeb6d37c3e334643afd6aa_1280.jpg" 
            alt="Dark Marble Background" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-transparent to-background" />
        </div>

        <div className="relative z-10 container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <span className="block text-primary tracking-[0.4em] text-sm md:text-base uppercase mb-6 font-semibold">
              Premium Natural Stone
            </span>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-medium mb-8 leading-tight">
              Timeless <span className="italic text-primary/80">Elegance</span> <br />
              Set in Stone
            </h1>
            <p className="max-w-xl mx-auto text-muted-foreground text-lg mb-10 leading-relaxed font-light">
              Discover our curated collection of exotic marbles, quartzites, and semi-precious stones sourced from the world's finest quarries.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Link href="/portfolio">
                <button className="px-8 py-4 bg-primary text-black hover:bg-white transition-colors uppercase tracking-widest text-sm font-bold">
                  View Collection
                </button>
              </Link>
              <Link href="/contact">
                <button className="px-8 py-4 border border-white/20 hover:border-primary hover:text-primary transition-colors uppercase tracking-widest text-sm font-bold">
                  Contact Us
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Excerpt */}
      <section className="py-24 bg-background relative">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative aspect-square"
            >
              <div className="absolute inset-4 border border-primary/20 z-10 translate-x-4 translate-y-4" />
              {/* White marble slab */}
              <img 
                src="https://pixabay.com/get/gcb241fadaedeb21ca8b096cd2d9470083244a0e6fd9ccce4fed387df62e53404f3a91a24fc0c8a464b0dfc586279bda60eda23c8c0016149083d53c619bed079_1280.jpg" 
                alt="White Marble Slab" 
                className="w-full h-full object-cover relative z-0 grayscale-[20%]"
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <SectionHeading 
                subtitle="The Art of Stone" 
                title="Crafting Legacy Through Nature's Finest" 
                align="left" 
              />
              <p className="text-muted-foreground leading-loose mb-8 font-light">
                At LJ Stone Surfaces, we believe that every slab tells a story. From the dramatic veining of Italian marbles to the crystalline depth of Brazilian quartzites, our selection represents the pinnacle of natural beauty. We don't just sell stone; we provide the canvas for your architectural masterpiece.
              </p>
              <Link href="/about">
                <div className="flex items-center gap-2 text-primary uppercase tracking-widest text-sm font-bold cursor-pointer group hover:text-white transition-colors">
                  Our Philosophy <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Collection */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-6">
          <SectionHeading subtitle="Curated Selection" title="Featured Materials" />
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s] mx-2"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          
          <div className="mt-16 text-center">
            <Link href="/portfolio">
              <button className="px-10 py-4 border border-white/10 hover:border-primary text-foreground hover:text-primary transition-all uppercase tracking-widest text-sm font-semibold">
                Explore Full Inventory
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services/Process */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            {[
              { title: "Sourcing", desc: "Direct relationships with elite quarries worldwide." },
              { title: "Selection", desc: "Hand-picked slabs ensuring consistent quality and pattern." },
              { title: "Consultation", desc: "Expert guidance to match the perfect stone to your vision." }
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="p-8 border border-white/5 bg-secondary/20 hover:bg-secondary/40 transition-colors"
              >
                <Star className="w-8 h-8 text-primary mx-auto mb-6" strokeWidth={1} />
                <h3 className="font-serif text-2xl mb-4">{item.title}</h3>
                <p className="text-muted-foreground font-light">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
