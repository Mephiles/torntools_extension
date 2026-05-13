<script lang="ts">
	import InternalSection from "@/entrypoints/options-v2/components/preferences/internal/InternalSection.svelte";
	import SectionNotFound from "@/entrypoints/options-v2/components/preferences/SectionNotFound.svelte";
	import InternalPopupSection from "./InternalPopupSection.svelte";

	interface InterfaceGroupProps {
		sectionId?: string;
	}

	let { sectionId }: InterfaceGroupProps = $props();
</script>

{#if sectionId === "internal"}
	<InternalSection />
{:else if sectionId === "popup"}
	<InternalPopupSection />
{:else}
	<SectionNotFound />
{/if}
