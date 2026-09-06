"use client";

import { RotateCcw, Save, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ColumnConfig, ModelTableRow } from "@/hooks/use-table";
import { getDefaultComparisonColumns, getTableColumns } from "@/hooks/use-table";

interface ComparisonConfigProps {
    currentConfig?: string[];
    isOpen: boolean;
    onClose: () => void;
    onSave: (enabledColumns: string[]) => void;
}

const ComparisonConfig = ({ currentConfig, isOpen, onClose, onSave }: ComparisonConfigProps) => {
    const [enabledColumns, setEnabledColumns] = useState<string[]>([]);
    const [hasChanges, setHasChanges] = useState(false);

    // Use localStorage hook for comparison config
    const [savedConfig, setSavedConfig, removeSavedConfig] = useLocalStorage<string[]>("model-comparison-config", []);

    // Get column configurations
    const columnConfigs = getTableColumns();
    const comparisonFields = columnConfigs.filter((config) => config.visibility.comparison);

    // Group fields by their column group
    const groupedFields = comparisonFields.reduce(
        (groups, field) => {
            const { group } = field;

            if (!groups[group]) {
                groups[group] = [];
            }

            groups[group].push(field);

            return groups;
        },
        {} as Record<string, ColumnConfig<ModelTableRow>[]>,
    );

    useEffect(() => {
        // Load saved config from localStorage, fallback to current config or defaults
        const initialConfig = savedConfig.length > 0 ? savedConfig : currentConfig || getDefaultComparisonColumns();

        setEnabledColumns(initialConfig);
        setHasChanges(false);
    }, [currentConfig, isOpen, savedConfig]);

    const handleToggleField = (fieldId: string) => {
        setEnabledColumns((prev) => {
            const newConfig = prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId];

            setHasChanges(true);

            return newConfig;
        });
    };

    const handleToggleGroup = (group: string) => {
        const groupFields = groupedFields[group] || [];
        const groupFieldIds = groupFields.map((field) => field.id);
        const allGroupEnabled = groupFieldIds.every((id) => enabledColumns.includes(id));

        setEnabledColumns((prev) => {
            const newConfig = allGroupEnabled ? prev.filter((id) => !groupFieldIds.includes(id)) : [...new Set([...groupFieldIds, ...prev])];

            setHasChanges(true);

            return newConfig;
        });
    };

    const handleReset = () => {
        const defaultConfig = getDefaultComparisonColumns();

        setEnabledColumns(defaultConfig);
        setHasChanges(true);
        // Note: localStorage is only cleared when user clicks "Save"
    };

    const handleSave = () => {
        // Check if we're resetting to defaults
        const defaultConfig = getDefaultComparisonColumns();
        const isResettingToDefaults = JSON.stringify(enabledColumns.sort()) === JSON.stringify(defaultConfig.sort());

        if (isResettingToDefaults) {
            // Clear saved config from localStorage
            removeSavedConfig();
        } else {
            // Save to localStorage
            setSavedConfig(enabledColumns);
        }

        // Call the parent's onSave callback
        onSave(enabledColumns);
        setHasChanges(false);
        onClose();
    };

    const getGroupDisplayName = (group: string) => {
        switch (group) {
            case "basic":
                return "Basic Information";
            case "capabilities":
                return "Capabilities";
            case "costs":
                return "Costs";
            case "limits":
                return "Limits";
            case "metadata":
                return "Metadata";
            default:
                return group.charAt(0).toUpperCase() + group.slice(1);
        }
    };

    const getFieldTypeBadge = (type: string) => {
        const typeColors = {
            boolean: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
            cost: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
            date: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
            modality: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
            number: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
            text: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        };

        return (
            <Badge className={`text-xs ${typeColors[type as keyof typeof typeColors] || typeColors.text}`} variant="secondary">
                {type}
            </Badge>
        );
    };

    return (
        <Dialog onOpenChange={onClose} open={isOpen}>
            <DialogContent className="flex max-h-[95vh] w-full flex-col sm:max-w-2xl" showCloseButton={false}>
                <DialogHeader className="flex-shrink-0">
                    <div>
                        <DialogTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Comparison Configuration
                        </DialogTitle>
                        <DialogDescription>Select which fields to include in model comparisons</DialogDescription>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">
                    <div className="divide-border flex flex-col divide-y">
                        {Object.entries(groupedFields).map(([group, fields]) => {
                            const groupFieldIds = fields.map((field) => field.id);
                            const enabledCount = groupFieldIds.filter((id) => enabledColumns.includes(id)).length;
                            const totalCount = groupFieldIds.length;

                            return (
                                <div className="py-6 first:pt-0 last:pb-0" key={group}>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Checkbox checked={enabledCount === totalCount} onCheckedChange={() => handleToggleGroup(group)} />
                                                <h3 className="font-medium">{getGroupDisplayName(group)}</h3>
                                                <Badge className="text-xs" variant="outline">
                                                    {enabledCount}/{totalCount}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="ml-6 grid grid-cols-1 gap-2 md:grid-cols-2">
                                            {fields.map((field) => (
                                                <div className="flex items-center gap-3 border p-2" key={field.id}>
                                                    <Checkbox checked={enabledColumns.includes(field.id)} onCheckedChange={() => handleToggleField(field.id)} />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="truncate text-sm font-medium">{field.displayName}</span>
                                                            {getFieldTypeBadge(field.type)}
                                                        </div>
                                                        {field.metadata?.description && (
                                                            <p className="text-muted-foreground truncate text-xs">{field.metadata.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-shrink-0 justify-end gap-2 border-t pt-4">
                    {(() => {
                        const defaultConfig = getDefaultComparisonColumns();
                        const isSameAsDefaults = JSON.stringify(enabledColumns.sort()) === JSON.stringify(defaultConfig.sort());

                        return !isSameAsDefaults
                            ? (
                            <Button onClick={handleReset} variant="outline">
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Reset
                            </Button>
                            )
                            : null;
                    })()}
                    <Button onClick={onClose} variant="outline">
                        Cancel
                    </Button>
                    <Button disabled={!hasChanges} onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ComparisonConfig;
