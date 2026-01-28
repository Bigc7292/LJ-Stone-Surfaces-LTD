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
}

export const storage = new DatabaseStorage();
