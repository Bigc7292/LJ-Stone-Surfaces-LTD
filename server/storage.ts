import { db } from "./db";
import {
  products,
  inquiries,
  type InsertProduct,
  type InsertInquiry,
  type Product,
  type Inquiry
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getProducts(category?: string): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  seedProducts(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(category?: string): Promise<Product[]> {
    if (category) {
      return await db.select().from(products).where(eq(products.category, category));
    }
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const [newInquiry] = await db.insert(inquiries).values(inquiry).returning();
    return newInquiry;
  }

  async seedProducts(): Promise<void> {
    const existing = await db.select().from(products).limit(1);
    if (existing.length === 0) {
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
      await db.insert(products).values(seedData);
    }
  }
}

export const storage = new DatabaseStorage();
