<script lang="ts">
	import SectionNotFound from "../SectionNotFound.svelte";
	import InternalApiSection from "./InternalApiSection.svelte";
	import InternalNotificationsSection from "./InternalNotificationsSection.svelte";
	import InternalPopupSection from "./InternalPopupSection.svelte";
	import InternalSection from "./InternalSection.svelte";

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
