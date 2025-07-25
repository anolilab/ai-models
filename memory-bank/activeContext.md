# Active Context

## Current Work Focus
- Implementing a script to fetch AI model metadata and organize it into provider-based directories, with each model as a separate JSON file.

## Recent Changes
- Created Memory Bank core files to document project context and requirements.

## Next Steps
- Implement the Node.js script as described in the documentation.
- Test the script to ensure correct directory and file creation.
- Update documentation as needed after implementation.

## Active Decisions
- Use model `id` as the filename for each JSON file.
- Organize files under `providers/{provider}/` directories.
- Ensure output is idempotent and easily extendable. 