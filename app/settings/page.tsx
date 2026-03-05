"use client";

import { useSettingsStore } from "@/store/settings-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ProviderForm } from "@/app/settings/components/provider-form";

export default function SettingsPage() {
  const providers = useSettingsStore((s) => s.providers);

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-muted-foreground">Configure AI providers and model settings.</p>
        </div>

        <Tabs defaultValue={providers[0]?.id} className="w-full">
          <TabsList className="w-full justify-start">
            {providers.map((p) => (
              <TabsTrigger key={p.id} value={p.id}>
                {p.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {providers.map((p) => (
            <TabsContent key={p.id} value={p.id}>
              <Card>
                <CardContent className="pt-6">
                  <ProviderForm provider={p} />
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
