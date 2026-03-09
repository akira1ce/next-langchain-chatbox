import type { NodeExecutor } from "./index";
import type { TestNodeData } from "@/types";

/** Test executor：为上一个节点的输出添加自定义前缀 */
export const testExecutor: NodeExecutor = async (data, ctx) => {
  const { prefix } = data as TestNodeData;
  return `${prefix}${ctx.input}`;
};
