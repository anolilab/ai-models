import { getAllModels } from "@anolilab/ai-model-registry";
import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { BarChart3, Copy, MoreHorizontal, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";

import AnolilabLogo from "@/assets/images/anolilab_text.svg?react";
import ModelComparisonDialog from "@/components/comparison/model-comparison-dialog";
import DataTable from "@/components/data-table/data-table";
import HowToUseDialog from "@/components/how-to-use-dialog";
import SkeletonTable from "@/components/skeleton-table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import useIsMobile from "@/hooks/use-is-mobile";
import { useModelTable, useSelectionMode, useTableHeight } from "@/hooks/use-table";

const HomeComponent = () => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const { allModels } = Route.useLoaderData();
    const isMobile = useIsMobile();

    // Custom hooks
    const { containerHeight, didMount, footerRef, headerRef } = useTableHeight();

    const { getValidationMessage, handleModeChange, maxSelectionLimit, selectionMode } = useSelectionMode();

    const { columns, exportConfig, filterConfig, tableData } = useModelTable(allModels, {
        enableColumnHiding: true,
        enableColumnResizing: false,
        enableFiltering: true,
        enableSorting: true,
    });

    // Local state
    const [isComparisonDialogOpen, setIsComparisonDialogOpen] = useState(false);
    const [selectedModelsForComparison, setSelectedModelsForComparison] = useState<typeof tableData>([]);

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
        }) => (
            <div className="flex items-center gap-4">
                {totalSelectedCount > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{getValidationMessage(totalSelectedCount)}</span>
                        <div className="flex items-center gap-2">
                            {selectionMode === "comparison" && totalSelectedCount > 1 && (
                                <Button
                                    onClick={() => {
                                        // Store selected models for comparison
                                        setSelectedModelsForComparison(selectedRows);
                                        setIsComparisonDialogOpen(true);
                                    }}
                                    variant="default"
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
                            >
                                <Copy className="mr-1 h-4 w-4" />
                                Copy IDs
                            </Button>

                            <Button onClick={resetSelection} variant="outline">
                                <Trash2 className="mr-1 h-4 w-4" />
                                Clear
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        ),
        [selectionMode, maxSelectionLimit, handleModeChange, getValidationMessage],
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
                    {isMobile ? (
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
                    ) : (
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
                            estimatedRowHeight: 40,
                            maxSelectionLimit,
                            selectionMode,
                            virtualizationOverscan: 5,
                        }}
                        containerHeight={didMount ? containerHeight : undefined}
                        data={tableData}
                        defaultSorting={{
                            sortBy: "provider",
                            sortOrder: "asc",
                        }}
                        exportConfig={exportConfig}
                        filterColumns={filterConfig}
                        filterStrategy="client"
                        getColumns={() => columns}
                        idField="id"
                        renderToolbarContent={renderToolbarContent}
                        virtualizationOptions={{
                            estimatedRowHeight: 40,
                            overscan: 5,
                        }}
                    />
                </ClientOnly>

                <ModelComparisonDialog
                    isOpen={isComparisonDialogOpen}
                    onClose={() => setIsComparisonDialogOpen(false)}
                    selectedModels={selectedModelsForComparison}
                />
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
