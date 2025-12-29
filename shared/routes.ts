import { z } from 'zod';
import { insertInquirySchema, insertProductSchema, products } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  products: {
    list: {
      method: 'GET' as const,
      path: '/api/products',
      input: z.object({
        category: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof products.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/products/:id',
      responses: {
        200: z.custom<typeof products.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  inquiries: {
    create: {
      method: 'POST' as const,
      path: '/api/inquiries',
      input: insertInquirySchema,
      responses: {
        201: z.custom<typeof insertInquirySchema>(),
        400: errorSchemas.validation,
      },
    },
  },
  ai: {
    consultant: {
      method: 'POST' as const,
      path: '/api/ai/consultant',
      input: z.object({
        text: z.string().optional(),
        image: z.string().optional(), // base64
      }),
      responses: {
        200: z.object({
          recommendation: z.string(),
          brief: z.string(),
        }),
      },
    },
    visualize: {
      method: 'POST' as const,
      path: '/api/ai/visualize',
      input: z.object({
        description: z.string(),
      }),
      responses: {
        200: z.object({
          imageUrl: z.string(),
        }),
      },
    },
    tts: {
      method: 'POST' as const,
      path: '/api/ai/tts',
      input: z.object({
        text: z.string(),
      }),
      responses: {
        200: z.object({
          audioBase64: z.string(),
        }),
      },
    },
    reImager: {
      method: 'POST' as const,
      path: '/api/ai/re-imager',
      input: z.object({
        image: z.string(),
        stoneType: z.string(),
      }),
      responses: {
        200: z.object({
          imageUrl: z.string(),
        }),
      },
    },
    chat: {
      method: 'POST' as const,
      path: '/api/ai/chat',
      input: z.object({
        message: z.string(),
        history: z.array(z.object({
          role: z.enum(['user', 'model']),
          content: z.string(),
        })).optional(),
      }),
      responses: {
        200: z.object({
          response: z.string(),
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
