<script lang="ts">
	import AdvancedSection from "@/entrypoints/options-v2/components/preferences/global/AdvancedSection.svelte";
	import GlobalChatSection from "@/entrypoints/options-v2/components/preferences/global/GlobalChatSection.svelte";
	import GlobalSection from "@/entrypoints/options-v2/components/preferences/global/GlobalSection.svelte";
	import GlobalSidebarSection
		from "@/entrypoints/options-v2/components/preferences/global/GlobalSidebarSection.svelte";
	import SectionNotFound from "@/entrypoints/options-v2/components/preferences/SectionNotFound.svelte";

	interface CoreGroupProps {
		sectionId?: string;
	}

	let { sectionId }: CoreGroupProps = $props();
</script>

{#if sectionId === "global"}
	<GlobalSection />
{:else if sectionId === "sidebar"}
	<GlobalSidebarSection />
{:else if sectionId === "chat"}
	<GlobalChatSection />
{:else if sectionId === "advanced"}
	<AdvancedSection />
{:else}
	<SectionNotFound />
{/if}
