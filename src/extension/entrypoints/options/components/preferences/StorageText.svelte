<script lang="ts">
	import * as Field from "@svelte/components/ui/field";
	import { Input } from "@svelte/components/ui/input";
	import { apiStore, settingsStore } from "../../stores/database-store.svelte";
	import { getPreferenceValue, type StringPreferenceStoragePath, updatePreferenceValue } from "./preference-storage";

	interface StorageTextProps {
		path: StringPreferenceStoragePath;
		label: string;
		description?: string;
		id?: string;
	}

	let {
		path,
		label,
		description,
		id = path.replaceAll(".", "-"),
	}: StorageTextProps = $props();

	const storageSource = $derived({ settings: $settingsStore, api: $apiStore });
	const value = $derived(String(getPreferenceValue(storageSource, path) ?? ""));

	function updateValue(input: string) {
		void updatePreferenceValue(path, input);
	}
</script>

<Field.Field orientation="responsive" class="rounded-md border border-border bg-background/60 p-2">
	<Field.Content>
		<Field.Label for={id}>{label}</Field.Label>
		{#if description}
			<Field.Description class="text-xs">{description}</Field.Description>
		{/if}
	</Field.Content>

	<Input
		{id}
		type="text"
		{value}
		oninput={(event) => updateValue(event.currentTarget.value)}
	/>
</Field.Field>
