# Tech Context

## Technologies Used
- **Node.js** (>=20) for scripting and async/await support
- **TypeScript** for type safety and development experience
- **Nx** for monorepo workspace management
- **pnpm** for package management and workspace dependencies
- **React** (19.1.1) with TanStack Router for web application
- **Vite** for build tooling and development server
- **Zod** for schema validation and type inference
- **Playwright** for E2E testing
- **Vitest** for unit testing
- **Tailwind CSS** for styling
- **Radix UI** for accessible UI components

## Development Setup
- **Monorepo structure**: Nx workspace with multiple packages
- **Provider Registry**: `packages/ai-model-registry/` - NPM package for model data
- **Web Application**: `web/` - React application with data table
- **Scripts**: `packages/ai-model-registry/scripts/` - Data aggregation and processing
- **Dependencies**: Workspace dependencies between packages

## Technical Constraints
- **Data integrity**: All models must pass Zod schema validation
- **Cross-provider synchronization**: Models with same ID must be intelligently merged
- **Performance**: Efficient aggregation and processing pipeline required
- **Type safety**: Full TypeScript implementation with comprehensive types
- **Tree-shaking**: Package must support tree-shaking for optimal bundle size
- **Browser compatibility**: Must work in both Node.js and browser environments

## Dependencies
### Provider Registry Package
- **Core**: Zod for schema validation
- **Build**: Packem for optimized builds
- **Testing**: Vitest for unit testing
- **Linting**: ESLint, Prettier for code quality
- **Icons**: LobeHub icons for provider icons

### Web Application
- **Framework**: React 19.1.1 with TanStack Router
- **UI**: Radix UI components with Tailwind CSS
- **Data**: @anolilab/ai-model-registry workspace dependency
- **Testing**: Playwright for E2E testing
- **Build**: Vite for development and production builds

### Development Tools
- **Package Manager**: pnpm for workspace management
- **Monorepo**: Nx for project orchestration
- **TypeScript**: Latest version for type safety
- **ESLint**: Code linting and quality enforcement
- **Prettier**: Code formatting

## Build and Deployment
- **Provider Registry**: Packem for optimized builds with tree-shaking
- **Web Application**: Vite for development and production builds
- **Testing**: Comprehensive test suite with 29 unit tests and E2E tests
- **API**: Static CDN API for model data access
- **Package**: NPM package ready for publication (v1.1.0) 