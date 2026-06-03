<script lang="ts">
	import * as Select from "@svelte/components/ui/select";

	interface ItemSelectProps {
		items: {value: string, label: string, disabled?: boolean}[];
		placeholder: string;
		value: string;
		onValueChange: (value: string) => void;
	}

	let { items, placeholder, value, onValueChange }: ItemSelectProps = $props();

	const triggerContent = $derived(items.find((i) => i.value === value)?.label ?? placeholder);
</script>

<Select.Root type="single" {value} {onValueChange}>
	<Select.Trigger size="sm" class="w-full">
		{triggerContent}
	</Select.Trigger>
	<Select.Content class="max-h-60">
		{#each items as item (item.value)}
			<Select.Item value={item.value} label={item.label} disabled={item.disabled}>{item.label}</Select.Item>
		{/each}
	</Select.Content>
</Select.Root>