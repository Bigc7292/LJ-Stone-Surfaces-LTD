# LJ Stone Surfaces

## Overview

LJ Stone Surfaces is a premium luxury stone showroom web application built for showcasing natural and engineered stone products (marble, quartz, quartzite, etc.). The application features a dark luxury aesthetic with gold accents, AI-powered design consultation tools, and a product portfolio system. Key features include a "Visionary Re-Imager" that uses AI to visualize stones in customer spaces and an "AI Stone Concierge" for personalized recommendations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **Styling**: Tailwind CSS with a custom dark luxury theme (deep grays, gold/bronze accents)
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Animations**: Framer Motion for page transitions and scroll effects
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints under `/api/` prefix
- **Build Process**: Custom build script using esbuild for server and Vite for client

### Data Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` contains all database tables
- **Migrations**: Drizzle Kit with `db:push` command

### AI Integration
- **Provider**: Google Generative AI (Gemini) via Replit AI Integrations
- **Models Used**: gemini-2.5-flash for text, gemini-2.5-flash-image for image generation
- **Features**: Room re-imaging, stone consultation, chat functionality
- **Integration Modules**: Located in `server/replit_integrations/` for chat, image, and batch processing

### Project Structure
```
client/           # React frontend
  src/
    components/   # Reusable UI components
    pages/        # Route-based page components
    hooks/        # Custom React hooks
    lib/          # Utilities and query client
server/           # Express backend
  replit_integrations/  # AI integration modules
shared/           # Shared types, schemas, routes
  schema.ts       # Drizzle database schema
  routes.ts       # API route definitions with Zod schemas
```

### Key Design Decisions
- **Monorepo Structure**: Client and server in same repository with shared types
- **Type Safety**: End-to-end type safety using Zod schemas shared between client and server
- **Path Aliases**: `@/` for client source, `@shared/` for shared code
- **Dark Theme**: CSS variables in `client/src/index.css` define the luxury dark color palette

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **connect-pg-simple**: Session storage in PostgreSQL

### AI Services
- **Replit AI Integrations**: Provides Gemini API access
  - `AI_INTEGRATIONS_GEMINI_API_KEY`: API key
  - `AI_INTEGRATIONS_GEMINI_BASE_URL`: Custom base URL for the service
- **@google/generative-ai**: Official Google AI SDK for Gemini models

### Third-Party Libraries
- **Radix UI**: Accessible UI primitives for dialogs, menus, forms
- **Framer Motion**: Animation library
- **date-fns**: Date formatting utilities
- **Lucide React**: Icon library