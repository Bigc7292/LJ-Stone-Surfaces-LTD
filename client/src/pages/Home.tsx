import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SectionHeading } from "@/components/SectionHeading";
import { ProductCard } from "@/components/ProductCard";
import { LuxeStoneVisualizer } from "@/components/LuxeStoneVisualizer";
import { StoneConcierge } from "@/components/StoneConcierge";
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
            src="https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&q=80&w=1280"
            alt="Dark Marble Background"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-transparent to-background" />
        </div>

        <div className="relative z-10 container mx-auto px-8 text-center mt-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="block text-primary tracking-[0.6em] text-xs md:text-sm uppercase mb-8 font-black">
              Artisan Natural Stone
            </span>
            <h1 className="font-serif text-6xl md:text-8xl lg:text-[10rem] font-bold mb-10 leading-[0.9] text-white tracking-tighter">
              Timeless <br />
              <span className="italic font-light text-primary/90 opacity-80">Elegance</span>
            </h1>
            <p className="max-w-2xl mx-auto text-slate-400 text-base md:text-lg mb-14 leading-[2] font-medium uppercase tracking-widest">
              Pioneering the future of masonry with <span className="text-white">Machine Intelligence</span>. Seamlessly visualize exotic slabs in your architecture.
            </p>
            <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
              <Link href="/portfolio">
                <button className="group relative px-12 py-5 bg-primary text-primary-foreground font-black uppercase tracking-[0.3em] text-[11px] overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-3xl shadow-primary/20">
                  <span className="relative z-10">Explore Collection</span>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
                </button>
              </Link>
              <button
                onClick={() => document.getElementById('ai-tools')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-12 py-5 border border-white/10 hover:border-primary/50 text-white hover:text-primary backdrop-blur-md bg-white/5 transition-all uppercase tracking-[0.3em] text-[11px] font-black group active:scale-95"
              >
                AI Experience
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* AI Tools Section */}
      <section id="ai-tools" className="py-24 bg-background relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <SectionHeading
            subtitle="AI Innovations"
            title="Design with Machine Intelligence"
          />
          <div className="space-y-24">
            <LuxeStoneVisualizer />
            <StoneConcierge />
          </div>
        </div>

        {/* Decorative Background Element */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
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
                src="https://images.unsplash.com/photo-1628592102751-ba83b0314276?auto=format&fit=crop&q=80&w=1280"
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
