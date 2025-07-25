# Project Brief

## Project Name
AI Models Fetcher & Organizer

## Purpose
Automate the fetching and organization of AI model metadata from external APIs, storing each model's data in a structured, provider-based directory as individual JSON files.

## Core Requirements
- Fetch model metadata from a remote API endpoint.
- For each model, create a JSON file containing all its data.
- Organize model files into folders by provider (e.g., `providers/openai/gpt-3.5-turbo.json`).
- Ensure each model file is named after its `id` (or a sanitized version).
- Automatically create directories as needed.
- Script should be easily extendable for new providers or APIs.

## Goals
- Maintain a clean, organized, and up-to-date local repository of model metadata.
- Facilitate integration with other tools or systems that require model information.
- Ensure maintainability and clarity in both code and output structure. 