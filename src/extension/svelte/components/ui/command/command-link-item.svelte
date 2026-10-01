<script lang="ts">
	import { cn } from "@svelte/utils.js";
	import { Command as CommandPrimitive } from "bits-ui";

	let { ref = $bindable(null), class: className, ...restProps }: CommandPrimitive.LinkItemProps = $props();
</script>

<CommandPrimitive.LinkItem
	bind:ref
	data-slot="command-item"
	class={cn(
		"data-selected:bg-muted data-selected:text-foreground data-selected:*:[svg]:text-foreground group/command-item relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none in-data-[slot=dialog-content]:rounded-lg! data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		className,
	)}
	{...restProps}
/>
