<script lang="ts">
	import { Button } from "@svelte/components/ui/button";
	import { Input } from "@svelte/components/ui/input";
	import ArrowDownIcon from "phosphor-svelte/lib/ArrowDownIcon";
	import ArrowUpIcon from "phosphor-svelte/lib/ArrowUpIcon";
	import PlusIcon from "phosphor-svelte/lib/PlusIcon";
	import TrashIcon from "phosphor-svelte/lib/TrashIcon";
	import ItemSelect from "@/entrypoints/options-v2/components/preferences/ItemSelect.svelte";
	import PreferenceSectionCard from "@/entrypoints/options-v2/components/preferences/PreferenceSectionCard.svelte";
	import { settingsStore } from "@/entrypoints/options-v2/stores/database-store.svelte";
	import type { ColoredChatOption } from "@/features/colored-chat/colored-chat";
	import { ttStorage } from "@/utils/common/data/storage";
	import { CHAT_TITLE_COLORS } from "@/utils/common/functions/torn";

	const colorOptions = Object.keys(CHAT_TITLE_COLORS).map((value) => ({
		value,
		label: value.replace(/^./, (letter) => letter.toUpperCase()),
	}));

	async function updateColoredChats(nextLinks: ColoredChatOption[]) {
		await ttStorage.change({ settings: { pages: {chat: { titleHighlights: nextLinks } } } });
	}

	function addColoredChat() {
		void updateColoredChats([
			...$settingsStore.pages.chat.titleHighlights,
			{ title: "", color: "blue" } satisfies ColoredChatOption,
		]);
	}

	function updateColoredChat(index: number, newColoredChat: ColoredChatOption) {
		const newColoredChats = [...$settingsStore.pages.chat.titleHighlights];
		newColoredChats[index] = newColoredChat;
		void updateColoredChats(newColoredChats);
	}

	function updateColoredChatField<K extends keyof ColoredChatOption>(index: number, key: K, value: ColoredChatOption[K]) {
		const highlight = $settingsStore.pages.chat.titleHighlights[index];
		if (!highlight) return;

		updateColoredChat(index, { ...highlight, [key]: value });
	}

	function moveColoredChat(index: number, direction: -1 | 1) {
		const nextIndex = index + direction;
		if (nextIndex < 0 || nextIndex >= $settingsStore.pages.chat.titleHighlights.length) return;

		const newColoredChats = [...$settingsStore.pages.chat.titleHighlights];
		[newColoredChats[index], newColoredChats[nextIndex]] = [newColoredChats[nextIndex], newColoredChats[index]];
		void updateColoredChats(newColoredChats);
	}

	function removeColoredChat(index: number) {
		void updateColoredChats($settingsStore.pages.chat.titleHighlights.filter((_, i) => i !== index));
	}
</script>

<PreferenceSectionCard title="Colored Chats">
	{#snippet action()}
		<Button type="button" size="icon-xs" variant="outline" onclick={addColoredChat}>
			<PlusIcon />
		</Button>
	{/snippet}
	
	{#if $settingsStore.pages.chat.titleHighlights.length}
		<div class="space-y-1">
			{#each $settingsStore.pages.chat.titleHighlights as highlight, index (index)}
				<div class="rounded-md border border-border/70 bg-background/60 p-2">
					<div class="grid gap-2 md:grid-cols-[repeat(2,1fr)_28px]">
						<Input
							value={highlight.title}
							class="h-7"
							placeholder="Title"
							oninput={(event) => updateColoredChatField(index, "title", event.currentTarget.value)}
						/>

						<ItemSelect
							items={colorOptions}
							placeholder="Color"
							value={highlight.color}
							onValueChange={(nextValue) => void updateColoredChatField(index, "color", nextValue)}
						/>

						<Button type="button" size="icon-sm" variant="destructive" onclick={() => removeColoredChat(index)}>
							<TrashIcon />
						</Button>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p class="rounded-md border border-dashed border-border p-2 text-center text-muted-foreground">
			No colored chats configured.
		</p>
	{/if}

</PreferenceSectionCard>