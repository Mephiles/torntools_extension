<script lang="ts">
	import { Badge } from "@svelte/components/ui/badge";
	import { Button } from "@svelte/components/ui/button";
	import type { Snippet } from "svelte";
	import ExportDialog from "@/entrypoints/options-v2/components/export/ExportDialog.svelte";
	import ImportDialog from "@/entrypoints/options-v2/components/export/ImportDialog.svelte";

	interface ExportMethodProps {
		title: string;
		recommended?: boolean;
		description: string;
		busy?: boolean;
		allowApi: boolean;
		onExport: (includeApi: boolean) => (Promise<void> | void);
		disableImport?: boolean;
		onImport: () => (Promise<void> | void);
		information?: Snippet;
		extraButtons?: Snippet;
		exportWarning?: Snippet;
		extraImportInput?: Snippet;
	}

	let {
		title,
		recommended = false,
		description,
		busy = $bindable(false),
		allowApi,
		onExport,
		disableImport,
		onImport,
		information,
		extraButtons,
		exportWarning,
		extraImportInput,
	}: ExportMethodProps = $props();

	let exportDialog = $state(false);
	let importDialog = $state(false);
	let includeApi = $state(false);

	async function confirmExport() {
		busy = true;
		try {
			await onExport(includeApi);
			exportDialog = false;
		} finally {
			busy = false;
		}
	}

	async function confirmImport() {
		busy = true;
		try {
			await onImport();
			importDialog = false;
		} finally {
			busy = false;
		}
	}
</script>

<article class="flex h-full flex-col rounded-lg border border-border/70 p-2">
	<div class="flex flex-wrap items-center gap-2">
		<h3 class="text-sm font-bold">{title}</h3>
		{#if recommended}
			<Badge
				variant="secondary"
				class="border-amber-300 bg-amber-100 text-amber-900 dark:border-transparent dark:bg-amber-950 dark:text-amber-200"
			>
				Recommended
			</Badge>
		{/if}
	</div>
	<p class="mt-1 text-sm text-muted-foreground">{description}</p>

	{@render information?.()}

	<div class="mt-auto pt-2 flex flex-wrap gap-2">
		<Button size="sm" disabled={busy} onclick={() => (exportDialog = true)}>Export</Button>
		<Button size="sm" variant="outline" disabled={busy || disableImport} onclick={() => (importDialog = true)}>
			Import
		</Button>
		{@render extraButtons?.()}
	</div>
</article>

<ExportDialog bind:dialogOpen={exportDialog} {allowApi} bind:includeApi onConfirm={confirmExport}>
	{#snippet warning()}
		{@render exportWarning?.()}
	{/snippet}
</ExportDialog>

<ImportDialog bind:dialogOpen={importDialog} {allowApi} onConfirm={confirmImport}>
	{#snippet extraInput()}
		{@render extraImportInput?.()}
	{/snippet}
</ImportDialog>
