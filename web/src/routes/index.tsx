import type { Model } from "@anolilab/ai-model-registry";
import { getAllModels } from "@anolilab/ai-model-registry";
import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Calendar, Copy, File, FileText, Image as ImageIcon, MoreHorizontal, ScatterChart, Search, Trash2, Video, Volume2, BarChart3 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import AnolilabLogo from "@/assets/images/anolilab_text.svg?react";
import DataTableColumnHeader from "@/components/data-table/column-header";
import DataTable from "@/components/data-table/data-table";
import type { ColumnConfig } from "@/components/data-table/filter/core/types";
import { dateFilterFn, numberFilterFn, textFilterFn } from "@/components/data-table/filter/integrations/tanstack-table/filter-fns";
import { optionFilterFn } from "@/components/data-table/filter/lib/filter-fns";
import HowToUseDialog from "@/components/how-to-use-dialog";
import ModelComparisonDialog from "@/components/data-table/model-comparison-dialog";
import SelectionModeToggle from "@/components/data-table/selection-mode-toggle";
import SkeletonTable from "@/components/skeleton-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useIsMobile from "@/hooks/use-is-mobile";
import { ProviderIcon } from "@/utils/provider-icons";

const modalityIconMap: Record<string, React.ReactNode> = {
    audio: <Volume2 className="inline size-4" />,
    embedding: <ScatterChart className="inline size-4" />,
    file: <File className="inline size-4" />,
    image: <ImageIcon className="inline size-4" />,
    text: <FileText className="inline size-4" />,
    video: <Video className="inline size-4" />,
};

const HomeComponent = () => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const { allModels } = Route.useLoaderData();
    const [containerHeight, setContainerHeight] = useState(600);
    const [didMount, setDidMount] = useState(false);
    const [isComparisonDialogOpen, setIsComparisonDialogOpen] = useState(false);
    const [selectedModelsForComparison, setSelectedModelsForComparison] = useState<typeof tableData>([]);
    const [selectionMode, setSelectionMode] = useState<"comparison" | "export">("comparison");
    const isMobile = useIsMobile();
    
    // Handler for mode changes
    const handleModeChange = useCallback((newMode: "comparison" | "export") => {
        setSelectionMode(newMode);
        // Clear selections when switching modes to avoid confusion
        // This will be handled by the DataTable component
    }, []);
    const headerRef = useRef<HTMLElement>(null);
    const footerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        setDidMount(true);

        const updateHeight = () => {
            const headerHeight = headerRef.current?.offsetHeight;
            const footerHeight = footerRef.current?.offsetHeight;

            if (headerHeight && footerHeight) {
                const totalOffset = headerHeight + footerHeight + 64;

                setContainerHeight(window.innerHeight - totalOffset);
            }
        };

        updateHeight();

        window.addEventListener("resize", updateHeight);

        return () => window.removeEventListener("resize", updateHeight);
    }, [isMobile]);

    // Helper function to format cost as currency
    const formatCost = (cost: number | null): string => {
        if (cost === null || cost === undefined)
            return "-";

        return new Intl.NumberFormat("en-US", {
            currency: "USD",
            maximumFractionDigits: 4,
            minimumFractionDigits: 2,
            style: "currency",
        }).format(cost);
    };

    // Transform the data to match our table structure
    const tableData = useMemo(() => {
        const processed = allModels.map((model: Model, index: number) => {
            return {
                cacheReadCost: formatCost(model.cost.inputCacheHit),
                cacheWriteCost: "-", // Not available in our data
                contextLimit: model.limit.context ? model.limit.context.toLocaleString() : "-",
                id: index + model.id,
                input: model.modalities.input.join(", "),
                inputCost: formatCost(model.cost.input),
                knowledge: model.knowledge || "-",
                lastUpdated: model.lastUpdated || "-",
                model: (model.name || model.id).toLowerCase(),
                modelId: model.id,
                output: model.modalities.output.join(", "),
                outputCost: formatCost(model.cost.output),
                outputLimit: model.limit.output ? model.limit.output.toLocaleString() : "-",
                provider: model.provider || "Unknown",
                providerIcon: model.icon || null,
                providerId: model.providerId || "Unknown",
                reasoning: model.reasoning,
                releaseDate: model.releaseDate || "-",
                temperature: model.temperature ? "Yes" : "No",
                toolCall: model.toolCall,
                weights: model.openWeights ? "Open" : "Closed",
            };
        });

        // Sort alphabetically by provider
        return processed.sort((a, b) => a.provider.localeCompare(b.provider));
    }, [allModels]);

    // Column configurations for data-table-filter - only the ones we want to filter
    const columnConfigs: ColumnConfig<(typeof tableData)[0]>[] = useMemo(
        () => [
            {
                accessor: (row) => row.provider,
                displayName: "Provider",
                icon: Search,
                id: "provider",
                type: "text",
            },
            {
                accessor: (row) => row.model,
                displayName: "Model",
                icon: Search,
                id: "model",
                type: "text",
            },
            {
                accessor: (row) => {
                    const cost = row.inputCost.replace(/[^0-9.]/g, "");

                    return cost === "-" ? 0 : parseFloat(cost);
                },
                displayName: "Input Cost",
                icon: Search,
                id: "inputCost",
                type: "number",
            },
            {
                accessor: (row) => {
                    const cost = row.outputCost.replace(/[^0-9.]/g, "");

                    return cost === "-" ? 0 : parseFloat(cost);
                },
                displayName: "Output Cost",
                icon: Search,
                id: "outputCost",
                type: "number",
            },
            {
                accessor: (row) => {
                    if (row.lastUpdated === "-")
                        return null;

                    return new Date(row.lastUpdated);
                },
                displayName: "Last Updated",
                icon: Calendar,
                id: "lastUpdated",
                type: "date",
            },
            {
                accessor: (row) => row.toolCall,
                displayName: "Tool Call",
                icon: Search,
                id: "toolCall",
                options: [
                    { label: "Yes", value: "Yes" },
                    { label: "No", value: "No" },
                ],
                type: "option",
            },
            {
                accessor: (row) => row.reasoning,
                displayName: "Reasoning",
                icon: Search,
                id: "reasoning",
                options: [
                    { label: "Yes", value: "Yes" },
                    { label: "No", value: "No" },
                ],
                type: "option",
            },
        ],
        [],
    );

    const baseColumns: ColumnDef<(typeof tableData)[0]>[] = [
        {
            cell: ({ row }) => <Checkbox aria-label="Select row" checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} />,
            enableHiding: false,
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
            size: 60,
        },
        {
            accessorKey: "providerIcon",
            cell: ({ row }) => <ProviderIcon className="h-6 w-6" provider={row.original.provider} providerIcon={row.original.providerIcon} />,
            enableColumnFilter: false,
            enableSorting: false,
            header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
            id: "providerIcon",
            size: 60,
        },
        {
            accessorKey: "provider",
            enableColumnFilter: true,
            enableSorting: true,
            filterFn: textFilterFn,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Provider" />,
            id: "provider",
            size: 150,
            sortingFn: "text",
        },
        {
            accessorKey: "model",
            enableColumnFilter: true,
            enableSorting: true,
            filterFn: textFilterFn,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Model" />,
            id: "model",
            size: 300,
            sortingFn: "text",
        },
        {
            accessorKey: "providerId",
            cell: ({ row }) => <span className="text-muted-foreground font-mono-id text-xs">{row.original.providerId}</span>,
            enableColumnFilter: true,
            enableSorting: true,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Provider ID" />,
            id: "providerId",
            size: 200,
        },
        {
            accessorKey: "modelId",
            cell: ({ row }) => <span className="text-muted-foreground font-mono-id text-xs">{row.original.modelId}</span>,
            enableColumnFilter: true,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Model ID" />,
            id: "modelId",
            size: 420,
        },
        {
            accessorKey: "toolCall",
            enableColumnFilter: true,
            filterFn: (row, columnId, filterValue) => {
                const value = row.getValue<string>(columnId);

                return optionFilterFn(value, filterValue);
            },
            header: ({ column }) => <DataTableColumnHeader column={column} title="Tool Call" />,
            id: "toolCall",
            size: 130,
            sortingFn: "basic",
        },
        {
            accessorKey: "reasoning",
            enableColumnFilter: true,
            filterFn: (row, columnId, filterValue) => {
                const value = row.getValue<string>(columnId);

                return optionFilterFn(value, filterValue);
            },
            header: ({ column }) => <DataTableColumnHeader column={column} title="Reasoning" />,
            id: "reasoning",
            size: 130,
            sortingFn: "basic",
        },
        {
            accessorKey: "input",
            cell: ({ row }) => {
                const modalities = useMemo(() => row.original.input.split(",").map((m: string) => m.trim()), [row.original.input]);

                // Memoize the modality components to prevent tooltip recreation
                const modalityComponents = useMemo(
                    () =>
                        modalities.map((modality: string, index: number) => {
                            const icon = modalityIconMap[modality];

                            if (icon) {
                                return (
                                    <span
                                        className="border-border text-muted-foreground border px-1 py-0.5"
                                        key={`input-${modality}-${index}`}
                                        title={modality.charAt(0).toUpperCase() + modality.slice(1)}
                                    >
                                        {icon}
                                    </span>
                                );
                            }

                            return <span key={`input-${modality}-${index}`}>{modality}</span>;
                        }),
                    [modalities],
                );

                return <span className="flex items-center gap-1">{modalityComponents}</span>;
            },
            enableColumnFilter: true,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Input" />,
            size: 150,
        },
        {
            accessorKey: "output",
            cell: ({ row }) => {
                const modalities = useMemo(() => row.original.output.split(",").map((m: string) => m.trim()), [row.original.output]);

                // Memoize the modality components to prevent tooltip recreation
                const modalityComponents = useMemo(
                    () =>
                        modalities.map((modality: string, index: number) => {
                            const icon = modalityIconMap[modality];

                            if (icon) {
                                return (
                                    <span
                                        className="border-border text-muted-foreground border px-1 py-0.5"
                                        key={`output-${modality}-${index}`}
                                        title={modality.charAt(0).toUpperCase() + modality.slice(1)}
                                    >
                                        {icon}
                                    </span>
                                );
                            }

                            return <span key={`output-${modality}-${index}`}>{modality}</span>;
                        }),
                    [modalities],
                );

                return <span className="flex items-center gap-1">{modalityComponents}</span>;
            },
            enableColumnFilter: true,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Output" />,
            size: 150,
        },
        {
            accessorFn: (row) => {
                const cost = row.inputCost.replace(/[^0-9.]/g, "");

                return cost === "-" ? 0 : parseFloat(cost);
            },
            cell: ({ row }) => <span className="text-right">{row.original.inputCost}</span>,
            enableColumnFilter: true,
            filterFn: numberFilterFn,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Input Cost" />,
            id: "inputCost",
            size: 150,
            sortingFn: "basic",
        },
        {
            accessorFn: (row) => {
                const cost = row.outputCost.replace(/[^0-9.]/g, "");

                return cost === "-" ? 0 : parseFloat(cost);
            },
            cell: ({ row }) => <span className="text-right">{row.original.outputCost}</span>,
            enableColumnFilter: true,
            filterFn: numberFilterFn,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Output Cost" />,
            id: "outputCost",
            size: 150,
            sortingFn: "basic",
        },
        {
            accessorKey: "cacheReadCost",
            cell: ({ row }) => <span className="text-right">{row.original.cacheReadCost}</span>,
            enableColumnFilter: true,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Cache Read Cost" />,
            size: 200,
        },
        {
            accessorKey: "cacheWriteCost",
            cell: ({ row }) => <span className="text-right">{row.original.cacheWriteCost}</span>,
            enableColumnFilter: true,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Cache Write Cost" />,
            size: 200,
        },
        {
            accessorFn: (row) => {
                const limit = row.contextLimit.replace(/\D/g, "");

                return limit === "-" ? 0 : parseInt(limit, 10);
            },
            cell: ({ row }) => {
                const value = row.original.contextLimit;

                if (value === "-")
                    return <span className="text-muted-foreground text-xs text-right">-</span>;

                // Parse the number and format with commas
                const num = parseInt(value.replace(/\D/g, ""), 10);
                const formatted = num.toLocaleString();

                return <span className="text-right">{formatted}</span>;
            },
            enableColumnFilter: true,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Context Limit" />,
            id: "contextLimit",
            size: 200,
            sortingFn: "basic",
        },
        {
            accessorFn: (row) => {
                const limit = row.outputLimit.replace(/\D/g, "");

                return limit === "-" ? 0 : parseInt(limit, 10);
            },
            cell: ({ row }) => {
                const value = row.original.outputLimit;

                if (value === "-")
                    return <span className="text-muted-foreground text-xs text-right">-</span>;

                // Parse the number and format with commas
                const num = parseInt(value.replace(/\D/g, ""), 10);
                const formatted = num.toLocaleString();

                return <span className="text-right">{formatted}</span>;
            },
            enableColumnFilter: true,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Output Limit" />,
            id: "outputLimit",
            size: 160,
            sortingFn: "basic",
        },
        {
            accessorKey: "temperature",
            cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.temperature}</span>,
            enableColumnFilter: true,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Temperature" />,
            size: 150,
            sortingFn: "basic",
        },
        {
            accessorKey: "weights",
            cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.weights}</span>,
            enableColumnFilter: true,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Weights" />,
            size: 140,
            sortingFn: "basic",
        },
        {
            accessorKey: "knowledge",
            cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.knowledge}</span>,
            enableColumnFilter: true,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Knowledge" />,
            size: 150,
        },
        {
            accessorKey: "releaseDate",
            cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.releaseDate}</span>,
            enableColumnFilter: true,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Release Date" />,
            size: 200,
        },
        {
            accessorFn: (row) => {
                if (row.lastUpdated === "-")
                    return null;

                return new Date(row.lastUpdated);
            },
            cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.lastUpdated}</span>,
            enableColumnFilter: true,
            filterFn: dateFilterFn,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Last Updated" />,
            id: "lastUpdated",
            size: 200,
            sortingFn: "datetime",
        },
    ];

    // Create columns with row deselection handler
    const getColumns = useCallback((handleRowDeselection: ((rowId: string) => void) | null | undefined) => baseColumns, [baseColumns]);

    // Custom toolbar component for selection actions
    const renderToolbarContent = useCallback(
        ({
            resetSelection,
            selectedRows,
            totalSelectedCount,
        }: {
            allSelectedIds: (string | number)[];
            resetSelection: () => void;
            selectedRows: typeof tableData;
            totalSelectedCount: number;
        }) => {
            return (
                <div className="flex items-center gap-4">
                    {/* Selection Mode Toggle */}
                    <SelectionModeToggle
                        currentMode={selectionMode}
                        onModeChange={handleModeChange}
                        selectedCount={totalSelectedCount}
                        maxSelectionLimit={5}
                        size="sm"
                    />
                    
                    {/* Selection Actions */}
                    {totalSelectedCount > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                                {totalSelectedCount} model{totalSelectedCount !== 1 ? "s" : ""} selected
                                {selectionMode === "comparison" && totalSelectedCount > 1 && (
                                    <span className="text-muted-foreground ml-1">
                                        (max 5 for comparison)
                                    </span>
                                )}
                            </span>
                            <div className="flex items-center gap-2">
                                {selectionMode === "comparison" && totalSelectedCount > 1 && (
                                    <Button
                                        onClick={() => {
                                            // Store selected models for comparison
                                            setSelectedModelsForComparison(selectedRows);
                                            setIsComparisonDialogOpen(true);
                                        }}
                                        variant="default"
                                        size="sm"
                                    >
                                        <BarChart3 className="mr-1 h-4 w-4" />
                                        Compare Models
                                    </Button>
                                )}
                                
                                <Button
                                    onClick={() => {
                                        // Copy selected model IDs to clipboard
                                        const modelIds = selectedRows.map((row) => row.modelId).join("\n");

                                        navigator.clipboard.writeText(modelIds);
                                    }}
                                    variant="outline"
                                    size="sm"
                                >
                                    <Copy className="mr-1 h-4 w-4" />
                                    Copy IDs
                                </Button>

                                <Button onClick={resetSelection} variant="outline" size="sm">
                                    <Trash2 className="mr-1 h-4 w-4" />
                                    Clear
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            );
        },
        [selectionMode],
    );

    return (
        <>
            <header className="flex items-center justify-between border-b px-3 py-2" ref={headerRef} style={{ height: "56px" }}>
                <div className="left flex min-w-0 items-center gap-2">
                    <h1 className="text-lg font-bold tracking-tight uppercase">Models</h1>
                    <span className="slash" />
                    <p className="truncate text-sm text-[var(--color-text-tertiary)]">An open-source database of AI models</p>
                </div>
                <div className="right flex items-center gap-3">
                    {isMobile
                        ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button className="flex items-center gap-2 text-sm" size="sm" variant="ghost">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem asChild>
                                        <HowToUseDialog />
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <a
                                            className="w-full cursor-pointer"
                                            href="https://github.com/anolilab/ai-models"
                                            rel="noopener noreferrer"
                                            target="_blank"
                                        >
                                            GitHub
                                        </a>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )
                        : (
                            <>
                                <HowToUseDialog />

                                <a className="github" href="https://github.com/anolilab/ai-models" rel="noopener noreferrer" target="_blank">
                                    <svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"
                                            fill="currentColor"
                                        ></path>
                                    </svg>
                                </a>
                            </>
                        )}
                </div>
            </header>
            <main>
                <ClientOnly fallback={<SkeletonTable columns={isMobile ? 2 : 20} rows={15} />}>
                    <DataTable<(typeof tableData)[0], any>
                        config={{
                            enableColumnResizing: false,
                            enableColumnVisibility: true,
                            enablePagination: false,
                            enableRowSelection: true,
                            // Performance optimizations
                            enableRowVirtualization: true,
                            enableStickyHeader: true,
                            enableToolbar: true,
                            maxSelectionLimit: 5, // Limit selection to 5 models for comparison
                            selectionMode: selectionMode, // Use current selection mode
                            estimatedRowHeight: 40,
                            virtualizationOverscan: 5,
                        }}
                        containerHeight={didMount ? containerHeight : undefined}
                        data={tableData}
                        defaultSorting={{
                            sortBy: "provider",
                            sortOrder: "asc",
                        }}
                        exportConfig={{
                            columnMapping: {
                                cacheReadCost: "Cache Read Cost",
                                cacheWriteCost: "Cache Write Cost",
                                contextLimit: "Context Limit",
                                input: "Input",
                                inputCost: "Input Cost",
                                knowledge: "Knowledge",
                                lastUpdated: "Last Updated",
                                model: "Model",
                                modelId: "Model ID",
                                output: "Output",
                                outputCost: "Output Cost",
                                outputLimit: "Output Limit",
                                provider: "Provider",
                                providerIcon: "Provider Icon",
                                providerId: "Provider ID",
                                reasoning: "Reasoning",
                                releaseDate: "Release Date",
                                temperature: "Temperature",
                                toolCall: "Tool Call",
                                weights: "Weights",
                            },
                            columnWidths: [
                                { wch: 10 }, // providerIcon
                                { wch: 15 }, // provider
                                { wch: 20 }, // model
                                { wch: 15 }, // providerId
                                { wch: 20 }, // modelId
                                { wch: 10 }, // toolCall
                                { wch: 10 }, // reasoning
                                { wch: 15 }, // input
                                { wch: 15 }, // output
                                { wch: 12 }, // inputCost
                                { wch: 12 }, // outputCost
                                { wch: 15 }, // cacheReadCost
                                { wch: 15 }, // cacheWriteCost
                                { wch: 15 }, // contextLimit
                                { wch: 15 }, // outputLimit
                                { wch: 12 }, // temperature
                                { wch: 12 }, // weights
                                { wch: 15 }, // knowledge
                                { wch: 15 }, // releaseDate
                                { wch: 15 }, // lastUpdated
                            ],
                            entityName: "models",
                            headers: [
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
                            ],
                            transformFunction: (row) => {
                                return {
                                    cacheReadCost: row.cacheReadCost,
                                    cacheWriteCost: row.cacheWriteCost,
                                    contextLimit: row.contextLimit,
                                    input: row.input,
                                    inputCost: row.inputCost,
                                    knowledge: row.knowledge,
                                    lastUpdated: row.lastUpdated,
                                    model: row.model,
                                    modelId: row.modelId,
                                    output: row.output,
                                    outputCost: row.outputCost,
                                    outputLimit: row.outputLimit,
                                    provider: row.provider,
                                    providerIcon: row.providerIcon,
                                    providerId: row.providerId,
                                    reasoning: row.reasoning,
                                    releaseDate: row.releaseDate,
                                    temperature: row.temperature,
                                    toolCall: row.toolCall,
                                    weights: row.weights,
                                };
                            },
                        }}
                        filterColumns={columnConfigs}
                        filterStrategy="client"
                        getColumns={getColumns}
                        idField="id"
                        renderToolbarContent={renderToolbarContent}
                        virtualizationOptions={{
                            estimatedRowHeight: 40,
                            overscan: 5,
                        }}
                    />
                </ClientOnly>
                
                {/* Model Comparison Dialog */}
                <ModelComparisonDialog
                    isOpen={isComparisonDialogOpen}
                    onClose={() => setIsComparisonDialogOpen(false)}
                    selectedModels={selectedModelsForComparison}
                />
            </main>
            <footer className="flex items-center justify-between gap-4 sm:gap-10 px-4 py-3 flex-col sm:flex-row" ref={footerRef}>
                <div className="flex items-center gap-2">
                    <p className="text-sm text-[var(--color-text-tertiary)]">Powered by</p>
                    <a href="https://anolilab.com" rel="noopener noreferrer" target="_blank">
                        <AnolilabLogo className="h-6 fill-white" />
                    </a>
                </div>
                <ul className="flex items-center justify-center gap-2 text-sm text-white">
                    <li>
                        <a
                            className="hover:text-primary text-sm transition-colors"
                            href="https://anolilab.com/imprint"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            Imprint
                        </a>
                    </li>
                    <li className="text-muted-foreground">|</li>
                    <li>
                        <a className="hover:text-primary text-sm transition-colors" href="https://anolilab.com/terms" rel="noopener noreferrer" target="_blank">
                            Terms of Service
                        </a>
                    </li>
                    <li className="text-muted-foreground">|</li>
                    <li>
                        <a
                            className="hover:text-primary text-sm transition-colors"
                            href="https://anolilab.com/privacy"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            Privacy Policy
                        </a>
                    </li>
                </ul>
            </footer>
        </>
    );
};

export const Route = createFileRoute("/")({
    component: HomeComponent,
    loader: () => {
        const allModels = getAllModels();

        return { allModels };
    },
});
