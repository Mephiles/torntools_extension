<script lang="ts">
	import { Button } from "@svelte/components/ui/button";
	import { Input } from "@svelte/components/ui/input";
	import ArrowDownIcon from "phosphor-svelte/lib/ArrowDownIcon";
	import ArrowUpIcon from "phosphor-svelte/lib/ArrowUpIcon";
	import PlusIcon from "phosphor-svelte/lib/PlusIcon";
	import TrashIcon from "phosphor-svelte/lib/TrashIcon";
	import PreferenceSectionCard from "@/entrypoints/options-v2/components/preferences/PreferenceSectionCard.svelte";
	import { settingsStore } from "@/entrypoints/options-v2/stores/database-store.svelte";
	import type { SavedHighlight } from "@/features/chat-highlight/chat-highlight";
	import { ttStorage } from "@/utils/common/data/storage";
	import { HIGHLIGHT_PLACEHOLDERS } from "@/utils/common/functions/torn";

	async function updateHighlights(newHighlights: SavedHighlight[]) {
		await ttStorage.change({ settings: { pages: {chat: { highlights: newHighlights } } } });
	}

	function addHighlight() {
		void updateHighlights([
			...$settingsStore.pages.chat.highlights,
			{ name: "", color: "#7ca900" } satisfies SavedHighlight,
		]);
	}

	function updateHighlight(index: number, newHighlight: SavedHighlight) {
		const newHighlights = [...$settingsStore.pages.chat.highlights];
		newHighlights[index] = newHighlight;
		void updateHighlights(newHighlights);
	}

	function updateHighlightField<K extends keyof SavedHighlight>(index: number, key: K, value: SavedHighlight[K]) {
		const highlight = $settingsStore.pages.chat.highlights[index];
		if (!highlight) return;

		updateHighlight(index, { ...highlight, [key]: value });
	}

	function removeHighlight(index: number) {
		void updateHighlights($settingsStore.pages.chat.highlights.filter((_, i) => i !== index));
	}
</script>

<PreferenceSectionCard title="Highlights">
	{#snippet action()}
		<Button type="button" size="icon-xs" variant="outline" onclick={addHighlight}>
			<PlusIcon />
		</Button>
	{/snippet}

	<div class="p-2 text-muted-foreground text-xs">
		Placeholders:

		<ul class="pl-4 list-disc">
			{#each HIGHLIGHT_PLACEHOLDERS as placeholder, index (index)}
				<li>{placeholder.name}: {placeholder.description}</li>
			{/each}
		</ul>
	</div>

	{#if $settingsStore.pages.chat.highlights.length}
		<div class="space-y-1">
			{#each $settingsStore.pages.chat.highlights as highlight, index (index)}
				<div class="rounded-md border border-border bg-background/60 p-2">
					<div class="grid gap-2 md:grid-cols-[1fr_40px_28px]">
						<Input
							value={highlight.name}
							class="h-7"
							placeholder="Name"
							oninput={(event) => updateHighlightField(index, "name", event.currentTarget.value)}
						/>

						<Input
							value={highlight.color}
							class="h-7"
							placeholder="Color"
							type="color"
							oninput={(event) => updateHighlightField(index, "color", event.currentTarget.value)}
						/>

						<Button type="button" size="icon-sm" variant="destructive" onclick={() => removeHighlight(index)}>
							<TrashIcon />
						</Button>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p class="rounded-md border border-dashed border-border p-2 text-center text-muted-foreground">
			No highlights configured.
		</p>
	{/if}

</PreferenceSectionCard>