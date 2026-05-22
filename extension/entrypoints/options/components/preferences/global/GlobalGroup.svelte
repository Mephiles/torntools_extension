<script lang="ts">
	import SectionNotFound from "../SectionNotFound.svelte";
	import AdvancedSection from "./AdvancedSection.svelte";
	import GlobalChatSection from "./GlobalChatSection.svelte";
	import GlobalSection from "./GlobalSection.svelte";
	import GlobalSidebarSection from "./GlobalSidebarSection.svelte";

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
