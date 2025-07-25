# Tech Context

## Technologies Used
- Node.js (>=18.x) for scripting and async/await support.
- Fetch API (native in Node.js >=18).
- Node.js built-in modules: `fs`, `path`.

## Development Setup
- Script is run via `node scripts/fetch-models.js` (or similar).
- No external dependencies required for core functionality.
- Optional: code formatter (e.g., Biome, Prettier) for output files.

## Technical Constraints
- Output must be valid JSON, one file per model.
- Directory and file names must be sanitized for cross-platform compatibility.
- Script should handle API/network errors gracefully.

## Dependencies
- Node.js runtime.
- (Optional) Biome or Prettier for formatting generated files. 