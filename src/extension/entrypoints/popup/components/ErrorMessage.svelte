<script lang="ts">
	let { error }: { error: unknown } = $props();
</script>

<div class="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-2 py-1.5 text-xs">
	<p>Something went wrong while loading this section, please contact the developers if it continues.</p>
	<p>{error}</p>
</div>
