import { NextRequest } from "next/server";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createModel } from "@/lib/model-factory";
import type { WorkflowPayload, WorkflowNodeData } from "@/types";

/** 将 {{nodeId.output}} 占位符替换为实际节点输出 */
function interpolate(template: string, nodeOutputs: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\.output\}\}/g, (_, nodeId) => nodeOutputs[nodeId] ?? "");
}

/** 根据 edges 找到没有入边的节点（即起始节点） */
function findSourceNodes(nodeIds: string[], edges: WorkflowPayload["edges"]): string[] {
  const targets = new Set(edges.map((e) => e.target));
  return nodeIds.filter((id) => !targets.has(id));
}

/** 根据 edges 找到没有出边的节点（即末尾节点） */
function findSinkNodes(nodeIds: string[], edges: WorkflowPayload["edges"]): string[] {
  const sources = new Set(edges.map((e) => e.source));
  return nodeIds.filter((id) => !sources.has(id));
}

const WorkflowState = Annotation.Root({
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

function buildGraph(payload: WorkflowPayload) {
  const { nodes, edges, providerConfig } = payload;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic graph: node IDs are runtime values
  let graph: any = new StateGraph(WorkflowState);

  for (const node of nodes) {
    const nodeData: WorkflowNodeData = node.data;

    graph = graph.addNode(node.id, async (state: typeof WorkflowState.State) => {
      const model = createModel(providerConfig, nodeData.modelId);
      const systemPrompt = interpolate(nodeData.systemPrompt, state.nodeOutputs);
      const userInput = interpolate(state.input, state.nodeOutputs);

      const result = await model.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userInput),
      ]);

      const content =
        typeof result.content === "string" ? result.content : JSON.stringify(result.content);

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

export async function POST(req: NextRequest) {
  const body = (await req.json()) as WorkflowPayload;
  const { nodes, providerConfig, input } = body;

  if (!nodes?.length || !providerConfig?.apiKey || !input) {
    return new Response(JSON.stringify({ error: "Missing nodes, providerConfig or input" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const graph = buildGraph(body);

  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute: async ({ writer }) => {
        const partId = crypto.randomUUID();
        writer.write({ type: "text-start", id: partId });

        const stream = await graph.stream(
          { input, nodeOutputs: {}, lastOutput: "" },
          { streamMode: "updates" },
        );

        let finalOutput = "";
        for await (const update of stream) {
          const nodeKey = Object.keys(update)[0];
          if (!nodeKey || nodeKey === "__start__") continue;
          const nodeState = update[nodeKey] as { lastOutput?: string };
          if (nodeState.lastOutput) {
            finalOutput = nodeState.lastOutput;
          }
        }

        writer.write({ type: "text-delta", delta: finalOutput, id: partId });
        writer.write({ type: "text-end", id: partId });
      },
    }),
  });
}
