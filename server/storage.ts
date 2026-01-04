import { db } from "./db";
import {
  products,
  inquiries,
  visualizerGenerations,
  chatLogs,
  knowledgeBase,
  type InsertProduct,
  type InsertInquiry,
  type InsertVisualizerGeneration,
  type InsertChatLog,
  type InsertKnowledgeBaseItem,
  type Product,
  type Inquiry,
  type VisualizerGeneration,
  type ChatLog,
  type KnowledgeBaseItem
} from "../shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getProducts(category?: string): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  // New methods
  createVisualizerGeneration(gen: InsertVisualizerGeneration): Promise<VisualizerGeneration>;
  updateVisualizerGeneration(id: number, generatedUrl: string): Promise<void>;
  createChatLog(log: InsertChatLog): Promise<ChatLog>;
  getKnowledgeBase(): Promise<KnowledgeBaseItem[]>;
  createKnowledgeBaseItem(item: InsertKnowledgeBaseItem): Promise<KnowledgeBaseItem>;
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

  // New implementations
  async createVisualizerGeneration(gen: InsertVisualizerGeneration): Promise<VisualizerGeneration> {
    const [newGen] = await db.insert(visualizerGenerations).values(gen).returning();
    return newGen;
  }

  async updateVisualizerGeneration(id: number, generatedUrl: string): Promise<void> {
    await db.update(visualizerGenerations)
      .set({ generatedImageUrl: generatedUrl })
      .where(eq(visualizerGenerations.id, id));
  }

  async createChatLog(log: InsertChatLog): Promise<ChatLog> {
    const [newLog] = await db.insert(chatLogs).values(log).returning();
    return newLog;
  }

  async getKnowledgeBase(): Promise<KnowledgeBaseItem[]> {
    return await db.select().from(knowledgeBase);
  }

  async createKnowledgeBaseItem(item: InsertKnowledgeBaseItem): Promise<KnowledgeBaseItem> {
    const [newItem] = await db.insert(knowledgeBase).values(item).returning();
    return newItem;
  }

  async seedProducts(): Promise<void> {
    // ... existing implementation
    const existing = await db.select().from(products).limit(1);
    if (existing.length === 0) {
      const seedData: InsertProduct[] = [
        {
          name: "Gray Ice",
          category: "Marble",
          // ... existing seed data continues

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
