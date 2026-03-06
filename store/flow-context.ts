import { create } from "zustand";
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type OnNodesChange,
  type OnEdgesChange,
} from "@xyflow/react";
import type { WorkflowNodeData, Workflow, WorkflowNode, WorkflowEdge } from "@/types";

export type ReactFlowNode = Node<WorkflowNodeData, "llm">;

const DEFAULT_LLM_DATA: WorkflowNodeData = {
  label: "LLM",
  systemPrompt: "You are a helpful assistant.",
  providerId: "",
  modelId: "",
};

interface FlowContextState {
  nodes: ReactFlowNode[];
  edges: Edge[];
  selectedNodeId: string | null;
}

export const useFlowContext = create<FlowContextState>()(() => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
}));

const set = useFlowContext.setState;
const get = useFlowContext.getState;

let nodeCounter = 0;

export const flowContextActions = {
  load: (workflow: Workflow) => {
    const nodes: ReactFlowNode[] = workflow.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: n.data,
    }));
    set({ nodes, edges: workflow.edges, selectedNodeId: null });
  },

  clear: () => {
    nodeCounter = 0;
    set({ nodes: [], edges: [], selectedNodeId: null });
  },

  snapshot: (): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } => {
    const { nodes, edges } = get();
    return {
      nodes: nodes.map((n) => ({
        id: n.id,
        type: (n.type ?? "llm") as "llm",
        position: n.position,
        data: n.data,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
      })),
    };
  },

  onNodesChange: ((changes) => {
    set((s) => ({
      nodes: applyNodeChanges(changes, s.nodes) as ReactFlowNode[],
    }));
  }) satisfies OnNodesChange,

  onEdgesChange: ((changes) => {
    set((s) => ({
      edges: applyEdgeChanges(changes, s.edges),
    }));
  }) satisfies OnEdgesChange,

  onConnect: (connection: Connection) => {
    set((s) => ({ edges: addEdge(connection, s.edges) }));
  },

  setSelectedNode: (id: string | null) => {
    set({ selectedNodeId: id });
  },

  addNode: (position: { x: number; y: number }) => {
    nodeCounter += 1;
    const id = `llm_${Date.now()}_${nodeCounter}`;
    const newNode: ReactFlowNode = {
      id,
      type: "llm",
      position,
      data: { ...DEFAULT_LLM_DATA, label: `LLM ${nodeCounter}` },
    };
    set((s) => ({ nodes: [...s.nodes, newNode] }));
    return id;
  },

  updateNodeData: (id: string, patch: Partial<WorkflowNodeData>) => {
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...patch } } : n,
      ),
    }));
  },

  removeNode: (id: string) => {
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
    }));
  },
};
