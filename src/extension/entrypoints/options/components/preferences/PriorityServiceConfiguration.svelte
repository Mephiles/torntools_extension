<script lang="ts">
    import { Button } from "@svelte/components/ui/button";
    import * as Dialog from "@svelte/components/ui/dialog";
    import { Input } from "@svelte/components/ui/input";
    import { Switch } from "@svelte/components/ui/switch";
    import GearSixIcon from "phosphor-svelte/lib/GearSixIcon";
    import type {
        BooleanPreferenceStoragePath,
        NumberPreferenceStoragePath
    } from "@/entrypoints/options/components/preferences/preference-storage";
    import { getPreferenceValue, updatePreferenceValue } from "@/entrypoints/options/components/preferences/preference-storage";
    import { apiStore, settingsStore } from "@/entrypoints/options/stores/database-store.svelte";

    interface ServiceDef {
        name: string;
        pathEnabled: BooleanPreferenceStoragePath;
        pathPriority: NumberPreferenceStoragePath;
    }

    interface PriorityServiceProps {
        title: string;
        usesBest?: boolean;
        services: ServiceDef[];
    }

    let { title, services, usesBest = false }: PriorityServiceProps = $props();
    let open = $state(false);

    const storageSource = $derived({ settings: $settingsStore, api: $apiStore });

    function isEnabled(service: ServiceDef): boolean {
        return Boolean(getPreferenceValue(storageSource, service.pathEnabled));
    }
    function setEnabled(service: ServiceDef, value: boolean) {
        void updatePreferenceValue(service.pathEnabled, value);
    }
    function priority(service: ServiceDef): string {
        return String(getPreferenceValue(storageSource, service.pathPriority) ?? "");
    }
    function setPriority(service: ServiceDef, input: string) {
        void updatePreferenceValue(service.pathPriority, input.trim() === "" ? 0 : Number(input));
    }
</script>

<Dialog.Root bind:open>
    <Dialog.Trigger>
        <Button variant="ghost" size="icon-sm" aria-label="Configure {title} services">
            <GearSixIcon />
        </Button>
    </Dialog.Trigger>
    <Dialog.Content class="sm:max-w-sm md:max-w-md">
        <Dialog.Header>
            <Dialog.Title>{title} Service Preferences</Dialog.Title>
            <Dialog.Description>
                Configure your service preferences for {title.toLowerCase()} here. Lowest priority goes first.
                Services with the same priority will run at the same time and will compete for the {usesBest ? "best" : "fastest"} response.
            </Dialog.Description>
        </Dialog.Header>

        <!-- Table headers -->
        <div class="space-y-1">
            <div class="grid grid-cols-[1fr_auto_auto] items-center gap-1 text-sm text-muted-foreground">
                <span>Service</span>
                <span class="text-center w-18">Enabled</span>
                <span class="text-center w-18">Priority</span>
            </div>

            {#each services as service (service.name)}
                <div class="grid grid-cols-[1fr_auto_auto] items-center gap-1 rounded-md border border-border bg-background/60 p-2">
                    <span class="text-sm">{service.name}</span>
                    <div class="flex justify-center w-18">
                        <Switch
                            size="sm"
                            checked={isEnabled(service)}
                            onCheckedChange={(checked) => setEnabled(service, checked)}
                        />
                    </div>
                    <Input
                        type="number"
                        min={1}
                        class="with-number-wheel w-18 h-7 text-center text-sm"
                        value={priority(service)}
                        oninput={(event) => setPriority(service, event.currentTarget.value)}
                    />
                </div>
            {/each}
        </div>
    </Dialog.Content>
</Dialog.Root>