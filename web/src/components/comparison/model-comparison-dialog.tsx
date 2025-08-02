"use client";

import { Check, ChevronDown, ChevronRight, Code, Database, File, FileText, Image, Music, Settings, Video, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";

import ComparisonConfig from "@/components/comparison/comparison-config-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import DataExport from "@/components/ui/data-export";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ColumnConfig, ModelTableRow } from "@/hooks/use-table";
import { createComparisonConfig, getDefaultComparisonColumns, getTableColumns } from "@/hooks/use-table";
import { ProviderIcon } from "@/utils/provider-icons";

interface ModelComparisonDialogProps {
    isOpen: boolean;
    onClose: () => void;
    selectedModels: ModelTableRow[];
}

const ModelComparisonDialog = ({ isOpen, onClose, selectedModels }: ModelComparisonDialogProps) => {
    const [showConfig, setShowConfig] = useState(false);
    const [comparisonFields, setComparisonFields] = useState<ColumnConfig<ModelTableRow>[]>([]);
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);

    // Use localStorage hook for comparison config
    const [savedConfig, setSavedConfig] = useLocalStorage<string[]>("model-comparison-config", []);

    // Get column configurations and create comparison config
    const columnConfigs = getTableColumns();
    const comparisonConfig = createComparisonConfig(columnConfigs, savedConfig.length > 0 ? savedConfig : getDefaultComparisonColumns());

    // Update comparison fields when config changes
    useEffect(() => {
        if (selectedModels.length === 0)
            return;

        const fields = columnConfigs.filter((config) => config.visibility.comparison && comparisonConfig.enabledColumns.includes(config.id));

        setComparisonFields(fields);
    }, [columnConfigs, comparisonConfig.enabledColumns, selectedModels.length]);

    if (selectedModels.length === 0)
        return null;

    const handleConfigSave = (enabledColumns: string[]) => {
        // Save to localStorage
        setSavedConfig(enabledColumns);

        // Update the comparison fields
        const fields = columnConfigs.filter((config) => config.visibility.comparison && enabledColumns.includes(config.id));

        setComparisonFields(fields);
    };

    const getFieldValue = (model: ModelTableRow, fieldKey: string) => model[fieldKey as keyof ModelTableRow] as string;

    const renderFieldValue = (value: string, config: ColumnConfig<ModelTableRow>) => {
        // Use the same cell renderers as the table
        if (config.cell) {
            return config.cell({ getValue: () => value });
        }

        // Fallback rendering based on column type
        switch (config.type) {
            case "boolean":
                return value === "Yes" ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />;
            case "cost":
                return value === "-" ? <span className="text-muted-foreground">-</span> : <span className="font-mono text-sm">{value}</span>;
            case "date":
                return value === "-" ? <span className="text-muted-foreground">-</span> : <span className="text-sm">{value}</span>;
            case "modality":
                // Use the modality cell renderer
                return renderModalityCell({ getValue: () => value });
            case "number":
                return value === "-" ? <span className="text-muted-foreground">-</span> : <span className="text-sm">{value}</span>;
            default:
                return value === "-" ? <span className="text-muted-foreground">-</span> : <span className="text-sm">{value}</span>;
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
        audio: <Music className="size-4" />,
        code: <Code className="size-4" />,
        embedding: <Database className="size-4" />,
        file: <File className="size-4" />,
        image: <Image className="size-4" />,
        text: <FileText className="size-4" />,
        video: <Video className="size-4" />,
    };

    const highlightDifferences = (fieldKey: string) => {
        const values = selectedModels.map((model) => getFieldValue(model, fieldKey));
        const uniqueValues = new Set(values);

        return uniqueValues.size > 1;
    };

    const getBestValue = (fieldKey: string, config: ColumnConfig<ModelTableRow>) => {
        const values = selectedModels.map((model) => getFieldValue(model, fieldKey));

        // For cost fields, find the lowest cost
        if (config.type === "cost") {
            const numericValues = values.map((v) => (v === "-" ? Infinity : parseFloat(v.replace(/[^0-9.]/g, "")))).filter((v) => !isNaN(v));

            if (numericValues.length > 0) {
                const minCost = Math.min(...numericValues);

                return minCost === Infinity ? "-" : `$${minCost.toFixed(4)}`;
            }
        }

        // For number fields (like limits), find the highest value
        if (config.type === "number") {
            const numericValues = values.map((v) => (v === "-" ? 0 : parseInt(v.replace(/\D/g, "")))).filter((v) => !isNaN(v));

            if (numericValues.length > 0) {
                const maxValue = Math.max(...numericValues);

                return maxValue === 0 ? "-" : maxValue.toLocaleString();
            }
        }

        return null;
    };

    const getExportData = () => comparisonFields.map((field) => {
        const row: any = {
            Feature: field.displayName,
        };

        selectedModels.forEach((model) => {
            const value = getFieldValue(model, field.id);

            row[`${model.provider} - ${model.model}`] = value;
        });

        return row;
    });

    return (
        <Dialog onOpenChange={onClose} open={isOpen}>
            <DialogContent className="flex max-h-[90vh] w-full flex-col gap-4 pr-2 md:max-w-[90vw]">
                <DialogHeader className="flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle>Model Comparison</DialogTitle>
                            <DialogDescription>Comparing {selectedModels.length} models side-by-side</DialogDescription>
                        </div>
                        <Button className="flex cursor-pointer items-center gap-2" onClick={() => setShowConfig(true)} type="button" variant="outline">
                            <Settings className="h-4 w-4" />
                            Configure
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex flex-col gap-4 overflow-y-auto scroll-smooth pr-2">
                    <Collapsible className="bg-muted/50 mb-4 flex-shrink-0 rounded-lg" onOpenChange={setIsSummaryExpanded} open={isSummaryExpanded}>
                        <CollapsibleTrigger asChild>
                            <button className="hover:bg-muted/70 flex w-full items-center justify-between rounded-lg p-4 transition-colors">
                                <h3 className="font-medium">Quick Summary</h3>
                                {isSummaryExpanded
                                    ? (
                                    <ChevronDown className="text-muted-foreground h-4 w-4" />
                                    )
                                    : (
                                    <ChevronRight className="text-muted-foreground h-4 w-4" />
                                    )}
                            </button>
                        </CollapsibleTrigger>

                        <CollapsibleContent className="px-4 pb-4">
                            {/* Info text */}
                            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/20">
                                <div className="flex items-start gap-2">
                                    <div className="mt-0.5 text-blue-600 dark:text-blue-400">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                            />
                                        </svg>
                                    </div>
                                    <div className="text-sm text-blue-800 dark:text-blue-200">
                                        <p className="mb-1 font-medium">Quick Summary Guide</p>
                                        <p className="text-xs leading-relaxed">
                                            This summary helps you quickly identify the best models for your needs. <strong>Cost Analysis</strong> shows
                                            potential savings, <strong>Feature Comparison</strong> displays capability support, and{" "}
                                            <strong>Performance Highlights</strong> reveal the best-in-class metrics. Scroll down for detailed side-by-side
                                            comparison.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Cost Analysis */}
                            <div className="mb-4">
                                <h4 className="text-muted-foreground mb-2 text-sm font-medium">Cost Analysis</h4>
                                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                                    {(() => {
                                        const costFields = comparisonFields.filter((field) => field.type === "cost");
                                        const bestCosts = costFields.map((field) => {
                                            const bestValue = getBestValue(field.id, field);
                                            const bestModel = selectedModels.find((model) => getFieldValue(model, field.id) === bestValue);

                                            // Calculate potential savings
                                            const allValues = selectedModels
                                                .map((model) => {
                                                    const value = getFieldValue(model, field.id);

                                                    return { model, numeric: parseFloat(value.replace(/[^0-9.]/g, "")) || 0, value };
                                                })
                                                .filter((item) => item.numeric > 0);

                                            const maxCost = Math.max(...allValues.map((item) => item.numeric));
                                            const savings = maxCost - parseFloat(bestValue?.replace(/[^0-9.]/g, "") || "0");
                                            const savingsPercent = maxCost > 0 ? ((savings / maxCost) * 100).toFixed(0) : 0;

                                            return { bestModel, bestValue, field, savings, savingsPercent };
                                        });

                                        return bestCosts.slice(0, 3).map(({ bestModel, bestValue, field, savings, savingsPercent }) => (
                                            <div className="bg-background rounded border p-2" key={field.id}>
                                                <div className="mb-1 flex items-center justify-between">
                                                    <span className="text-muted-foreground">{field.displayName}:</span>
                                                    <div className="text-right">
                                                        <div className="font-mono font-medium">{bestValue || "-"}</div>
                                                        {bestModel && <div className="text-muted-foreground text-xs">{bestModel.provider}</div>}
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
                                <h4 className="text-muted-foreground mb-2 text-sm font-medium">Feature Comparison</h4>
                                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                                    {(() => {
                                        // Define key features to check
                                        const keyFeatures = [
                                            { icon: "🔧", id: "toolCall", name: "Tool Calling" },
                                            { icon: "🧠", id: "reasoning", name: "Reasoning" },
                                            { icon: "📝", id: "input", name: "Text Input" },
                                            { icon: "📤", id: "output", name: "Text Output" },
                                        ];

                                        return keyFeatures.map((feature) => {
                                            const supportedCount = selectedModels.filter((model) => {
                                                const value = getFieldValue(model, feature.id);

                                                return value === "Yes" || value === "Text" || value === "true";
                                            }).length;

                                            const supportPercentage = Math.round((supportedCount / selectedModels.length) * 100);

                                            return (
                                                <div className="bg-background rounded border p-2" key={feature.id}>
                                                    <div className="mb-1 flex items-center justify-between">
                                                        <span className="flex items-center gap-2">
                                                            <span>{feature.icon}</span>
                                                            <span className="text-muted-foreground">{feature.name}:</span>
                                                        </span>
                                                        <div className="text-right">
                                                            <div className="text-sm font-medium">
                                                                {supportedCount}/{selectedModels.length} models
                                                            </div>
                                                            <div className="text-muted-foreground text-xs">{supportPercentage}% support</div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-muted h-1.5 w-full rounded-full">
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
                                <h4 className="text-muted-foreground mb-2 text-sm font-medium">Performance Highlights</h4>
                                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                                    {(() => {
                                        const numberFields = comparisonFields.filter((field) => field.type === "number");
                                        const highlights = numberFields
                                            .slice(0, 4)
                                            .map((field) => {
                                                const values = selectedModels
                                                    .map((model) => {
                                                        const value = getFieldValue(model, field.id);

                                                        return { model, numeric: parseInt(value.replace(/\D/g, "")) || 0, value };
                                                    })
                                                    .filter((item) => item.numeric > 0);

                                                if (values.length === 0)
                                                    return null;

                                                const maxValue = Math.max(...values.map((item) => item.numeric));
                                                const minValue = Math.min(...values.map((item) => item.numeric));
                                                const bestModel = values.find((item) => item.numeric === maxValue)?.model;
                                                const improvement = maxValue > minValue ? (((maxValue - minValue) / minValue) * 100).toFixed(0) : 0;

                                                return { bestModel, field, improvement, maxValue };
                                            })
                                            .filter(
                                                (
                                                    item,
                                                ): item is {
                                                    bestModel: ModelTableRow | undefined;
                                                    field: ColumnConfig<ModelTableRow>;
                                                    improvement: string;
                                                    maxValue: number;
                                                } => item !== null,
                                            );

                                        return highlights.map(({ bestModel, field, improvement, maxValue }) => (
                                            <div className="bg-background rounded border p-2" key={field.id}>
                                                <div className="mb-1 flex items-center justify-between">
                                                    <span className="text-muted-foreground">{field.displayName}:</span>
                                                    <div className="text-right">
                                                        <div className="font-medium">{maxValue.toLocaleString()}</div>
                                                        {bestModel && <div className="text-muted-foreground text-xs">{bestModel.provider}</div>}
                                                    </div>
                                                </div>
                                                {parseFloat(improvement) > 0 && (
                                                    <div className="text-xs text-blue-600 dark:text-blue-400">{improvement}% better than lowest</div>
                                                )}
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>

                            {/* Model Overview */}
                            <div>
                                <h4 className="text-muted-foreground mb-2 text-sm font-medium">Model Overview</h4>
                                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                                    <div className="bg-background rounded border p-2">
                                        <span className="text-muted-foreground">Total Models:</span>
                                        <div className="font-medium">{selectedModels.length}</div>
                                    </div>
                                    <div className="bg-background rounded border p-2">
                                        <span className="text-muted-foreground">Unique Providers:</span>
                                        <div className="font-medium">{new Set(selectedModels.map((m) => m.provider)).size}</div>
                                    </div>
                                    <div className="bg-background rounded border p-2">
                                        <span className="text-muted-foreground">Fields Compared:</span>
                                        <div className="font-medium">{comparisonFields.length}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Scroll indicator */}
                            <div className="px-4 pb-2">
                                <div className="text-muted-foreground text-center text-xs">Scroll for more details</div>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>

                    {/* Scrollable comparison table */}
                    <div className="relative flex-1">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr>
                                    <th className="bg-background after:bg-border before:bg-border sticky top-0 left-0 z-30 min-w-[200px] border-b p-3 text-left font-medium shadow-sm before:absolute before:right-0 before:-bottom-[1px] before:left-0 before:h-[1px] after:absolute after:top-0 after:right-0 after:-bottom-[1px] after:w-[1px]">
                                        Feature
                                    </th>
                                    {selectedModels.map((model) => (
                                        <th
                                            className={`bg-background after:bg-border sticky top-0 z-20 min-w-[200px] border-b p-3 text-left font-medium shadow-sm after:absolute after:right-0 after:-bottom-[1px] after:left-0 after:h-[1px] ${selectedModels.indexOf(model) < selectedModels.length - 1 ? "before:bg-border before:absolute before:top-0 before:right-0 before:bottom-0 before:w-[1px]" : ""}`}
                                            key={model.id}
                                        >
                                            <div className="mb-2 flex items-center gap-2">
                                                <ProviderIcon className="h-4 w-4" provider={model.provider} providerIcon={model.providerIcon} />
                                                <span className="text-xs font-medium">{model.provider}</span>
                                            </div>
                                            <div className="text-muted-foreground truncate text-xs" title={model.model}>
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
                                            <td className="bg-background after:bg-border sticky left-0 z-20 border-b p-3 shadow-sm after:absolute after:top-0 after:right-0 after:bottom-0 after:w-[1px]">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">{field.displayName}</span>
                                                    {hasDifferences && shouldHighlight && (
                                                        <Badge className="text-xs" variant="secondary">
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
                                                        className={`border-b p-3 ${hasDifferences && shouldHighlight ? "bg-yellow-50 dark:bg-yellow-950/20" : "bg-background"} ${isBestValue ? "bg-green-50 dark:bg-green-950/20" : ""} before:bg-border before:absolute before:right-0 before:-bottom-[1px] before:left-0 before:h-[1px] ${selectedModels.indexOf(model) < selectedModels.length - 1 ? "after:bg-border after:absolute after:top-0 after:right-0 after:bottom-0 after:w-[1px]" : ""} relative`}
                                                        key={`${model.id}-${field.id}`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {renderFieldValue(value, field)}
                                                            {isBestValue && (
                                                                <Badge className="text-xs" variant="default">
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

                <div className="flex flex-shrink-0 items-center justify-between gap-2 border-t pt-4">
                    <div className="text-muted-foreground text-sm">{comparisonFields.length} comparison fields</div>
                    <div className="flex gap-2">
                        <DataExport data={getExportData()} filename={`model-comparison-${selectedModels.length}-models`} variant="outline" />
                        <Button onClick={onClose} variant="outline">
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>

            {/* Comparison Configuration Modal */}
            {showConfig && (
                <ComparisonConfig
                    currentConfig={comparisonConfig.enabledColumns}
                    isOpen={showConfig}
                    onClose={() => setShowConfig(false)}
                    onSave={handleConfigSave}
                />
            )}
        </Dialog>
    );
};

export default ModelComparisonDialog;
