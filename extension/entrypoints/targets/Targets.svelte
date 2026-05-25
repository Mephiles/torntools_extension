<script lang="ts">
	import Router from "svelte-spa-router";
	import AttackHistoryRedirect from "@/entrypoints/targets/components/attackhistory/AttackHistoryRedirect.svelte";
	import GlobalLayout from "@/entrypoints/targets/components/GlobalLayout.svelte";
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
