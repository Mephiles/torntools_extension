<script lang="ts">
	import { Checkbox } from "@svelte/components/ui/checkbox";

	interface AlertCheckboxProps {
		id: string;
		label: string;
		checked: boolean;
		onchange: (checked: boolean) => void;
	}

	let { id, label, checked, onchange }: AlertCheckboxProps = $props();
</script>

<label for={id} class="flex items-center gap-1 text-xs">
	<Checkbox {id} {checked} onCheckedChange={(value) => onchange(Boolean(value))} />
	<span>{label}</span>
</label>
