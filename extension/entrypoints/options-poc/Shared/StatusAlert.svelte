<script lang="ts">
	import { Button } from "@svelte/components/ui/button";

	type Status = { type: "success" | "error"; text: string } | null;

	let {
		status,
		onClear,
	}: {
		status: Status;
		onClear: () => void;
	} = $props();

	$effect(() => {
		if (!status) return;

		const timeoutId = window.setTimeout(() => {
			onClear();
		}, 5000);

		return () => {
			window.clearTimeout(timeoutId);
		};
	});
</script>

{#if status}
	<div class="pointer-events-none fixed right-4 bottom-4 z-50 w-[min(28rem,calc(100vw-2rem))]">
		<div
			role="alert"
			aria-live="polite"
			class={`pointer-events-auto rounded-2xl border shadow-lg backdrop-blur-sm ${
				status.type === "success"
					? "border-emerald-300/80 bg-emerald-50/95 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-100"
					: "border-red-300/80 bg-red-50/95 text-red-950 dark:border-red-800 dark:bg-red-950/90 dark:text-red-100"
			}`}
		>
			<div class="flex items-start gap-3 p-4">
				<div class="min-w-0 flex-1">
					<p class="text-sm font-medium">{status.type === "success" ? "Success" : "Error"}</p>
					<p class="mt-1 text-sm opacity-90">{status.text}</p>
				</div>

				<Button
					type="button"
					variant="ghost"
					class="h-auto min-h-0 px-2 py-1 text-xs"
					onclick={onClear}
				>
					Close
				</Button>
			</div>
		</div>
	</div>
{/if}
