"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type NodeTypes,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useRouter } from "next/navigation";
import { useWorkflowStore, workflowActions } from "@/store/workflow-store";
import { chatActions } from "@/store/chat-store";
import { useFlowContext, flowContextActions } from "@/store/flow-context";
import { LLMNode } from "./nodes/llm-node";
import { NodeConfigPanel } from "./node-config-panel";
import { Button } from "@/components/ui/button";
import { BrainCircuit, MessageSquare } from "lucide-react";

const nodeTypes: NodeTypes = { llm: LLMNode };

interface WorkflowCanvasProps {
  workflowId: string;
}

export function WorkflowCanvas({ workflowId }: WorkflowCanvasProps) {
  const router = useRouter();
  const { nodes, edges, selectedNodeId } = useFlowContext();
  const workflows = useWorkflowStore((s) => s.workflows);
  const currentWorkflow = workflows.find((w) => w.id === workflowId);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  useEffect(() => {
    const wf = workflows.find((w) => w.id === workflowId);
    if (wf) flowContextActions.load(wf);
    return () => flowContextActions.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only load on mount / id change
  }, [workflowId]);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const { nodes, edges } = flowContextActions.snapshot();
      workflowActions.saveSnapshot(workflowId, nodes, edges);
    }, 500);
    return () => clearTimeout(saveTimerRef.current);
  }, [nodes, edges, workflowId]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!rfInstance) return;
      const type = e.dataTransfer.getData("application/reactflow");
      if (type !== "llm") return;

      const position = rfInstance.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });
      const newId = flowContextActions.addNode(position);
      flowContextActions.setSelectedNode(newId);
    },
    [rfInstance],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      flowContextActions.setSelectedNode(node.id);
    },
    [],
  );

  const onPaneClick = useCallback(() => {
    flowContextActions.setSelectedNode(null);
  }, []);

  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/reactflow", "llm");
    e.dataTransfer.effectAllowed = "move";
  };

  const handleTryout = () => {
    if (!currentWorkflow || !nodes.length) return;
    const snap = flowContextActions.snapshot();
    workflowActions.saveSnapshot(workflowId, snap.nodes, snap.edges);

    const freshWorkflow = { ...currentWorkflow, nodes: snap.nodes, edges: snap.edges };

    chatActions.createSession({ workflowId: freshWorkflow.id });
    router.push("/chat");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Top header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <h2 className="truncate text-sm font-semibold">{currentWorkflow?.title ?? "Workflow"}</h2>
        <Button
          size="sm"
          className="gap-1.5"
          disabled={!nodes.length}
          onClick={handleTryout}>
          <MessageSquare className="h-3.5 w-3.5" />
          试用
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left palette */}
        <aside className="flex w-48 shrink-0 flex-col gap-2 border-r bg-muted/20 p-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Nodes
          </p>
          <div
            className="flex cursor-grab items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm shadow-sm transition-colors hover:bg-accent active:cursor-grabbing"
            draggable
            onDragStart={onDragStart}>
            <BrainCircuit className="h-4 w-4 text-primary" />
            LLM Node
          </div>
        </aside>

        {/* Canvas */}
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={flowContextActions.onNodesChange}
            onEdgesChange={flowContextActions.onEdgesChange}
            onConnect={flowContextActions.onConnect}
            onInit={setRfInstance}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            fitView
            deleteKeyCode={["Backspace", "Delete"]}
            className="bg-background">
            <Background gap={16} size={1} />
            <Controls />
            <MiniMap className="bg-muted/50!" maskColor="rgba(0,0,0,0.1)" />
          </ReactFlow>
        </div>

        {/* Right config panel */}
        {selectedNodeId && <NodeConfigPanel />}
      </div>
    </div>
  );
}
