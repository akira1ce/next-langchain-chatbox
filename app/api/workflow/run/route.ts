import { NextRequest } from "next/server";
import { createUIMessageStream, createUIMessageStreamResponse, type UIMessage } from "ai";
import { buildGraph } from "@/lib/workflow-graph";
import type { WorkflowNode, WorkflowEdge } from "@/types";

function extractText(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { messages, nodes, edges } = body as {
    messages: UIMessage[];
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };

  const latestUserMsg = [...(messages ?? [])].reverse().find((m) => m.role === "user");
  const input = latestUserMsg ? extractText(latestUserMsg) : "";

  if (!input.trim()) {
    return new Response(JSON.stringify({ error: "Missing input" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!nodes?.length) {
    return new Response(JSON.stringify({ error: "Missing workflow nodes" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const graph = buildGraph({ nodes, edges });

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

        const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
        for (const char of finalOutput) {
          writer.write({ type: "text-delta", delta: char, id: partId });
          await delay(15);
        }
        writer.write({ type: "text-end", id: partId });
      },
    }),
  });
}
