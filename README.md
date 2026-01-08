# AI Models - An Open-Source Database of AI Models

<div align="center">
  <img src=".github/assets/intro.png" alt="AI Models Database Interface" width="800" />

This project is a comprehensive, open-source platform that provides a unified database of AI models from 50+ providers. It consists of a powerful TypeScript library for accessing model metadata and a modern web application for browsing and searching AI models.

</div>

---

<div align="center">
    <p>
        <sup>
            Anolilab's open source work is supported by the community on <a href="https://github.com/sponsors/prisis">GitHub Sponsors</a>
        </sup>
    </p>
</div>

---

This is a monorepo that contains a collection of packages providing comprehensive AI model data and a modern web interface for browsing and searching AI models.

## What's Included

This repository contains two main components:

**AI Model Registry Library** - A TypeScript library that provides programmatic access to AI model metadata from 50+ providers. Perfect for integrating model information into your applications.

**Web Application** - A modern React web application for browsing and searching AI models with an interactive data table, advanced filtering, and data export capabilities.

For detailed usage instructions, see the README files in each package directory.

## Features

### Web Application

- Interactive data table to browse 1000+ AI models with advanced filtering and sorting
- Powerful search functionality by provider, capabilities, pricing, and more
- Responsive design that works seamlessly on desktop and mobile devices
- Modern UI built with TailwindCSS and shadcn/ui components
- Fast performance optimized with TanStack Table and virtual scrolling
- Data export functionality to export filtered data in various formats

### AI Model Registry Library

- Unified interface to access models from multiple providers through a single API
- Full TypeScript support with Zod schema validation for type safety
- Tree shaking support - import only what you need to minimize bundle size
- Comprehensive model information including capabilities, pricing, and limits
- Advanced search and filtering capabilities across all models
- Automatic data synchronization between models with the same ID
- Real-time pricing data integration from Helicone API (840+ models)

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/anolilab/ai-models.git
cd ai-models

# Install dependencies
pnpm install
```

### Development

```bash
cd packages/ai-model-registry

pnpm run download
pnpm run build

# WEB App

cd web

pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the web application.

## Versioning

This project uses [Semantic Versioning](https://semver.org/) (SemVer) for version management. This allows you to choose which version to use and test newer versions before upgrading.

## Node.js Support

This project requires Node.js 22 or higher. We follow [Node.js' release schedule](https://nodejs.org/en/about/releases/) to ensure compatibility with the latest stable versions.

## Contributing

If you would like to help take a look at the [list of issues](https://github.com/anolilab/ai-models/issues) and check our [Contributing](.github/CONTRIBUTING.md) guide.

> **Note:** please note that this project is released with a Contributor Code of Conduct. By participating in this project you agree to abide by its terms.

## Credits

- [Daniel Bannert](https://github.com/prisis)
- [All Contributors](https://github.com/anolilab/ai-models/graphs/contributors)

## License

The anolilab ai-models is open-sourced software licensed under the [Apache License 2.0](https://opensource.org/licenses/Apache-2.0)
