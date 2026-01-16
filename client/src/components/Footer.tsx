import { Link } from "wouter";
import logoImg from "@assets/Screenshot_20251226_103451_WhatsAppBusiness_1766730996434.jpg";

export function Footer() {
  return (
    <footer className="bg-secondary border-t border-white/5 pt-16 pb-8">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 overflow-hidden rounded-sm border border-primary/20">
                <img src={logoImg} alt="LJ Stone Surfaces" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-lg font-bold tracking-wider text-foreground">LJ STONE</span>
                <span className="text-[0.5rem] tracking-[0.2em] text-primary uppercase">Surfaces</span>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              Defining spaces with elegance and durability. Premium stone surfaces for the discerning client.
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
