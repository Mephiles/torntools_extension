<script lang="ts">
	import * as Command from "@svelte/components/ui/command";
	import * as Dialog from "@svelte/components/ui/dialog";
	import { push } from "svelte-spa-router";
	import { PREFERENCE_GROUPS } from "./configuration";
	import { getLastKey, PREFERENCE_SEARCH_DATA, type SearchablePreference } from "./preference-search-data";
	import { getPreferenceSectionRoute } from "./preferences";

	interface PreferenceSearchProps {
		open: boolean;
	}

	let { open = $bindable(false) }: PreferenceSearchProps = $props();

	const groupedData = $derived(
		PREFERENCE_GROUPS
			.filter((group) => PREFERENCE_SEARCH_DATA.some((item) => item.group === group.id))
			.flatMap((group) => {
				const groupItems = PREFERENCE_SEARCH_DATA.filter((item) => item.group === group.id);
				return (group.sections ?? [])
					.filter((section) => groupItems.some((item) => item.section === section.id))
					.map((section) => ({
						key: `${group.id}/${section.id}`,
						heading: `${group.title} / ${section.title}`,
						items: groupItems.filter((item) => item.section === section.id),
					}));
			})
	);

	function getKeywords(item: SearchablePreference): string[] {
		return [item.label, getLastKey(item.path), ...(item.keywords ?? [])].filter((t) => !!t);
	}

	function selectPreference(item: SearchablePreference) {
		open = false;
		void push(getPreferenceSectionRoute(item.group, item.section));
	}

	function handleGlobalKeydown(event: KeyboardEvent) {
		if (!(event.ctrlKey || event.metaKey) || event.key !== "k") return;

		event.preventDefault();
		open = !open;
	}
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

<Dialog.Root bind:open>
	<Dialog.Content class="p-0 rounded-xl">
		<Dialog.Header class="sr-only">
			<Dialog.Title>Search preferences</Dialog.Title>
			<Dialog.Description>Search through the TornTools preferences.</Dialog.Description>
		</Dialog.Header>

		<Command.Root>
			<Command.Input placeholder="Search preferences" />

			<Command.List>
				<Command.Empty>No preferences found.</Command.Empty>

				{#each groupedData as group (group.key)}
					<Command.Group heading={group.heading}>
						{#each group.items as item (item.path)}
							<Command.Item
								value={item.path}
								keywords={getKeywords(item)}
								onSelect={() => selectPreference(item)}
							>
								<div>
									<span class="truncate text-sm">{item.label}</span>
									{#if item.description}
										<span class="truncate text-xs text-muted-foreground">{item.description}</span>
									{/if}
								</div>
							</Command.Item>
						{/each}
					</Command.Group>
				{/each}
			</Command.List>
		</Command.Root>
	</Dialog.Content>
</Dialog.Root>
