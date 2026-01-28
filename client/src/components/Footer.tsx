import { Link } from "wouter";
import logoImg from "@assets/Screenshot_20251226_103451_WhatsAppBusiness_1766730996434.jpg";

export function Footer() {
  return (
    <footer className="bg-black border-t border-white/5 pt-24 pb-12 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#141414_0%,_transparent_100%)] opacity-30"></div>
      <div className="container mx-auto px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">

          {/* Brand */}
          <div className="space-y-8 md:col-span-2">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 overflow-hidden rounded-xl border border-white/10 shadow-3xl">
                <img src={logoImg} alt="LJ Stone Surfaces" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-bold tracking-[0.1em] text-white">LJ STONE</span>
                <span className="text-[0.6rem] tracking-[0.4em] text-primary uppercase font-black">Architects</span>
              </div>
            </div>
            <p className="text-slate-500 text-sm leading-[2] max-w-sm font-medium uppercase tracking-widest opacity-80">
              Defining architectural landscapes with the world's most exquisite natural stone. Bespoke installations for the discerning aesthetic.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-primary text-sm tracking-[0.2em] uppercase font-semibold">Explore</h4>
            <div className="flex flex-col gap-3">
              <Link href="/portfolio" className="text-muted-foreground hover:text-primary transition-colors text-sm">Material Portfolio</Link>
              <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors text-sm">Our Story</Link>
              <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors text-sm">Contact Us</Link>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h4 className="text-primary text-sm tracking-[0.2em] uppercase font-semibold">Visit Us</h4>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>123 Luxury Avenue<br />Design District, NY 10012</p>
              <p>
                <a href="tel:+15551234567" className="hover:text-primary transition-colors">+1 (555) 123-4567</a><br />
                <a href="mailto:info@ljstonesurfaces.com" className="hover:text-primary transition-colors">info@ljstonesurfaces.com</a>
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground/50">
          <p>&copy; {new Date().getFullYear()} LJ Stone Surfaces. All rights reserved.</p>
          <p>Designed with elegance.</p>
        </div>
      </div>
    </footer>
  );
}
