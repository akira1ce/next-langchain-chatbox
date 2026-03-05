"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsStore } from "@/store/settings-store";

interface ModelSelectorProps {
  value?: string;
  onValueChange?: (modelId: string) => void;
}

export function ModelSelector({ value, onValueChange }: ModelSelectorProps) {
  const providers = useSettingsStore((s) => s.providers);

  // 只显示已启用且有 apiKey 的服务商
  const availableProviders = providers.filter((p) => p.enabled && p.apiKey && p.models.length > 0);

  return (
    <Select value={value ?? ""} onValueChange={onValueChange}>
      <SelectTrigger className="w-[240px]">
        <SelectValue placeholder="Select a model" />
      </SelectTrigger>
      <SelectContent>
        {availableProviders.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No providers configured.
            <br />
            Go to Settings to add one.
          </div>
        ) : (
          availableProviders.map((provider) => (
            <SelectGroup key={provider.id}>
              <SelectLabel>{provider.name}</SelectLabel>
              {provider.models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectGroup>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
