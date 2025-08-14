import type { Model } from "@anolilab/ai-model-registry";
import type { ColumnDef } from "@tanstack/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import { Calendar, CheckSquare, Code, Database, DollarSign, File, FileText, Image, Music, Search, Video } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { memoizedTransformModels } from "@/utils/data-utils";
import { ProviderIcon } from "@/utils/provider-icons";

import useIsMobile from "./use-is-mobile";

const modalityIconMap: Record<string, React.ReactNode> = {
    audio: <Music className="size-4" />,
    code: <Code className="size-4" />,
    embedding: <Database className="size-4" />,
    file: <File className="size-4" />,
    image: <Image className="size-4" />,
    text: <FileText className="size-4" />,
    video: <Video className="size-4" />,
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

const renderCostCell = (props: any) => <span className="text-right">{props.getValue()}</span>;

const renderNumberCell = (props: any) => {
    const value = props.getValue();

    if (value === "-" || value === null || value === undefined) {
        return <span className="text-muted-foreground text-right text-xs">-</span>;
    }

    let num: number;

    if (typeof value === "string") {
        num = parseInt(value.replace(/\D/g, ""), 10);
    } else if (typeof value === "number") {
        num = value;
    } else {
        return <span className="text-muted-foreground text-right text-xs">-</span>;
    }

    if (isNaN(num) || num === 0) {
        return <span className="text-muted-foreground text-right text-xs">-</span>;
    }

    const formatted = num.toLocaleString();

    return <span className="text-right">{formatted}</span>;
};

const renderBooleanCell = (props: any) => <span className="text-muted-foreground text-xs">{props.getValue()}</span>;

const renderDateCell = (props: any) => {
    const value = props.getValue();

    if (value === "-" || value === null || value === undefined) {
        return <span className="text-muted-foreground text-xs">-</span>;
    }

    if (value instanceof Date) {
        return <span className="text-muted-foreground text-xs">{value.toLocaleDateString()}</span>;
    }

    if (typeof value === "string") {
        return <span className="text-muted-foreground text-xs">{value}</span>;
    }

    return <span className="text-muted-foreground text-xs">-</span>;
};

const extractLimitValue = (limitString: string): number => {
    if (limitString === "-")
        return 0;

    const numericValue = limitString.replace(/\D/g, "");

    return parseInt(numericValue, 10) || 0;
};

const parseDate = (dateString: string): Date | null => {
    if (dateString === "-")
        return null;

    const date = new Date(dateString);

    return Number.isNaN(date.getTime()) ? null : date;
};

const columnHelper = createColumnHelper<ModelTableRow>();

const createSelectionColumn = (): ColumnDef<ModelTableRow> =>
    columnHelper.display({
        cell: ({ row }) => <Checkbox aria-label="Select row" checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} />,
        enableColumnFilter: false,
        enableHiding: false,
        enableResizing: false,
        enableSorting: false,
        header: ({ table }) => (
            <div className="p-2">
                <Checkbox
                    aria-label="Select all"
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                />
            </div>
        ),
        id: "select",
        maxSize: 60,
        minSize: 60,
        size: 60,
    });

export enum ColumnType {
    BOOLEAN = "boolean",
    COST = "cost",
    DATE = "date",
    MODALITY = "modality",
    NUMBER = "number",
    SELECT = "select",
    TEXT = "text",
}

export enum ColumnGroup {
    BASIC = "basic",
    CAPABILITIES = "capabilities",
    COSTS = "costs",
    LIMITS = "limits",
    METADATA = "metadata",
}

export enum ColumnVisibility {
    ALWAYS = "always",
    HIDDEN = "hidden",
    OPTIONAL = "optional",
}

export type FilterFn = "text" | "number" | "date" | "option" | "boolean";
export type SortFn = "text" | "number" | "date" | "basic" | "datetime";

export interface ColumnConfig<T = any> {
    accessorFn?: (row: T) => any;
    accessorKey?: keyof T;
    cell?: (props: any) => React.ReactNode;
    comparison?: {
        formatter?: (value: any) => string;
        highlightDifferences?: boolean;
    };
    displayName: string;
    export?: {
        formatter?: (value: any) => string;
        label?: string;
        width?: number;
    };
    filter?: {
        options?: { label: string; value: string }[];
        type: FilterFn;
    };
    group: ColumnGroup;
    header?: (props: any) => React.ReactNode;
    id: string;
    metadata?: {
        description?: string;
        icon?: React.ReactNode;
        tooltip?: string;
    };
    size: number;
    sort?: {
        type: SortFn;
    };
    type: ColumnType;
    visibility: {
        comparison: boolean;
        default: ColumnVisibility;
        export: boolean;
        filterable: boolean;
        sortable: boolean;
    };
}

export interface ModelTableRow {
    [key: string]: string | number | boolean | null | undefined;
    cacheReadCost: string;
    cacheWriteCost: string;
    contextLimit: string;
    id: string;
    index: number;
    input: string;
    inputCost: string;
    knowledge: string;
    lastUpdated: string;
    model: string;
    modelId: string;
    output: string;
    outputCost: string;
    outputLimit: string;
    provider: string;
    providerIcon: string | null;
    providerId: string;
    reasoning: string;
    releaseDate: string;
    temperature: string;
    toolCall: string;
    weights: string;
}

export const getTableColumns = (): ColumnConfig<ModelTableRow>[] => [
    // Selection column
    {
        cell: ({ row }) => <Checkbox aria-label="Select row" checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} />,
        displayName: "Select",
        group: ColumnGroup.BASIC,
        header: ({ table }) => (
            <div className="p-2">
                <Checkbox
                    aria-label="Select all"
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                />
            </div>
        ),
        id: "select",
        size: 60,
        type: ColumnType.SELECT,
        visibility: {
            comparison: false,
            default: ColumnVisibility.ALWAYS,
            export: false,
            filterable: false,
            sortable: false,
        },
    },

    // Provider Icon
    {
        accessorKey: "providerIcon",
        cell: (props: any) => {
            const provider = props.getValue ? props.getValue() : props.row?.original?.provider;
            const providerIcon = props.row?.original?.providerIcon;

            return <ProviderIcon className="h-6 w-6" provider={provider} providerIcon={providerIcon} />;
        },
        displayName: "",
        group: ColumnGroup.BASIC,
        id: "providerIcon",
        size: 60,
        type: ColumnType.TEXT,
        visibility: {
            comparison: false,
            default: ColumnVisibility.ALWAYS,
            export: false,
            filterable: false,
            sortable: false,
        },
    },

    // Provider
    {
        accessorKey: "provider",
        comparison: { highlightDifferences: true },
        displayName: "Provider",
        export: { label: "Provider", width: 15 },
        filter: { type: "text" },
        group: ColumnGroup.BASIC,
        id: "provider",
        size: 150,
        sort: { type: "text" },
        type: ColumnType.TEXT,
        visibility: {
            comparison: true,
            default: ColumnVisibility.ALWAYS,
            export: true,
            filterable: true,
            sortable: true,
        },
    },

    // Model
    {
        accessorKey: "model",
        comparison: { highlightDifferences: true },
        displayName: "Model",
        export: { label: "Model", width: 20 },
        filter: { type: "text" },
        group: ColumnGroup.BASIC,
        id: "model",
        size: 300,
        sort: { type: "text" },
        type: ColumnType.TEXT,
        visibility: {
            comparison: true,
            default: ColumnVisibility.ALWAYS,
            export: true,
            filterable: true,
            sortable: true,
        },
    },

    // Provider ID
    {
        accessorKey: "providerId",
        cell: (props: any) => {
            const value = props.getValue ? props.getValue() : props.row?.original?.providerId;

            return <span className="text-muted-foreground font-mono text-xs">{value}</span>;
        },
        comparison: { highlightDifferences: true },
        displayName: "Provider ID",
        export: { label: "Provider ID", width: 15 },
        filter: { type: "text" },
        group: ColumnGroup.BASIC,
        id: "providerId",
        size: 200,
        sort: { type: "text" },
        type: ColumnType.TEXT,
        visibility: {
            comparison: true,
            default: ColumnVisibility.OPTIONAL,
            export: true,
            filterable: true,
            sortable: true,
        },
    },

    // Model ID
    {
        accessorKey: "modelId",
        cell: (props: any) => {
            const value = props.getValue ? props.getValue() : props.row?.original?.modelId;

            return <span className="text-muted-foreground font-mono text-xs">{value}</span>;
        },
        comparison: { highlightDifferences: true },
        displayName: "Model ID",
        export: { label: "Model ID", width: 20 },
        filter: { type: "text" },
        group: ColumnGroup.BASIC,
        id: "modelId",
        size: 420,
        sort: { type: "text" },
        type: ColumnType.TEXT,
        visibility: {
            comparison: true,
            default: ColumnVisibility.OPTIONAL,
            export: true,
            filterable: true,
            sortable: true,
        },
    },

    // Tool Call
    {
        accessorKey: "toolCall",
        cell: renderBooleanCell,
        comparison: { highlightDifferences: true },
        displayName: "Tool Call",
        export: { label: "Tool Call", width: 12 },
        filter: { type: "text" },
        group: ColumnGroup.CAPABILITIES,
        id: "toolCall",
        size: 130,
        sort: { type: "basic" },
        type: ColumnType.BOOLEAN,
        visibility: {
            comparison: true,
            default: ColumnVisibility.OPTIONAL,
            export: true,
            filterable: true,
            sortable: true,
        },
    },

    // Reasoning
    {
        accessorKey: "reasoning",
        cell: renderBooleanCell,
        comparison: { highlightDifferences: true },
        displayName: "Reasoning",
        export: { label: "Reasoning", width: 12 },
        filter: { type: "text" },
        group: ColumnGroup.CAPABILITIES,
        id: "reasoning",
        size: 130,
        sort: { type: "basic" },
        type: ColumnType.BOOLEAN,
        visibility: {
            comparison: true,
            default: ColumnVisibility.OPTIONAL,
            export: true,
            filterable: true,
            sortable: true,
        },
    },

    // Input Modalities
    {
        accessorKey: "input",
        cell: renderModalityCell,
        comparison: { highlightDifferences: true },
        displayName: "Input",
        export: { label: "Input", width: 15 },
        filter: { type: "text" },
        group: ColumnGroup.CAPABILITIES,
        id: "input",
        size: 150,
        type: ColumnType.MODALITY,
        visibility: {
            comparison: true,
            default: ColumnVisibility.OPTIONAL,
            export: true,
            filterable: true,
            sortable: false,
        },
    },

    // Output Modalities
    {
        accessorKey: "output",
        cell: renderModalityCell,
        comparison: { highlightDifferences: true },
        displayName: "Output",
        export: { label: "Output", width: 15 },
        filter: { type: "text" },
        group: ColumnGroup.CAPABILITIES,
        id: "output",
        size: 150,
        type: ColumnType.MODALITY,
        visibility: {
            comparison: true,
            default: ColumnVisibility.OPTIONAL,
            export: true,
            filterable: true,
            sortable: false,
        },
    },

    // Input Cost
    {
        accessorFn: (row) => extractLimitValue(row.inputCost),
        cell: renderCostCell,
        comparison: { highlightDifferences: true },
        displayName: "Input Cost",
        export: { label: "Input Cost", width: 12 },
        filter: { type: "number" },
        group: ColumnGroup.COSTS,
        id: "inputCost",
        size: 150,
        sort: { type: "basic" },
        type: ColumnType.COST,
        visibility: {
            comparison: true,
            default: ColumnVisibility.OPTIONAL,
            export: true,
            filterable: true,
            sortable: true,
        },
    },

    // Output Cost
    {
        accessorFn: (row) => extractLimitValue(row.outputCost),
        cell: renderCostCell,
        comparison: { highlightDifferences: true },
        displayName: "Output Cost",
        export: { label: "Output Cost", width: 12 },
        filter: { type: "number" },
        group: ColumnGroup.COSTS,
        id: "outputCost",
        size: 150,
        sort: { type: "basic" },
        type: ColumnType.COST,
        visibility: {
            comparison: true,
            default: ColumnVisibility.OPTIONAL,
            export: true,
            filterable: true,
            sortable: true,
        },
    },

    // Cache Read Cost
    {
        accessorKey: "cacheReadCost",
        cell: renderCostCell,
        comparison: { highlightDifferences: true },
        displayName: "Cache Read Cost",
        export: { label: "Cache Read Cost", width: 15 },
        filter: { type: "number" },
        group: ColumnGroup.COSTS,
        id: "cacheReadCost",
        size: 200,
        sort: { type: "basic" },
        type: ColumnType.COST,
        visibility: {
            comparison: true,
            default: ColumnVisibility.HIDDEN,
            export: true,
            filterable: true,
            sortable: true,
        },
    },

    // Cache Write Cost
    {
        accessorKey: "cacheWriteCost",
        cell: renderCostCell,
        comparison: { highlightDifferences: true },
        displayName: "Cache Write Cost",
        export: { label: "Cache Write Cost", width: 15 },
        filter: { type: "number" },
        group: ColumnGroup.COSTS,
        id: "cacheWriteCost",
        size: 200,
        sort: { type: "basic" },
        type: ColumnType.COST,
        visibility: {
            comparison: true,
            default: ColumnVisibility.HIDDEN,
            export: true,
            filterable: true,
            sortable: true,
        },
    },

    // Context Limit
    {
        accessorFn: (row) => extractLimitValue(row.contextLimit),
        cell: renderNumberCell,
        comparison: { highlightDifferences: true },
        displayName: "Context Limit",
        export: { label: "Context Limit", width: 15 },
        filter: { type: "number" },
        group: ColumnGroup.LIMITS,
        id: "contextLimit",
        size: 200,
        sort: { type: "basic" },
        type: ColumnType.NUMBER,
        visibility: {
            comparison: true,
            default: ColumnVisibility.OPTIONAL,
            export: true,
            filterable: true,
            sortable: true,
        },
    },

    // Output Limit
    {
        accessorFn: (row) => extractLimitValue(row.outputLimit),
        cell: renderNumberCell,
        comparison: { highlightDifferences: true },
        displayName: "Output Limit",
        export: { label: "Output Limit", width: 15 },
        filter: { type: "number" },
        group: ColumnGroup.LIMITS,
        id: "outputLimit",
        size: 160,
        sort: { type: "basic" },
        type: ColumnType.NUMBER,
        visibility: {
            comparison: true,
            default: ColumnVisibility.OPTIONAL,
            export: true,
            filterable: true,
            sortable: true,
        },
    },

    // Temperature
    {
        accessorKey: "temperature",
        cell: renderBooleanCell,
        displayName: "Temperature",
        export: { label: "Temperature", width: 12 },
        filter: { type: "text" },
        group: ColumnGroup.CAPABILITIES,
        id: "temperature",
        size: 150,
        sort: { type: "basic" },
        type: ColumnType.BOOLEAN,
        visibility: {
            comparison: false,
            default: ColumnVisibility.HIDDEN,
            export: true,
            filterable: true,
            sortable: true,
        },
    },

    // Weights
    {
        accessorKey: "weights",
        cell: renderBooleanCell,
        displayName: "Weights",
        export: { label: "Weights", width: 12 },
        filter: { type: "text" },
        group: ColumnGroup.METADATA,
        id: "weights",
        size: 140,
        sort: { type: "basic" },
        type: ColumnType.TEXT,
        visibility: {
            comparison: false,
            default: ColumnVisibility.HIDDEN,
            export: true,
            filterable: true,
            sortable: true,
        },
    },

    // Knowledge
    {
        accessorKey: "knowledge",
        cell: renderBooleanCell,
        displayName: "Knowledge",
        export: { label: "Knowledge", width: 15 },
        filter: { type: "text" },
        group: ColumnGroup.METADATA,
        id: "knowledge",
        size: 150,
        type: ColumnType.TEXT,
        visibility: {
            comparison: false,
            default: ColumnVisibility.HIDDEN,
            export: true,
            filterable: true,
            sortable: false,
        },
    },

    // Release Date
    {
        accessorKey: "releaseDate",
        cell: renderDateCell,
        displayName: "Release Date",
        export: { label: "Release Date", width: 15 },
        filter: { type: "text" },
        group: ColumnGroup.METADATA,
        id: "releaseDate",
        size: 200,
        type: ColumnType.DATE,
        visibility: {
            comparison: false,
            default: ColumnVisibility.HIDDEN,
            export: true,
            filterable: true,
            sortable: false,
        },
    },

    // Last Updated
    {
        accessorFn: (row) => parseDate(row.lastUpdated),
        cell: renderDateCell,
        displayName: "Last Updated",
        export: { label: "Last Updated", width: 15 },
        filter: { type: "date" },
        group: ColumnGroup.METADATA,
        id: "lastUpdated",
        size: 200,
        sort: { type: "datetime" },
        type: ColumnType.DATE,
        visibility: {
            comparison: false,
            default: ColumnVisibility.OPTIONAL,
            export: true,
            filterable: true,
            sortable: true,
        },
    },
];

export interface ColumnFactoryOptions {
    enableFilter?: boolean;
    enableHiding?: boolean;
    enableResizing?: boolean;
    enableSort?: boolean;
}

export const createColumnsFromConfig = (configs: ColumnConfig<ModelTableRow>[], options: ColumnFactoryOptions = {}): ColumnDef<ModelTableRow>[] =>
    configs.map((config) => {
        const column: ColumnDef<ModelTableRow> = {
            enableColumnFilter: config.visibility.filterable && config.filter && options.enableFilter !== false,
            enableHiding: options.enableHiding !== false,
            enableResizing: options.enableResizing !== false,
            enableSorting: config.visibility.sortable && config.sort && options.enableSort !== false,
            id: config.id,
            maxSize: config.size * 2,
            minSize: config.size,
            size: config.size,
        };

        // Set header
        if (config.header) {
            (column as any).header = config.header;
        } else {
            (column as any).header = config.displayName;
        }

        // Set accessor
        if (config.accessorKey) {
            (column as any).accessorKey = config.accessorKey as string;
        } else if (config.accessorFn) {
            (column as any).accessorFn = config.accessorFn;
        }

        // Set cell renderer
        if (config.cell) {
            (column as any).cell = config.cell;
        }

        // Set sorting function
        if (config.sort) {
            (column as any).sortingFn = "basic";
        }

        return column;
    });

export const createColumnsWithSelection = (configs: ColumnConfig<ModelTableRow>[], options: ColumnFactoryOptions = {}): ColumnDef<ModelTableRow>[] => {
    const hasSelectionColumn = configs.some((config) => config.id === "select");

    if (hasSelectionColumn) {
        return createColumnsFromConfig(configs, options);
    }

    return [createSelectionColumn(), ...createColumnsFromConfig(configs, options)];
};

export const createColumnsByVisibility = (
    configs: ColumnConfig<ModelTableRow>[],
    visibleColumns: string[],
    options: ColumnFactoryOptions = {},
): ColumnDef<ModelTableRow>[] => {
    const filteredConfigs = configs.filter((config) => visibleColumns.includes(config.id) || config.visibility.default === "always");

    return createColumnsWithSelection(filteredConfigs, options);
};

export const createExportConfig = (configs: ColumnConfig<ModelTableRow>[], enabledColumns: string[]) => {
    const exportableConfigs = configs.filter((config) => config.visibility.export && enabledColumns.includes(config.id));

    return {
        columnMapping: Object.fromEntries(exportableConfigs.map((config) => [config.id, config.export?.label || config.displayName])),
        columnWidths: exportableConfigs.map((config) => {
            return {
                wch: config.export?.width || 15,
            };
        }),
        enabledColumns: exportableConfigs.map((config) => config.id),
        headers: exportableConfigs.map((config) => config.export?.label || config.displayName),
    };
};

export const createComparisonConfig = (configs: ColumnConfig<ModelTableRow>[], enabledColumns: string[]) => {
    const comparableConfigs = configs.filter((config) => config.visibility.comparison && enabledColumns.includes(config.id));

    return {
        columns: comparableConfigs.map((config) => {
            return {
                highlightDifferences: config.comparison?.highlightDifferences || false,
                id: config.id,
                label: config.displayName,
            };
        }),
        enabledColumns: comparableConfigs.map((config) => config.id),
    };
};

export const createFilterConfig = (configs: ColumnConfig<ModelTableRow>[], enabledColumns: string[]) => {
    const filterableConfigs = configs.filter((config) => config.visibility.filterable && enabledColumns.includes(config.id));

    const iconMap: Record<string, any> = {
        boolean: CheckSquare,
        cost: DollarSign,
        date: Calendar,
        number: DollarSign,
        option: CheckSquare,
        text: Search,
    };

    // Map our ColumnType enum to data-table-filter ColumnDataType
    const typeMap: Record<ColumnType, "text" | "number" | "date" | "option" | "multiOption"> = {
        [ColumnType.BOOLEAN]: "option",
        [ColumnType.COST]: "number",
        [ColumnType.DATE]: "date",
        [ColumnType.MODALITY]: "text",
        [ColumnType.NUMBER]: "number",
        [ColumnType.SELECT]: "option",
        [ColumnType.TEXT]: "text",
    };

    const result = filterableConfigs.map((config) => {
        const mappedType = typeMap[config.type] || "text";

        const options = config.filter?.options;

        const accessor
            = config.accessorFn
                || ((row: ModelTableRow) => {
                    if (config.accessorKey) {
                        return row[config.accessorKey];
                    }

                    return undefined;
                });

        return {
            accessor,
            displayName: config.displayName,
            icon: iconMap[config.type] || Search,
            id: config.id,
            options,
            type: mappedType,
        };
    });

    return result;
};

export const getDefaultColumnOrder = (): string[] => [
    "select",
    "providerIcon",
    "provider",
    "model",
    "providerId",
    "modelId",
    "toolCall",
    "reasoning",
    "input",
    "output",
    "inputCost",
    "outputCost",
    "cacheReadCost",
    "cacheWriteCost",
    "contextLimit",
    "outputLimit",
    "temperature",
    "weights",
    "knowledge",
    "releaseDate",
    "lastUpdated",
];

export const getDefaultExportColumns = (): string[] => [
    "provider",
    "model",
    "providerId",
    "modelId",
    "toolCall",
    "reasoning",
    "input",
    "output",
    "inputCost",
    "outputCost",
    "cacheReadCost",
    "cacheWriteCost",
    "contextLimit",
    "outputLimit",
    "temperature",
    "weights",
    "knowledge",
    "releaseDate",
    "lastUpdated",
];

export const getDefaultComparisonColumns = (): string[] => [
    "provider",
    "model",
    "input",
    "output",
    "inputCost",
    "outputCost",
    "cacheReadCost",
    "contextLimit",
    "outputLimit",
    "temperature",
    "weights",
    "knowledge",
    "releaseDate",
    "lastUpdated",
    "toolCall",
    "reasoning",
];

export type SelectionMode = "comparison" | "export";
export type SortOrder = "asc" | "desc";

export interface TableOptions {
    enableColumnHiding?: boolean;
    enableColumnResizing?: boolean;
    enableFiltering?: boolean;
    enablePagination?: boolean;
    enableRowSelection?: boolean;
    enableSorting?: boolean;
    enableVirtualization?: boolean;
}

export interface TableState {
    filters: Record<string, any>;
    pageIndex: number;
    pageSize: number;
    searchTerm: string;
    selectedRows: ModelTableRow[];
    sortBy: string;
    sortOrder: SortOrder;
    visibleColumns: string[];
}

export interface TableError {
    code: string;
    details?: any;
    message: string;
}

export interface UseModelTableReturn {
    columns: any[];
    error: TableError | null;
    exportConfig: any;
    filterConfig: any;
    isLoading: boolean;
    refresh: () => void;
    tableData: ModelTableRow[];
}

export const useModelTable = (models: Model[], options: TableOptions = {}): UseModelTableReturn => {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<TableError | null>(null);
    const [lastRefresh, setLastRefresh] = useState(Date.now());

    // Transform models to table rows with memoization and error handling
    const tableData = useMemo(() => {
        try {
            setError(null);

            return memoizedTransformModels(models);
        } catch (err) {
            const tableError: TableError = {
                code: "TRANSFORM_ERROR",
                details: err,
                message: "Failed to transform model data",
            };

            setError(tableError);

            return [];
        }
    }, [models, lastRefresh]);

    // Get column configurations with memoization
    const columnConfigs = useMemo(() => {
        try {
            return getTableColumns();
        } catch (err) {
            const tableError: TableError = {
                code: "COLUMN_CONFIG_ERROR",
                details: err,
                message: "Failed to load column configurations",
            };

            setError(tableError);

            return [];
        }
    }, [getTableColumns]);

    // Create columns with visibility filtering
    const columns = useMemo(() => {
        if (columnConfigs.length === 0)
            return [];

        try {
            const visibleColumns = getDefaultColumnOrder();

            return createColumnsByVisibility(columnConfigs, visibleColumns, {
                enableFilter: options.enableFiltering,
                enableHiding: options.enableColumnHiding,
                enableResizing: options.enableColumnResizing,
                enableSort: options.enableSorting,
            });
        } catch (err) {
            const tableError: TableError = {
                code: "COLUMN_CREATION_ERROR",
                details: err,
                message: "Failed to create table columns",
            };

            setError(tableError);

            return [];
        }
    }, [columnConfigs, options]);

    // Create export configuration
    const exportConfig = useMemo(() => {
        if (columnConfigs.length === 0)
            return null;

        try {
            const exportColumns = getDefaultExportColumns();

            return createExportConfig(columnConfigs, exportColumns);
        } catch (err) {
            console.warn("Failed to create export config:", err);

            return null;
        }
    }, [columnConfigs]);

    // Create filter configuration
    const filterConfig = useMemo(() => {
        if (columnConfigs.length === 0)
            return [];

        try {
            const filterColumns = getDefaultColumnOrder();

            return createFilterConfig(columnConfigs, filterColumns);
        } catch (err) {
            console.warn("Failed to create filter config:", err);

            return [];
        }
    }, [columnConfigs, options.enableFiltering]);

    // Refresh function
    const refresh = useCallback(() => {
        startTransition(() => {
            setLastRefresh(Date.now());
        });
    }, []);

    return {
        columns,
        error,
        exportConfig,
        filterConfig,
        isLoading: isPending,
        refresh,
        tableData,
    };
};

export interface UseSelectionModeReturn {
    canCompare: (count: number) => boolean;
    canExport: (count: number) => boolean;
    getValidationMessage: (count: number) => string;
    handleModeChange: (mode: SelectionMode) => void;
    isSelectionValid: (count: number) => boolean;
    maxSelectionLimit: number;
    selectionMode: SelectionMode;
}

export const useSelectionMode = (): UseSelectionModeReturn => {
    const [selectionMode, setSelectionMode] = useState<SelectionMode>("comparison");

    const maxSelectionLimit = useMemo(() => (selectionMode === "comparison" ? 10 : 1000), [selectionMode]);

    const handleModeChange = useCallback((mode: SelectionMode) => {
        setSelectionMode(mode);
    }, []);

    const isSelectionValid = useCallback((count: number) => count >= 0 && count <= maxSelectionLimit, [maxSelectionLimit]);

    const canCompare = useCallback(
        (count: number) => selectionMode === "comparison" && count >= 2 && count <= maxSelectionLimit,
        [selectionMode, maxSelectionLimit],
    );

    const canExport = useCallback((count: number) => selectionMode === "export" && count > 0 && count <= maxSelectionLimit, [selectionMode, maxSelectionLimit]);

    const getValidationMessage = useCallback(
        (count: number) => {
            if (count === 0) {
                return "No models selected";
            }

            if (count > maxSelectionLimit) {
                return `Too many models selected (max: ${maxSelectionLimit})`;
            }

            if (selectionMode === "comparison" && count < 2) {
                return "Select at least 2 models to compare";
            }

            if (selectionMode === "export" && count === 0) {
                return "Select at least 1 model to export";
            }

            return `${count} model${count === 1 ? "" : "s"} selected`;
        },
        [maxSelectionLimit, selectionMode],
    );

    return {
        canCompare,
        canExport,
        getValidationMessage,
        handleModeChange,
        isSelectionValid,
        maxSelectionLimit,
        selectionMode,
    };
};

export interface UseTableHeightReturn {
    containerHeight: number;
    didMount: boolean;
    footerRef: React.RefObject<HTMLDivElement | null>;
    headerRef: React.RefObject<HTMLDivElement | null>;
    isResizing: boolean;
    updateHeight: () => void;
}

export const useTableHeight = (): UseTableHeightReturn => {
    const [containerHeight, setContainerHeight] = useState(0);
    const [didMount, setDidMount] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const headerRef = useRef<HTMLDivElement>(null);
    const footerRef = useRef<HTMLDivElement>(null);
    const resizeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const isMobile = useIsMobile();

    const updateHeight = useCallback(() => {
        if (typeof window === "undefined")
            return;

        setIsResizing(true);

        const windowHeight = window.innerHeight;
        const headerHeight = headerRef.current?.offsetHeight || 0;
        const footerHeight = footerRef.current?.offsetHeight || 0;

        // Calculate available height for table
        const availableHeight = windowHeight - headerHeight - footerHeight - (isMobile ? 64 : 54);

        setContainerHeight(Math.max(400, availableHeight)); // Minimum 400px height

        // Clear previous timeout
        if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current);
        }

        // Set timeout to clear resizing state
        resizeTimeoutRef.current = setTimeout(() => {
            setIsResizing(false);
        }, 150);
    }, []);

    useEffect(() => {
        setDidMount(true);
        updateHeight();

        const handleResize = () => {
            updateHeight();
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);

            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
        };
    }, [updateHeight]);

    return {
        containerHeight,
        didMount,
        footerRef,
        headerRef,
        isResizing,
        updateHeight,
    };
};

export interface UseTableStateReturn {
    resetState: () => void;
    setFilters: (filters: Record<string, any>) => void;
    setPageIndex: (index: number) => void;
    setPageSize: (size: number) => void;
    setSearchTerm: (term: string) => void;
    setSelectedRows: (rows: ModelTableRow[]) => void;
    setSortBy: (column: string) => void;
    setSortOrder: (order: SortOrder) => void;
    setVisibleColumns: (columns: string[]) => void;
    state: TableState;
    updateState: (updates: Partial<TableState>) => void;
}

export const useTableState = (): UseTableStateReturn => {
    const initialTableState: TableState = {
        filters: {},
        pageIndex: 0,
        pageSize: 50,
        searchTerm: "",
        selectedRows: [],
        sortBy: "provider",
        sortOrder: "asc",
        visibleColumns: getDefaultColumnOrder(),
    };

    const [state, setState] = useState<TableState>(initialTableState);

    const setSelectedRows = useCallback((rows: ModelTableRow[]) => {
        setState((prev) => {
            return { ...prev, selectedRows: rows };
        });
    }, []);

    const setVisibleColumns = useCallback((columns: string[]) => {
        setState((prev) => {
            return { ...prev, visibleColumns: columns };
        });
    }, []);

    const setSortBy = useCallback((column: string) => {
        setState((prev) => {
            return { ...prev, sortBy: column };
        });
    }, []);

    const setSortOrder = useCallback((order: SortOrder) => {
        setState((prev) => {
            return { ...prev, sortOrder: order };
        });
    }, []);

    const setFilters = useCallback((filters: Record<string, any>) => {
        setState((prev) => {
            return { ...prev, filters };
        });
    }, []);

    const setPageIndex = useCallback((index: number) => {
        setState((prev) => {
            return { ...prev, pageIndex: index };
        });
    }, []);

    const setPageSize = useCallback((size: number) => {
        setState((prev) => {
            return { ...prev, pageIndex: 0, pageSize: size };
        });
    }, []);

    const setSearchTerm = useCallback((term: string) => {
        setState((prev) => {
            return { ...prev, pageIndex: 0, searchTerm: term };
        });
    }, []);

    const resetState = useCallback(() => {
        setState(initialTableState);
    }, []);

    const updateState = useCallback((updates: Partial<TableState>) => {
        setState((prev) => {
            return { ...prev, ...updates };
        });
    }, []);

    return {
        resetState,
        setFilters,
        setPageIndex,
        setPageSize,
        setSearchTerm,
        setSelectedRows,
        setSortBy,
        setSortOrder,
        setVisibleColumns,
        state,
        updateState,
    };
};

export const useTablePersistence = (key: string, initialState: TableState): [TableState, (state: TableState) => void] => {
    const [state, setState] = useState<TableState>(() => {
        if (typeof window === "undefined")
            return initialState;

        try {
            const saved = localStorage.getItem(key);

            if (saved) {
                const parsed = JSON.parse(saved);

                // Merge with initial state to handle new fields
                return { ...initialState, ...parsed };
            }
        } catch (error) {
            console.warn(`Failed to load table state from localStorage (${key}):`, error);
        }

        return initialState;
    });

    const setPersistedState = useCallback(
        (newState: TableState) => {
            setState(newState);

            if (typeof window !== "undefined") {
                try {
                    localStorage.setItem(key, JSON.stringify(newState));
                } catch (error) {
                    console.warn(`Failed to save table state to localStorage (${key}):`, error);
                }
            }
        },
        [key],
    );

    return [state, setPersistedState];
};

export interface UseTableSearchReturn {
    clearSearch: () => void;
    filteredData: ModelTableRow[];
    isSearching: boolean;
    searchResults: number;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
}

export const useTableSearch = (data: ModelTableRow[], searchFields: (keyof ModelTableRow)[] = ["provider", "model", "modelId"]): UseTableSearchReturn => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) {
            return data;
        }

        setIsSearching(true);
        const term = searchTerm.toLowerCase();

        const filtered = data.filter((row) =>
            searchFields.some((field) => {
                const value = row[field];

                if (value == null)
                    return false;

                return String(value).toLowerCase().includes(term);
            }),
        );

        setIsSearching(false);

        return filtered;
    }, [data, searchTerm, searchFields]);

    const clearSearch = useCallback(() => {
        setSearchTerm("");
    }, [setSearchTerm]);

    return {
        clearSearch,
        filteredData,
        isSearching,
        searchResults: filteredData.length,
        searchTerm,
        setSearchTerm,
    };
};

export interface UseTablePerformanceReturn {
    enableColumnVirtualization: boolean;
    enableRowVirtualization: boolean;
    estimatedRowHeight: number;
    isVirtualized: boolean;
    overscan: number;
}

export const useTablePerformance = (
    dataLength: number,
    options: {
        enableVirtualization?: boolean;
        estimatedRowHeight?: number;
        overscan?: number;
    } = {},
): UseTablePerformanceReturn => {
    const { enableVirtualization = true, estimatedRowHeight = 40, overscan = 5 } = options;

    const isVirtualized = useMemo(() => enableVirtualization && dataLength > 100, [enableVirtualization, dataLength]);

    return {
        enableColumnVirtualization: false, // Usually not needed for most tables
        enableRowVirtualization: isVirtualized,
        estimatedRowHeight,
        isVirtualized,
        overscan,
    };
};
