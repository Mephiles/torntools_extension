<script lang="ts">
	import { Spinner } from "@svelte/components/ui/spinner";
	import { isStoresInitialized } from "../../stores/database-store.svelte";
	import type { PreferenceGroupId } from "./configuration";
	import ConnectionsGroup from "./connections/ConnectionsGroup.svelte";
	import FinancialGroup from "./financial/FinancialGroup.svelte";
	import GlobalGroup from "./global/GlobalGroup.svelte";
	import InternalGroup from "./internal/InternalGroup.svelte";
	import QolGroup from "./qol/QolGroup.svelte";

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
	{:else if groupId === "financial"}
		<FinancialGroup {sectionId} />
	{:else if groupId === "qol"}
		<QolGroup {sectionId} />
	{:else if groupId === "connections"}
		<ConnectionsGroup />
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
