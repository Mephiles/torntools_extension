<script lang="ts">
	import { onMount } from "svelte";
	import { replace } from "svelte-spa-router";

	onMount(() => void replace("/preferences"));
</script>
