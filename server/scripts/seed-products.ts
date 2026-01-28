import { db } from "../db";
import { products, type InsertProduct } from "../../shared/schema";

async function seed() {
    console.log("Seeding products...");
    const seedData: InsertProduct[] = [
        {
            name: "Gray Ice",
            category: "Marble",
            description: "A stunning grey marble with intricate white veining, perfect for modern interiors.",
            imageUrl: "/stones/grey-ice-marble.jpg",
            isFeatured: true
        },
        {
            name: "Statuarietto Gioia",
            category: "Marble",
            description: "Classic white marble with bold grey veining, a timeless choice for luxury spaces.",
            imageUrl: "/stones/statuarietto-gioia.png",
            isFeatured: true
        },
        {
            name: "Pietra Gray",
            category: "Marble",
            description: "Deep charcoal grey background with striking white streaks.",
            imageUrl: "/stones/pietra-gray.png",
            isFeatured: true
        },
        {
            name: "Calacatta Seraphina",
            category: "Quartz",
            description: "Engineered perfection mimicking the finest Italian Calacatta marble.",
            imageUrl: "/stones/calacatta-laza-quartz.png",
            isFeatured: true
        },
        {
            name: "Patagonia",
            category: "Quartzite",
            description: "Translucent grey base with beige and gold clusters. Ideal for backlit applications.",
            imageUrl: "/stones/patagonia.jpg",
            isFeatured: true
        },
        {
            name: "Belize",
            category: "Quartz",
            description: "Uniform appearance bringing sophistication to kitchens and living spaces.",
            imageUrl: "/stones/colonial-white-granite.png",
            isFeatured: false
        }
    ];

    try {
        await db.insert(products).values(seedData);
        console.log("Seeding complete!");
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
    process.exit(0);
}

seed();
