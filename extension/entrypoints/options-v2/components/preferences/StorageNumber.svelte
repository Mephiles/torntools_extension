<script lang="ts">
	import * as Field from "@svelte/components/ui/field";
	import { Input } from "@svelte/components/ui/input";
	import { apiStore, settingsStore } from "@/entrypoints/options-v2/stores/database-store.svelte";
	import { getPreferenceValue, type NumberPreferenceStoragePath, updatePreferenceValue } from "./preference-storage";

	interface StorageNumberProps {
		path: NumberPreferenceStoragePath;
		label: string;
		description?: string;
		id?: string;
		min?: number;
		max?: number;
		step?: number;
	}

	let {
		path,
		label,
		description,
		id = path.replaceAll(".", "-"),
		min = undefined,
		max = undefined,
		step = undefined,
	}: StorageNumberProps = $props();

	const storageSource = $derived({ settings: $settingsStore, api: $apiStore });
	const value = $derived(String(getPreferenceValue(storageSource, path) ?? ""));

	function updateValue(input: string) {
		void updatePreferenceValue(path, input.trim() === "" ? 0 : Number(input));
	}
</script>

<Field.Field orientation="responsive" class="rounded-md border border-border bg-background60 p-2">
	<Field.Content>
		<Field.Label for={id}>{label}</Field.Label>
		{#if description}
			<Field.Description class="text-xs">{description}</Field.Description>
		{/if}
	</Field.Content>

	<Input
		{id}
		type="number"
		{min}
		{max}
		{step}
		{value}
		oninput={(event) => updateValue(event.currentTarget.value)}
	/>
</Field.Field>
