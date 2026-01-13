## @anolilab/ai-model-registry [4.0.2](https://github.com/anolilab/ai-models/compare/@anolilab/ai-model-registry@4.0.1...@anolilab/ai-model-registry@4.0.2) (2026-01-13)

### Bug Fixes

* update README and JSON files to clarify pricing structure ([837cf9e](https://github.com/anolilab/ai-models/commit/837cf9eec452652f734df3e21afa49c70806c79f))

## @anolilab/ai-model-registry [4.0.1](https://github.com/anolilab/ai-models/compare/@anolilab/ai-model-registry@4.0.0...@anolilab/ai-model-registry@4.0.1) (2026-01-13)

### Bug Fixes

* Added package.json mapping for the package.json file in the ai-model-registry directory. ([c50ed28](https://github.com/anolilab/ai-models/commit/c50ed28a4f1538084b8fc516dbff533051df4341))
* **upstage:** add Puppeteer launch arguments for improved browser performance ([a5cc143](https://github.com/anolilab/ai-models/commit/a5cc14391b60c8b37e5636745e86e6bf07a8a264))

## @anolilab/ai-model-registry [4.0.0](https://github.com/anolilab/ai-models/compare/@anolilab/ai-model-registry@3.0.0...@anolilab/ai-model-registry@4.0.0) (2026-01-13)

### ⚠ BREAKING CHANGES

* **ai-model-registry:** Ensure to update any references to the modified model structures in your implementation.
* **ai-model-registry:** Ensure to update any references to the removed api.json in your implementation.

### Features

* **ai-model-registry:** add AIHubMix provider and update model configurations ([3c00caf](https://github.com/anolilab/ai-models/commit/3c00caf6368c24f118cbd765b4ac12cf0c0afed3))
* **ai-model-registry:** add new provider and update model configurations ([ff86548](https://github.com/anolilab/ai-models/commit/ff86548ec782bb8ded318a291a96aaa5332baff3))
* **ai-model-registry:** update release configuration and add TODO for missing providers ([89d47bd](https://github.com/anolilab/ai-models/commit/89d47bd438e77f112aa847b5cd88c4e57987b90d))

## @anolilab/ai-model-registry [3.0.0](https://github.com/anolilab/ai-models/compare/@anolilab/ai-model-registry@2.0.0...@anolilab/ai-model-registry@3.0.0) (2026-01-13)

### ⚠ BREAKING CHANGES

* **ai-model-registry:** See MIGRATION.md

### Features

* **ai-model-registry:** enhance provider integration and update migration guide ([bfd965e](https://github.com/anolilab/ai-models/commit/bfd965e84d8dcf21b5d0423c6625e38782f0d68f))
* **ai-model-registry:** refactor provider loading mechanism ([26c7ccc](https://github.com/anolilab/ai-models/commit/26c7cccc4ebe40873b9ec17855de368b8fafd64b))

### Miscellaneous Chores

* **deps:** update dependencies across multiple packages ([32a60c5](https://github.com/anolilab/ai-models/commit/32a60c51ba1128f1703ef5ae8320af742040c11b))

## @anolilab/ai-model-registry [2.0.0](https://github.com/anolilab/ai-models/compare/@anolilab/ai-model-registry@1.4.0...@anolilab/ai-model-registry@2.0.0) (2026-01-10)

### ⚠ BREAKING CHANGES

* **ai-model-registry:** All API functions are now async

All exported functions now return Promises and must be awaited. This enables
code splitting, dynamic imports, and better performance by loading provider
data on-demand.

Migration:
- getAllModels() → await getAllModels()
- getProviders() → await getProviders()
- getModelsByProvider(provider) → await getModelsByProvider(provider)
- getModelById(id) → await getModelById(id)
- searchModels(criteria) → await searchModels(criteria)
- getProviderStats() → await getProviderStats()

This change enables:
- Code splitting and dynamic imports for better bundle sizes
- On-demand loading of provider data
- Improved tree-shaking capabilities
- Better scalability as the registry grows

Additional changes:
- Provider-specific JSON files generated (public/{provider-name}.json)
- New type exports: @anolilab/ai-model-registry/types/{provider-name}
- api.json still generated but no longer statically imported

### Features

* add new AI model provider configurations and update package structure ([e2badcb](https://github.com/anolilab/ai-models/commit/e2badcbc204be1a3ff14571c12ad2a3bdcac4afc))

### Bug Fixes

* **ai-model-registry:** update tests for async API ([6795524](https://github.com/anolilab/ai-models/commit/67955243f292dee0ae35e411e04081e6409a5c6d))

### Documentation

* **ai-model-registry:** add migration guide for v1 to v2 transition ([e5d9c4b](https://github.com/anolilab/ai-models/commit/e5d9c4bdbb957e184ac04dfe510544c2ed835bff))

## @anolilab/ai-model-registry [1.4.0](https://github.com/anolilab/ai-models/compare/@anolilab/ai-model-registry@1.3.0...@anolilab/ai-model-registry@1.4.0) (2026-01-09)

### Features

* **deps:** update dependencies and improve package configurations ([858afd8](https://github.com/anolilab/ai-models/commit/858afd894ee24e8abe9cbaa5f6d0d00dc76344ae))
* enhance AI model registry with new models and cost normalization ([b64800b](https://github.com/anolilab/ai-models/commit/b64800b47b7523c54652e0385571689e7b268232))
* enhance AI model registry with retirement information and update dependencies ([ec66750](https://github.com/anolilab/ai-models/commit/ec66750f8ca504fe12b3ca372b4051f220f97b05))

### Bug Fixes

* **deps:** update dependency @lobehub/icons-static-svg to ^1.63.0 ([#19](https://github.com/anolilab/ai-models/issues/19)) ([e932ae1](https://github.com/anolilab/ai-models/commit/e932ae18983628ad47abb7538567de6892a129dd))
* enhance AI model registry with new download scripts and cost formatting improvements ([8a6ff27](https://github.com/anolilab/ai-models/commit/8a6ff27697638865062bf1dbadc5395cd203ebd7))
* update API and improve output modality parsing ([36d197a](https://github.com/anolilab/ai-models/commit/36d197aaeb7e4495923428d469c27296b0f4b824))
* update package configurations and enhance README documentation ([4483be1](https://github.com/anolilab/ai-models/commit/4483be12f5a3d7c692e0ad06576e70f681e5e218))

### Miscellaneous Chores

* add Prettier configuration and ignore files ([490f841](https://github.com/anolilab/ai-models/commit/490f841c983064f2143b14e5ebd6b21960aece5e))
* **deps:** update dependencies and package configurations ([b5b2005](https://github.com/anolilab/ai-models/commit/b5b20053824074ccf1981bccb38cc7dd4d1dd228))
* **deps:** update package dependencies and configurations ([1deefef](https://github.com/anolilab/ai-models/commit/1deefef4c1a400b018b687b7c3d4da88f7125ad5))

## @anolilab/ai-model-registry [1.3.0](https://github.com/anolilab/ai-models/compare/@anolilab/ai-model-registry@1.2.3...@anolilab/ai-model-registry@1.3.0) (2025-08-14)

### Features

* update AI model registry with new models and enhance documentation links ([dc06631](https://github.com/anolilab/ai-models/commit/dc066313a223584d60c77622179a431d5c56234c))

### Miscellaneous Chores

* update dependencies and improve package configurations ([26b2a56](https://github.com/anolilab/ai-models/commit/26b2a56cb0cbff477e6c6fa0b7c6260f45cea8da))

## @anolilab/ai-model-registry [1.2.3](https://github.com/anolilab/ai-models/compare/@anolilab/ai-model-registry@1.2.2...@anolilab/ai-model-registry@1.2.3) (2025-08-04)

### Bug Fixes

* update AI model registry data and enhance transformer utilities ([3c5f86e](https://github.com/anolilab/ai-models/commit/3c5f86e1795d31e9890d015e69f0b07cdd0df14f))

## @anolilab/ai-model-registry [1.2.2](https://github.com/anolilab/ai-models/compare/@anolilab/ai-model-registry@1.2.1...@anolilab/ai-model-registry@1.2.2) (2025-08-02)

### Bug Fixes

* streamline model extraction process of upstage ([59cb3c8](https://github.com/anolilab/ai-models/commit/59cb3c821da9053caffbc2b88af4e57f598884b9))

## @anolilab/ai-model-registry [1.2.1](https://github.com/anolilab/ai-models/compare/@anolilab/ai-model-registry@1.2.0...@anolilab/ai-model-registry@1.2.1) (2025-08-02)

### Bug Fixes

* **deps:** update dependency @visulima/packem to v2.0.0-alpha.5 ([cfbe379](https://github.com/anolilab/ai-models/commit/cfbe379145bbe0c31e97bb7f9e42c5911957946c))

## @anolilab/ai-model-registry [1.2.0](https://github.com/anolilab/ai-models/compare/@anolilab/ai-model-registry@1.1.0...@anolilab/ai-model-registry@1.2.0) (2025-08-02)

### Features

* implement Inception model integration and enhance provider registry with new features ([bc814bd](https://github.com/anolilab/ai-models/commit/bc814bd64188c35fee5243fe53aa9aef4e51df1b))

### Bug Fixes

* update Weights & Biases icon mapping and enhance icon generation logic ([80dc219](https://github.com/anolilab/ai-models/commit/80dc219833049ded7b477cd12e954ed9077348ba))

## @anolilab/ai-model-registry [1.1.0](https://github.com/anolilab/ai-models/compare/@anolilab/ai-model-registry@1.0.2...@anolilab/ai-model-registry@1.1.0) (2025-08-02)

### Features

* add new Cerebras and Chutes models to the AI model registry, update API data, and enhance icon handling for improved functionality ([e99ddb7](https://github.com/anolilab/ai-models/commit/e99ddb76cd1ea4a848068a051d565eb0fe4dd33f))
* add Weights & Biases integration with new models, update API data, and enhance provider handling for improved functionality ([670e9f2](https://github.com/anolilab/ai-models/commit/670e9f24234d0fec239dc8e8b4246a58aed822e2))

## @anolilab/ai-model-registry [1.0.2](https://github.com/anolilab/ai-models/compare/@anolilab/ai-model-registry@1.0.1...@anolilab/ai-model-registry@1.0.2) (2025-08-02)

### Bug Fixes

* fixed openAI model registry with new models and enhance existing model attributes for improved functionality ([ed978dc](https://github.com/anolilab/ai-models/commit/ed978dcf1bad8a936097a7be586ab8a17fe854cb))
* update AI model registry data structure and add new scripts for Azure and deep infra models, for better output ([70b895f](https://github.com/anolilab/ai-models/commit/70b895f8d018f662c5782b23cd280350da04f218))

## @anolilab/ai-model-registry [1.0.1](https://github.com/anolilab/ai-models/compare/@anolilab/ai-model-registry@1.0.0...@anolilab/ai-model-registry@1.0.1) (2025-08-01)

### Bug Fixes

* add missing models ([5adc0cf](https://github.com/anolilab/ai-models/commit/5adc0cf64b48675080f199a1229eecac88540dcc))
* streamline build process by removing redundant aggregation steps and updating README for clarity on build commands ([c0b4525](https://github.com/anolilab/ai-models/commit/c0b452541bcae0e6d4c594b012fa70b68a752f52))

## @anolilab/ai-model-registry 1.0.0 (2025-08-01)

### Features

* add configuration files for semantic release and secretlint in ai-model-registry package. Introduce .releaserc.json for release management, .secretlintignore for ignoring specific files, and .secretlintrc.cjs for linting rules. Update package.json to include new dependencies and enhance file inclusion for better package management. ([735acc8](https://github.com/anolilab/ai-models/commit/735acc85d752ecf728b42a3222644807eca85d8c))
* enhance package.json with new build and linting scripts, and add ai-model-registry project configuration. Introduce multiple affected commands for efficient task execution and improve project structure with a dedicated library configuration. ([597c0a5](https://github.com/anolilab/ai-models/commit/597c0a51123f9460e94fab049db410b9561b09c2))
* implement API JSON endpoint for model data and enhance how-to-use dialog. Add Netlify redirect for CDN access, update package.json for new exports, and improve documentation with usage examples and contribution guidelines. ([e784a49](https://github.com/anolilab/ai-models/commit/e784a497b335fe39c922f5f84d8df995d16dc9a7))
* introduce ai-model-registry package with comprehensive model data and icon management. Update build configurations, replace provider-registry references, and add new scripts for data aggregation and transformer handling. Enhance documentation and include various provider icons to improve user experience. ([e4ce11d](https://github.com/anolilab/ai-models/commit/e4ce11d99f3e9b0e28873f807043f8cedec49056))
* update ai-model-registry package with new Cloudflare model integration, enhance semantic release configuration, and improve testing setup. Adjust node version in workflows, refine linting commands, and add new icons for providers. Update package.json and pnpm-lock.yaml for dependency management and ensure consistent model data structure. ([2c7b41a](https://github.com/anolilab/ai-models/commit/2c7b41a5bd8bebfbe3df6ebe582ff22e5a484bbb))
* update ai-model-registry package with new model data, enhance semantic release configuration, and improve how-to-use dialog. Add .npmrc for npm settings, update dependencies in package.json, and introduce new API JSON endpoint for comprehensive model specifications. Refactor scripts for better data aggregation and version management. ([554e945](https://github.com/anolilab/ai-models/commit/554e945c4cc7147cec03e13a670456e9fe3af934))

### Miscellaneous Chores

* update testing scripts in ai-model-registry package.json for improved usability. Add new test commands for UI and watch mode, and simplify existing test commands for better clarity. ([1640314](https://github.com/anolilab/ai-models/commit/1640314034ed6c66ef52cd7b2762023ce1e966ff))
