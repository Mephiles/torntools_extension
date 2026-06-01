<script lang="ts">
	import { Separator } from "@svelte/components/ui/separator/index.js";
	import { cn } from "@svelte/utils.js";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		orientation = "vertical",
		...restProps
	}: ComponentProps<typeof Separator> = $props();
</script>

<Separator
	bind:ref
	data-slot="button-group-separator"
	{orientation}
	class={cn(
		"bg-input relative self-stretch data-[orientation=horizontal]:mx-px data-[orientation=horizontal]:w-auto data-[orientation=vertical]:my-px data-[orientation=vertical]:h-auto",
		className
	)}
	{...restProps}
/>
