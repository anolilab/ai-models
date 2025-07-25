# System Patterns

## System Architecture
- Script-based automation, run via Node.js.
- Output directory structure: `providers/{provider}/{model-id}.json`.
- Each model is stored as a standalone JSON file for modularity and clarity.

## Key Technical Decisions
- Use Node.js for cross-platform compatibility and async operations.
- Use the Fetch API for HTTP requests.
- Use the Node.js `fs` and `path` modules for file and directory management.
- Sanitize file and directory names to avoid filesystem issues.

## Design Patterns
- Separation of concerns: fetching, processing, and writing are distinct steps.
- Idempotent output: running the script multiple times produces consistent results.
- Extensible: easy to add new providers or change API endpoints.

## Component Relationships
- Fetcher: Retrieves model data from the API.
- Organizer: Sorts models by provider and prepares directory structure.
- Writer: Outputs each model as a JSON file in the correct location. 