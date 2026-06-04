<script lang="ts">
	import { link } from "svelte-spa-router";
	import type { PreferenceGroupId, PreferenceSection } from "./configuration";
	import { getPreferenceSectionRoute } from "./preferences";

	interface PreferencesSectionNavigationProps {
		groupId: PreferenceGroupId;
		sections: readonly PreferenceSection[];
		activeSection?: string;
	}

	let { groupId, sections, activeSection }: PreferencesSectionNavigationProps = $props();
</script>

<section class="rounded-lg border border-border bg-card p-2">
	<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
		{#each sections as section (section.id)}
			<a
				use:link
				href={getPreferenceSectionRoute(groupId, section.id)}
				class={`rounded-md border px-3 py-2 text-sm transition-colors ${
					section.id === activeSection
						? "border-gray-300 bg-gray-100 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
						: "border-border text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
				}`}
			>
				<span class="block font-medium">{section.title}</span>
			</a>
		{/each}
	</div>
</section>
