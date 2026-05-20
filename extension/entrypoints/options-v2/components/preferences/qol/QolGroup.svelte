<script lang="ts">
	import SectionNotFound from "@/entrypoints/options-v2/components/preferences/SectionNotFound.svelte";
	import InformationSection from "./InformationSection.svelte";

	interface QolGroupProps {
		sectionId?: string;
	}

	let { sectionId }: QolGroupProps = $props();
</script>

{#if sectionId === "information"}
	<InformationSection />
{:else}
	<SectionNotFound />
{/if}
