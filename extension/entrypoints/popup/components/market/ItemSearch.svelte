<script lang="ts">
    import * as Command from "@svelte/components/ui/command";
    import { cn } from "@svelte/utils.js";
    import type { TornItem } from "tornapi-typescript";
    import { torndataStore } from "../../stores/database-store.svelte.js";

    interface ItemSearchProps {
        selectedItem: TornItem | null;
    }

    let { selectedItem = $bindable(null) }: ItemSearchProps = $props();

    let search = $state("");

    const items = $derived<TornItem[]>($torndataStore?.items ?? []);
    const matches = $derived(getMatches(items, search));
    const listOpen = $derived(!!search.trim());

    function getMatches(sourceItems: TornItem[], keyword: string) {
        const normalized = keyword.trim().toLowerCase();
        if (!normalized) return [];

        const id = Number.parseInt(normalized, 10);
        return sourceItems
            .filter((item) => item.name.toLowerCase().includes(normalized) || (!Number.isNaN(id) && item.id === id))
            .slice(0, 30);
    }

    function selectItem(item: TornItem) {
        selectedItem = item;
        search = "";
    }
</script>

<Command.Root shouldFilter={false} class="relative h-auto overflow-visible rounded-md bg-transparent p-0">
    <Command.Input
        bind:value={search}
        placeholder="Search item..."
        onkeydown={(event) => {
            if (event.key === "Enter" && matches[0]) selectItem(matches[0]);
        }}
    />

    {#if listOpen}
        <Command.List class={cn("mt-1 max-h-42 w-full rounded-md bg-popover p-1", selectedItem && "absolute top-full z-10")}>
            <Command.Empty class="p-2">No items found.</Command.Empty>
            <Command.Group class="p-0">
                {#each matches as item (item.id)}
                    <Command.Item value={`${item.id}-${item.name}`} onSelect={() => selectItem(item)}>
                        <span>{item.name}</span>
                        <Command.Shortcut>#{item.id}</Command.Shortcut>
                    </Command.Item>
                {/each}
            </Command.Group>
        </Command.List>
    {/if}
</Command.Root>
