import { createFileRoute } from "@tanstack/react-router";
import {   Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ColumnDef } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

const DataTable = <TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })
 
  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

const HomeComponent = () => {
  // Table columns matching the provided HTML
  type Model = {
    provider: string;
    model: string;
    providerId: string;
    modelId: string;
    toolCall: boolean;
    reasoning: boolean;
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
  };
  const columns: ColumnDef<Model>[] = [
    { accessorKey: "provider", header: () => <>Provider <span className="sort-indicator" /></>, meta: { type: "text" } },
    { accessorKey: "model", header: () => <>Model <span className="sort-indicator" /></>, meta: { type: "text" } },
    { accessorKey: "providerId", header: () => <>Provider ID <span className="sort-indicator" /></>, meta: { type: "text" } },
    { accessorKey: "modelId", header: () => <>Model ID <span className="sort-indicator" /></>, meta: { type: "text" } },
    { accessorKey: "toolCall", header: () => <>Tool Call <span className="sort-indicator" /></>, meta: { type: "boolean" } },
    { accessorKey: "reasoning", header: () => <>Reasoning <span className="sort-indicator" /></>, meta: { type: "boolean" } },
    { accessorKey: "input", header: () => <>Input <span className="sort-indicator" /></>, meta: { type: "modalities" } },
    { accessorKey: "output", header: () => <>Output <span className="sort-indicator" /></>, meta: { type: "modalities" } },
    { accessorKey: "inputCost", header: () => <div className="header-container"><span className="header-text">Input Cost<br /><span className="desc">per 1M tokens</span></span><span className="sort-indicator" /></div>, meta: { type: "number" } },
    { accessorKey: "outputCost", header: () => <div className="header-container"><span className="header-text">Output Cost<br /><span className="desc">per 1M tokens</span></span><span className="sort-indicator" /></div>, meta: { type: "number" } },
    { accessorKey: "cacheReadCost", header: () => <div className="header-container"><span className="header-text">Cache Read Cost<br /><span className="desc">per 1M tokens</span></span><span className="sort-indicator" /></div>, meta: { type: "number" } },
    { accessorKey: "cacheWriteCost", header: () => <div className="header-container"><span className="header-text">Cache Write Cost<br /><span className="desc">per 1M tokens</span></span><span className="sort-indicator" /></div>, meta: { type: "number" } },
    { accessorKey: "contextLimit", header: () => <>Context Limit <span className="sort-indicator" /></>, meta: { type: "number" } },
    { accessorKey: "outputLimit", header: () => <>Output Limit <span className="sort-indicator" /></>, meta: { type: "number" } },
    { accessorKey: "temperature", header: () => <>Temperature <span className="sort-indicator" /></>, meta: { type: "boolean" } },
    { accessorKey: "weights", header: () => <>Weights <span className="sort-indicator" /></>, meta: { type: "text" } },
    { accessorKey: "knowledge", header: () => <>Knowledge <span className="sort-indicator" /></>, meta: { type: "text" } },
    { accessorKey: "releaseDate", header: () => <>Release Date <span className="sort-indicator" /></>, meta: { type: "text" } },
    { accessorKey: "lastUpdated", header: () => <>Last Updated <span className="sort-indicator" /></>, meta: { type: "text" } },
  ];
  // Example data (empty for now)
  const data: Model[] = [];

  return (
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
        <DataTable columns={columns} data={data} />
      </main>
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

