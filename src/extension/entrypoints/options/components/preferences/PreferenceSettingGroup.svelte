<script lang="ts">
	import type { Snippet } from "svelte";

	interface PreferenceSettingGroupProps {
		title?: string;
		description?: string;
		contentClass?: string;
		children: Snippet;
	}

	let { title, description, contentClass = "grid gap-1 md:grid-cols-2", children }: PreferenceSettingGroupProps = $props();
</script>

<div class="border-border bg-background/60 rounded-md border p-2">
	<div class="mb-1">
		{#if title}
			<h3>{title}</h3>
		{/if}
		{#if description}
			<p class="text-muted-foreground text-xs">{description}</p>
		{/if}
	</div>

	<div class={contentClass}>
		{@render children()}
	</div>
</div>
