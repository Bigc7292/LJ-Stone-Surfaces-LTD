import { pgTable, text, serial, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertInquirySchema = createInsertSchema(inquiries).omit({ id: true });

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export const designSessions = pgTable("design_sessions", {
  id: serial("id").primaryKey(),
  userId: text("user_id"), // Optional if no auth
  roomDescription: text("room_description"),
  imageAnalysis: text("image_analysis"),
  recommendation: text("recommendation"),
  textureUrl: text("texture_url"),
  projectBrief: text("project_brief"),
});

export const insertDesignSessionSchema = createInsertSchema(designSessions).omit({ id: true });
export type DesignSession = typeof designSessions.$inferSelect;
export type InsertDesignSession = z.infer<typeof insertDesignSessionSchema>;
