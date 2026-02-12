import { pgTable, text, serial, boolean, jsonb } from "drizzle-orm/pg-core";

export * from "./models/chat";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // Marble, Quartz, etc.
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  isFeatured: boolean("is_featured").default(false),
});

export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  source: text("source").default("contact_form"),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = {
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  isFeatured?: boolean;
};

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = {
  name: string;
  email: string;
  phone?: string;
  message: string;
  source?: string;
};
// ... existing imports

export const visualizerGenerations = pgTable("visualizer_generations", {
  id: serial("id").primaryKey(),
  originalImageUrl: text("original_image_url").notNull(),
  generatedImageUrl: text("generated_image_url"),
  stoneSelected: text("stone_selected").notNull(),
  promptUsed: text("prompt_used"),
  markers: jsonb("markers"),
  createdAt: text("created_at").default("NOW()"),
});

export const chatLogs = pgTable("chat_logs", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id"),
  userMessage: text("user_message").notNull(),
  aiResponse: text("ai_response").notNull(),
  createdAt: text("created_at").default("NOW()"),
});

export const knowledgeBase = pgTable("knowledge_base", {
  id: serial("id").primaryKey(),
  topic: text("topic").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").default("NOW()"),
});

export type VisualizerGeneration = typeof visualizerGenerations.$inferSelect;
export type InsertVisualizerGeneration = {
  originalImageUrl: string;
  generatedImageUrl?: string;
  stoneSelected: string;
  promptUsed?: string;
  markers?: unknown;
};

export type ChatLog = typeof chatLogs.$inferSelect;
export type InsertChatLog = {
  sessionId?: string;
  userMessage: string;
  aiResponse: string;
  createdAt?: string;
};

export type KnowledgeBaseItem = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBaseItem = {
  topic: string;
  content: string;
  createdAt?: string;
};

export const designSessions = pgTable("design_sessions", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  roomDescription: text("room_description"),
  imageAnalysis: text("image_analysis"),
  recommendation: text("recommendation"),
  textureUrl: text("texture_url"),
  projectBrief: text("project_brief"),
});

export type DesignSession = typeof designSessions.$inferSelect;
export type InsertDesignSession = {
  userId?: string;
  roomDescription?: string;
  imageAnalysis?: string;
  recommendation?: string;
  textureUrl?: string;
  projectBrief?: string;
};


export const portfolio_gallery = pgTable("portfolio_gallery", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  title: text("title").notNull(),
  category: text("category").default('Kitchen'),
  createdAt: text("created_at").default("NOW()"),
});

export type InsertPortfolio = {
  imageUrl: string;
  title: string;
  category?: string;
  createdAt?: string;
};
export type PortfolioItem = typeof portfolio_gallery.$inferSelect;
