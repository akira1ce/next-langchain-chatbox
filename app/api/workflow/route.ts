import { NextRequest } from "next/server";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { buildGraph } from "@/lib/workflow-graph";
import type { WorkflowPayload } from "@/types";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as WorkflowPayload;
  const { nodes, input } = body;

  if (!nodes?.length || !input) {
    return new Response(
      JSON.stringify({ error: "Missing nodes or input" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
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
