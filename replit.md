# AI Code IDE

## Overview

This is a full-stack AI-powered IDE application built for both mobile and desktop use. The application features an integrated AI assistant for code editing, File System Access API support, Monaco Editor integration, and a responsive design optimized for all device types.

## System Architecture

The application follows a modern full-stack architecture with clear separation between client and server components:

### Frontend Architecture
- **Framework**: React with TypeScript
- **Bundler**: Vite with custom configuration for monorepo structure
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **UI Framework**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with custom IDE theme variables
- **Code Editor**: Monaco Editor with custom setup and theming

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **API**: RESTful endpoints with structured error handling
- **Development**: Hot module replacement with Vite integration

## Key Components

### Database Layer
- **Schema Definition**: Centralized in `shared/schema.ts` using Drizzle ORM
- **Tables**:
  - `projects`: Store project metadata and directory handles
  - `files`: Store file content, paths, and modification status
  - `chatMessages`: Store AI chat conversation history
- **Validation**: Zod schemas for type-safe data validation

### File System Integration
- **Browser API**: File System Access API for direct folder access
- **Fallback**: Memory storage implementation for unsupported browsers
- **Project Management**: Serialized directory handles for persistence

### AI Integration
- **Provider**: OpenAI GPT-4o for code assistance
- **Features**:
  - Code editing with contextual understanding
  - Chat-based code assistance
  - Code generation capabilities
- **API Key**: Environment variable configuration

### Responsive Design
- **Mobile-First**: Optimized for touch interfaces
- **Adaptive Layout**: Tabs-based navigation on mobile, panels on desktop
- **Virtual Keyboard**: Custom programming symbols keyboard for mobile
- **PWA Ready**: Manifest and service worker configuration

## Data Flow

1. **Project Initialization**: User opens folder via File System Access API or creates new project
2. **File Management**: Files are read from filesystem and cached in database
3. **Code Editing**: Monaco Editor provides syntax highlighting and editing capabilities
4. **AI Assistance**: User interactions with AI are processed through OpenAI API
5. **Persistence**: Changes are saved to both filesystem (if available) and database
6. **Real-time Updates**: TanStack Query manages cache invalidation and updates

## External Dependencies

### Frontend Dependencies
- **UI Components**: Comprehensive Radix UI component library
- **Code Editor**: Monaco Editor for professional code editing experience
- **HTTP Client**: Built-in fetch with custom wrapper for API calls
- **Form Handling**: React Hook Form with Zod resolvers

### Backend Dependencies
- **Database**: Drizzle ORM with PostgreSQL adapter
- **AI Service**: OpenAI SDK for chat completions
- **Session Management**: Connect-pg-simple for PostgreSQL session storage

### Development Tools
- **Build System**: Vite with React plugin and custom configurations
- **Type Checking**: TypeScript with strict mode enabled
- **Code Quality**: ESM modules with path mapping for clean imports

## Deployment Strategy

### Replit Configuration
- **Environment**: Node.js 20 with PostgreSQL 16
- **Development**: `npm run dev` with hot reload on port 5000
- **Production Build**: Vite build + esbuild bundle for server
- **Database**: Automatic PostgreSQL provisioning via environment variables

### Build Process
1. **Client Build**: Vite bundles React application with optimizations
2. **Server Build**: esbuild bundles Express server as ESM module
3. **Asset Handling**: Static files served from `dist/public`
4. **Database Migration**: Drizzle migrations applied on deployment

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (auto-provisioned)
- `OPENAI_API_KEY`: Required for AI functionality
- `NODE_ENV`: Development/production environment flag

## Changelog
- June 24, 2025. Initial setup
- June 24, 2025. Configured AI integration with Portuguese language support
- June 24, 2025. Added demo project with sample files for testing
- June 24, 2025. Enhanced mobile responsiveness with tabs-based navigation
- June 24, 2025. Fixed Monaco Editor integration for real-world usage
- June 24, 2025. Implemented reliable SimpleCodeEditor maintaining full AI code editing capabilities

## User Preferences

Preferred communication style: Simple, everyday language in Portuguese (Brazilian).
Device: Windows PC with mobile optimization requirements.
Critical requirement: AI must maintain full capability to edit and create code automatically.
Editor preference: Reliable text editor with AI integration over complex Monaco setup.