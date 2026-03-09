"use client";

import { flowContextActions } from "@/store/flow-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TestNodeData } from "@/types";

interface TestConfigProps {
  nodeId: string;
  data: TestNodeData;
}

export function TestConfig({ nodeId, data }: TestConfigProps) {
  const update = (patch: Partial<TestNodeData>) =>
    flowContextActions.updateNodeData(nodeId, patch);

  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="node-label">Label</Label>
        <Input
          id="node-label"
          value={data.label}
          onChange={(e) => update({ label: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="node-prefix">Prefix</Label>
        <Input
          id="node-prefix"
          value={data.prefix}
          onChange={(e) => update({ prefix: e.target.value })}
          placeholder="[TEST] "
        />
      </div>
    </>
  );
}
