import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { getAllModels, type Model } from "@anolilab/provider-registry";
import { FileText, Image as ImageIcon, Video, ScatterChart } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu"; 
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { useDataTable } from "@/hooks/use-data-table";

const modalityIconMap: Record<string, React.ReactNode> = {
  text: <FileText className="inline size-4" />,
  image: <ImageIcon className="inline size-4" />,
  video: <Video className="inline size-4" />,
  embedding: <ScatterChart className="inline size-4" />,
};

const HomeComponent = () => {
  // Get all models from the provider registry
  const allModels = getAllModels();
  
  // Helper function to format cost as currency
  const formatCost = (cost: number | null): string => {
    if (cost === null || cost === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(cost);
  };

  // Transform the data to match our table structure
  const tableData = allModels.map((model: Model) => ({
    provider: model.provider || 'Unknown',
    model: model.name || model.id,
    providerId: model.provider || 'Unknown',
    modelId: model.id,
    toolCall: model.tool_call,
    reasoning: model.reasoning,
    input: model.modalities.input.join(', '),
    output: model.modalities.output.join(', '),
    inputCost: formatCost(model.cost.input),
    outputCost: formatCost(model.cost.output),
    cacheReadCost: formatCost(model.cost.input_cache_hit),
    cacheWriteCost: 'N/A', // Not available in our data
    contextLimit: model.limit.context ? model.limit.context.toLocaleString() : 'N/A',
    outputLimit: model.limit.output ? model.limit.output.toLocaleString() : 'N/A',
    temperature: model.temperature ? 'Yes' : 'No',
    weights: model.open_weights ? 'Open' : 'Closed',
    knowledge: model.knowledge || 'N/A',
    releaseDate: model.release_date || 'N/A',
    lastUpdated: model.last_updated || 'N/A',
  }));

  const columns: ColumnDef<typeof tableData[0]>[] = [
    { 
      accessorKey: "provider", 
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Provider" />
      ),
      enableColumnFilter: true,
      meta: { 
        label: "Provider",
        variant: "text",
        placeholder: "Filter providers..."
      }
    },
    { 
      accessorKey: "model", 
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Model" />
      ),
      enableColumnFilter: true,
      meta: { 
        label: "Model",
        variant: "text",
        placeholder: "Filter models..."
      }
    },
    { 
      accessorKey: "providerId", 
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Provider ID" />
      ),
      enableColumnFilter: true,
      meta: { 
        label: "Provider ID",
        variant: "text",
        placeholder: "Filter provider IDs..."
      }
    },
    { 
      accessorKey: "modelId", 
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Model ID" />
      ),
      enableColumnFilter: true,
      meta: { 
        label: "Model ID",
        variant: "text",
        placeholder: "Filter model IDs..."
      }
    },
    { 
      accessorKey: "toolCall", 
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tool Call" />
      ),
      enableColumnFilter: true,
      meta: { 
        label: "Tool Call",
        variant: "select",
        options: [
          { label: "Yes", value: "Yes" },
          { label: "No", value: "No" }
        ]
      }
    },
    { 
      accessorKey: "reasoning", 
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Reasoning" />
      ),
      enableColumnFilter: true,
      meta: { 
        label: "Reasoning",
        variant: "select",
        options: [
          { label: "Yes", value: "Yes" },
          { label: "No", value: "No" }
        ]
      }
    },
    {
      accessorKey: "input",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Input" />
      ),
      enableColumnFilter: true,
      meta: { 
        label: "Input Modalities",
        variant: "text",
        placeholder: "Filter input modalities..."
      },
      cell: ({ row }) => {
        const modalities = row.original.input.split(',').map((m: string) => m.trim());
        return (
          <span className="flex gap-1 items-center">
            {modalities.map((modality: string) =>
              modalityIconMap[modality] ? (
                <Tooltip key={modality}>
                  <TooltipTrigger asChild>
                    <span>{modalityIconMap[modality]}</span>
                  </TooltipTrigger>
                  <TooltipContent>{modality.charAt(0).toUpperCase() + modality.slice(1)}</TooltipContent>
                </Tooltip>
              ) : (
                <span key={modality}>{modality}</span>
              )
            )}
          </span>
        );
      },
    },
    {
      accessorKey: "output",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Output" />
      ),
      enableColumnFilter: true,
      meta: { 
        label: "Output Modalities",
        variant: "text",
        placeholder: "Filter output modalities..."
      },
      cell: ({ row }) => {
        const modalities = row.original.output.split(',').map((m: string) => m.trim());
        return (
          <span className="flex gap-1 items-center">
            {modalities.map((modality: string) =>
              modalityIconMap[modality] ? (
                <Tooltip key={modality}>
                  <TooltipTrigger asChild>
                    <span>{modalityIconMap[modality]}</span>
                  </TooltipTrigger>
                  <TooltipContent>{modality.charAt(0).toUpperCase() + modality.slice(1)}</TooltipContent>
                </Tooltip>
              ) : (
                <span key={modality}>{modality}</span>
              )
            )}
          </span>
        );
      },
    },
    { 
      accessorKey: "inputCost", 
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Input Cost" />
      ),
      enableColumnFilter: true,
      meta: { 
        label: "Input Cost",
        variant: "number",
        placeholder: "Filter input cost...",
        unit: "$"
      }
    },
    { 
      accessorKey: "outputCost", 
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Output Cost" />
      ),
      enableColumnFilter: true,
      meta: { 
        label: "Output Cost",
        variant: "number",
        placeholder: "Filter output cost...",
        unit: "$"
      }
    },
    { 
      accessorKey: "cacheReadCost", 
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Cache Read Cost" />
      ),
      enableColumnFilter: true,
      meta: { 
        label: "Cache Read Cost",
        variant: "number",
        placeholder: "Filter cache read cost...",
        unit: "$"
      }
    },
    { 
      accessorKey: "cacheWriteCost", 
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Cache Write Cost" />
      ),
      enableColumnFilter: true,
      meta: { 
        label: "Cache Write Cost",
        variant: "text",
        placeholder: "Filter cache write cost..."
      }
    },
    { 
      accessorKey: "contextLimit", 
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Context Limit" />
      ),
      enableColumnFilter: true,
      meta: { 
        label: "Context Limit",
        variant: "number",
        placeholder: "Filter context limit..."
      }
    },
    { 
      accessorKey: "outputLimit", 
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Output Limit" />
      ),
      enableColumnFilter: true,
      meta: { 
        label: "Output Limit",
        variant: "number",
        placeholder: "Filter output limit..."
      }
    },
    { 
      accessorKey: "temperature", 
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Temperature" />
      ),
      enableColumnFilter: true,
      meta: { 
        label: "Temperature",
        variant: "select",
        options: [
          { label: "Yes", value: "Yes" },
          { label: "No", value: "No" }
        ]
      }
    },
    { 
      accessorKey: "weights", 
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Weights" />
      ),
      enableColumnFilter: true,
      meta: { 
        label: "Weights",
        variant: "select",
        options: [
          { label: "Open", value: "Open" },
          { label: "Closed", value: "Closed" }
        ]
      }
    },
    { 
      accessorKey: "knowledge", 
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Knowledge" />
      ),
      enableColumnFilter: true,
      meta: { 
        label: "Knowledge",
        variant: "text",
        placeholder: "Filter knowledge..."
      }
    },
    { 
      accessorKey: "releaseDate", 
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Release Date" />
      ),
      enableColumnFilter: true,
      meta: { 
        label: "Release Date",
        variant: "text",
        placeholder: "Filter release date..."
      }
    },
    { 
      accessorKey: "lastUpdated", 
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last Updated" />
      ),
      enableColumnFilter: true,
      meta: { 
        label: "Last Updated",
        variant: "text",
        placeholder: "Filter last updated..."
      }
    },
  ];

  const { table } = useDataTable({
    data: tableData,
    columns,
    pageCount: Math.ceil(tableData.length / 10), // Assuming 10 items per page
  });

  return (
    <TooltipProvider delayDuration={100}>
      <div className="min-h-screen w-full bg-background">
        <header className="flex items-center justify-between px-3 py-2 border-b" style={{ height: '56px' }}>
          <div className="left flex items-center gap-2 min-w-0">
            <h1 className="font-bold text-lg uppercase tracking-tight">Models.dev</h1>
            <span className="slash" />
            <p className="truncate text-sm text-[var(--color-text-tertiary)]">An open-source database of AI models</p>
          </div>
          <div className="right flex items-center gap-3">
            <a className="github" target="_blank" rel="noopener noreferrer" href="https://github.com/sst/models.dev">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"></path></svg>
            </a>
            <div className="search-container relative min-w-[12.5rem]">
              <input type="text" id="search" placeholder="Filter by model" className="w-full text-sm px-3 py-2 rounded border" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', background: 'none' }} />
              <span className="search-shortcut absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-tertiary)] pointer-events-none">⌘K</span>
            </div>
            <button id="help" className="bg-[var(--color-brand)] text-[var(--color-text-invert)] text-sm px-3 py-2 rounded">How to use</button>
          </div>
        </header>
        <main className="w-full">
          <DataTable table={table}>
            <DataTableAdvancedToolbar table={table}>
              <DataTableFilterMenu table={table} />
              <DataTableSortList table={table} />
            </DataTableAdvancedToolbar>
          </DataTable>
        </main>
      </div>
    </TooltipProvider>
  );
}

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

