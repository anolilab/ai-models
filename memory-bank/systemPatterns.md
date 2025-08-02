# System Patterns

## System Architecture
- **Monorepo structure** with Nx workspace for efficient project management
- **Provider Registry Package**: NPM package (`@anolilab/ai-model-registry`) for static model data
- **Web Application**: React-based frontend with TanStack Router and data table
- **Data Pipeline**: Automated aggregation and synchronization system
- **Output structure**: Organized by provider with cross-provider synchronization

## Key Technical Decisions
- **Cross-provider synchronization**: Models with same ID across providers are intelligently merged
- **Pricing data integration**: Helicone API integration for comprehensive pricing information
- **Icon system**: Automatic icon assignment based on provider information
- **Per-provider uniqueness**: Models can have same ID across different providers
- **Tree-shakable exports**: Optimized bundle size for consumers
- **Type safety**: Full TypeScript implementation with Zod schema validation
- **Performance optimization**: Efficient aggregation and processing pipeline

## Design Patterns
- **Separation of concerns**: Data fetching, processing, synchronization, and presentation are distinct layers
- **Idempotent output**: Running the aggregation multiple times produces consistent results
- **Extensible architecture**: Easy to add new providers or change data sources
- **Cross-provider data merging**: Intelligent synchronization of model data across providers
- **Data validation**: Comprehensive schema validation ensuring data integrity
- **Error handling**: Robust error handling for API failures and data processing

## Component Relationships
- **Data Aggregator**: Collects and processes model data from all providers
- **Synchronization Engine**: Merges data from multiple sources for same model IDs
- **Pricing Enricher**: Enhances models with pricing data from Helicone
- **Icon Assigner**: Automatically assigns appropriate provider icons
- **Registry Interface**: Provides unified API for accessing model data
- **Web Application**: Consumes registry data and presents it in interactive table
- **Test Suite**: Comprehensive validation of all functionality

## Data Flow
1. **Provider Data Collection**: Individual transformers fetch data from each provider
2. **Aggregation**: All provider data is collected and normalized
3. **Synchronization**: Models with same ID across providers are merged
4. **Enrichment**: Pricing data and icons are added
5. **Validation**: Comprehensive schema validation ensures data integrity
6. **Export**: Data is exported to NPM package and static API
7. **Consumption**: Web application and other consumers access the data

## Quality Assurance
- **Comprehensive test suite**: 29 tests covering all API functions and edge cases
- **Schema validation**: Zod schemas ensure data structure consistency
- **Cross-provider validation**: Ensures data integrity across multiple sources
- **Performance testing**: Optimized aggregation and processing pipeline
- **Integration testing**: Web application integration validated 