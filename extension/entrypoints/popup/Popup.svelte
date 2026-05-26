<script lang="ts">
	import { onMount } from "svelte";
	import Router, { replace, router } from "svelte-spa-router";
	import Calculator from "./components/calculator/Calculator.svelte";
    import GlobalLayout from "./components/GlobalLayout.svelte";
	import Initialize from "./components/initialize/Initialize.svelte";
	import Market from "./components/market/Market.svelte";
    import PopupRedirect from "./components/PopupRedirect.svelte";
	import Dashboard from "./routes/Dashboard.svelte";
	import Notifications from "./routes/Notifications.svelte";
	import Stocks from "./routes/Stocks.svelte";
	import { apiStore, settingsStore } from "./stores/database-store.svelte.js";
    import {getStartupPath} from "./tabs";

	const routes = {
		"/initialize": Initialize,
		"/dashboard": Dashboard,
		"/market": Market,
		"/calculator": Calculator,
		"/stocks": Stocks,
		"/notifications": Notifications,
		"*": PopupRedirect,
	};

	let initialized = $state(false);

	onMount(() => {
		const unsubscribeStartup = apiStore.subscribe((api) => {
			if (!$settingsStore || !api) return;

			const currentLocation = router.location;
			const startupPath = getStartupPath($settingsStore, !!api.torn.key);
			if (!api.torn.key && currentLocation !== "/initialize") {
				void replace("/initialize");
			} else if (api.torn.key && (currentLocation === "/" || currentLocation === "/initialize")) {
				void replace(startupPath);
			}
			initialized = true;
		});

		return () => {
			unsubscribeStartup();
		};
	});

</script>

<GlobalLayout>
    {#if initialized}
        <Router {routes} />
    {:else}
        <div class="text-sm text-muted-foreground">Loading...</div>
    {/if}
</GlobalLayout>
