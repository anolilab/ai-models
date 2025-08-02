"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Settings, Save, RotateCcw } from "lucide-react";

import type { ColumnConfig, ModelTableRow } from "@/hooks/use-table";
import { getTableColumns, getDefaultComparisonColumns } from "@/hooks/use-table";

interface ComparisonConfigProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (enabledColumns: string[]) => void;
    currentConfig?: string[];
}

const ComparisonConfig = ({ isOpen, onClose, onSave, currentConfig }: ComparisonConfigProps) => {
    const [enabledColumns, setEnabledColumns] = useState<string[]>([]);
    const [hasChanges, setHasChanges] = useState(false);

    // Get column configurations
    const columnConfigs = getTableColumns();
    const comparisonFields = columnConfigs.filter(config => config.visibility.comparison);

    // Group fields by their column group
    const groupedFields = comparisonFields.reduce((groups, field) => {
        const group = field.group;
        if (!groups[group]) {
            groups[group] = [];
        }
        groups[group].push(field);
        return groups;
    }, {} as Record<string, ColumnConfig<ModelTableRow>[]>);

    useEffect(() => {
        // Initialize with current config or defaults
        const initialConfig = currentConfig || getDefaultComparisonColumns();
        setEnabledColumns(initialConfig);
        setHasChanges(false);
    }, [currentConfig, isOpen]);

    const handleToggleField = (fieldId: string) => {
        setEnabledColumns(prev => {
            const newConfig = prev.includes(fieldId)
                ? prev.filter(id => id !== fieldId)
                : [...prev, fieldId];
            setHasChanges(true);
            return newConfig;
        });
    };

    const handleToggleGroup = (group: string) => {
        const groupFields = groupedFields[group] || [];
        const groupFieldIds = groupFields.map(field => field.id);
        const allGroupEnabled = groupFieldIds.every(id => enabledColumns.includes(id));

        setEnabledColumns(prev => {
            const newConfig = allGroupEnabled
                ? prev.filter(id => !groupFieldIds.includes(id))
                : [...new Set([...prev, ...groupFieldIds])];
            setHasChanges(true);
            return newConfig;
        });
    };

    const handleReset = () => {
        const defaultConfig = getDefaultComparisonColumns();
        setEnabledColumns(defaultConfig);
        setHasChanges(true);
    };

    const handleSave = () => {
        onSave(enabledColumns);
        setHasChanges(false);
        onClose();
    };

    const getGroupDisplayName = (group: string) => {
        switch (group) {
            case "basic": return "Basic Information";
            case "capabilities": return "Capabilities";
            case "costs": return "Costs";
            case "limits": return "Limits";
            case "metadata": return "Metadata";
            default: return group.charAt(0).toUpperCase() + group.slice(1);
        }
    };

    const getFieldTypeBadge = (type: string) => {
        const typeColors = {
            text: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
            number: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
            cost: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
            boolean: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
            date: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
            modality: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
        };

        return (
            <Badge variant="secondary" className={`text-xs ${typeColors[type as keyof typeof typeColors] || typeColors.text}`}>
                {type}
            </Badge>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
                <CardHeader className="flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Comparison Configuration
                            </CardTitle>
                            <CardDescription>
                                Select which fields to include in model comparisons
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleReset}>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Reset
                            </Button>
                            <Button variant="outline" size="sm" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button 
                                size="sm" 
                                onClick={handleSave}
                                disabled={!hasChanges}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Save
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-auto">
                    <div className="space-y-6">
                        {Object.entries(groupedFields).map(([group, fields]) => {
                            const groupFieldIds = fields.map(field => field.id);
                            const enabledCount = groupFieldIds.filter(id => enabledColumns.includes(id)).length;
                            const totalCount = groupFieldIds.length;

                            return (
                                <div key={group} className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                checked={enabledCount === totalCount}
                                                indeterminate={enabledCount > 0 && enabledCount < totalCount}
                                                onCheckedChange={() => handleToggleGroup(group)}
                                            />
                                            <h3 className="font-medium">{getGroupDisplayName(group)}</h3>
                                            <Badge variant="outline" className="text-xs">
                                                {enabledCount}/{totalCount}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-6">
                                        {fields.map(field => (
                                            <div key={field.id} className="flex items-center gap-3 p-2 rounded-md border">
                                                <Checkbox
                                                    checked={enabledColumns.includes(field.id)}
                                                    onCheckedChange={() => handleToggleField(field.id)}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium truncate">
                                                            {field.displayName}
                                                        </span>
                                                        {getFieldTypeBadge(field.type)}
                                                    </div>
                                                    {field.metadata?.description && (
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {field.metadata.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Separator />
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ComparisonConfig; 