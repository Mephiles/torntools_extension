<script lang="ts">
	import { Button } from "@svelte/components/ui/button";
	import * as Kbd from "@svelte/components/ui/kbd";
	import MagnifyingGlassIcon from "phosphor-svelte/lib/MagnifyingGlassIcon";
	import { link } from "svelte-spa-router";
	import type { PreferenceGroupId } from "./configuration";
	import { PREFERENCE_GROUPS } from "./configuration";
	import { getPreferenceGroupRoute } from "./preferences";
	import PreferenceSearch from "./PreferenceSearch.svelte";

	interface PreferencesNavigationProps {
		activeGroup: PreferenceGroupId;
	}

	let { activeGroup }: PreferencesNavigationProps = $props();

	let searchOpen = $state(false);

	const shortcutKey = $derived(navigator.platform.startsWith("Mac") ? "⌘" : "Ctrl");
</script>

<aside class="border-sidebar bg-sidebar flex flex-col space-y-1 rounded-lg border p-2">
	<Button variant="outline" class="text-muted-foreground" onclick={() => (searchOpen = true)}>
		<MagnifyingGlassIcon />
		<span class="flex-1">Search</span>

		<Kbd.Group>
			<Kbd.Root>{shortcutKey} + K</Kbd.Root>
		</Kbd.Group>
	</Button>

	<div class="space-y-1">
		{#each PREFERENCE_GROUPS as group (group.id)}
			<div>
				<a
					use:link
					href={getPreferenceGroupRoute(group.id)}
					class={`block rounded-md px-3 py-2 text-sm ${
						group.id === activeGroup
							? "bg-accent text-accent-foreground"
							: "text-accent-foreground/50 hover:bg-accent/50 hover:text-accent-foreground/75"
					}`}
				>
					{group.title}
				</a>
			</div>
		{/each}
	</div>
</aside>

<PreferenceSearch bind:open={searchOpen} />
