"use client";

import { useFlowContext, flowContextActions } from "@/store/flow-context";
import { Button } from "@/components/ui/button";
import { Trash2, X } from "lucide-react";
import { nodeConfigRegistry } from "./node-configs";
import type { WorkflowNodeType } from "@/types";

export function NodeConfigPanel() {
  const nodes = useFlowContext((s) => s.nodes);
  const selectedNodeId = useFlowContext((s) => s.selectedNodeId);

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const nodeType = (node.type ?? "llm") as WorkflowNodeType;
  const ConfigComponent = nodeConfigRegistry[nodeType];

  return (
    <aside className="flex w-72 shrink-0 flex-col gap-4 border-l bg-muted/20 p-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Node Config</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => flowContextActions.setSelectedNode(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {ConfigComponent ? (
        <ConfigComponent nodeId={node.id} data={node.data} />
      ) : (
        <p className="text-sm text-muted-foreground">
          No config available for node type: {nodeType}
        </p>
      )}

      <Button
        variant="destructive"
        size="sm"
        className="mt-auto gap-1.5"
        onClick={() => flowContextActions.removeNode(node.id)}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete Node
      </Button>
    </aside>
  );
}
