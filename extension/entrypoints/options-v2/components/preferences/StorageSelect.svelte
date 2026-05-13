<script lang="ts">
	import * as Field from "@svelte/components/ui/field";
	import * as Select from "@svelte/components/ui/select";
	import type { Snippet } from "svelte";
	import ItemSelect from "@/entrypoints/options-v2/components/preferences/ItemSelect.svelte";
	import { apiStore, settingsStore } from "@/entrypoints/options-v2/stores/database-store.svelte";
	import { getPreferenceValue, type StringPreferenceStoragePath, updatePreferenceValue } from "./preference-storage";

	interface StorageSelectProps {
		items: {value: string, label: string, disabled?: boolean}[];
		path: StringPreferenceStoragePath;
		label: string;
		description?: string;
		id?: string;
	}

	let { items, path, label, description, id = path.replaceAll(".", "-") }: StorageSelectProps = $props();

	const storageSource = $derived({ settings: $settingsStore, api: $apiStore });
	const value = $derived(String(getPreferenceValue(storageSource, path) ?? ""));
</script>

<Field.Field orientation="responsive" class="rounded-md border border-border/70 bg-background/60 p-2">
	<Field.Content>
		<Field.Label for={id}>{label}</Field.Label>
		{#if description}
			<Field.Description class="text-xs">{description}</Field.Description>
		{/if}
	</Field.Content>

	<ItemSelect
		{items}
		placeholder="Select a value"
		{value}
		onValueChange={(nextValue) => void updatePreferenceValue(path, nextValue)}
	/>
</Field.Field>
