# AI Models Registry Web App

A modern, high-performance web application built with TanStack Start, React 19, and TypeScript. This application provides a comprehensive interface for exploring and comparing AI models from various providers.

## Features

- Modern tech stack built with React 19, TanStack Router, and TypeScript
- High performance optimized with React Compiler and virtual scrolling
- Responsive design with mobile-first approach using Tailwind CSS
- Advanced data table with filtering, sorting, and pagination
- SEO optimized with server-side rendering, meta tags, and structured data
- Accessibility compliant with WCAG standards and keyboard navigation support
- Analytics integration with PostHog for user analytics
- GDPR-compliant cookie and consent management
- Comprehensive E2E testing with Playwright

## Tech Stack

### Core

- React 19 with React Compiler
- TanStack Router for type-safe routing with file-based routes
- TanStack Start as the full-stack React framework
- TypeScript for type-safe development
- Vite as the build tool and dev server

### UI & Styling

- Tailwind CSS 4 for utility-first styling
- Radix UI for accessible component primitives
- Lucide React for icons
- Motion for animations
- Sonner for toast notifications

### Data & State

- TanStack React Query for server state management
- TanStack React Table for powerful data table functionality
- TanStack React Virtual for virtual scrolling performance
- React Hook Form for form state management
- Zod for schema validation

### Development Tools

- ESLint for code linting
- Prettier for code formatting
- Playwright for E2E testing
- React Compiler for performance optimization

## Project Structure

```
web/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── data-table/      # Advanced data table implementation
│   │   ├── ui/              # Base UI components (Radix UI)
│   │   └── ...
│   ├── routes/              # File-based routing (TanStack Router)
│   │   ├── __root.tsx       # Root layout
│   │   └── index.tsx        # Home page
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility libraries
│   ├── providers/           # Context providers
│   ├── utils/               # Utility functions
│   ├── assets/              # Static assets
│   ├── client.tsx           # Client entry point
│   ├── router.tsx           # Router configuration
│   └── index.css            # Global styles
├── __tests__/               # E2E tests
├── public/                  # Public assets
├── vite.config.ts           # Vite configuration
├── playwright.config.ts     # Playwright configuration
└── netlify.toml            # Deployment configuration
```

## Getting Started

### Prerequisites

- Node.js 22 or higher
- pnpm (recommended) or npm
- Git

### Quick Start

1. Start the development server:

    ```bash
    pnpm run dev
    ```

2. Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

## Available Scripts

### Development

```bash
# Start development server
pnpm dev

# Start development server for E2E testing
pnpm dev:e2e
```

### Building

```bash
# Build for production
pnpm build

# Preview production build
pnpm serve
```

### Linting & Formatting

```bash
# Run ESLint
pnpm lint:eslint

# Fix ESLint issues
pnpm lint:eslint:fix

# Check Prettier formatting
pnpm lint:prettier

# Fix Prettier formatting
pnpm lint:prettier:fix

# Type checking
pnpm lint:types
```

### Testing

```bash
# Run E2E tests
pnpm test:e2e

# Run E2E tests in debug mode
pnpm test:e2e:debug

# Run E2E tests with UI
pnpm test:e2e:ui
```

## Architecture

### TanStack Start Integration

This project uses TanStack Start, which provides:

- File-based routing with automatic code splitting
- Server-side rendering for better SEO and performance
- Type-safe routing with full TypeScript support
- Built-in optimizations for React 19 and React Compiler

### Data Table Architecture

The data table implementation includes:

- Virtual scrolling for handling large datasets
- Advanced filtering with multiple operators
- Column resizing and reordering
- Export functionality (CSV, JSON)
- Keyboard navigation support
- Responsive design for mobile devices

### Performance Optimizations

- React Compiler for automatic performance optimizations
- Virtual scrolling for large datasets
- Code splitting with TanStack Router
- Image optimization with Vite
- Font optimization with unplugin-fonts
- SVG optimization with vite-plugin-svgr

## Testing

### E2E Testing with Playwright

The project includes comprehensive E2E tests:

```bash
# Run all E2E tests
pnpm test:e2e

# Run tests in debug mode
pnpm test:e2e:debug

# Run tests with UI
pnpm test:e2e:ui
```

### Test Structure

- Setup: Automatic port management and server startup
- Global setup/teardown: Database seeding and cleanup
- Page objects: Reusable test components
- Visual testing: Screenshot comparisons

## Deployment

### Netlify Deployment

The project is configured for Netlify deployment with:

- Automatic builds on git push
- Preview deployments for pull requests
- Edge functions for server-side logic
- CDN optimization for static assets
- Security headers for production

### Environment Variables

```bash
# Required
VITE_SITE_BASE_URL=https://your-domain.com

# Optional
VITE_POSTHOG_KEY=your-posthog-key
VITE_POSTHOG_HOST=https://app.posthog.com
```

## Configuration

### Vite Configuration

The Vite config includes:

- TanStack Start plugin for SSR and routing
- React Compiler for performance optimization
- Tailwind CSS for styling
- Font optimization with unplugin-fonts
- SVG optimization with vite-plugin-svgr
- Favicon generation with unplugin-favicons

### Tailwind Configuration

- Custom color palette for brand consistency
- Responsive breakpoints for mobile-first design
- Custom animations for smooth interactions
- Dark mode support

## Analytics & Monitoring

### PostHog Integration

- User analytics and behavior tracking
- Feature flags for A/B testing
- Session recordings for debugging
- GDPR compliance with consent management

### Performance Monitoring

- Core Web Vitals tracking
- Custom performance metrics
- Error tracking and reporting

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`pnpm test:e2e`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- ESLint for code quality
- Prettier for code formatting
- TypeScript for type safety
- Conventional commits for commit messages

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## Acknowledgments

- TanStack for the React ecosystem
- Radix UI for accessible components
- Tailwind CSS for the utility-first approach
- Vite for the fast build tool
- Playwright for reliable E2E testing

## Support

For support and questions:

- Issues: [GitHub Issues](https://github.com/anolilab/ai-models/issues)
- Discussions: [GitHub Discussions](https://github.com/anolilab/ai-models/discussions)
- Documentation: [Project Wiki](https://github.com/anolilab/ai-models/wiki)
