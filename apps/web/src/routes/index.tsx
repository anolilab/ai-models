import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { getAllModels, type Model } from "@anolilab/provider-registry";
import { FileText, Image as ImageIcon, Video, ScatterChart, Search, Calendar, Volume2, Trash2, Copy, File } from "lucide-react";
import { useMemo, useState, useEffect, useCallback } from "react";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { DataTable } from "@/components/data-table/data-table";
import { SkeletonTable } from "@/components/skeleton-table";
import type { ColumnConfig } from "@/components/data-table/filter/core/types";
import { textFilterFn, numberFilterFn, dateFilterFn } from "@/components/data-table/filter/integrations/tanstack-table/filter-fns";
import { optionFilterFn } from "@/components/data-table/filter/lib/filter-fns";
import AnolilabLogo from "@/assets/images/anolilab_text.svg?react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ProviderIcon } from "@/utils/provider-icons";

const modalityIconMap: Record<string, React.ReactNode> = {
    text: <FileText className="inline size-4" />,
    image: <ImageIcon className="inline size-4" />,
    video: <Video className="inline size-4" />,
    audio: <Volume2 className="inline size-4" />,
    embedding: <ScatterChart className="inline size-4" />,
    file: <File className="inline size-4" />,
};

const HomeComponent = () => {
    const { allModels } = Route.useLoaderData();
    const [containerHeight, setContainerHeight] = useState(600);

    useEffect(() => {
        const updateHeight = () => {
            setContainerHeight(window.innerHeight - 160);
        };

        updateHeight();

        window.addEventListener("resize", updateHeight);

        return () => window.removeEventListener("resize", updateHeight);
    }, []);

    // Helper function to format cost as currency
    const formatCost = (cost: number | null): string => {
        if (cost === null || cost === undefined) return "-";
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
        }).format(cost);
    };

    // Transform the data to match our table structure
    const tableData = useMemo(() => {
        const processed = allModels.map((model: Model, index: number) => ({
            id: index + model.id,
            provider: model.provider || "Unknown",
            providerId: model.providerId || "Unknown",
            providerIcon: model.icon || null,
            model: (model.name || model.id).toLowerCase(),
            modelId: model.id,
            toolCall: model.toolCall,
            reasoning: model.reasoning,
            input: model.modalities.input.join(", "),
            output: model.modalities.output.join(", "),
            inputCost: formatCost(model.cost.input),
            outputCost: formatCost(model.cost.output),
            cacheReadCost: formatCost(model.cost.inputCacheHit),
            cacheWriteCost: "-", // Not available in our data
            contextLimit: model.limit.context ? model.limit.context.toLocaleString() : "-",
            outputLimit: model.limit.output ? model.limit.output.toLocaleString() : "-",
            temperature: model.temperature ? "Yes" : "No",
            weights: model.openWeights ? "Open" : "Closed",
            knowledge: model.knowledge || "-",
            releaseDate: model.releaseDate || "-",
            lastUpdated: model.lastUpdated || "-",
        }));

        // Sort alphabetically by provider
        return processed.sort((a, b) => a.provider.localeCompare(b.provider));
    }, [allModels]);

    // Column configurations for data-table-filter - only the ones we want to filter
    const columnConfigs: ColumnConfig<(typeof tableData)[0]>[] = useMemo(
        () => [
            {
                id: "provider",
                accessor: (row) => row.provider,
                displayName: "Provider",
                icon: Search,
                type: "text",
            },
            {
                id: "model",
                accessor: (row) => row.model,
                displayName: "Model",
                icon: Search,
                type: "text",
            },
            {
                id: "inputCost",
                accessor: (row) => {
                    const cost = row.inputCost.replace(/[^0-9.]/g, "");
                    return cost === "-" ? 0 : parseFloat(cost);
                },
                displayName: "Input Cost",
                icon: Search,
                type: "number",
            },
            {
                id: "outputCost",
                accessor: (row) => {
                    const cost = row.outputCost.replace(/[^0-9.]/g, "");
                    return cost === "-" ? 0 : parseFloat(cost);
                },
                displayName: "Output Cost",
                icon: Search,
                type: "number",
            },
            {
                id: "lastUpdated",
                accessor: (row) => {
                    if (row.lastUpdated === "-") return null;
                    return new Date(row.lastUpdated);
                },
                displayName: "Last Updated",
                icon: Calendar,
                type: "date",
            },
            {
                id: "toolCall",
                accessor: (row) => row.toolCall,
                displayName: "Tool Call",
                icon: Search,
                type: "option",
                options: [
                    { label: "Yes", value: "Yes" },
                    { label: "No", value: "No" },
                ],
            },
            {
                id: "reasoning",
                accessor: (row) => row.reasoning,
                displayName: "Reasoning",
                icon: Search,
                type: "option",
                options: [
                    { label: "Yes", value: "Yes" },
                    { label: "No", value: "No" },
                ],
            },
        ],
        [],
    );

    const baseColumns: ColumnDef<(typeof tableData)[0]>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <div className="p-2">
                    <Checkbox
                        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Select all"
                    />
                </div>
            ),
            cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />,
            enableSorting: false,
            enableHiding: false,
            size: 60,
        },
        {
            id: "providerIcon",
            accessorKey: "providerIcon",
            size: 60,
            header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
            cell: ({ row }) => <ProviderIcon providerIcon={row.original.providerIcon} provider={row.original.provider} className="h-6 w-6" />,
            enableColumnFilter: false,
            enableSorting: false,
        },
        {
            id: "provider",
            accessorKey: "provider",
            size: 150,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Provider" />,
            enableColumnFilter: true,
            enableSorting: true,
            sortingFn: "text",
            filterFn: textFilterFn,
        },
        {
            id: "model",
            accessorKey: "model",
            size: 300,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Model" />,
            enableColumnFilter: true,
            enableSorting: true,
            sortingFn: "text",
            filterFn: textFilterFn,
        },
        {
            id: "providerId",
            accessorKey: "providerId",
            size: 200,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Provider ID" />,
            cell: ({ row }) => {
                return <span className="text-muted-foreground font-mono-id text-xs">{row.original.providerId}</span>;
            },
            enableColumnFilter: true,
            enableSorting: true,
        },
        {
            id: "modelId",
            accessorKey: "modelId",
            size: 420,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Model ID" />,
            cell: ({ row }) => {
                return <span className="text-muted-foreground font-mono-id text-xs">{row.original.modelId}</span>;
            },
            enableColumnFilter: true,
        },
        {
            id: "toolCall",
            accessorKey: "toolCall",
            size: 130,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Tool Call" />,
            enableColumnFilter: true,
            sortingFn: "basic",
            filterFn: (row, columnId, filterValue) => {
                const value = row.getValue<string>(columnId);
                return optionFilterFn(value, filterValue);
            },
        },
        {
            id: "reasoning",
            accessorKey: "reasoning",
            size: 130,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Reasoning" />,
            enableColumnFilter: true,
            sortingFn: "basic",
            filterFn: (row, columnId, filterValue) => {
                const value = row.getValue<string>(columnId);
                return optionFilterFn(value, filterValue);
            },
        },
        {
            accessorKey: "input",
            size: 150,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Input" />,
            enableColumnFilter: true,
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
                                        key={`input-${modality}-${index}`}
                                        title={modality.charAt(0).toUpperCase() + modality.slice(1)}
                                        className="border-border text-muted-foreground border px-1 py-0.5"
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
        },
        {
            accessorKey: "output",
            size: 150,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Output" />,
            enableColumnFilter: true,
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
                                        key={`output-${modality}-${index}`}
                                        title={modality.charAt(0).toUpperCase() + modality.slice(1)}
                                        className="border-border text-muted-foreground border px-1 py-0.5"
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
        },
        {
            id: "inputCost",
            accessorFn: (row) => {
                const cost = row.inputCost.replace(/[^0-9.]/g, "");
                return cost === "-" ? 0 : parseFloat(cost);
            },
            size: 150,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Input Cost" />,
            enableColumnFilter: true,
            sortingFn: "basic",
            filterFn: numberFilterFn,
        },
        {
            id: "outputCost",
            accessorFn: (row) => {
                const cost = row.outputCost.replace(/[^0-9.]/g, "");
                return cost === "-" ? 0 : parseFloat(cost);
            },
            size: 150,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Output Cost" />,
            enableColumnFilter: true,
            sortingFn: "basic",
            filterFn: numberFilterFn,
        },
        {
            accessorKey: "cacheReadCost",
            size: 200,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Cache Read Cost" />,
            enableColumnFilter: true,
        },
        {
            accessorKey: "cacheWriteCost",
            size: 200,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Cache Write Cost" />,
            enableColumnFilter: true,
        },
        {
            id: "contextLimit",
            accessorFn: (row) => {
                const limit = row.contextLimit.replace(/[^0-9]/g, "");
                return limit === "-" ? 0 : parseInt(limit, 10);
            },
            size: 200,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Context Limit" />,
            cell: ({ row }) => {
                const value = row.original.contextLimit;
                if (value === "-") return <span className="text-muted-foreground text-xs">-</span>;

                // Parse the number and format with commas
                const num = parseInt(value.replace(/[^0-9]/g, ""), 10);
                const formatted = num.toLocaleString();
                return <span>{formatted}</span>;
            },
            enableColumnFilter: true,
            sortingFn: "basic",
        },
        {
            id: "outputLimit",
            accessorFn: (row) => {
                const limit = row.outputLimit.replace(/[^0-9]/g, "");
                return limit === "-" ? 0 : parseInt(limit, 10);
            },
            size: 160,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Output Limit" />,
            cell: ({ row }) => {
                const value = row.original.outputLimit;
                if (value === "-") return <span className="text-muted-foreground text-xs">-</span>;

                // Parse the number and format with commas
                const num = parseInt(value.replace(/[^0-9]/g, ""), 10);
                const formatted = num.toLocaleString();
                return <span>{formatted}</span>;
            },
            enableColumnFilter: true,
            sortingFn: "basic",
        },
        {
            accessorKey: "temperature",
            size: 150,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Temperature" />,
            cell: ({ row }) => {
                return <span className="text-muted-foreground text-xs">{row.original.temperature}</span>;
            },
            enableColumnFilter: true,
            sortingFn: "basic",
        },
        {
            accessorKey: "weights",
            size: 140,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Weights" />,
            cell: ({ row }) => {
                return <span className="text-muted-foreground text-xs">{row.original.weights}</span>;
            },
            enableColumnFilter: true,
            sortingFn: "basic",
        },
        {
            accessorKey: "knowledge",
            size: 150,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Knowledge" />,
            cell: ({ row }) => {
                return <span className="text-muted-foreground text-xs">{row.original.knowledge}</span>;
            },
            enableColumnFilter: true,
        },
        {
            accessorKey: "releaseDate",
            size: 200,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Release Date" />,
            cell: ({ row }) => {
                return <span className="text-muted-foreground text-xs">{row.original.releaseDate}</span>;
            },
            enableColumnFilter: true,
        },
        {
            id: "lastUpdated",
            accessorFn: (row) => {
                if (row.lastUpdated === "-") return null;
                return new Date(row.lastUpdated);
            },
            size: 200,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Last Updated" />,
            cell: ({ row }) => {
                return <span className="text-muted-foreground text-xs">{row.original.lastUpdated}</span>;
            },
            enableColumnFilter: true,
            sortingFn: "datetime",
            filterFn: dateFilterFn,
        },
    ];

    // Create columns with row deselection handler
    const getColumns = useCallback(
        (handleRowDeselection: ((rowId: string) => void) | null | undefined) => {
            return baseColumns;
        },
        [baseColumns],
    );

    // Custom toolbar component for selection actions
    const renderToolbarContent = useCallback(
        ({
            selectedRows,
            totalSelectedCount,
            resetSelection,
        }: {
            selectedRows: typeof tableData;
            allSelectedIds: (string | number)[];
            totalSelectedCount: number;
            resetSelection: () => void;
        }) => {
            if (totalSelectedCount === 0) return null;

            return (
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                        {totalSelectedCount} model{totalSelectedCount !== 1 ? "s" : ""} selected
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                // Copy selected model IDs to clipboard
                                const modelIds = selectedRows.map((row) => row.modelId).join("\n");
                                navigator.clipboard.writeText(modelIds);
                            }}
                        >
                            <Copy className="mr-1 h-4 w-4" />
                            Copy IDs
                        </Button>

                        <Button variant="outline" onClick={resetSelection}>
                            <Trash2 className="mr-1 h-4 w-4" />
                            Clear
                        </Button>
                    </div>
                </div>
            );
        },
        [],
    );

    return (
        <>
            <header className="flex items-center justify-between border-b px-3 py-2" style={{ height: "56px" }}>
                <div className="left flex min-w-0 items-center gap-2">
                    <h1 className="text-lg font-bold tracking-tight uppercase">Models</h1>
                    <span className="slash" />
                    <p className="truncate text-sm text-[var(--color-text-tertiary)]">An open-source database of AI models</p>
                </div>
                <div className="right flex items-center gap-3">
                    <Button id="help" className="bg-[var(--color-brand)] px-3 py-2 text-sm text-[var(--color-text-invert)]">
                        How to use
                    </Button>

                    <a className="github" target="_blank" rel="noopener noreferrer" href="https://github.com/anolilab/ai-models">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"
                            ></path>
                        </svg>
                    </a>
                </div>
            </header>
            <main>
                <ClientOnly fallback={<SkeletonTable rows={15} columns={20} />}>
                    <DataTable<(typeof tableData)[0], any>
                        getColumns={getColumns}
                        data={tableData}
                        idField="id"
                        filterColumns={columnConfigs}
                        filterStrategy="client"
                        containerHeight={containerHeight}
                        renderToolbarContent={renderToolbarContent}
                        exportConfig={{
                            entityName: "models",
                            columnMapping: {
                                providerIcon: "Provider Icon",
                                provider: "Provider",
                                model: "Model",
                                providerId: "Provider ID",
                                modelId: "Model ID",
                                toolCall: "Tool Call",
                                reasoning: "Reasoning",
                                input: "Input",
                                output: "Output",
                                inputCost: "Input Cost",
                                outputCost: "Output Cost",
                                cacheReadCost: "Cache Read Cost",
                                cacheWriteCost: "Cache Write Cost",
                                contextLimit: "Context Limit",
                                outputLimit: "Output Limit",
                                temperature: "Temperature",
                                weights: "Weights",
                                knowledge: "Knowledge",
                                releaseDate: "Release Date",
                                lastUpdated: "Last Updated",
                            },
                            transformFunction: (row) => ({
                                providerIcon: row.providerIcon,
                                provider: row.provider,
                                model: row.model,
                                providerId: row.providerId,
                                modelId: row.modelId,
                                toolCall: row.toolCall,
                                reasoning: row.reasoning,
                                input: row.input,
                                output: row.output,
                                inputCost: row.inputCost,
                                outputCost: row.outputCost,
                                cacheReadCost: row.cacheReadCost,
                                cacheWriteCost: row.cacheWriteCost,
                                contextLimit: row.contextLimit,
                                outputLimit: row.outputLimit,
                                temperature: row.temperature,
                                weights: row.weights,
                                knowledge: row.knowledge,
                                releaseDate: row.releaseDate,
                                lastUpdated: row.lastUpdated,
                            }),
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
                        }}
                        config={{
                            enableRowSelection: true,
                            enableColumnResizing: false,
                            enablePagination: false,
                            enableColumnVisibility: true,
                            enableToolbar: true,
                            enableStickyHeader: true,
                            // Performance optimizations
                            enableRowVirtualization: true,
                            estimatedRowHeight: 40,
                            virtualizationOverscan: 5,
                        }}
                        virtualizationOptions={{
                            estimatedRowHeight: 40,
                            overscan: 5,
                        }}
                        defaultSorting={{
                            sortBy: "provider",
                            sortOrder: "asc",
                        }}
                    />
                </ClientOnly>
            </main>
            <footer className="flex items-center justify-between gap-10 px-4 py-3">
                <div className="flex items-center gap-2">
                    <p className="text-sm text-[var(--color-text-tertiary)]">Powered by</p>
                    <a href="https://anolilab.com" target="_blank" rel="noopener noreferrer">
                        <AnolilabLogo className="h-6 fill-white" />
                    </a>
                </div>
                <ul className="flex items-center justify-center gap-2 text-sm text-white">
                    <li>
                        <a
                            className="hover:text-primary text-sm transition-colors"
                            href="https://anolilab.com/imprint"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Imprint
                        </a>
                    </li>
                    <li className="text-muted-foreground">|</li>
                    <li>
                        <a className="hover:text-primary text-sm transition-colors" href="https://anolilab.com/terms" target="_blank" rel="noopener noreferrer">
                            Terms of Service
                        </a>
                    </li>
                    <li className="text-muted-foreground">|</li>
                    <li>
                        <a
                            className="hover:text-primary text-sm transition-colors"
                            href="https://anolilab.com/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
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
