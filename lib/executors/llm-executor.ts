import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createModel } from "@/lib/model-factory";
import type { LLMNodeData } from "@/types";
import type { NodeExecutor } from "./index";

function interpolate(
  template: string,
  nodeOutputs: Record<string, string>,
): string {
  return template.replace(
    /\{\{(\w+)\.output\}\}/g,
    (_, nodeId) => nodeOutputs[nodeId] ?? "",
  );
}

export const llmExecutor: NodeExecutor = async (rawData, ctx) => {
  const data = rawData as LLMNodeData;
  const { provider, modelId, systemPrompt } = data;

  if (!provider || !modelId) {
    throw new Error(
      `LLM node missing provider or modelId (providerId=${data.providerId}, modelId=${modelId})`,
    );
  }

  const model = createModel(provider, modelId);

  const resolvedPrompt = interpolate(systemPrompt, ctx.nodeOutputs);
  const userInput = interpolate(ctx.input, ctx.nodeOutputs);

  const result = await model.invoke([
    new SystemMessage(resolvedPrompt),
    new HumanMessage(userInput),
  ]);

  return typeof result.content === "string"
    ? result.content
    : JSON.stringify(result.content);
};
