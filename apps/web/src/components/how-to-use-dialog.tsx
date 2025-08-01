import { ExternalLink, Github, Package } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const HowToUseDialog = () => {
    const [open, setOpen] = useState(false);

    return (
        <Dialog onOpenChange={setOpen} open={open}>
            <DialogTrigger asChild>
                <Button className="bg-[var(--color-brand)] px-3 py-2 text-sm text-[var(--color-text-invert)]" id="help">
                    How to use
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] flex flex-col" style={{ maxWidth: "896px" }}>
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">How to use</DialogTitle>
                    <DialogDescription className="text-base">
                        AI Models is a comprehensive open-source database of AI model specifications, pricing, and features.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 overflow-y-auto flex-1 pr-2">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">About</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            AI Models is a comprehensive, open-source database that automates the collection and organization of AI model metadata from 25+ providers.
                            We solve the problem of scattered model information by providing a unified, always-up-to-date source of model specifications, pricing, and features.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2">Quick Start</h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm font-medium mb-1">API Endpoints:</p>
                                <div className="space-y-2">
                                    <div className="bg-muted p-3 rounded-md font-mono text-sm">
                                        curl https://unpkg.com/@anolilab/ai-model-registry/api.json
                                    </div>
                                    <div className="bg-muted p-3 rounded-md font-mono text-sm">
                                        curl https://ai-models.anolilab.com/api.json
                                    </div>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium mb-1">NPM Package:</p>
                                <div className="bg-muted p-3 rounded-md font-mono text-sm">
                                    npm install @anolilab/ai-model-registry
                                </div>
                            </div>
                        </div>
                        <div className="mt-2 flex gap-2">
                            <Button asChild size="sm" variant="outline">
                                <a href="https://unpkg.com/@anolilab/ai-model-registry/api.json" rel="noopener noreferrer" target="_blank">
                                    <Package className="mr-2 h-4 w-4" />
                                    Unpkg API
                                    <ExternalLink className="ml-2 h-3 w-3" />
                                </a>
                            </Button>
                            <Button asChild size="sm" variant="outline">
                                <a href="https://ai-models.anolilab.com/api.json" rel="noopener noreferrer" target="_blank">
                                    <Package className="mr-2 h-4 w-4" />
                                    Custom API
                                    <ExternalLink className="ml-2 h-3 w-3" />
                                </a>
                            </Button>
                            <Button asChild size="sm" variant="outline">
                                <a href="https://www.npmjs.com/package/@anolilab/ai-model-registry" rel="noopener noreferrer" target="_blank">
                                    <Package className="mr-2 h-4 w-4" />
                                    View on NPM
                                    <ExternalLink className="ml-2 h-3 w-3" />
                                </a>
                            </Button>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2">Usage Examples</h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm font-medium mb-1">JavaScript/TypeScript:</p>
                                <div className="bg-muted p-3 rounded-md font-mono text-sm">
                                    import {`{ getAllModels, getModelById }`} from '@anolilab/ai-model-registry';
                                    <br />
                                    <br />
                                    // Get all models
                                    <br />
                                    const allModels = getAllModels();
                                    <br />
                                    <br />
                                    // Get specific model by ID
                                    <br />
                                    const model = getModelById('gpt-4');
                                    <br />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium mb-1">API Response:</p>
                                <div className="bg-muted p-3 rounded-md font-mono text-sm">
                                    {`{
  "models": [...],
  "metadata": {
    "totalModels": 1676,
    "totalProviders": 25,
    "lastUpdated": "2024-01-XX...",
    "version": "1.0.0"
  }
}`}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2">Features</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-muted p-3 rounded-md">
                                <div className="font-semibold">1,676+ Models</div>
                                <div className="text-muted-foreground">Comprehensive coverage</div>
                            </div>
                            <div className="bg-muted p-3 rounded-md">
                                <div className="font-semibold">25+ Providers</div>
                                <div className="text-muted-foreground">Major AI platforms</div>
                            </div>
                            <div className="bg-muted p-3 rounded-md">
                                <div className="font-semibold">Pricing Data</div>
                                <div className="text-muted-foreground">285+ models with costs</div>
                            </div>
                            <div className="bg-muted p-3 rounded-md">
                                <div className="font-semibold">Auto-Updated</div>
                                <div className="text-muted-foreground">Daily aggregation</div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2">Data Included</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>Model specifications (context limits, modalities)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>Pricing information (input/output costs)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>Provider metadata and icons</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>Release dates and last updated timestamps</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>Model capabilities (tool calling, reasoning)</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2">Contribute</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                            This is a community-driven project. Help us keep the data accurate and up-to-date by contributing to our GitHub repository.
                        </p>
                        <div className="flex gap-2">
                            <Button asChild size="sm" variant="outline">
                                <a href="https://github.com/anolilab/ai-models" rel="noopener noreferrer" target="_blank">
                                    <Github className="mr-2 h-4 w-4" />
                                    View on GitHub
                                    <ExternalLink className="ml-2 h-3 w-3" />
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
