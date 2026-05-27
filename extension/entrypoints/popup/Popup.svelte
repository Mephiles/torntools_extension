<script lang="ts">
	import { onMount } from "svelte";
	import Router, { replace, router } from "svelte-spa-router";
	import Calculator from "./components/calculator/Calculator.svelte";
    import GlobalLayout from "./components/GlobalLayout.svelte";
	import Initialize from "./components/initialize/Initialize.svelte";
	import Market from "./components/market/Market.svelte";
    import PopupRedirect from "./components/PopupRedirect.svelte";
	import Stocks from "./components/stocks/Stocks.svelte";
	import Dashboard from "./routes/Dashboard.svelte";
	import Notifications from "./routes/Notifications.svelte";
    import { apiStore, initializeDatabaseStore, settingsStore } from "./stores/database-store.svelte.js";
    import { getStartupPath } from "./tabs";

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
    const startupPath = $derived.by(() => {
        if (!$settingsStore || !$apiStore) return null;

        return getStartupPath($settingsStore, !!$apiStore?.torn?.key);
    })

    $effect(() => {
        if (!startupPath || initialized) return;

        const currentLocation = router.location;
        if (currentLocation !== startupPath) {
            void replace(startupPath);
        }
        initialized = true;
    })

	onMount(() => {
        initializeDatabaseStore();
	});
</script>

<GlobalLayout>
    {#if initialized}
        <Router {routes} />
    {:else}
        <div class="text-sm text-muted-foreground">Loading...</div>
    {/if}
</GlobalLayout>
