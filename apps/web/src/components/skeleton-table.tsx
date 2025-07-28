import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export const SkeletonTable = ({ rows = 10, columns = 19 }: SkeletonTableProps) => {
  return (
    <div className="w-full">
      {/* Table Container */}
      <div className="border rounded-lg">
        {/* Table Header */}
        <div className="border-b bg-muted/50">
          <div className="flex items-center px-4 py-3">
            {Array.from({ length: columns }).map((_, index) => (
              <div key={index} className="flex-1 px-2">
                <Skeleton className="h-4 w-full max-w-24" />
              </div>
            ))}
          </div>
        </div>

        {/* Table Rows */}
        <div className="divide-y">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex items-center px-4 py-3 hover:bg-muted/50">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className="flex-1 px-2">
                  <Skeleton className="h-4 w-full max-w-20" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 