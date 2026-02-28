
import React, { useState } from 'react';
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SectionHeading } from "@/components/SectionHeading";
import Masonry from 'react-masonry-css';
import { motion, AnimatePresence } from 'framer-motion';
import { PORTFOLIO_DATA } from '@/data/portfolio';
import { Search, Grid, LayoutGrid } from 'lucide-react';

const breakpointColumnsObj = {
  default: 4,
  1200: 3,
  900: 2,
  600: 1
};

export default function Portfolio() {
  const [search, setSearch] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const filteredImages = PORTFOLIO_DATA.filter(img =>
    img.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-amber-500/30">
      <Navigation />

      <div className="pt-32 pb-16 bg-gradient-to-b from-slate-900 to-slate-950 border-b border-white/5">
        <div className="container mx-auto px-6 text-center">
          <SectionHeading subtitle="The Collection" title="Our Portfolio" />
          <p className="text-slate-400 mt-4 max-w-2xl mx-auto text-sm leading-relaxed">
            Explore Jack's previous masterworks. Every installation represents a unique marriage of high-end stone and precision craftsmanship.
          </p>

          <div className="mt-12 max-w-xl mx-auto relative group">
            <label htmlFor="portfolio-search" className="sr-only">Filter portfolio by name or style</label>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
            <input
              id="portfolio-search"
              type="text"
              placeholder="Filter by name or style..."
              className="w-full bg-slate-900/50 border border-white/10 rounded-full py-4 pl-12 pr-6 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all backdrop-blur-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-16">
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="flex w-full gap-4"
          columnClassName="bg-clip-padding flex flex-col gap-4"
        >
          {filteredImages.map((image, idx) => (
            <motion.div
              key={image.id}
              className="group relative overflow-hidden rounded-xl bg-slate-900 border border-white/5 hover:border-amber-500/30 transition-all cursor-zoom-in shadow-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.02, 1), duration: 0.4 }}
              onClick={() => setSelectedImage(image.swatchUrl)}
            >
              <div className="aspect-auto overflow-hidden">
                <img
                  src={image.swatchUrl}
                  alt={image.name}
                  className="w-full h-auto block transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            </motion.div>
          ))}
        </Masonry>

        {filteredImages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-slate-500">
            <LayoutGrid className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm font-medium uppercase tracking-widest">No matching works found</p>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-8 cursor-zoom-out"
            onClick={() => setSelectedImage(null)}
          >
            <button className="absolute top-8 right-8 text-white p-2 hover:bg-white/10 rounded-full transition-colors">
              <Grid className="w-6 h-6 rotate-45" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={selectedImage}
              className="max-w-full max-h-full object-contain rounded-sm shadow-[0_30px_100px_rgba(0,0,0,0.8)]"
              alt="Full view"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
