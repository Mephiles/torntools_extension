<script lang="ts">
	import { ttCache } from "@common/utils/data/cache";
	import type { TornW3BResult } from "@common/utils/functions/api.types";
	import { fetchData } from "@common/utils/functions/api-fetcher";
	import { formatNumber } from "@common/utils/functions/formatting";
	import { isSellable } from "@common/utils/functions/torn";
	import { TO_MILLIS } from "@common/utils/functions/utilities";
	import MarketPrice from "@extension/entrypoints/popup/components/market/MarketPrice.svelte";
	import { Alert, AlertDescription, AlertTitle } from "@svelte/components/ui/alert";
	import { Badge } from "@svelte/components/ui/badge";
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@svelte/components/ui/card";
	import { Separator } from "@svelte/components/ui/separator";
	import { Spinner } from "@svelte/components/ui/spinner";
	import { cn } from "@svelte/utils";
	import type { MarketItemMarketResponse, TornItem } from "tornapi-typescript";
	import { settingsStore } from "../../stores/database-store.svelte";

	interface SearchResultProps {
		selectedItem: TornItem | null;
	}
	let {selectedItem}: SearchResultProps = $props();

	let loading = $state(false);
	let error = $state("");
	let itemMarket = $state<MarketItemMarketResponse | null>(null);
	let tornW3bMarket = $state<TornW3BResult | null>(null);

	const tornListings = $derived(itemMarket?.itemmarket.listings ?? []);
	const tornW3bListings = $derived((tornW3bMarket?.listings ?? []).slice(0, 3));
	const showExternalMarket = $derived(!!$settingsStore?.pages?.popup?.bazaarUsingExternal && !!$settingsStore?.external?.tornw3b);

	$effect(() => {
		error = "";
		itemMarket = null;
		tornW3bMarket = null;

		if (!selectedItem || !isSellable(selectedItem.id)) return;

		loading = true;

		Promise.all([
			loadTornMarket(selectedItem.id),
			showExternalMarket ? loadTornW3bMarket(selectedItem.id) : Promise.resolve<TornW3BResult>({ listings: [] }),
		])
			.then(([tornResult, tornW3bResult]) => {
				itemMarket = tornResult;
				tornW3bMarket = tornW3bResult;
			})
			.catch((err: Error) => {
				error = err.message ?? "Unable to load market prices.";
			})
			.finally(() => {
				loading = false;
			});
	});

	async function loadTornMarket(itemId: number) {
		if (ttCache.hasValue("livePrice", itemId)) {
			return ttCache.get<MarketItemMarketResponse>("livePrice", itemId);
		}

		const result = await fetchData<MarketItemMarketResponse>("tornv2", {
            section: "market",
            id: itemId,
            selections: ["itemmarket"],
            params: { limit: 3 },
        });
        void ttCache.set({[itemId]: result}, TO_MILLIS.SECONDS * 30, "livePrice");
        return result;
	}

	async function loadTornW3bMarket(itemId: number) {
		if (ttCache.hasValue("tornw3bPrice", itemId)) {
			return ttCache.get<TornW3BResult>("tornw3bPrice", itemId);
		}

		const result = await fetchData<TornW3BResult>("tornw3b", { section: `marketplace/${itemId}` });
        void ttCache.set({[itemId]: result}, TO_MILLIS.SECONDS * 60, "tornw3bPrice");
        return result;
	}
</script>

{#if error}
	<Alert variant="destructive">
		<AlertTitle>Market lookup failed</AlertTitle>
		<AlertDescription>{error}</AlertDescription>
	</Alert>
{/if}

{#if selectedItem}
	<Card size="sm" class="rounded-lg mx-1">
		<CardHeader class="grid-cols-[4rem_1fr] gap-x-2">
			<img class="size-16 rounded-md border border-border object-contain" src={selectedItem.image} alt={selectedItem.name} />
			<div class="min-w-0 space-y-1">
				<CardTitle>
					<a class="hover:underline" href={`https://www.torn.com/page.php?sid=ItemMarket#/market/view=search&itemID=${selectedItem.id}&itemName=${selectedItem.name}&itemType=${selectedItem.type}`} target="_blank" rel="noreferrer">
						{selectedItem.name}
					</a>
				</CardTitle>
				<CardDescription class="flex flex-wrap gap-1">
					<Badge variant="outline">#{selectedItem.id}</Badge>
					<Badge variant="secondary">{selectedItem.type}</Badge>
					{#if selectedItem.sub_type}
						<Badge variant="secondary">{selectedItem.sub_type}</Badge>
					{/if}
				</CardDescription>
				<div class="grid grid-cols-2 gap-2 pt-1 text-xs">
					<div>
						<div class="text-muted-foreground">Circulation</div>
						<div class="">{formatNumber(selectedItem.circulation)}</div>
					</div>
					<div>
						<div class="text-muted-foreground">Market value</div>
						<div class="">{formatNumber(selectedItem.value.market_price, { currency: true })}</div>
					</div>
				</div>
			</div>
		</CardHeader>
		<CardContent class="space-y-3 px-3 text-xs">
			<Separator />

			{#if !isSellable(selectedItem.id)}
				<Alert variant="destructive">
					<AlertTitle>Not sellable</AlertTitle>
					<AlertDescription>This item cannot be sold.</AlertDescription>
				</Alert>
			{:else if loading}
				<div class="flex items-center gap-2 py-2 text-muted-foreground">
					<Spinner class="size-4" />
					<span>Loading prices...</span>
				</div>
			{:else if itemMarket}
				<div class={cn("grid gap-2", { "grid-cols-2": showExternalMarket })}>
					<MarketPrice
							title="Item Market"
							listings={tornListings.map((listing) => ({ amount: listing.amount, price: listing.price }))}
					/>

					{#if showExternalMarket}
						<MarketPrice
								title="TornW3B Bazaars"
								listings={tornW3bListings.map((listing) => ({ amount: listing.quantity, price: listing.price }))}
						/>
					{/if}
				</div>
			{/if}
		</CardContent>
	</Card>
{/if}
