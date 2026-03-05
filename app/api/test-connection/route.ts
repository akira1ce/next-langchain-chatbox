import { NextRequest } from "next/server";
import { HumanMessage } from "@langchain/core/messages";
import { createModel } from "@/lib/model-factory";
import type { Provider } from "@/types";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { provider, modelId } = (await req.json()) as {
    provider: Provider;
    modelId: string;
  };

  if (!provider?.id || !provider?.apiKey || !modelId) {
    return Response.json({ ok: false, error: "Missing provider or modelId" }, { status: 400 });
  }

  try {
    const model = createModel(provider, modelId);
    await model.invoke([new HumanMessage("Hi")]);

    return Response.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ ok: false, error: message });
  }
}
