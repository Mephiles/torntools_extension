<script lang="ts">
	import { cn } from "@svelte/utils.js";
	import { Command as CommandPrimitive } from "bits-ui";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: CommandPrimitive.ListProps = $props();
</script>

<CommandPrimitive.List
	bind:ref
	data-slot="command-list"
	class={cn("no-scrollbar max-h-72 scroll-py-1 outline-none overflow-x-hidden overflow-y-auto", className)}
	{...restProps}
/>
