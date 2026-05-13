<script lang="ts">
	import GlobalSidebarSection
		from "@/entrypoints/options-v2/components/preferences/global/GlobalSidebarSection.svelte";
	import SectionNotFound from "@/entrypoints/options-v2/components/preferences/SectionNotFound.svelte";

	interface CoreGroupProps {
		sectionId?: string;
	}

	let { sectionId }: CoreGroupProps = $props();
</script>

{#if sectionId === "sidebar"}
	<GlobalSidebarSection />
{:else}
	<SectionNotFound />
{/if}
