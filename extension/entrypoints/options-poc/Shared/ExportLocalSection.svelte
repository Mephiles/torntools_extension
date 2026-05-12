<script lang="ts">
	import { Button } from "@svelte/components/ui/button";

	type ActionKind = "clipboard" | "file";

	let {
		busy,
		openExportDialog,
		openManualImportDialog,
		openFileImport,
	}: {
		busy: boolean;
		openExportDialog: (action: ActionKind) => void;
		openManualImportDialog: () => void;
		openFileImport: () => void;
	} = $props();
</script>

<section class="rounded-2xl border border-border bg-card p-6 shadow-sm">
	<h2 class="text-xl font-bold">Locally</h2>

	<div class="mt-4 grid gap-4 md:grid-cols-2">
		<div class="rounded-xl border border-border/70 p-4">
			<h3 class="text-base font-medium">Clipboard</h3>
			<p class="mt-2 text-sm text-muted-foreground">
				Copy a compact version of the database, or paste one back in manually.
			</p>
			<div class="mt-4 flex flex-wrap gap-3">
				<Button disabled={busy} onclick={() => openExportDialog("clipboard")}>Export</Button>
				<Button variant="outline" disabled={busy} onclick={openManualImportDialog}>Import</Button>
			</div>
		</div>

		<div class="rounded-xl border border-border/70 p-4">
			<h3 class="text-base font-medium">File</h3>
			<p class="mt-2 text-sm text-muted-foreground">
				Download a formatted file or import one from disk.
			</p>
			<div class="mt-4 flex flex-wrap gap-3">
				<Button disabled={busy} onclick={() => openExportDialog("file")}>Export</Button>
				<Button variant="outline" disabled={busy} onclick={openFileImport}>Import</Button>
			</div>
		</div>
	</div>
</section>
