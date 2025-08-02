"use client";

import type { Model } from "@anolilab/ai-model-registry";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { ProviderIcon } from "@/utils/provider-icons";

interface ModelComparisonDialogProps {
    isOpen: boolean;
    onClose: () => void;
    selectedModels: Array<{
        id: string;
        model: string;
        modelId: string;
        provider: string;
        providerIcon: string | null;
        providerId: string;
        input: string;
        output: string;
        inputCost: string;
        outputCost: string;
        cacheReadCost: string;
        cacheWriteCost: string;
        contextLimit: string;
        outputLimit: string;
        temperature: string;
        weights: string;
        knowledge: string;
        releaseDate: string;
        lastUpdated: string;
        toolCall: string;
        reasoning: string;
    }>;
}

const ModelComparisonDialog = ({ isOpen, onClose, selectedModels }: ModelComparisonDialogProps) => {
    if (selectedModels.length === 0) return null;

    // Define comparison fields with their display names
    const comparisonFields = [
        { key: "provider", label: "Provider", type: "text" },
        { key: "model", label: "Model", type: "text" },
        { key: "input", label: "Input Modalities", type: "text" },
        { key: "output", label: "Output Modalities", type: "text" },
        { key: "inputCost", label: "Input Cost", type: "cost" },
        { key: "outputCost", label: "Output Cost", type: "cost" },
        { key: "cacheReadCost", label: "Cache Read Cost", type: "cost" },
        { key: "contextLimit", label: "Context Limit", type: "text" },
        { key: "outputLimit", label: "Output Limit", type: "text" },
        { key: "temperature", label: "Temperature", type: "boolean" },
        { key: "weights", label: "Weights", type: "text" },
        { key: "knowledge", label: "Knowledge", type: "text" },
        { key: "releaseDate", label: "Release Date", type: "text" },
        { key: "lastUpdated", label: "Last Updated", type: "text" },
        { key: "toolCall", label: "Tool Call", type: "boolean" },
        { key: "reasoning", label: "Reasoning", type: "boolean" },
    ];

    const getFieldValue = (model: typeof selectedModels[0], fieldKey: string) => {
        return model[fieldKey as keyof typeof model] as string;
    };

    const renderFieldValue = (value: string, type: string) => {
        if (type === "boolean") {
            return value === "Yes" ? (
                <Check className="h-4 w-4 text-green-500" />
            ) : (
                <X className="h-4 w-4 text-red-500" />
            );
        }
        if (type === "cost") {
            return value === "-" ? (
                <span className="text-muted-foreground">-</span>
            ) : (
                <span className="font-mono text-sm">{value}</span>
            );
        }
        return value === "-" ? (
            <span className="text-muted-foreground">-</span>
        ) : (
            <span className="text-sm">{value}</span>
        );
    };

    const highlightDifferences = (fieldKey: string) => {
        const values = selectedModels.map(model => getFieldValue(model, fieldKey));
        const uniqueValues = new Set(values);
        return uniqueValues.size > 1;
    };

    const getBestValue = (fieldKey: string) => {
        const values = selectedModels.map(model => getFieldValue(model, fieldKey));
        
        // For cost fields, find the lowest cost
        if (fieldKey.includes('Cost')) {
            const numericValues = values
                .map(v => v === '-' ? Infinity : parseFloat(v.replace(/[^0-9.]/g, '')))
                .filter(v => !isNaN(v));
            if (numericValues.length > 0) {
                const minCost = Math.min(...numericValues);
                return minCost === Infinity ? '-' : `$${minCost.toFixed(4)}`;
            }
        }
        
        // For context/output limits, find the highest limit
        if (fieldKey.includes('Limit')) {
            const numericValues = values
                .map(v => v === '-' ? 0 : parseInt(v.replace(/[^0-9]/g, '')))
                .filter(v => !isNaN(v));
            if (numericValues.length > 0) {
                const maxLimit = Math.max(...numericValues);
                return maxLimit === 0 ? '-' : maxLimit.toLocaleString();
            }
        }
        
        return null;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-7xl max-h-[90vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Model Comparison</DialogTitle>
                    <DialogDescription>
                        Comparing {selectedModels.length} models side-by-side
                    </DialogDescription>
                </DialogHeader>
                
                {/* Summary section */}
                <div className="p-4 bg-muted/50 rounded-lg mb-4 flex-shrink-0">
                    <h3 className="font-medium mb-2">Quick Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground">Lowest Input Cost:</span>
                            <div className="font-mono">{getBestValue('inputCost') || '-'}</div>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Lowest Output Cost:</span>
                            <div className="font-mono">{getBestValue('outputCost') || '-'}</div>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Highest Context Limit:</span>
                            <div className="font-mono">{getBestValue('contextLimit') || '-'}</div>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Highest Output Limit:</span>
                            <div className="font-mono">{getBestValue('outputLimit') || '-'}</div>
                        </div>
                    </div>
                </div>
                
                {/* Scrollable comparison table */}
                <div className="flex-1 overflow-auto min-h-0 relative">
                    <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(200px,1fr))] gap-2 text-sm pb-4">
                        {/* Fade indicator for scrollable content */}
                        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-background to-transparent pointer-events-none z-10"></div>
                        {/* Header row with model names */}
                        <div className="sticky top-0 bg-background z-10 p-2 font-medium border-b shadow-sm">
                            Feature
                        </div>
                        {selectedModels.map((model, index) => (
                            <div key={model.id} className="sticky top-0 bg-background z-10 p-2 border-b shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <ProviderIcon 
                                        provider={model.provider} 
                                        providerIcon={model.providerIcon} 
                                        className="h-4 w-4" 
                                    />
                                    <span className="font-medium text-xs">{model.provider}</span>
                                </div>
                                <div className="text-xs text-muted-foreground truncate" title={model.model}>
                                    {model.model}
                                </div>
                            </div>
                        ))}

                        {/* Comparison rows */}
                        {comparisonFields.map((field) => {
                            const hasDifferences = highlightDifferences(field.key);
                            const bestValue = getBestValue(field.key);
                            
                            return (
                                <div key={field.key} className="contents">
                                    <div className={`p-2 border-b ${hasDifferences ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}`}>
                                        <span className="text-sm font-medium">{field.label}</span>
                                        {hasDifferences && (
                                            <Badge variant="secondary" className="ml-2 text-xs">
                                                Different
                                            </Badge>
                                        )}
                                    </div>
                                    {selectedModels.map((model) => {
                                        const value = getFieldValue(model, field.key);
                                        const isBestValue = bestValue && value === bestValue;
                                        
                                        return (
                                            <div 
                                                key={`${model.id}-${field.key}`} 
                                                className={`p-2 border-b flex items-center ${hasDifferences ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''} ${isBestValue ? 'bg-green-50 dark:bg-green-950/20' : ''}`}
                                            >
                                                {renderFieldValue(value, field.type)}
                                                {isBestValue && (
                                                    <Badge variant="default" className="ml-2 text-xs">
                                                        Best
                                                    </Badge>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ModelComparisonDialog;