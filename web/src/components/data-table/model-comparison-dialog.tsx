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
import { Check, X, Download, FileText, Image, Music, Video, Code, File, Database, Settings } from "lucide-react";
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
            <DialogContent className="w-full md:max-w-[90vw] max-h-[90vh] flex flex-col">
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
                
                {/* Summary section */}
                <div className="p-4 bg-muted/50 rounded-lg mb-4 flex-shrink-0">
                    <h3 className="font-medium mb-2">Quick Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {comparisonFields
                            .filter(field => field.type === "cost" || field.type === "number")
                            .slice(0, 4)
                            .map(field => (
                                <div key={field.id}>
                                    <span className="text-muted-foreground">
                                        {field.type === "cost" ? "Lowest" : "Highest"} {field.displayName}:
                                    </span>
                                    <div className="font-mono">{getBestValue(field.id, field) || '-'}</div>
                                </div>
                            ))}
                    </div>
                </div>
                
                {/* Scrollable comparison table */}
                <div className="flex-1 overflow-auto min-h-0 relative">
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