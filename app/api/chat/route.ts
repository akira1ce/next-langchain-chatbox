import { NextRequest } from "next/server";
import { createUIMessageStream, createUIMessageStreamResponse, type UIMessage } from "ai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { createModel } from "@/lib/model-factory";
import { buildGraph } from "@/lib/workflow-graph";
import type { Provider, Workflow } from "@/types";

function extractText(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

/** 普通对话 */
async function handlePlainChat(messages: UIMessage[], provider: Provider, modelId: string) {
  const model = createModel(provider, modelId);

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a helpful assistant."],
    new MessagesPlaceholder("history"),
  ]);

  const chain = prompt.pipe(model).pipe(new StringOutputParser());

  const history = messages
    .filter((m) => m.role !== "system")
    .map((m) => {
      const text = extractText(m);
      return m.role === "user" ? new HumanMessage(text) : new AIMessage(text);
    });

  const langchainStream = await chain.stream({ history });

  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute: async ({ writer }) => {
        const partId = crypto.randomUUID();
        writer.write({ type: "text-start", id: partId });
        for await (const chunk of langchainStream) {
          writer.write({ type: "text-delta", delta: chunk, id: partId });
        }
        writer.write({ type: "text-end", id: partId });
      },
    }),
  });
}

/** Workflow 驱动对话：取最新用户消息作为 input 执行图 */
async function handleWorkflowChat(messages: UIMessage[], workflow: Workflow) {
  const latestUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const userInput = latestUserMsg ? extractText(latestUserMsg) : "";

  const graph = buildGraph({
    nodes: workflow.nodes,
    edges: workflow.edges,
  });

  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute: async ({ writer }) => {
        const partId = crypto.randomUUID();
        writer.write({ type: "text-start", id: partId });

        const stream = await graph.stream(
          { input: userInput, nodeOutputs: {}, lastOutput: "" },
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

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { messages, provider, modelId, workflow } = body as {
    messages: UIMessage[];
    provider?: Provider;
    modelId?: string;
    workflow?: Workflow;
  };

  if (workflow?.nodes?.length) {
    return handleWorkflowChat(messages, workflow);
  }

  if (!provider?.id || !provider?.apiKey) {
    return new Response(JSON.stringify({ error: "Missing provider" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!modelId) {
    return new Response(JSON.stringify({ error: "Missing modelId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return handlePlainChat(messages, provider, modelId);
}
