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
import { useEditor, useEditorSnapshot } from "./editor-context";
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
  const editor = useEditor();
  const snapshot = useEditorSnapshot();
  const workflows = useWorkflowStore((s) => s.workflows);
  const currentWorkflow = workflows.find((w) => w.id === workflowId);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  useEffect(() => {
    const wf = workflows.find((w) => w.id === workflowId);
    if (wf) editor.load(wf);
    return () => editor.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only load on mount / id change
  }, [workflowId]);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const { nodes, edges } = snapshot();
      workflowActions.saveSnapshot(workflowId, nodes, edges);
    }, 500);
    return () => clearTimeout(saveTimerRef.current);
  }, [editor.nodes, editor.edges, workflowId, snapshot]);

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
      const newId = editor.addNode(position);
      editor.setSelectedNode(newId);
    },
    [rfInstance, editor],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      editor.setSelectedNode(node.id);
    },
    [editor],
  );

  const onPaneClick = useCallback(() => {
    editor.setSelectedNode(null);
  }, [editor]);

  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/reactflow", "llm");
    e.dataTransfer.effectAllowed = "move";
  };

  const handleTryout = () => {
    if (!currentWorkflow || !editor.nodes.length) return;
    const { nodes, edges } = snapshot();
    workflowActions.saveSnapshot(workflowId, nodes, edges);

    const freshWorkflow = { ...currentWorkflow, nodes, edges };

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
          disabled={!editor.nodes.length}
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
            nodes={editor.nodes}
            edges={editor.edges}
            nodeTypes={nodeTypes}
            onNodesChange={editor.onNodesChange}
            onEdgesChange={editor.onEdgesChange}
            onConnect={editor.onConnect}
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
        {editor.selectedNodeId && <NodeConfigPanel />}
      </div>
    </div>
  );
}
