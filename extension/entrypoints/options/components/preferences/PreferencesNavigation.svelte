<script lang="ts">
	import { link } from "svelte-spa-router";
	import { PREFERENCE_GROUPS, type PreferenceGroupId } from "./configuration";
	import { getPreferenceGroupRoute } from "./preferences";

	interface PreferencesNavigationProps {
		activeGroup: PreferenceGroupId;
	}

	let { activeGroup }: PreferencesNavigationProps = $props();
</script>

<aside class="rounded-lg border border-sidebar bg-sidebar p-2 space-y-1">
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
</aside>
