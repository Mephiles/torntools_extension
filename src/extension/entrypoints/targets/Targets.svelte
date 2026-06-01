<script lang="ts">
	import AttackHistoryRedirect from "@extension/entrypoints/targets/components/attackhistory/AttackHistoryRedirect.svelte";
	import GlobalLayout from "@extension/entrypoints/targets/components/GlobalLayout.svelte";
	import Router from "svelte-spa-router";
	import AttackHistory from "./components/attackhistory/AttackHistory.svelte";
	import Stakeouts from "./components/stakeouts/Stakeouts.svelte";


	const routes = {
		"/attackhistory": AttackHistory,
		"/stakeouts": Stakeouts,
		"/": AttackHistoryRedirect,
	};
</script>

<GlobalLayout>
	<Router {routes} />
</GlobalLayout>
