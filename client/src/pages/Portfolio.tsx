
import React, { useState, useEffect } from 'react';
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SectionHeading } from "@/components/SectionHeading";
import Masonry from 'react-masonry-css';
import { motion } from 'framer-motion';

// --- Data Interfaces ---
interface StoneMetadata {
  material: string;
  item: string;
  visual_clue: string;
  original_filename: string;
}

interface StoneImage {
  src: string;
  width: number; // Placeholder, can be dynamically calculated if needed
  height: number; // Placeholder
  alt: string;
  material: string;
  name: string;
}

// --- Constants ---
const CATEGORIES = ["All", "Marble", "Quartz", "Granite"];
const breakpointColumnsObj = {
  default: 4,
  1200: 3,
  900: 2,
  600: 1
};

// --- Main Component ---
export default function Portfolio() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [allStones, setAllStones] = useState<StoneImage[]>([]);
  const [filteredStones, setFilteredStones] = useState<StoneImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadGalleryData() {
      setIsLoading(true);
      try {
        // Fetch metadata
        const metaResponse = await fetch('/stone_metadata_final.json');
        const metadata: StoneMetadata[] = await metaResponse.json();

        // The image files are now in public/stones. We can construct the URLs.
        const imageList = metadata.map(item => {
            return {
                src: `/stones/${encodeURIComponent(item.original_filename)}`,
                width: 1, // Will be set by browser
                height: 1, // Will be set by browser
                alt: item.visual_clue,
                material: item.material,
                name: item.item
            };
        });
        
        // Remove duplicates and items with missing images (defensive coding)
        const uniqueStones = Array.from(new Map(imageList.map(item => [item.src, item])).values());
        
        setAllStones(uniqueStones);
        
      } catch (error) {
        console.error("Failed to load gallery data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadGalleryData();
  }, []);

  useEffect(() => {
    if (activeCategory === "All") {
      setFilteredStones(allStones);
    } else {
      const filtered = allStones.filter(stone => 
        stone.material.toLowerCase().includes(activeCategory.toLowerCase())
      );
      setFilteredStones(filtered);
    }
  }, [activeCategory, allStones]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navigation />
      
      <div className="pt-32 pb-16 bg-gray-800/50">
        <div className="container mx-auto px-6 text-center">
          <SectionHeading subtitle="The Collection" title="Living Atelier" />
          
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 mt-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 text-xs md:text-sm uppercase tracking-wider rounded-full border-2 transition-all duration-300 transform hover:scale-105 ${
                  activeCategory === cat
                    ? "border-amber-400 text-amber-400 bg-amber-400/10"
                    : "border-gray-600 text-gray-400 hover:border-amber-500 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-16">
        {isLoading ? (
          <div className="text-center text-gray-400">Loading the Atelier...</div>
        ) : (
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="flex w-full gap-4"
            columnClassName="bg-clip-padding flex flex-col gap-4"
          >
            {filteredStones.map((stone, idx) => (
              <motion.div
                key={stone.src}
                className="group relative overflow-hidden rounded-md shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
              >
                <img 
                  src={stone.src} 
                  alt={stone.alt}
                  className="w-full h-auto block"
                />
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <h3 className="text-lg font-serif text-amber-300 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{stone.name}</h3>
                    <p className="text-sm text-gray-300 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-100">{stone.material}</p>
                </div>
              </motion.div>
            ))}
          </Masonry>
        )}
        {filteredStones.length === 0 && !isLoading && (
          <div className="col-span-full text-center py-20 text-gray-500">
            No materials found in this category.
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
