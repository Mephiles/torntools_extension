<script lang="ts">
	import * as Field from "@svelte/components/ui/field";
	import { Switch } from "@svelte/components/ui/switch";
	import { cn } from "@svelte/utils";
	import type { Snippet } from "svelte";
	import type { ExternalService } from "@/entrypoints/options-v2/components/preferences/external-service-requirement";
	import { apiStore, settingsStore } from "@/entrypoints/options-v2/stores/database-store.svelte";
	import ExternalServiceRequirement from "./ExternalServiceRequirement.svelte";
	import { type BooleanPreferenceStoragePath, getPreferenceValue, updatePreferenceValue } from "./preference-storage";

	interface StorageSwitchProps {
		path: BooleanPreferenceStoragePath;
		label: string;
		description?: string;
		id?: string;
		class?: string;
		compact?: boolean;
		disabled?: boolean;
		externalServices?: readonly ExternalService[];
		titleAction?: Snippet;
		children?: Snippet;
	}

	let {
		path,
		label,
		description,
		id = path.replaceAll(".", "-"),
		class: className,
		compact = false,
		disabled: disabledProp = false,
		externalServices = [],
		titleAction,
		children,
	}: StorageSwitchProps = $props();

	const storageSource = $derived({ settings: $settingsStore, api: $apiStore });
	const checked = $derived(Boolean(getPreferenceValue(storageSource, path)));
	const requirementMet = $derived(externalServices.length === 0 || externalServices.some((service) => Boolean($settingsStore.external[service])));
	const disabled = $derived(disabledProp || !requirementMet);

	function updateChecked(value: boolean) {
		if (disabled) return;
		void updatePreferenceValue(path, value);
	}
</script>

<div class={cn("rounded-md border", compact ? "border-border bg-card" : "border-border bg-background/60", className)}>
	<Field.Field orientation="horizontal" class="p-2">
		<Field.Content>
			<div class="flex flex-wrap items-center gap-2">
				<Field.Label for={id} class="w-full">{label}</Field.Label>
				{#if externalServices.length}
					<ExternalServiceRequirement services={externalServices} />
				{/if}
				{@render titleAction?.()}
			</div>
			{#if description}
				<Field.Description class="text-xs">{description}</Field.Description>
			{/if}
		</Field.Content>

		<Switch {id} size="sm" {checked} {disabled} onCheckedChange={updateChecked} />
	</Field.Field>

	{#if children}
		<div class="grid gap-1 bg-muted/50 p-2">
			{@render children()}
		</div>
	{/if}
</div>
