
import React, { useState, useEffect } from 'react';
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SectionHeading } from "@/components/SectionHeading";
import Masonry from 'react-masonry-css';
import { motion } from 'framer-motion';

// A simpler interface for the new image structure
interface PortfolioImage {
  src: string;
  alt: string;
}

const breakpointColumnsObj = {
  default: 4,
  1200: 3,
  900: 2,
  600: 1
};

export default function Portfolio() {
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadGalleryData() {
      setIsLoading(true);
      try {
        // Fetch the new image manifest
        const response = await fetch('/image_manifest.json');
        const imageFilenames: string[] = await response.json();

        // Construct the image objects for the gallery
        const imageList = imageFilenames.map(filename => {
            return {
                src: `/portfolio_images/${encodeURIComponent(filename)}`,
                alt: `Portfolio image ${filename}` // Simple alt text
            };
        });

        setImages(imageList);

      } catch (error) {
        console.error("Failed to load gallery data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadGalleryData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navigation />
      
      <div className="pt-32 pb-16 bg-gray-800/50">
        <div className="container mx-auto px-6 text-center">
          <SectionHeading subtitle="The Collection" title="Living Atelier" />
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
            {images.map((image, idx) => (
              <motion.div
                key={image.src}
                className="overflow-hidden rounded-md shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
              >
                <img 
                  src={image.src} 
                  alt={image.alt}
                  className="w-full h-auto block"
                />
              </motion.div>
            ))}
          </Masonry>
        )}
        {images.length === 0 && !isLoading && (
          <div className="col-span-full text-center py-20 text-gray-500">
            There are no images in the collection at this time.
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
