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
          imageUrl: "https://images.unsplash.com/photo-1615800098779-1be8287d6b34?auto=format&fit=crop&q=80&w=800",
          isFeatured: true
        },
        {
          name: "Statuarietto Gioia",
          category: "Marble",
          description: "Classic white marble with bold grey veining, a timeless choice for luxury spaces.",
          imageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800",
          isFeatured: true
        },
        {
          name: "Pietra Gray",
          category: "Marble",
          description: "Deep charcoal grey background with striking white streaks.",
          imageUrl: "https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=800",
          isFeatured: true
        },
        {
          name: "Calacatta Seraphina",
          category: "Quartz",
          description: "Engineered perfection mimicking the finest Italian Calacatta marble.",
          imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800",
          isFeatured: true
        },
        {
          name: "Patagonia",
          category: "Quartzite",
          description: "Translucent grey base with beige and gold clusters. Ideal for backlit applications.",
          imageUrl: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800",
          isFeatured: true
        },
        {
          name: "Belize",
          category: "Quartz",
          description: "Uniform appearance bringing sophistication to kitchens and living spaces.",
          imageUrl: "https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?auto=format&fit=crop&q=80&w=800",
          isFeatured: false
        }
      ];
      await db.insert(products).values(seedData);
    }
  }
}

export const storage = new DatabaseStorage();
