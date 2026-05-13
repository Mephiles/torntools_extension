<script lang="ts">
	import { link } from "svelte-spa-router";
	import type { PreferenceGroupId, PreferenceSection } from "@/entrypoints/options-v2/components/preferences/configuration";
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
						? "border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-950"
						: "border-border text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-900 dark:hover:text-gray-100"
				}`}
			>
				<span class="block font-medium">{section.title}</span>
			</a>
		{/each}
	</div>
</section>
