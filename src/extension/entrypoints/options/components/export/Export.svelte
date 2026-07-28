<script lang="ts">
	import ClipboardMethod from "./local/ClipboardMethod.svelte";
	import FileMethod from "./local/FileMethod.svelte";
	import BrowserSyncMethod from "./remote/BrowserSyncMethod.svelte";
</script>

<section class="space-y-4">
	<section class="border-border bg-card rounded-lg border px-3 py-2">
		<h2 class="text-lg font-bold">Locally</h2>

		<div class="mt-2 grid gap-2 sm:grid-cols-2">
			<ClipboardMethod />
			<FileMethod />
		</div>
	</section>

	<section class="border-border bg-card rounded-lg border px-3 py-2">
		<h2 class="text-lg font-bold">Remote</h2>

		<div class="mt-2 grid gap-2 sm:grid-cols-2">
			<BrowserSyncMethod />
		</div>
	</section>
</section>
