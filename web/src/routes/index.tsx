import type { Model } from "@anolilab/ai-model-registry";
import { getAllModels } from "@anolilab/ai-model-registry";
import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { CheckSquare, Code, Database, DollarSign, File, FileText, Image, MoreHorizontal, Music, Search, Video } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import AnolilabLogo from "@/assets/images/anolilab_text.svg?react";
import { DataTable, useDataTable } from "@/components/data-table";
import HowToUseDialog from "@/components/how-to-use-dialog";
import SkeletonTable from "@/components/skeleton-table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import useIsMobile from "@/hooks/use-is-mobile";
import { ProviderIcon } from "@/utils/provider-icons";

/***
 * Data transformation utilities
 */
const formatCost = (cost: number | null): string => {
    if (cost === null || cost === undefined) {
        return "-";
    }

    if (cost === 0) {
        return "Free";
    }

    if (cost < 0.001) {
        return `$${(cost * 1000000).toFixed(2)}/1M tokens`;
    }

    if (cost < 1) {
        return `$${(cost * 1000).toFixed(2)}/1K tokens`;
    }

    return `$${cost.toFixed(2)}/token`;
};

const formatBoolean = (value: boolean | null | undefined): string => {
    if (value === null || value === undefined) {
        return "-";
    }

    return value ? "Yes" : "No";
};

const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined) {
        return "-";
    }

    if (value === 0) {
        return "-";
    }

    return value.toLocaleString();
};

const formatModalities = (modalities: string[]): string => {
    if (!modalities || modalities.length === 0) {
        return "-";
    }

    return modalities.join(", ");
};

/***
 * Model table row interface
 */
interface ModelTableRow {
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

/***
 * Transform model data to table rows
 */
const transformModelToTableRow = (model: Model, index: number): ModelTableRow => {
    return {
        cacheReadCost: formatCost(model.cost.inputCacheHit),
        cacheWriteCost: "-",
        contextLimit: model.limit.context ? formatNumber(model.limit.context) : "-",
        id: model.id,
        index,
        input: formatModalities(model.modalities.input),
        inputCost: formatCost(model.cost.input),
        knowledge: model.knowledge || "-",
        lastUpdated: model.lastUpdated || "-",
        model: (model.name || model.id).toLowerCase(),
        modelId: model.id,
        output: formatModalities(model.modalities.output),
        outputCost: formatCost(model.cost.output),
        outputLimit: model.limit.output ? formatNumber(model.limit.output) : "-",
        provider: model.provider || "Unknown",
        providerIcon: model.icon || null,
        providerId: model.providerId || "Unknown",
        reasoning: formatBoolean(model.reasoning),
        releaseDate: model.releaseDate || "-",
        temperature: formatBoolean(model.temperature),
        toolCall: formatBoolean(model.toolCall),
        weights: model.openWeights ? "Open" : "Closed",
    };
};

/***
 * Modality icon mapping
 */
const modalityIconMap: Record<string, React.ReactNode> = {
    audio: <Music className="size-4" />,
    code: <Code className="size-4" />,
    embedding: <Database className="size-4" />,
    file: <File className="size-4" />,
    image: <Image className="size-4" />,
    text: <FileText className="size-4" />,
    video: <Video className="size-4" />,
};

/***
 * Cell renderers
 */
const renderModalityCell = (value: string) => {
    const modalityList = value.split(",").map((m: string) => m.trim());

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

const renderCostCell = (value: string) => <span className="text-right">{value}</span>;

const renderNumberCell = (value: string) => {
    if (value === "-" || value === null || value === undefined) {
        return <span className="text-muted-foreground text-right text-xs">-</span>;
    }

    return <span className="text-right">{value}</span>;
};

const renderBooleanCell = (value: string) => <span className="text-muted-foreground text-xs">{value}</span>;

const renderMonoTextCell = (value: string) => <span className="text-muted-foreground font-mono text-xs">{value}</span>;

/***
 * Create TanStack column helper
 */
const columnHelper = createColumnHelper<ModelTableRow>();

/***
 * Custom hook for table height management
 */
const useTableHeight = () => {
    const [containerHeight, setContainerHeight] = useState(0);
    const [didMount, setDidMount] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const headerRef = useRef<HTMLDivElement>(null);
    const footerRef = useRef<HTMLDivElement>(null);
    const resizeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const isMobile = useIsMobile();

    const updateHeight = useCallback(() => {
        if (typeof window === "undefined") {
            return;
        }

        setIsResizing(true);

        const windowHeight = window.innerHeight;
        const headerHeight = headerRef.current?.offsetHeight || 0;
        const footerHeight = footerRef.current?.offsetHeight || 0;

        // Calculate available height for table
        const availableHeight = windowHeight - headerHeight - footerHeight - (isMobile ? 64 : 58);

        setContainerHeight(Math.max(400, availableHeight)); // Minimum 400px height

        // Clear previous timeout
        if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current);
        }

        // Set timeout to clear resizing state
        resizeTimeoutRef.current = setTimeout(() => {
            setIsResizing(false);
        }, 150);
    }, [isMobile]);

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

const HomeComponent = () => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const { allModels } = Route.useLoaderData();
    const isMobile = useIsMobile();

    const { containerHeight, didMount, footerRef, headerRef } = useTableHeight();

    /***
     * Transform models to table data with memoization
     */
    const tableData = useMemo(() => allModels
        .map((model, index) => transformModelToTableRow(model, index))
        .sort((a, b) => a.provider.localeCompare(b.provider)), [allModels]);

    /***
     * Create columns with TanStack helper and stable reference
     */
    const columns = useRef([
        columnHelper.accessor("providerIcon", {
            cell: ({ row }) => {
                const { provider } = row.original;
                const { providerIcon } = row.original;

                return <ProviderIcon className="h-6 w-6" provider={provider} providerIcon={providerIcon} />;
            },
            enableResizing: false, // Disable resizing for icon column
            enableSorting: false,
            header: "",
            id: "providerIcon",
            maxSize: 60, // Fixed width for icon column
            minSize: 60,
            size: 60,
        }),
        columnHelper.accessor("provider", {
            enableColumnFilter: true,
            enableSorting: true,
            header: "Provider",
            id: "provider",
            maxSize: 300,
            minSize: 150,
            size: 150,
        }),
        columnHelper.accessor("model", {
            enableColumnFilter: true,
            enableSorting: true,
            header: "Model",
            id: "model",
            maxSize: 600,
            minSize: 300,
            size: 300,
        }),
        columnHelper.accessor("providerId", {
            Cell: ({ cell }) => renderMonoTextCell(cell.getValue()),
            enableColumnFilter: true,
            enableSorting: true,
            header: "Provider ID",
            id: "providerId",
            maxSize: 400,
            minSize: 200,
            size: 200,
        }),
        columnHelper.accessor("modelId", {
            Cell: ({ cell }) => renderMonoTextCell(cell.getValue()),
            enableColumnFilter: true,
            enableSorting: true,
            header: "Model ID",
            id: "modelId",
            maxSize: 840,
            minSize: 420,
            size: 420,
        }),
        columnHelper.accessor("toolCall", {
            Cell: ({ cell }) => renderBooleanCell(cell.getValue()),
            enableColumnFilter: true,
            enableSorting: true,
            header: "Tool Call",
            id: "toolCall",
            maxSize: 260,
            minSize: 130,
            size: 130,
        }),
        columnHelper.accessor("reasoning", {
            Cell: ({ cell }) => renderBooleanCell(cell.getValue()),
            enableColumnFilter: true,
            enableSorting: true,
            header: "Reasoning",
            id: "reasoning",
            maxSize: 260,
            minSize: 130,
            size: 130,
        }),
        columnHelper.accessor("input", {
            Cell: ({ cell }) => renderModalityCell(cell.getValue()),
            enableColumnFilter: true,
            enableSorting: false,
            header: "Input",
            id: "input",
            maxSize: 300,
            minSize: 150,
            size: 150,
        }),
        columnHelper.accessor("output", {
            Cell: ({ cell }) => renderModalityCell(cell.getValue()),
            enableColumnFilter: true,
            enableSorting: false,
            header: "Output",
            id: "output",
            maxSize: 300,
            minSize: 150,
            size: 150,
        }),
        columnHelper.accessor("inputCost", {
            Cell: ({ cell }) => renderCostCell(cell.getValue()),
            enableColumnFilter: true,
            enableSorting: true,
            header: "Input Cost",
            id: "inputCost",
            maxSize: 300,
            minSize: 150,
            size: 150,
        }),
        columnHelper.accessor("outputCost", {
            Cell: ({ cell }) => renderCostCell(cell.getValue()),
            enableColumnFilter: true,
            enableSorting: true,
            header: "Output Cost",
            id: "outputCost",
            maxSize: 300,
            minSize: 150,
            size: 150,
        }),
        columnHelper.accessor("contextLimit", {
            Cell: ({ cell }) => renderNumberCell(cell.getValue()),
            enableColumnFilter: true,
            enableSorting: true,
            header: "Context Limit",
            id: "contextLimit",
            maxSize: 400,
            minSize: 200,
            size: 200,
        }),
        columnHelper.accessor("outputLimit", {
            Cell: ({ cell }) => renderNumberCell(cell.getValue()),
            enableColumnFilter: true,
            enableSorting: true,
            header: "Output Limit",
            id: "outputLimit",
            maxSize: 320,
            minSize: 160,
            size: 160,
        }),
    ]);

    /***
     * Create filter configuration with stable reference
     */
    const filterConfig = useRef([
        {
            accessor: (row: ModelTableRow) => row.provider,
            displayName: "Provider",
            icon: Search,
            id: "provider",
            type: "text" as const,
        },
        {
            accessor: (row: ModelTableRow) => row.model,
            displayName: "Model",
            icon: Search,
            id: "model",
            type: "text" as const,
        },
        {
            accessor: (row: ModelTableRow) => row.providerId,
            displayName: "Provider ID",
            icon: Search,
            id: "providerId",
            type: "text" as const,
        },
        {
            accessor: (row: ModelTableRow) => row.modelId,
            displayName: "Model ID",
            icon: Search,
            id: "modelId",
            type: "text" as const,
        },
        {
            accessor: (row: ModelTableRow) => row.toolCall,
            displayName: "Tool Call",
            icon: CheckSquare,
            id: "toolCall",
            type: "option" as const,
        },
        {
            accessor: (row: ModelTableRow) => row.reasoning,
            displayName: "Reasoning",
            icon: CheckSquare,
            id: "reasoning",
            type: "option" as const,
        },
        {
            accessor: (row: ModelTableRow) => row.input,
            displayName: "Input",
            icon: Search,
            id: "input",
            type: "text" as const,
        },
        {
            accessor: (row: ModelTableRow) => row.output,
            displayName: "Output",
            icon: Search,
            id: "output",
            type: "text" as const,
        },
        {
            accessor: (row: ModelTableRow) => row.inputCost,
            displayName: "Input Cost",
            icon: DollarSign,
            id: "inputCost",
            type: "number" as const,
        },
        {
            accessor: (row: ModelTableRow) => row.outputCost,
            displayName: "Output Cost",
            icon: DollarSign,
            id: "outputCost",
            type: "number" as const,
        },
        {
            accessor: (row: ModelTableRow) => row.contextLimit,
            displayName: "Context Limit",
            icon: DollarSign,
            id: "contextLimit",
            type: "number" as const,
        },
        {
            accessor: (row: ModelTableRow) => row.outputLimit,
            displayName: "Output Limit",
            icon: DollarSign,
            id: "outputLimit",
            type: "number" as const,
        },
    ]);

    /***
     * Configure DataTable with features
     */
    const { features, table } = useDataTable({
        columns: columns.current,
        data: tableData,
        features: {
            clickToCopy: {
                enabled: false,
            },
            columnResizing: {
                enabled: true, // ✅ ENABLED: Required for column sizes to be applied
            },
            filters: {
                columns: filterConfig.current,
                enabled: true,
                strategy: "client",
            },
            keyboardNavigation: {
                enableArrowKeys: true,
                enabled: true,
                enableEnterKey: true,
                enableTabKey: true,
            },
            pagination: {
                enabled: false, // Disabled as per original config
            },
            rowNumbers: {
                enabled: false,
            },
            selection: {
                enabled: true, // ✅ ENABLED: Selection functionality restored
            },
            toolbar: {
                columnVisibility: true,
                customActions: null,
                enabled: true,
                export: { enabled: true },
                filters: true,
                search: { enabled: true },
            },
            virtualization: {
                containerHeight: didMount ? containerHeight : 600,
                enabled: true, // ✅ ENABLED for performance
                estimatedRowHeight: 40,
                overscan: 5,
            },
        },
    });

    let Menu = (
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
    );

    if (isMobile) {
        Menu = (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button className="flex items-center gap-2 text-sm" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                        <HowToUseDialog />
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <a className="w-full cursor-pointer" href="https://github.com/anolilab/ai-models" rel="noopener noreferrer" target="_blank">
                            GitHub
                        </a>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <div className="flex h-screen flex-col">
            <header className="flex items-center justify-between border-b px-3 py-2" ref={headerRef} style={{ height: "56px" }}>
                <div className="left flex min-w-0 items-center gap-2">
                    <h1 className="text-lg font-bold tracking-tight uppercase">Models</h1>
                    <span className="slash" />
                    <p className="truncate text-sm text-[var(--color-text-tertiary)]">An open-source database of AI models</p>
                </div>
                <div className="right flex items-center gap-3">{Menu}</div>
            </header>
            <main className="flex-1 overflow-hidden">
                <ClientOnly fallback={<SkeletonTable columns={isMobile ? 2 : 20} rows={15} />}>
                    <div className="h-full">
                        <DataTable features={features} table={table} />
                    </div>
                </ClientOnly>
            </main>
            <footer className="flex flex-col items-center justify-between gap-4 px-4 py-3 sm:flex-row sm:gap-10" ref={footerRef}>
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
        </div>
    );
};

// eslint-disable-next-line import/prefer-default-export
export const Route = createFileRoute("/")({
    component: HomeComponent,
    loader: () => {
        const allModels = getAllModels();

        return { allModels };
    },
});
