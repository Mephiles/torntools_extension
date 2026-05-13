<script lang="ts">
	import { Spinner } from "@svelte/components/ui/spinner";
	import GlobalGroup from "@/entrypoints/options-v2/components/preferences/global/GlobalGroup.svelte";
	import InternalGroup from "@/entrypoints/options-v2/components/preferences/internal/InternalGroup.svelte";
	import { isStoresInitialized } from "@/entrypoints/options-v2/stores/database-store.svelte";
	import type { PreferenceGroupId } from "./configuration";

	interface PreferencesContentProps {
		groupId: PreferenceGroupId;
		sectionId?: string;
	}

	let { groupId, sectionId }: PreferencesContentProps = $props();
</script>

{#if isStoresInitialized() }
	{#if groupId === "internal"}
		<InternalGroup {sectionId} />
	{:else if groupId === "global"}
		<GlobalGroup {sectionId} />
	{:else}
		<section class="rounded-lg border border-border bg-card px-3 py-2">
			<h2 class="text-lg font-bold">Not Found - Group</h2>
			<p class="mt-1 text-sm text-muted-foreground">Couldn't find your requested preferences group.</p>
		</section>
	{/if}
{:else}
	<div class="flex justify-center">
		<Spinner class="size-16" />
	</div>
{/if}
