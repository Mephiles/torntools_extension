<script lang="ts">
	import { getPreferenceValue, updatePreferenceValue } from "@common/utils/data/preference-storage";
	import type { BooleanPreferenceStoragePath } from "@common/utils/data/preference-storage";
	import * as Field from "@svelte/components/ui/field";
	import { Switch } from "@svelte/components/ui/switch";
	import { cn } from "@svelte/utils";
	import type { Snippet } from "svelte";
	import { apiStore, settingsStore } from "../../stores/database-store.svelte";
	import type { ExternalService } from "./external-service-requirement";
	import ExternalServiceRequirement from "./ExternalServiceRequirement.svelte";

	interface StorageSwitchProps {
		path: BooleanPreferenceStoragePath;
		label: string;
		description?: string;
		id?: string;
		class?: string;
		compact?: boolean;
		disabled?: boolean;
		externalServices?: readonly ExternalService[];
		beforeValueChange?: (value: boolean) => boolean | Promise<boolean>;
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
		beforeValueChange,
		titleAction,
		children,
	}: StorageSwitchProps = $props();

	const storageSource = $derived({ settings: $settingsStore, api: $apiStore });
	const storedChecked = $derived(Boolean(getPreferenceValue(storageSource, path)));
	const requirementMet = $derived(
		!externalServices || externalServices.length === 0 || externalServices.some((service) => Boolean($settingsStore.external[service])),
	);
	const disabled = $derived(disabledProp || !requirementMet);

	let checked = $state(false);
	$effect(() => {
		checked = storedChecked;
	});

	async function updateChecked(value: boolean) {
		if (disabled) return;

		if (beforeValueChange && !(await beforeValueChange(value))) {
			checked = storedChecked;
			return;
		}

		await updatePreferenceValue(path, value);
	}
</script>

<div class={cn("rounded-md border", compact ? "border-border bg-card" : "border-border bg-background/60", className)}>
	<Field.Field orientation="horizontal" class="p-2">
		<Field.Content>
			<div class="flex flex-wrap items-center gap-2">
				<Field.Label for={id} class="w-full">{label}{@render titleAction?.()}</Field.Label>
				{#if externalServices.length}
					<ExternalServiceRequirement services={externalServices} />
				{/if}
			</div>
			{#if description}
				<Field.Description class="text-xs">{description}</Field.Description>
			{/if}
		</Field.Content>

		<Switch {id} size="sm" bind:checked {disabled} onCheckedChange={(value) => void updateChecked(value)} />
	</Field.Field>

	{#if children}
		<div class="bg-muted/50 grid gap-1 p-2">
			{@render children()}
		</div>
	{/if}
</div>
