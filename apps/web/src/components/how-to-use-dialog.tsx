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
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
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
                            There's no single database with information about all the available AI models. We started AI Models as a community-contributed project to address this gap. 
                            This project automates the fetching and organization of AI model metadata from various providers, ensuring that model information is always current and organized.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2">NPM Package</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                            You can access this data through our NPM package for easy integration into your projects.
                        </p>
                        <div className="bg-muted p-3 rounded-md font-mono text-sm">
                            npm install @anolilab/ai-model-registry
                        </div>
                        <div className="mt-2">
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
                        <h3 className="text-lg font-semibold mb-2">Usage</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                            Use the Model ID field to do a lookup on any model; it's the identifier used by AI SDK and other tools.
                        </p>
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
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2">Contribute</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                            The data is stored in the GitHub repository as structured JSON files, organized by provider and model. 
                            This is used to generate this page and power the NPM package.
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                            We need your help keeping this up to date. Feel free to contribute by improving the data transformers, 
                            adding new providers, or submitting pull requests. Refer to the README for more information.
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

                    <div>
                        <h3 className="text-lg font-semibold mb-2">Current Status</h3>
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
                                <div className="font-semibold">Open Source</div>
                                <div className="text-muted-foreground">Community driven</div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}; 