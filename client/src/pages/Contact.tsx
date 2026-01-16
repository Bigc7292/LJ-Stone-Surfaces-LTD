import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SectionHeading } from "@/components/SectionHeading";
import { ContactForm } from "@/components/ContactForm";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export default function Contact() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <section className="pt-32 pb-20 container mx-auto px-6">
        <SectionHeading subtitle="Get In Touch" title="Start Your Project" />

        <div className="grid lg:grid-cols-2 gap-16 mt-12">
          {/* Contact Info Side */}
          <div className="space-y-12">
            <div className="prose prose-invert">
              <p className="text-xl text-muted-foreground font-light leading-relaxed">
                Whether you are an architect, designer, or homeowner, we are here to assist you in finding the perfect stone for your next masterpiece. Visit our showroom or send us a message.
              </p>
            </div>

            <div className="grid gap-8">
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-secondary rounded-sm text-primary">
                  <MapPin size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="font-serif text-lg mb-1">Showroom</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    123 Luxury Avenue<br />Design District, NY 10012
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="p-3 bg-secondary rounded-sm text-primary">
                  <Phone size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="font-serif text-lg mb-1">Phone</h4>
                  <p className="text-muted-foreground text-sm">
                    <a href="tel:+15551234567" className="hover:text-primary">+1 (555) 123-4567</a>
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="p-3 bg-secondary rounded-sm text-primary">
                  <Mail size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="font-serif text-lg mb-1">Email</h4>
                  <p className="text-muted-foreground text-sm">
                    <a href="mailto:info@ljstonesurfaces.com" className="hover:text-primary">info@ljstonesurfaces.com</a>
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="p-3 bg-secondary rounded-sm text-primary">
                  <Clock size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="font-serif text-lg mb-1">Hours</h4>
                  <p className="text-muted-foreground text-sm">
                    Mon - Fri: 9:00 AM - 6:00 PM<br />
                    Sat: By Appointment Only<br />
                    Sun: Closed
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="bg-secondary/10 p-8 md:p-12 border border-white/5">
            <h3 className="font-serif text-2xl mb-8">Send a Message</h3>
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Map Section (Placeholder) */}
      <div className="h-96 w-full bg-secondary grayscale opacity-80">
        <iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024.2219901290355!2d-74.00369368400567!3d40.71312937933185!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25a23e28c1191%3A0x49f75d3281df052a!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2s!4v1650000000000!5m2!1sen!2s" 
          width="100%" 
          height="100%" 
          style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }} 
          allowFullScreen 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>

      <Footer />
    </div>
  );
}
