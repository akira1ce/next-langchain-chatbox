import { NextRequest } from "next/server";
import { HumanMessage } from "@langchain/core/messages";
import { createModel } from "@/lib/model-factory";
import type { ProviderConfig } from "@/types";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { providerConfig, modelId } = (await req.json()) as {
    providerConfig: ProviderConfig;
    modelId: string;
  };

  if (!providerConfig?.id || !providerConfig?.apiKey || !modelId) {
    return Response.json(
      { ok: false, error: "Missing providerConfig or modelId" },
      { status: 400 }
    );
  }

  try {
    const model = createModel(providerConfig, modelId);
    await model.invoke([new HumanMessage("Hi")]);

    return Response.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ ok: false, error: message });
  }
}
