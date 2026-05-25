<script lang="ts">
	import * as Field from "@svelte/components/ui/field";
	import { apiStore, settingsStore } from "../../stores/database-store.svelte";
	import ItemSelect from "./ItemSelect.svelte";
	import { getPreferenceValue, type StringPreferenceStoragePath, updatePreferenceValue } from "./preference-storage";

	interface StorageSelectProps {
		items: {value: string, label: string, disabled?: boolean}[];
		path: StringPreferenceStoragePath;
		label: string;
		description?: string;
		id?: string;
		beforeValueChange?: (value: string) => boolean | Promise<boolean>;
	}

	let { items, path, label, description, id = path.replaceAll(".", "-"), beforeValueChange }: StorageSelectProps = $props();

	const storageSource = $derived({ settings: $settingsStore, api: $apiStore });
	const value = $derived(String(getPreferenceValue(storageSource, path) ?? ""));

	async function updateValue(nextValue: string) {
		if (beforeValueChange && !(await beforeValueChange(nextValue))) return;

		await updatePreferenceValue(path, nextValue);
	}
</script>

<Field.Field orientation="responsive" class="rounded-md border border-border bg-background/60 p-2">
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
		onValueChange={(nextValue) => void updateValue(nextValue)}
	/>
</Field.Field>
