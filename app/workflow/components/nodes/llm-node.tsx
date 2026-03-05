"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowNodeData } from "@/types";

type LLMNodeProps = NodeProps & { data: WorkflowNodeData };

export const LLMNode = memo(function LLMNode({ data, selected }: LLMNodeProps) {
  return (
    <div
      className={cn(
        "w-48 rounded-lg border bg-card px-3 py-2 shadow-sm transition-shadow",
        selected && "ring-2 ring-primary shadow-md",
      )}
    >
      <Handle type="target" position={Position.Top} className="w-3! h-3! bg-muted-foreground!" />

      <div className="flex items-center gap-2">
        <BrainCircuit className="h-4 w-4 shrink-0 text-primary" />
        <span className="truncate text-sm font-medium">{data.label}</span>
      </div>

      {data.modelId && (
        <p className="mt-1 truncate text-xs text-muted-foreground">{data.modelId}</p>
      )}

      <Handle type="source" position={Position.Bottom} className="w-3! h-3! bg-muted-foreground!" />
    </div>
  );
});
