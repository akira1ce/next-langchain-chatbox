import type { NodeExecutor } from "./index";

/** 测试用 executor：直接返回带 akira 标记的字符串，不调用 LLM */
export const testExecutor: NodeExecutor = async (data, ctx) => {
  return `[akira] node="${data.label}" input="${ctx.input}"`;
};
