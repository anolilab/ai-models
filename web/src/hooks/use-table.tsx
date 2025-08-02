import { useState, useCallback, useMemo, useEffect, useRef, useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { ProviderIcon } from "@/utils/provider-icons";
import { Calendar, DollarSign, CheckSquare, Search, FileText, Image, Music, Video, Code, File, Database } from "lucide-react";
import type { Model } from "@anolilab/ai-model-registry";
import { memoizedTransformModels } from "@/utils/data-utils";


export enum ColumnType {
    TEXT = "text",
    NUMBER = "number",
    BOOLEAN = "boolean",
    DATE = "date",
    COST = "cost",
    MODALITY = "modality",
    SELECT = "select",
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
    OPTIONAL = "optional",
    HIDDEN = "hidden",
}

export type FilterFn = "text" | "number" | "date" | "option" | "boolean";
export type SortFn = "text" | "number" | "date" | "basic" | "datetime";

export interface ColumnConfig<T = any> {
    id: string;
    displayName: string;
    type: ColumnType;
    group: ColumnGroup;
    accessorKey?: keyof T;
    accessorFn?: (row: T) => any;
    visibility: {
        default: ColumnVisibility;
        export: boolean;
        comparison: boolean;
        filterable: boolean;
        sortable: boolean;
    };
    size: number;
    cell?: (props: any) => React.ReactNode;
    header?: (props: any) => React.ReactNode;
    filter?: {
        type: FilterFn;
        options?: Array<{ label: string; value: string }>;
    };
    sort?: {
        type: SortFn;
    };
    export?: {
        label?: string;
        width?: number;
        formatter?: (value: any) => string;
    };
    comparison?: {
        highlightDifferences?: boolean;
        formatter?: (value: any) => string;
    };
    metadata?: {
        description?: string;
        icon?: React.ReactNode;
        tooltip?: string;
    };
}

export interface ModelTableRow {
    id: string;
    index: number;
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
    [key: string]: string | number | boolean | null | undefined;
}

const modalityIconMap: Record<string, React.ReactNode> = {
    text: <FileText className="size-4" />,
    image: <Image className="size-4" />,
    audio: <Music className="size-4" />,
    video: <Video className="size-4" />,
    code: <Code className="size-4" />,
    file: <File className="size-4" />,
    embedding: <Database className="size-4" />,
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

const renderCostCell = (props: any) => (
    <span className="text-right">{props.getValue()}</span>
);

const renderNumberCell = (props: any) => {
    const value = props.getValue();
    if (value === "-" || value === null || value === undefined) {
        return <span className="text-muted-foreground text-xs text-right">-</span>;
    }
    
    let num: number;
    if (typeof value === "string") {
        num = parseInt(value.replace(/\D/g, ""), 10);
    } else if (typeof value === "number") {
        num = value;
    } else {
        return <span className="text-muted-foreground text-xs text-right">-</span>;
    }
    
    if (isNaN(num) || num === 0) {
        return <span className="text-muted-foreground text-xs text-right">-</span>;
    }
    
    const formatted = num.toLocaleString();
    return <span className="text-right">{formatted}</span>;
};

const renderBooleanCell = (props: any) => (
    <span className="text-muted-foreground text-xs">{props.getValue()}</span>
);

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
    if (limitString === "-") return 0;
    const numericValue = limitString.replace(/\D/g, "");
    return parseInt(numericValue, 10) || 0;
};

const parseDate = (dateString: string): Date | null => {
    if (dateString === "-") return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
};

export const getTableColumns = (): ColumnConfig<ModelTableRow>[] => [
    // Selection column
    {
        id: "select",
        displayName: "Select",
        type: ColumnType.SELECT,
        group: ColumnGroup.BASIC,
        size: 60,
        visibility: {
            default: ColumnVisibility.ALWAYS,
            export: false,
            comparison: false,
            filterable: false,
            sortable: false,
        },
        header: ({ table }) => (
            <div className="p-2">
                <Checkbox
                    aria-label="Select all"
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                />
            </div>
        ),
        cell: ({ row }) => (
            <Checkbox 
                aria-label="Select row" 
                checked={row.getIsSelected()} 
                onCheckedChange={(value) => row.toggleSelected(!!value)} 
            />
        ),
    },
    
    // Provider Icon
    {
        id: "providerIcon",
        displayName: "",
        type: ColumnType.TEXT,
        group: ColumnGroup.BASIC,
        accessorKey: "providerIcon",
        size: 60,
        visibility: {
            default: ColumnVisibility.ALWAYS,
            export: false,
            comparison: false,
            filterable: false,
            sortable: false,
        },
        cell: ({ row }) => (
            <ProviderIcon 
                className="h-6 w-6" 
                provider={row.original.provider} 
                providerIcon={row.original.providerIcon} 
            />
        ),
    },
    
    // Provider
    {
        id: "provider",
        displayName: "Provider",
        type: ColumnType.TEXT,
        group: ColumnGroup.BASIC,
        accessorKey: "provider",
        size: 150,
        visibility: {
            default: ColumnVisibility.ALWAYS,
            export: true,
            comparison: true,
            filterable: true,
            sortable: true,
        },
        filter: { type: "text" },
        sort: { type: "text" },
        export: { label: "Provider", width: 15 },
        comparison: { highlightDifferences: true },
    },
    
    // Model
    {
        id: "model",
        displayName: "Model",
        type: ColumnType.TEXT,
        group: ColumnGroup.BASIC,
        accessorKey: "model",
        size: 300,
        visibility: {
            default: ColumnVisibility.ALWAYS,
            export: true,
            comparison: true,
            filterable: true,
            sortable: true,
        },
        filter: { type: "text" },
        sort: { type: "text" },
        export: { label: "Model", width: 20 },
        comparison: { highlightDifferences: true },
    },
    
    // Provider ID
    {
        id: "providerId",
        displayName: "Provider ID",
        type: ColumnType.TEXT,
        group: ColumnGroup.BASIC,
        accessorKey: "providerId",
        size: 200,
        visibility: {
            default: ColumnVisibility.OPTIONAL,
            export: true,
            comparison: true,
            filterable: true,
            sortable: true,
        },
        filter: { type: "text" },
        sort: { type: "text" },
        export: { label: "Provider ID", width: 15 },
        comparison: { highlightDifferences: true },
        cell: ({ row }) => (
            <span className="text-muted-foreground font-mono text-xs">{row.original.providerId}</span>
        ),
    },
    
    // Model ID
    {
        id: "modelId",
        displayName: "Model ID",
        type: ColumnType.TEXT,
        group: ColumnGroup.BASIC,
        accessorKey: "modelId",
        size: 420,
        visibility: {
            default: ColumnVisibility.OPTIONAL,
            export: true,
            comparison: true,
            filterable: true,
            sortable: true,
        },
        filter: { type: "text" },
        sort: { type: "text" },
        export: { label: "Model ID", width: 20 },
        comparison: { highlightDifferences: true },
        cell: ({ row }) => (
            <span className="text-muted-foreground font-mono text-xs">{row.original.modelId}</span>
        ),
    },
    
    // Tool Call
    {
        id: "toolCall",
        displayName: "Tool Call",
        type: ColumnType.BOOLEAN,
        group: ColumnGroup.CAPABILITIES,
        accessorKey: "toolCall",
        size: 130,
        visibility: {
            default: ColumnVisibility.OPTIONAL,
            export: true,
            comparison: true,
            filterable: true,
            sortable: true,
        },
        filter: { type: "text" },
        sort: { type: "basic" },
        export: { label: "Tool Call", width: 12 },
        comparison: { highlightDifferences: true },
        cell: renderBooleanCell,
    },
    
    // Reasoning
    {
        id: "reasoning",
        displayName: "Reasoning",
        type: ColumnType.BOOLEAN,
        group: ColumnGroup.CAPABILITIES,
        accessorKey: "reasoning",
        size: 130,
        visibility: {
            default: ColumnVisibility.OPTIONAL,
            export: true,
            comparison: true,
            filterable: true,
            sortable: true,
        },
        filter: { type: "text" },
        sort: { type: "basic" },
        export: { label: "Reasoning", width: 12 },
        comparison: { highlightDifferences: true },
        cell: renderBooleanCell,
    },
    
    // Input Modalities
    {
        id: "input",
        displayName: "Input",
        type: ColumnType.MODALITY,
        group: ColumnGroup.CAPABILITIES,
        accessorKey: "input",
        size: 150,
        visibility: {
            default: ColumnVisibility.OPTIONAL,
            export: true,
            comparison: true,
            filterable: true,
            sortable: false,
        },
        filter: { type: "text" },
        export: { label: "Input", width: 15 },
        comparison: { highlightDifferences: true },
        cell: renderModalityCell,
    },
    
    // Output Modalities
    {
        id: "output",
        displayName: "Output",
        type: ColumnType.MODALITY,
        group: ColumnGroup.CAPABILITIES,
        accessorKey: "output",
        size: 150,
        visibility: {
            default: ColumnVisibility.OPTIONAL,
            export: true,
            comparison: true,
            filterable: true,
            sortable: false,
        },
        filter: { type: "text" },
        export: { label: "Output", width: 15 },
        comparison: { highlightDifferences: true },
        cell: renderModalityCell,
    },
    
    // Input Cost
    {
        id: "inputCost",
        displayName: "Input Cost",
        type: ColumnType.COST,
        group: ColumnGroup.COSTS,
        accessorFn: (row) => extractLimitValue(row.inputCost),
        size: 150,
        visibility: {
            default: ColumnVisibility.OPTIONAL,
            export: true,
            comparison: true,
            filterable: true,
            sortable: true,
        },
        filter: { type: "number" },
        sort: { type: "basic" },
        export: { label: "Input Cost", width: 12 },
        comparison: { highlightDifferences: true },
        cell: renderCostCell
    },
    
    // Output Cost
    {
        id: "outputCost",
        displayName: "Output Cost",
        type: ColumnType.COST,
        group: ColumnGroup.COSTS,
        accessorFn: (row) => extractLimitValue(row.outputCost),
        size: 150,
        visibility: {
            default: ColumnVisibility.OPTIONAL,
            export: true,
            comparison: true,
            filterable: true,
            sortable: true,
        },
        filter: { type: "number" },
        sort: { type: "basic" },
        export: { label: "Output Cost", width: 12 },
        comparison: { highlightDifferences: true },
        cell: renderCostCell,
    },
    
    // Cache Read Cost
    {
        id: "cacheReadCost",
        displayName: "Cache Read Cost",
        type: ColumnType.COST,
        group: ColumnGroup.COSTS,
        accessorKey: "cacheReadCost",
        size: 200,
        visibility: {
            default: ColumnVisibility.HIDDEN,
            export: true,
            comparison: true,
            filterable: true,
            sortable: true,
        },
        filter: { type: "number" },
        sort: { type: "basic" },
        export: { label: "Cache Read Cost", width: 15 },
        comparison: { highlightDifferences: true },
        cell: renderCostCell,
    },
    
    // Cache Write Cost
    {
        id: "cacheWriteCost",
        displayName: "Cache Write Cost",
        type: ColumnType.COST,
        group: ColumnGroup.COSTS,
        accessorKey: "cacheWriteCost",
        size: 200,
        visibility: {
            default: ColumnVisibility.HIDDEN,
            export: true,
            comparison: true,
            filterable: true,
            sortable: true,
        },
        filter: { type: "number" },
        sort: { type: "basic" },
        export: { label: "Cache Write Cost", width: 15 },
        comparison: { highlightDifferences: true },
        cell: renderCostCell,
    },
    
    // Context Limit
    {
        id: "contextLimit",
        displayName: "Context Limit",
        type: ColumnType.NUMBER,
        group: ColumnGroup.LIMITS,
        accessorFn: (row) => extractLimitValue(row.contextLimit),
        size: 200,
        visibility: {
            default: ColumnVisibility.OPTIONAL,
            export: true,
            comparison: true,
            filterable: true,
            sortable: true,
        },
        filter: { type: "number" },
        sort: { type: "basic" },
        export: { label: "Context Limit", width: 15 },
        comparison: { highlightDifferences: true },
        cell: renderNumberCell,
    },
    
    // Output Limit
    {
        id: "outputLimit",
        displayName: "Output Limit",
        type: ColumnType.NUMBER,
        group: ColumnGroup.LIMITS,
        accessorFn: (row) => extractLimitValue(row.outputLimit),
        size: 160,
        visibility: {
            default: ColumnVisibility.OPTIONAL,
            export: true,
            comparison: true,
            filterable: true,
            sortable: true,
        },
        filter: { type: "number" },
        sort: { type: "basic" },
        export: { label: "Output Limit", width: 15 },
        comparison: { highlightDifferences: true },
        cell: renderNumberCell,
    },
    
    // Temperature
    {
        id: "temperature",
        displayName: "Temperature",
        type: ColumnType.BOOLEAN,
        group: ColumnGroup.CAPABILITIES,
        accessorKey: "temperature",
        size: 150,
        visibility: {
            default: ColumnVisibility.HIDDEN,
            export: true,
            comparison: false,
            filterable: true,
            sortable: true,
        },
        filter: { type: "text" },
        sort: { type: "basic" },
        export: { label: "Temperature", width: 12 },
        cell: renderBooleanCell,
    },
    
    // Weights
    {
        id: "weights",
        displayName: "Weights",
        type: ColumnType.TEXT,
        group: ColumnGroup.METADATA,
        accessorKey: "weights",
        size: 140,
        visibility: {
            default: ColumnVisibility.HIDDEN,
            export: true,
            comparison: false,
            filterable: true,
            sortable: true,
        },
        filter: { type: "text" },
        sort: { type: "basic" },
        export: { label: "Weights", width: 12 },
        cell: renderBooleanCell,
    },
    
    // Knowledge
    {
        id: "knowledge",
        displayName: "Knowledge",
        type: ColumnType.TEXT,
        group: ColumnGroup.METADATA,
        accessorKey: "knowledge",
        size: 150,
        visibility: {
            default: ColumnVisibility.HIDDEN,
            export: true,
            comparison: false,
            filterable: true,
            sortable: false,
        },
        filter: { type: "text" },
        export: { label: "Knowledge", width: 15 },
        cell: renderBooleanCell,
    },
    
    // Release Date
    {
        id: "releaseDate",
        displayName: "Release Date",
        type: ColumnType.DATE,
        group: ColumnGroup.METADATA,
        accessorKey: "releaseDate",
        size: 200,
        visibility: {
            default: ColumnVisibility.HIDDEN,
            export: true,
            comparison: false,
            filterable: true,
            sortable: false,
        },
        filter: { type: "text" },
        export: { label: "Release Date", width: 15 },
        cell: renderDateCell,
    },
    
    // Last Updated
    {
        id: "lastUpdated",
        displayName: "Last Updated",
        type: ColumnType.DATE,
        group: ColumnGroup.METADATA,
        accessorFn: (row) => parseDate(row.lastUpdated),
        size: 200,
        visibility: {
            default: ColumnVisibility.OPTIONAL,
            export: true,
            comparison: false,
            filterable: true,
            sortable: true,
        },
        filter: { type: "date" },
        sort: { type: "datetime" },
        export: { label: "Last Updated", width: 15 },
        cell: renderDateCell,
    },
];

export interface ColumnFactoryOptions {
    enableResizing?: boolean;
    enableHiding?: boolean;
    enableFilter?: boolean;
    enableSort?: boolean;
}



const getSortFn = (type: string) => {
    switch (type) {
        case "number": return "basic";
        case "date": return "basic";
        case "datetime": return "basic";
        case "text": default: return "basic";
    }
};

const columnHelper = createColumnHelper<ModelTableRow>();

const createSelectionColumn = (): ColumnDef<ModelTableRow> => 
    columnHelper.display({
        id: "select",
        size: 60,
        minSize: 60,
        maxSize: 60,
        enableHiding: false,
        enableResizing: false,
        enableSorting: false,
        enableColumnFilter: false,
        header: ({ table }) => (
            <div className="p-2">
                <Checkbox
                    aria-label="Select all"
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                />
            </div>
        ),
        cell: ({ row }) => (
            <Checkbox 
                aria-label="Select row" 
                checked={row.getIsSelected()} 
                onCheckedChange={(value) => row.toggleSelected(!!value)} 
            />
        ),
    });



export const createColumnsFromConfig = (
    configs: ColumnConfig<ModelTableRow>[],
    options: ColumnFactoryOptions = {}
): ColumnDef<ModelTableRow>[] => {
    return configs.map(config => {
        const column: ColumnDef<ModelTableRow> = {
            id: config.id,
            size: config.size,
            minSize: config.size,
            maxSize: config.size * 2,
            enableColumnFilter: config.visibility.filterable && config.filter && options.enableFilter !== false,
            enableSorting: config.visibility.sortable && config.sort && options.enableSort !== false,
            enableResizing: options.enableResizing !== false,
            enableHiding: options.enableHiding !== false,
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
            (column as any).sortingFn = getSortFn(config.sort.type);
        }

        return column;
    });
};

export const createColumnsWithSelection = (
    configs: ColumnConfig<ModelTableRow>[],
    options: ColumnFactoryOptions = {}
): ColumnDef<ModelTableRow>[] => {
    const hasSelectionColumn = configs.some(config => config.id === "select");
    
    if (hasSelectionColumn) {
        return createColumnsFromConfig(configs, options);
    }
    
    return [createSelectionColumn(), ...createColumnsFromConfig(configs, options)];
};

export const createColumnsByVisibility = (
    configs: ColumnConfig<ModelTableRow>[],
    visibleColumns: string[],
    options: ColumnFactoryOptions = {}
): ColumnDef<ModelTableRow>[] => {
    const filteredConfigs = configs.filter(config => 
        visibleColumns.includes(config.id) || config.visibility.default === "always"
    );
    
    return createColumnsWithSelection(filteredConfigs, options);
};





export const createExportConfig = (
    configs: ColumnConfig<ModelTableRow>[],
    enabledColumns: string[]
) => {
    const exportableConfigs = configs.filter(config => 
        config.visibility.export && enabledColumns.includes(config.id)
    );

    return {
        columnMapping: Object.fromEntries(
            exportableConfigs.map(config => [
                config.id,
                config.export?.label || config.displayName
            ])
        ),
        columnWidths: exportableConfigs.map(config => ({ 
            wch: config.export?.width || 15 
        })),
        headers: exportableConfigs.map(config => 
            config.export?.label || config.displayName
        ),
        enabledColumns: exportableConfigs.map(config => config.id),
    };
};

export const createComparisonConfig = (
    configs: ColumnConfig<ModelTableRow>[],
    enabledColumns: string[]
) => {
    const comparableConfigs = configs.filter(config => 
        config.visibility.comparison && enabledColumns.includes(config.id)
    );

    return {
        columns: comparableConfigs.map(config => ({
            id: config.id,
            label: config.displayName,
            highlightDifferences: config.comparison?.highlightDifferences || false,
        })),
        enabledColumns: comparableConfigs.map(config => config.id),
    };
};

export const createFilterConfig = (
    configs: ColumnConfig<ModelTableRow>[],
    enabledColumns: string[]
) => {
    const filterableConfigs = configs.filter(config => 
        config.visibility.filterable && enabledColumns.includes(config.id)
    );



    const iconMap: Record<string, any> = {
        date: Calendar,
        number: DollarSign,
        cost: DollarSign,
        option: CheckSquare,
        boolean: CheckSquare,
        text: Search,
    };

    // Map our ColumnType enum to data-table-filter ColumnDataType
    const typeMap: Record<ColumnType, "text" | "number" | "date" | "option" | "multiOption"> = {
        [ColumnType.TEXT]: "text",
        [ColumnType.NUMBER]: "number", 
        [ColumnType.COST]: "number",
        [ColumnType.DATE]: "date",
        [ColumnType.BOOLEAN]: "option",
        [ColumnType.MODALITY]: "text",
        [ColumnType.SELECT]: "option",
    };

    const result = filterableConfigs.map(config => {
        const mappedType = typeMap[config.type] || "text";
        
        let options = config.filter?.options;
        
        const accessor = config.accessorFn || ((row: ModelTableRow) => {
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
            type: mappedType,
            options,
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
    enableColumnResizing?: boolean;
    enableColumnHiding?: boolean;
    enableFiltering?: boolean;
    enableSorting?: boolean;
    enableVirtualization?: boolean;
    enableRowSelection?: boolean;
    enablePagination?: boolean;
}

export interface TableState {
    selectedRows: ModelTableRow[];
    visibleColumns: string[];
    sortBy: string;
    sortOrder: SortOrder;
    filters: Record<string, any>;
    pageIndex: number;
    pageSize: number;
    searchTerm: string;
}

export interface TableError {
    message: string;
    code: string;
    details?: any;
}

export interface UseModelTableReturn {
    tableData: ModelTableRow[];
    columns: any[];
    exportConfig: any;
    filterConfig: any;
    isLoading: boolean;
    error: TableError | null;
    refresh: () => void;
}

export const useModelTable = (
    models: Model[],
    options: TableOptions = {}
): UseModelTableReturn => {
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
                message: "Failed to transform model data",
                code: "TRANSFORM_ERROR",
                details: err,
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
                message: "Failed to load column configurations",
                code: "COLUMN_CONFIG_ERROR",
                details: err,
            };
            setError(tableError);
            return [];
        }
    }, []);

    // Create columns with visibility filtering
    const columns = useMemo(() => {
        if (columnConfigs.length === 0) return [];
        
        try {
            const visibleColumns = getDefaultColumnOrder();
            return createColumnsByVisibility(columnConfigs, visibleColumns, {
                enableResizing: options.enableColumnResizing,
                enableHiding: options.enableColumnHiding,
                enableFilter: options.enableFiltering,
                enableSort: options.enableSorting,
            });
        } catch (err) {
            const tableError: TableError = {
                message: "Failed to create table columns",
                code: "COLUMN_CREATION_ERROR",
                details: err,
            };
            setError(tableError);
            return [];
        }
    }, [columnConfigs, options]);

    // Create export configuration
    const exportConfig = useMemo(() => {
        if (columnConfigs.length === 0) return null;
        
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
        if (columnConfigs.length === 0) return [];
        
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
        tableData,
        columns,
        exportConfig,
        filterConfig,
        isLoading: isPending,
        error,
        refresh,
    };
};

export interface UseSelectionModeReturn {
    selectionMode: SelectionMode;
    maxSelectionLimit: number;
    handleModeChange: (mode: SelectionMode) => void;
    isSelectionValid: (count: number) => boolean;
    getValidationMessage: (count: number) => string;
    canCompare: (count: number) => boolean;
    canExport: (count: number) => boolean;
}

export const useSelectionMode = (): UseSelectionModeReturn => {
    const [selectionMode, setSelectionMode] = useState<SelectionMode>("comparison");

    const maxSelectionLimit = useMemo(() => {
        return selectionMode === "comparison" ? 10 : 1000;
    }, [selectionMode]);

    const handleModeChange = useCallback((mode: SelectionMode) => {
        setSelectionMode(mode);
    }, []);

    const isSelectionValid = useCallback((count: number) => {
        return count >= 0 && count <= maxSelectionLimit;
    }, [maxSelectionLimit]);

    const canCompare = useCallback((count: number) => {
        return selectionMode === "comparison" && count >= 2 && count <= maxSelectionLimit;
    }, [selectionMode, maxSelectionLimit]);

    const canExport = useCallback((count: number) => {
        return selectionMode === "export" && count > 0 && count <= maxSelectionLimit;
    }, [selectionMode, maxSelectionLimit]);

    const getValidationMessage = useCallback((count: number) => {
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
    }, [maxSelectionLimit, selectionMode]);

    return {
        selectionMode,
        maxSelectionLimit,
        handleModeChange,
        isSelectionValid,
        getValidationMessage,
        canCompare,
        canExport,
    };
};

export interface UseTableHeightReturn {
    containerHeight: number;
    didMount: boolean;
    headerRef: React.RefObject<HTMLDivElement | null>;
    footerRef: React.RefObject<HTMLDivElement | null>;
    updateHeight: () => void;
    isResizing: boolean;
}

export const useTableHeight = (): UseTableHeightReturn => {
    const [containerHeight, setContainerHeight] = useState(0);
    const [didMount, setDidMount] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const headerRef = useRef<HTMLDivElement>(null);
    const footerRef = useRef<HTMLDivElement>(null);
    const resizeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    const updateHeight = useCallback(() => {
        if (typeof window === "undefined") return;

        setIsResizing(true);
        
        const windowHeight = window.innerHeight;
        const headerHeight = headerRef.current?.offsetHeight || 0;
        const footerHeight = footerRef.current?.offsetHeight || 0;
        
        // Calculate available height for table
        const availableHeight = windowHeight - headerHeight - footerHeight - 100; // 100px buffer
        
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
        headerRef,
        footerRef,
        updateHeight,
        isResizing,
    };
};

export interface UseTableStateReturn {
    state: TableState;
    setSelectedRows: (rows: ModelTableRow[]) => void;
    setVisibleColumns: (columns: string[]) => void;
    setSortBy: (column: string) => void;
    setSortOrder: (order: SortOrder) => void;
    setFilters: (filters: Record<string, any>) => void;
    setPageIndex: (index: number) => void;
    setPageSize: (size: number) => void;
    setSearchTerm: (term: string) => void;
    resetState: () => void;
    updateState: (updates: Partial<TableState>) => void;
}

const initialTableState: TableState = {
    selectedRows: [],
    visibleColumns: getDefaultColumnOrder(),
    sortBy: "provider",
    sortOrder: "asc",
    filters: {},
    pageIndex: 0,
    pageSize: 50,
    searchTerm: "",
};

export const useTableState = (): UseTableStateReturn => {
    const [state, setState] = useState<TableState>(initialTableState);

    const setSelectedRows = useCallback((rows: ModelTableRow[]) => {
        setState(prev => ({ ...prev, selectedRows: rows }));
    }, []);

    const setVisibleColumns = useCallback((columns: string[]) => {
        setState(prev => ({ ...prev, visibleColumns: columns }));
    }, []);

    const setSortBy = useCallback((column: string) => {
        setState(prev => ({ ...prev, sortBy: column }));
    }, []);

    const setSortOrder = useCallback((order: SortOrder) => {
        setState(prev => ({ ...prev, sortOrder: order }));
    }, []);

    const setFilters = useCallback((filters: Record<string, any>) => {
        setState(prev => ({ ...prev, filters }));
    }, []);

    const setPageIndex = useCallback((index: number) => {
        setState(prev => ({ ...prev, pageIndex: index }));
    }, []);

    const setPageSize = useCallback((size: number) => {
        setState(prev => ({ ...prev, pageSize: size, pageIndex: 0 }));
    }, []);

    const setSearchTerm = useCallback((term: string) => {
        setState(prev => ({ ...prev, searchTerm: term, pageIndex: 0 }));
    }, []);

    const resetState = useCallback(() => {
        setState(initialTableState);
    }, []);

    const updateState = useCallback((updates: Partial<TableState>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    return {
        state,
        setSelectedRows,
        setVisibleColumns,
        setSortBy,
        setSortOrder,
        setFilters,
        setPageIndex,
        setPageSize,
        setSearchTerm,
        resetState,
        updateState,
    };
};

export const useTablePersistence = (
    key: string,
    initialState: TableState
): [TableState, (state: TableState) => void] => {
    const [state, setState] = useState<TableState>(() => {
        if (typeof window === "undefined") return initialState;
        
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

    const setPersistedState = useCallback((newState: TableState) => {
        setState(newState);
        
        if (typeof window !== "undefined") {
            try {
                localStorage.setItem(key, JSON.stringify(newState));
            } catch (error) {
                console.warn(`Failed to save table state to localStorage (${key}):`, error);
            }
        }
    }, [key]);

    return [state, setPersistedState];
};

export interface UseTableSearchReturn {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filteredData: ModelTableRow[];
    isSearching: boolean;
    searchResults: number;
    clearSearch: () => void;
}

export const useTableSearch = (
    data: ModelTableRow[],
    searchFields: (keyof ModelTableRow)[] = ["provider", "model", "modelId"]
): UseTableSearchReturn => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) {
            return data;
        }

        setIsSearching(true);
        const term = searchTerm.toLowerCase();
        
        const filtered = data.filter(row => {
            return searchFields.some(field => {
                const value = row[field];
                if (value == null) return false;
                return String(value).toLowerCase().includes(term);
            });
        });

        setIsSearching(false);
        return filtered;
    }, [data, searchTerm, searchFields]);

    const clearSearch = useCallback(() => {
        setSearchTerm("");
    }, [setSearchTerm]);

    return {
        searchTerm,
        setSearchTerm,
        filteredData,
        isSearching,
        searchResults: filteredData.length,
        clearSearch,
    };
};

export interface UseTablePerformanceReturn {
    isVirtualized: boolean;
    estimatedRowHeight: number;
    overscan: number;
    enableRowVirtualization: boolean;
    enableColumnVirtualization: boolean;
}

export const useTablePerformance = (
    dataLength: number,
    options: {
        enableVirtualization?: boolean;
        estimatedRowHeight?: number;
        overscan?: number;
    } = {}
): UseTablePerformanceReturn => {
    const {
        enableVirtualization = true,
        estimatedRowHeight = 40,
        overscan = 5,
    } = options;

    const isVirtualized = useMemo(() => {
        return enableVirtualization && dataLength > 100;
    }, [enableVirtualization, dataLength]);

    return {
        isVirtualized,
        estimatedRowHeight,
        overscan,
        enableRowVirtualization: isVirtualized,
        enableColumnVirtualization: false, // Usually not needed for most tables
    };
}; 