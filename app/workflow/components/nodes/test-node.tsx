"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TestNodeData } from "@/types";

type TestNodeProps = NodeProps & { data: TestNodeData };

export const TestNode = memo(function TestNode({ data, selected }: TestNodeProps) {
  return (
    <div
      className={cn(
        "w-48 rounded-lg border bg-card px-3 py-2 shadow-sm transition-shadow",
        selected && "ring-2 ring-primary shadow-md",
      )}
    >
      <Handle type="target" position={Position.Top} className="w-3! h-3! bg-muted-foreground!" />

      <div className="flex items-center gap-2">
        <FlaskConical className="h-4 w-4 shrink-0 text-orange-500" />
        <span className="truncate text-sm font-medium">{data.label}</span>
      </div>

      {data.prefix && (
        <p className="mt-1 truncate text-xs text-muted-foreground">
          prefix: {data.prefix}
        </p>
      )}

      <Handle type="source" position={Position.Bottom} className="w-3! h-3! bg-muted-foreground!" />
    </div>
  );
});
