# Product Context

## Why This Project Exists
Managing and updating AI model metadata from various providers can be tedious and error-prone if done manually. This project automates the process, ensuring that model information is always current and organized.

## Problems It Solves
- Manual collection and organization of model metadata is time-consuming.
- Inconsistent or outdated model information can lead to integration issues.
- Lack of structure makes it hard to find or use specific model data.

## How It Should Work
- The script fetches model data from a remote API.
- Each model's data is saved as a separate JSON file.
- Files are organized by provider, making it easy to locate and use model information.
- The process is repeatable and can be scheduled or triggered as needed.

## User Experience Goals
- Simple, one-command execution to update all model data.
- Clear, logical directory and file structure.
- Easy integration with other tools or workflows that require model metadata. 