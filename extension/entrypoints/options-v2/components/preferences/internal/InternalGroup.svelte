<script lang="ts">
	import InternalApiSection from "@/entrypoints/options-v2/components/preferences/internal/InternalApiSection.svelte";
	import InternalSection from "@/entrypoints/options-v2/components/preferences/internal/InternalSection.svelte";
	import SectionNotFound from "@/entrypoints/options-v2/components/preferences/SectionNotFound.svelte";
	import InternalNotificationsSection from "./InternalNotificationsSection.svelte";
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
{:else if sectionId === "notifications"}
	<InternalNotificationsSection />
{:else if sectionId === "api"}
	<InternalApiSection />
{:else}
	<SectionNotFound />
{/if}
