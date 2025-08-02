"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Check, X, Download, FileText, Image, Music, Video, Code, File, Database, Settings, ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ProviderIcon } from "@/utils/provider-icons";

import type { ModelTableRow, ColumnConfig } from "@/hooks/use-table";
import { getTableColumns, createComparisonConfig, getDefaultComparisonColumns } from "@/hooks/use-table";
import ComparisonConfig from "@/components/ModelTable/ComparisonConfig";

interface ModelComparisonDialogProps {
    isOpen: boolean;
    onClose: () => void;
    selectedModels: ModelTableRow[];
}

const ModelComparisonDialog = ({ isOpen, onClose, selectedModels }: ModelComparisonDialogProps) => {
    const [showConfig, setShowConfig] = useState(false);
    const [comparisonFields, setComparisonFields] = useState<ColumnConfig<ModelTableRow>[]>([]);
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);

    // Get column configurations and create comparison config
    const columnConfigs = getTableColumns();
    const comparisonConfig = createComparisonConfig(columnConfigs, getDefaultComparisonColumns());
    
    // Update comparison fields when config changes
    useEffect(() => {
        if (selectedModels.length === 0) return;
        
        const fields = columnConfigs.filter(config => 
            config.visibility.comparison && comparisonConfig.enabledColumns.includes(config.id)
        );
        setComparisonFields(fields);
    }, [columnConfigs, comparisonConfig.enabledColumns, selectedModels.length]);

    if (selectedModels.length === 0) return null;

    const handleConfigSave = (enabledColumns: string[]) => {
        const fields = columnConfigs.filter(config => 
            config.visibility.comparison && enabledColumns.includes(config.id)
        );
        setComparisonFields(fields);
    };

    const getFieldValue = (model: ModelTableRow, fieldKey: string) => {
        return model[fieldKey as keyof ModelTableRow] as string;
    };

    const renderFieldValue = (value: string, config: ColumnConfig<ModelTableRow>) => {
        // Use the same cell renderers as the table
        if (config.cell) {
            return config.cell({ getValue: () => value });
        }

        // Fallback rendering based on column type
        switch (config.type) {
            case "boolean":
                return value === "Yes" ? (
                    <Check className="h-4 w-4 text-green-500" />
                ) : (
                    <X className="h-4 w-4 text-red-500" />
                );
            case "cost":
                return value === "-" ? (
                    <span className="text-muted-foreground">-</span>
                ) : (
                    <span className="font-mono text-sm">{value}</span>
                );
            case "number":
                return value === "-" ? (
                    <span className="text-muted-foreground">-</span>
                ) : (
                    <span className="text-sm">{value}</span>
                );
            case "date":
                return value === "-" ? (
                    <span className="text-muted-foreground">-</span>
                ) : (
                    <span className="text-sm">{value}</span>
                );
            case "modality":
                // Use the modality cell renderer
                return renderModalityCell({ getValue: () => value });
            default:
                return value === "-" ? (
                    <span className="text-muted-foreground">-</span>
                ) : (
                    <span className="text-sm">{value}</span>
                );
        }
    };

    const renderModalityCell = (props: any) => {
        const modalities = props.getValue();
        const modalityList = modalities.split(",").map((m: string) => m.trim());
        
        return (
            <span className="flex items-center gap-1">
                {modalityList.map((modality: string, index: number) => {
                    const icon = modalityIconMap[modality];
                    
                    if (icon) {
                        return (
                            <span
                                className="border-border text-muted-foreground border px-1 py-0.5"
                                key={`${modality}-${index}`}
                                title={modality.charAt(0).toUpperCase() + modality.slice(1)}
                            >
                                {icon}
                            </span>
                        );
                    }
                    
                    return <span key={`${modality}-${index}`}>{modality}</span>;
                })}
            </span>
        );
    };

    const modalityIconMap: Record<string, React.ReactNode> = {
        text: <FileText className="size-4" />,
        image: <Image className="size-4" />,
        audio: <Music className="size-4" />,
        video: <Video className="size-4" />,
        code: <Code className="size-4" />,
        file: <File className="size-4" />,
        embedding: <Database className="size-4" />,
    };

    const highlightDifferences = (fieldKey: string) => {
        const values = selectedModels.map(model => getFieldValue(model, fieldKey));
        const uniqueValues = new Set(values);
        return uniqueValues.size > 1;
    };

    const getBestValue = (fieldKey: string, config: ColumnConfig<ModelTableRow>) => {
        const values = selectedModels.map(model => getFieldValue(model, fieldKey));
        
        // For cost fields, find the lowest cost
        if (config.type === "cost") {
            const numericValues = values
                .map(v => v === '-' ? Infinity : parseFloat(v.replace(/[^0-9.]/g, '')))
                .filter(v => !isNaN(v));
            if (numericValues.length > 0) {
                const minCost = Math.min(...numericValues);
                return minCost === Infinity ? '-' : `$${minCost.toFixed(4)}`;
            }
        }
        
        // For number fields (like limits), find the highest value
        if (config.type === "number") {
            const numericValues = values
                .map(v => v === '-' ? 0 : parseInt(v.replace(/[^0-9]/g, '')))
                .filter(v => !isNaN(v));
            if (numericValues.length > 0) {
                const maxValue = Math.max(...numericValues);
                return maxValue === 0 ? '-' : maxValue.toLocaleString();
            }
        }
        
        return null;
    };

    const exportComparison = () => {
        const csvData = [
            // Header row
            ["Feature", ...selectedModels.map(model => `${model.provider} - ${model.model}`)],
            // Data rows
            ...comparisonFields.map(field => [
                field.displayName,
                ...selectedModels.map(model => getFieldValue(model, field.id))
            ])
        ];

        const csvContent = csvData.map(row => 
            row.map(cell => `"${cell}"`).join(",")
        ).join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `model-comparison-${selectedModels.length}-models.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-full md:max-w-[90vw] max-h-[90vh] flex flex-col gap-4 pr-2">
                <DialogHeader className="flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle>Model Comparison</DialogTitle>
                            <DialogDescription>
                                Comparing {selectedModels.length} models side-by-side
                            </DialogDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowConfig(true)}
                            className="flex items-center gap-2"
                        >
                            <Settings className="h-4 w-4" />
                            Configure
                        </Button>
                    </div>
                </DialogHeader>
                
                <div className="flex flex-col gap-4 overflow-y-auto scroll-smooth pr-2">
                <Collapsible open={isSummaryExpanded} onOpenChange={setIsSummaryExpanded} className="bg-muted/50 rounded-lg mb-4 flex-shrink-0">
                    <CollapsibleTrigger asChild>
                        <button className="w-full p-4 flex items-center justify-between hover:bg-muted/70 transition-colors rounded-lg">
                            <h3 className="font-medium">Quick Summary</h3>
                            {isSummaryExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                        </button>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="px-4 pb-4">
                    
                    {/* Info text */}
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-2">
                            <div className="text-blue-600 dark:text-blue-400 mt-0.5">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="text-sm text-blue-800 dark:text-blue-200">
                                <p className="font-medium mb-1">Quick Summary Guide</p>
                                <p className="text-xs leading-relaxed">
                                    This summary helps you quickly identify the best models for your needs.{" "}
                                    <strong>Cost Analysis</strong> shows potential savings, <strong>Feature Comparison</strong> displays capability support, 
                                    and <strong>Performance Highlights</strong> reveal the best-in-class metrics. 
                                    Scroll down for detailed side-by-side comparison.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Cost Analysis */}
                    <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Cost Analysis</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            {(() => {
                                const costFields = comparisonFields.filter(field => field.type === "cost");
                                const bestCosts = costFields.map(field => {
                                    const bestValue = getBestValue(field.id, field);
                                    const bestModel = selectedModels.find(model => 
                                        getFieldValue(model, field.id) === bestValue
                                    );
                                    
                                    // Calculate potential savings
                                    const allValues = selectedModels.map(model => {
                                        const value = getFieldValue(model, field.id);
                                        return { model, value, numeric: parseFloat(value.replace(/[^0-9.]/g, '')) || 0 };
                                    }).filter(item => item.numeric > 0);
                                    
                                    const maxCost = Math.max(...allValues.map(item => item.numeric));
                                    const savings = maxCost - (parseFloat(bestValue?.replace(/[^0-9.]/g, '') || '0'));
                                    const savingsPercent = maxCost > 0 ? ((savings / maxCost) * 100).toFixed(0) : 0;
                                    
                                    return { field, bestValue, bestModel, savings, savingsPercent };
                                });
                                
                                return bestCosts.slice(0, 3).map(({ field, bestValue, bestModel, savings, savingsPercent }) => (
                                    <div key={field.id} className="p-2 bg-background rounded border">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-muted-foreground">{field.displayName}:</span>
                                            <div className="text-right">
                                                <div className="font-mono font-medium">{bestValue || '-'}</div>
                                                {bestModel && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {bestModel.provider}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {savings > 0 && (
                                            <div className="text-xs text-green-600 dark:text-green-400">
                                                Save up to {savingsPercent}% vs most expensive
                                            </div>
                                        )}
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>

                    {/* Feature Comparison */}
                    <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Feature Comparison</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            {(() => {
                                // Define key features to check
                                const keyFeatures = [
                                    { id: 'toolCall', name: 'Tool Calling', icon: '🔧' },
                                    { id: 'reasoning', name: 'Reasoning', icon: '🧠' },
                                    { id: 'input', name: 'Text Input', icon: '📝' },
                                    { id: 'output', name: 'Text Output', icon: '📤' }
                                ];
                                
                                return keyFeatures.map(feature => {
                                    const supportedCount = selectedModels.filter(model => {
                                        const value = getFieldValue(model, feature.id);
                                        return value === 'Yes' || value === 'Text' || value === 'true';
                                    }).length;
                                    
                                    const supportPercentage = Math.round((supportedCount / selectedModels.length) * 100);
                                    
                                    return (
                                        <div key={feature.id} className="p-2 bg-background rounded border">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="flex items-center gap-2">
                                                    <span>{feature.icon}</span>
                                                    <span className="text-muted-foreground">{feature.name}:</span>
                                                </span>
                                                <div className="text-right">
                                                    <div className="text-sm font-medium">
                                                        {supportedCount}/{selectedModels.length} models
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {supportPercentage}% support
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-1.5">
                                                <div 
                                                    className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                                                    style={{ width: `${supportPercentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>

                    {/* Performance Highlights */}
                    <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Performance Highlights</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            {(() => {
                                const numberFields = comparisonFields.filter(field => field.type === "number");
                                const highlights = numberFields.slice(0, 4).map(field => {
                                    const values = selectedModels.map(model => {
                                        const value = getFieldValue(model, field.id);
                                        return { model, value, numeric: parseInt(value.replace(/[^0-9]/g, '')) || 0 };
                                    }).filter(item => item.numeric > 0);
                                    
                                    if (values.length === 0) return null;
                                    
                                    const maxValue = Math.max(...values.map(item => item.numeric));
                                    const minValue = Math.min(...values.map(item => item.numeric));
                                    const bestModel = values.find(item => item.numeric === maxValue)?.model;
                                    const improvement = maxValue > minValue ? ((maxValue - minValue) / minValue * 100).toFixed(0) : 0;
                                    
                                    return { field, maxValue, bestModel, improvement };
                                }).filter((item): item is { field: ColumnConfig<ModelTableRow>; maxValue: number; bestModel: ModelTableRow | undefined; improvement: string } => item !== null);
                                
                                return highlights.map(({ field, maxValue, bestModel, improvement }) => (
                                    <div key={field.id} className="p-2 bg-background rounded border">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-muted-foreground">{field.displayName}:</span>
                                            <div className="text-right">
                                                <div className="font-medium">{maxValue.toLocaleString()}</div>
                                                {bestModel && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {bestModel.provider}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {parseFloat(improvement) > 0 && (
                                            <div className="text-xs text-blue-600 dark:text-blue-400">
                                                {improvement}% better than lowest
                                            </div>
                                        )}
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>

                    {/* Model Overview */}
                    <div>
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Model Overview</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div className="p-2 bg-background rounded border">
                                <span className="text-muted-foreground">Total Models:</span>
                                <div className="font-medium">{selectedModels.length}</div>
                            </div>
                            <div className="p-2 bg-background rounded border">
                                <span className="text-muted-foreground">Unique Providers:</span>
                                <div className="font-medium">
                                    {new Set(selectedModels.map(m => m.provider)).size}
                                </div>
                            </div>
                            <div className="p-2 bg-background rounded border">
                                <span className="text-muted-foreground">Fields Compared:</span>
                                <div className="font-medium">{comparisonFields.length}</div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Scroll indicator */}
                    <div className="px-4 pb-2">
                        <div className="text-xs text-muted-foreground text-center">
                            Scroll for more details
                        </div>
                    </div>
                </CollapsibleContent>
                </Collapsible>
                
                {/* Scrollable comparison table */}
                <div className="flex-1 relative">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr>
                                <th className="sticky top-0 left-0 z-30 p-3 text-left font-medium border-b min-w-[200px] shadow-sm bg-background after:absolute after:top-0 after:right-0 after:-bottom-[1px] after:w-[1px] after:bg-border before:absolute before:-bottom-[1px] before:left-0 before:right-0 before:h-[1px] before:bg-border">
                                    Feature
                                </th>
                                {selectedModels.map((model) => (
                                    <th key={model.id} className={`sticky top-0 z-20 p-3 text-left font-medium border-b min-w-[200px] shadow-sm bg-background after:absolute after:-bottom-[1px] after:left-0 after:right-0 after:h-[1px] after:bg-border ${selectedModels.indexOf(model) < selectedModels.length - 1 ? 'before:absolute before:top-0 before:right-0 before:bottom-0 before:w-[1px] before:bg-border' : ''}`}>
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
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {comparisonFields.map((field) => {
                                const hasDifferences = highlightDifferences(field.id);
                                const bestValue = getBestValue(field.id, field);
                                const shouldHighlight = field.comparison?.highlightDifferences !== false;
                                
                                return (
                                    <tr key={field.id}>
                                        <td className="sticky left-0 z-20 p-3 border-b shadow-sm bg-background after:absolute after:top-0 after:right-0 after:bottom-0 after:w-[1px] after:bg-border">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">{field.displayName}</span>
                                                {hasDifferences && shouldHighlight && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Different
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        {selectedModels.map((model) => {
                                            const value = getFieldValue(model, field.id);
                                            const isBestValue = bestValue && value === bestValue;
                                            
                                            return (
                                                <td 
                                                    key={`${model.id}-${field.id}`} 
                                                    className={`p-3 border-b ${hasDifferences && shouldHighlight ? 'bg-yellow-50 dark:bg-yellow-950/20' : 'bg-background'} ${isBestValue ? 'bg-green-50 dark:bg-green-950/20' : ''} before:absolute before:-bottom-[1px] before:left-0 before:right-0 before:h-[1px] before:bg-border ${selectedModels.indexOf(model) < selectedModels.length - 1 ? 'after:absolute after:top-0 after:right-0 after:bottom-0 after:w-[1px] after:bg-border' : ''} relative`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {renderFieldValue(value, field)}
                                                        {isBestValue && (
                                                            <Badge variant="default" className="text-xs">
                                                                Best
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                </div>

                <div className="flex justify-between items-center gap-2 pt-4 border-t flex-shrink-0">
                    <div className="text-sm text-muted-foreground">
                        {comparisonFields.length} comparison fields
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={exportComparison}>
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                        </Button>
                        <Button variant="outline" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>

            {/* Comparison Configuration Modal */}
            <ComparisonConfig
                isOpen={showConfig}
                onClose={() => setShowConfig(false)}
                onSave={handleConfigSave}
                currentConfig={comparisonConfig.enabledColumns}
            />
        </Dialog>
    );
};

export default ModelComparisonDialog;