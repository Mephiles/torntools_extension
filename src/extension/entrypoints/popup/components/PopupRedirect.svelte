<script lang="ts">
	import { onMount } from "svelte";
	import { replace } from "svelte-spa-router";
	import { apiStore, settingsStore } from "../stores/database-store.svelte";
	import { getStartupPath } from "../tabs";

	onMount(() => {
		const path = getStartupPath($settingsStore, !!$apiStore?.torn?.key);
		void replace(path);
	});
</script>

<div class="text-muted-foreground p-3 text-sm">Loading...</div>
