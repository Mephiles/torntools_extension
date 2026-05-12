<script lang="ts">
	import type { PreferenceSubgroupDefinition } from "../types";

	let {
		items,
		activeItem,
		onSelect,
	}: {
		items: PreferenceSubgroupDefinition[];
		activeItem: string;
		onSelect: (id: string) => void;
	} = $props();
</script>

<section class="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm backdrop-blur">
	<p class="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Inside This Group</p>
	<div class="grid gap-2 lg:grid-cols-3">
		{#each items as item (item.id)}
			<button
				type="button"
				class={`rounded-2xl border px-4 py-3 text-left transition ${
					item.id === activeItem
						? "border-primary/40 bg-primary/10 text-foreground"
						: "border-border bg-background/70 text-muted-foreground hover:border-primary/30 hover:text-foreground"
				}`}
				onclick={() => onSelect(item.id)}
			>
				<div class="text-sm font-medium">{item.title}</div>
				<div class="mt-1 text-xs leading-5">{item.description}</div>
			</button>
		{/each}
	</div>
</section>
