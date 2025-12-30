import { motion } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { MapPin, Mail, Phone, Linkedin, Award, Users, Clock } from "lucide-react";

interface TeamMember {
    name: string;
    role: string;
    bio: string;
    image: string;
    specialties: string[];
}

const teamMembers: TeamMember[] = [
    {
        name: "Jack Davis",
        role: "Founder & Managing Director",
        bio: "With over 15 years of experience in the stone industry, Jack founded LJ Stone Surfaces with a vision to bring the world's finest natural stones to homes and commercial spaces across the UK.",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
        specialties: ["Business Strategy", "Client Relations", "Stone Sourcing"]
    },
    {
        name: "Sarah Mitchell",
        role: "Head of Design",
        bio: "Sarah brings her architectural background and keen eye for aesthetics to every project, ensuring each installation perfectly complements the space's design vision.",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face",
        specialties: ["Interior Design", "Color Matching", "Custom Patterns"]
    },
    {
        name: "David Chen",
        role: "Master Stone Fabricator",
        bio: "David's precision craftsmanship and 20 years of hands-on experience ensure every cut is perfect and every edge is flawlessly finished.",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
        specialties: ["Precision Cutting", "Edge Profiling", "Installation"]
    },
    {
        name: "Emma Williams",
        role: "Client Experience Manager",
        bio: "Emma ensures every client journey from consultation to installation is seamless, making the process of selecting and installing luxury stone as enjoyable as the final result.",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
        specialties: ["Project Coordination", "Client Support", "Aftercare"]
    }
];

const companyStats = [
    { icon: Clock, value: "15+", label: "Years Experience" },
    { icon: Users, value: "500+", label: "Happy Clients" },
    { icon: Award, value: "50+", label: "Industry Awards" },
];

export default function Team() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
            <Navigation />

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4">
                <div className="max-w-6xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="text-amber-500 text-xs font-black uppercase tracking-[0.3em] mb-4 block">
                            The Artisans Behind the Stone
                        </span>
                        <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-white via-amber-200 to-amber-500 bg-clip-text text-transparent">
                            Meet Our Team
                        </h1>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
                            A passionate team of stone experts, designers, and craftspeople dedicated to transforming spaces with the world's finest natural materials.
                        </p>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        className="grid grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                    >
                        {companyStats.map((stat, i) => (
                            <div key={i} className="text-center">
                                <stat.icon className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                                <div className="text-4xl font-black text-white">{stat.value}</div>
                                <div className="text-sm text-slate-500 uppercase tracking-wider mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Team Members */}
            <section className="py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-8">
                        {teamMembers.map((member, index) => (
                            <motion.div
                                key={member.name}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1, duration: 0.5 }}
                                className="group bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-slate-800 overflow-hidden hover:border-amber-500/50 transition-all duration-500"
                            >
                                <div className="flex flex-col md:flex-row">
                                    {/* Image */}
                                    <div className="relative w-full md:w-48 h-64 md:h-auto shrink-0 overflow-hidden">
                                        <img
                                            src={member.image}
                                            alt={member.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-900 via-transparent to-transparent" />
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 flex flex-col justify-center">
                                        <h3 className="text-2xl font-black text-white mb-1">{member.name}</h3>
                                        <p className="text-amber-500 text-sm font-bold uppercase tracking-wider mb-4">{member.role}</p>
                                        <p className="text-slate-400 text-sm leading-relaxed mb-4">{member.bio}</p>

                                        {/* Specialties */}
                                        <div className="flex flex-wrap gap-2">
                                            {member.specialties.map((specialty) => (
                                                <span
                                                    key={specialty}
                                                    className="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded-full border border-slate-700"
                                                >
                                                    {specialty}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Location Map Section */}
            <section className="py-20 px-4 bg-slate-900/50">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <span className="text-amber-500 text-xs font-black uppercase tracking-[0.3em] mb-4 block">
                            Visit Our Showroom
                        </span>
                        <h2 className="text-4xl font-black text-white mb-4">Find Us in Aberdare</h2>
                        <p className="text-slate-400 max-w-xl mx-auto">
                            Visit our state-of-the-art showroom in the heart of Wales to experience our premium stone collection in person.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-8 items-stretch">
                        {/* Map Embed */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="rounded-3xl overflow-hidden border border-slate-800 h-[400px]"
                        >
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d39544.95847453894!2d-3.4731!3d51.7148!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x486e1a0a8a8b0001%3A0x8e3d3f2c6c8a8b0c!2sAberdare%2C%20UK!5e0!3m2!1sen!2s!4v1640000000000!5m2!1sen!2s"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="LJ Stone Surfaces Location"
                            />
                        </motion.div>

                        {/* Contact Info */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="bg-slate-900 rounded-3xl border border-slate-800 p-8 flex flex-col justify-center"
                        >
                            <h3 className="text-2xl font-black text-white mb-8">Contact Information</h3>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center shrink-0">
                                        <MapPin className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold mb-1">Showroom Address</h4>
                                        <p className="text-slate-400 text-sm">Aberdare, Rhondda Cynon Taf<br />Wales, United Kingdom</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center shrink-0">
                                        <Phone className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold mb-1">Phone</h4>
                                        <a href="tel:+447727310537" className="text-slate-400 text-sm hover:text-amber-500 transition-colors">
                                            +44 7727 310537
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center shrink-0">
                                        <Mail className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold mb-1">Email</h4>
                                        <a href="mailto:info@ljstonesurfaces.com" className="text-slate-400 text-sm hover:text-amber-500 transition-colors">
                                            info@ljstonesurfaces.com
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center shrink-0">
                                        <Clock className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold mb-1">Opening Hours</h4>
                                        <p className="text-slate-400 text-sm">
                                            Mon - Fri: 9:00 AM - 6:00 PM<br />
                                            Sat: By Appointment<br />
                                            Sun: Closed
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* CTA */}
                            <a
                                href="https://wa.me/447727310537"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-8 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-4 px-8 rounded-2xl hover:shadow-lg hover:shadow-green-500/30 transition-all"
                            >
                                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                                Chat with Jack on WhatsApp
                            </a>
                        </motion.div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
