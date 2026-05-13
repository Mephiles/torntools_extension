<script lang="ts">
	import * as Card from "@svelte/components/ui/card";
	import { cn } from "@svelte/utils";
	import type { Snippet } from "svelte";

	interface PreferenceSectionCardProps {
		title?: string;
		description?: string;
		children: Snippet;
		action?: Snippet;
	}

	let { title, description, children, action }: PreferenceSectionCardProps = $props();
</script>

<Card.Root class={cn("gap-1 rounded-lg", title || description ? "py-2" : "py-1")}>
	<Card.Header class="px-3 flex justify-between gap-3">
		<div>
			{#if title}
				<Card.Title>{title}</Card.Title>
			{/if}
			{#if description}
				<Card.Description class="text-xs">{description}</Card.Description>
			{/if}
		</div>

		{@render action?.()}
	</Card.Header>

	<Card.Content class="px-2">
		{@render children()}
	</Card.Content>
</Card.Root>
