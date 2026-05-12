<script lang="ts">
	import type { PreferenceGroupDefinition, PreferenceGroupId } from "../types";

	let {
		groups,
		activeSection,
		onSelect,
		onSearch,
	}: {
		groups: PreferenceGroupDefinition[];
		activeSection: PreferenceGroupId;
		onSelect: (section: PreferenceGroupId) => void;
		onSearch: () => void;
	} = $props();
</script>

<aside class="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm backdrop-blur">
	<div class="mb-4 flex items-center justify-between gap-3">
		<div>
			<p class="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Preferences</p>
		</div>
		<button
			type="button"
			class="rounded-full border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/40 hover:text-primary"
			onclick={onSearch}
		>
			Search
		</button>
	</div>

	<div class="mb-4 lg:hidden">
		<label class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground" for="preferences-section-picker">
			Section
		</label>
		<select
			id="preferences-section-picker"
			class="w-full rounded-2xl border border-border bg-background px-3 py-2.5 text-sm"
			value={activeSection}
			onchange={(event) => onSelect((event.currentTarget as HTMLSelectElement).value as PreferenceGroupId)}
		>
			{#each groups as group (group.id)}
				<option value={group.id}>{group.title}</option>
			{/each}
		</select>
	</div>

	<div class="hidden space-y-1 lg:block">
		{#each groups as group (group.id)}
			<button
				type="button"
				class={`w-full rounded-2xl px-3 py-3 text-left text-sm transition font-medium ${
					group.id === activeSection
						? "bg-primary text-primary-foreground shadow-sm"
						: "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
				}`}
				onclick={() => onSelect(group.id)}
			>
				{group.title}
			</button>
		{/each}
	</div>
</aside>
