import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { getExecutor } from "@/lib/executors";
import type { WorkflowNodeType, WorkflowEdge, WorkflowNode } from "@/types";

function findSourceNodes(nodeIds: string[], edges: WorkflowEdge[]): string[] {
  const targets = new Set(edges.map((e) => e.target));
  return nodeIds.filter((id) => !targets.has(id));
}

function findSinkNodes(nodeIds: string[], edges: WorkflowEdge[]): string[] {
  const sources = new Set(edges.map((e) => e.source));
  return nodeIds.filter((id) => !sources.has(id));
}

export const WorkflowState = Annotation.Root({
  input: Annotation<string>,
  nodeOutputs: Annotation<Record<string, string>>({
    default: () => ({}),
    reducer: (prev, next) => ({ ...prev, ...next }),
  }),
  lastOutput: Annotation<string>({
    default: () => "",
    reducer: (_, next) => next,
  }),
});

interface GraphInput {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export function buildGraph({ nodes, edges }: GraphInput) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic graph: node IDs are runtime values
  let graph: any = new StateGraph(WorkflowState);

  // Build predecessor map: nodeId → list of source node IDs
  const predecessorMap = new Map<string, string[]>();
  for (const edge of edges) {
    const preds = predecessorMap.get(edge.target) || [];
    preds.push(edge.source);
    predecessorMap.set(edge.target, preds);
  }

  for (const node of nodes) {
    const executor = getExecutor(node.type as WorkflowNodeType);

    graph = graph.addNode(node.id, async (state: typeof WorkflowState.State) => {
      const predecessors = predecessorMap.get(node.id) || [];

      // Source nodes use original input; downstream nodes use predecessor outputs
      const input =
        predecessors.length === 0
          ? state.input
          : predecessors.map((id) => state.nodeOutputs[id] ?? "").join("\n");

      const content = await executor(node.data, {
        input,
        nodeOutputs: state.nodeOutputs,
      });

      return {
        nodeOutputs: { [node.id]: content },
        lastOutput: content,
      };
    });
  }

  const nodeIds = nodes.map((n) => n.id);
  const sourceNodes = findSourceNodes(nodeIds, edges);
  const sinkNodes = findSinkNodes(nodeIds, edges);

  for (const id of sourceNodes) {
    graph = graph.addEdge(START, id);
  }
  for (const edge of edges) {
    graph = graph.addEdge(edge.source, edge.target);
  }
  for (const id of sinkNodes) {
    graph = graph.addEdge(id, END);
  }

  return graph.compile();
}
