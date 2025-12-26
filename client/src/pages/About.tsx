import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SectionHeading } from "@/components/SectionHeading";
import { motion } from "framer-motion";

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <section className="pt-40 pb-20 container mx-auto px-6">
        <SectionHeading subtitle="Who We Are" title="Our Legacy" />
        
        <div className="grid md:grid-cols-2 gap-16 items-center mt-12">
          <div className="space-y-6 text-muted-foreground font-light text-lg leading-relaxed">
            <p>
              <strong className="text-primary font-medium">LJ Stone Surfaces</strong> was founded on a singular principle: to bridge the gap between nature's raw beauty and architectural refinement.
            </p>
            <p>
              For over a decade, we have traveled to the most remote corners of the globe—from the mountains of Carrara to the deep quarries of Brazil—to hand-select slabs that meet our exacting standards of quality, consistency, and aesthetic impact.
            </p>
            <p>
              We understand that choosing a stone surface is an investment in art. It defines the tone of a kitchen, the grandeur of a lobby, or the serenity of a master bath. Our team of experts is dedicated to guiding you through this selection process, ensuring that the stone you choose is not just a surface, but a statement.
            </p>
          </div>
          
          <div className="relative">
            <div className="absolute -inset-4 border border-primary/20 z-0" />
            {/* artisan working on stone */}
            <img 
              src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2000&auto=format&fit=crop" 
              alt="Stone Craftsmanship" 
              className="w-full h-auto grayscale-[30%] relative z-10 shadow-2xl shadow-black/50"
            />
          </div>
        </div>
      </section>

      {/* Stats/Values */}
      <section className="py-20 bg-secondary/20 border-y border-white/5">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "12+", label: "Years Experience" },
              { number: "500+", label: "Premium Slabs" },
              { number: "50+", label: "Quarry Partners" },
              { number: "1k+", label: "Projects Completed" }
            ].map((stat, idx) => (
              <div key={idx} className="space-y-2">
                <span className="text-4xl md:text-5xl font-serif text-primary">{stat.number}</span>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
