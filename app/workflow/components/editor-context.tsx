"use client";

import { createContext, useCallback, useContext, useRef, type ReactNode } from "react";
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type Connection,
} from "@xyflow/react";
import { useSyncExternalStore } from "react";
import type { WorkflowNodeData, WorkflowSession, SerializedNode, SerializedEdge } from "@/types";

export type WorkflowNode = Node<WorkflowNodeData, "llm">;

const DEFAULT_LLM_DATA: WorkflowNodeData = {
  label: "LLM",
  systemPrompt: "You are a helpful assistant.",
  providerId: "",
  modelId: "",
};

interface EditorState {
  nodes: WorkflowNode[];
  edges: Edge[];
  selectedNodeId: string | null;
}

interface EditorActions {
  load: (session: WorkflowSession) => void;
  clear: () => void;
  snapshot: () => { nodes: SerializedNode[]; edges: SerializedEdge[] };
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  setSelectedNode: (id: string | null) => void;
  addNode: (position: { x: number; y: number }) => string;
  updateNodeData: (id: string, patch: Partial<WorkflowNodeData>) => void;
  removeNode: (id: string) => void;
}

type EditorStore = EditorState & EditorActions;

function createEditorStore(): {
  getState: () => EditorState;
  subscribe: (listener: () => void) => () => void;
  actions: EditorActions;
} {
  let state: EditorState = {
    nodes: [],
    edges: [],
    selectedNodeId: null,
  };
  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach((l) => l());

  const setState = (updater: (prev: EditorState) => Partial<EditorState>) => {
    state = { ...state, ...updater(state) };
    emit();
  };

  let nodeCounter = 0;

  const actions: EditorActions = {
    load: (session) => {
      const nodes: WorkflowNode[] = session.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
      }));
      state = { nodes, edges: session.edges, selectedNodeId: null };
      emit();
    },

    clear: () => {
      state = { nodes: [], edges: [], selectedNodeId: null };
      emit();
    },

    snapshot: () => ({
      nodes: state.nodes.map((n) => ({
        id: n.id,
        type: (n.type ?? "llm") as "llm",
        position: n.position,
        data: n.data,
      })),
      edges: state.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
      })),
    }),

    onNodesChange: (changes) => {
      setState((s) => ({
        nodes: applyNodeChanges(changes, s.nodes) as WorkflowNode[],
      }));
    },

    onEdgesChange: (changes) => {
      setState((s) => ({
        edges: applyEdgeChanges(changes, s.edges),
      }));
    },

    onConnect: (connection) => {
      setState((s) => ({ edges: addEdge(connection, s.edges) }));
    },

    setSelectedNode: (id) => {
      setState(() => ({ selectedNodeId: id }));
    },

    addNode: (position) => {
      nodeCounter += 1;
      const id = `llm_${Date.now()}_${nodeCounter}`;
      const newNode: WorkflowNode = {
        id,
        type: "llm",
        position,
        data: { ...DEFAULT_LLM_DATA, label: `LLM ${nodeCounter}` },
      };
      setState((s) => ({ nodes: [...s.nodes, newNode] }));
      return id;
    },

    updateNodeData: (id, patch) => {
      setState((s) => ({
        nodes: s.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)),
      }));
    },

    removeNode: (id) => {
      setState((s) => ({
        nodes: s.nodes.filter((n) => n.id !== id),
        edges: s.edges.filter((e) => e.source !== id && e.target !== id),
        selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
      }));
    },
  };

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    actions,
  };
}

type Store = ReturnType<typeof createEditorStore>;

const EditorContext = createContext<Store | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<Store>(undefined);
  if (!storeRef.current) {
    storeRef.current = createEditorStore();
  }
  return <EditorContext.Provider value={storeRef.current}>{children}</EditorContext.Provider>;
}

function useEditorStore(): Store {
  const store = useContext(EditorContext);
  if (!store) throw new Error("useEditor must be used within EditorProvider");
  return store;
}

/** 读取编辑器状态（自动订阅更新） */
export function useEditor(): EditorStore {
  const store = useEditorStore();
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  return { ...state, ...store.actions };
}

/** 仅获取 actions（不触发重渲染） */
export function useEditorActions(): EditorActions {
  return useEditorStore().actions;
}

/** 获取 snapshot 函数（用于自动保存等场景） */
export function useEditorSnapshot() {
  const store = useEditorStore();
  return useCallback(() => store.actions.snapshot(), [store]);
}
