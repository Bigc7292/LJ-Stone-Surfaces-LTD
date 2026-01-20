import { pgTable, text, serial, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertInquirySchema = createInsertSchema(inquiries).omit({ id: true });

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;
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

export const insertVisualizerGenerationSchema = createInsertSchema(visualizerGenerations).omit({ id: true });
export const insertChatLogSchema = createInsertSchema(chatLogs).omit({ id: true });
export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBase).omit({ id: true });

export type VisualizerGeneration = typeof visualizerGenerations.$inferSelect;
export type InsertVisualizerGeneration = z.infer<typeof insertVisualizerGenerationSchema>;

export type ChatLog = typeof chatLogs.$inferSelect;
export type InsertChatLog = z.infer<typeof insertChatLogSchema>;

export type KnowledgeBaseItem = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBaseItem = z.infer<typeof insertKnowledgeBaseSchema>;

export const designSessions = pgTable("design_sessions", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  roomDescription: text("room_description"),
  imageAnalysis: text("image_analysis"),
  recommendation: text("recommendation"),
  textureUrl: text("texture_url"),
  projectBrief: text("project_brief"),
});

export const insertDesignSessionSchema = createInsertSchema(designSessions).omit({ id: true });
export type DesignSession = typeof designSessions.$inferSelect;
export type InsertDesignSession = z.infer<typeof insertDesignSessionSchema>;


export const portfolio_gallery = pgTable("portfolio_gallery", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  title: text("title").notNull(),
  category: text("category").default('Kitchen'),
  createdAt: text("created_at").default("NOW()"),
});

export const insertPortfolioSchema = createInsertSchema(portfolio_gallery);
export const selectPortfolioSchema = createSelectSchema(portfolio_gallery);
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;
export type PortfolioItem = z.infer<typeof selectPortfolioSchema>;
