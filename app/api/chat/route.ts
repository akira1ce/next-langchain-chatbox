import { NextRequest } from "next/server";
import { createUIMessageStream, createUIMessageStreamResponse, type UIMessage } from "ai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { createModel } from "@/lib/model-factory";
import type { Provider } from "@/types";

function extractText(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { messages, provider, modelId } = body as {
    messages: UIMessage[];
    provider?: Provider;
    modelId?: string;
  };

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
