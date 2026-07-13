<script lang="ts">
	import { ttStorage } from "@common/utils/context";
	import { capitalizeText } from "@common/utils/functions/formatting";
	import { CASINO_GAMES } from "@common/utils/functions/torn";
	import * as Field from "@svelte/components/ui/field";
	import { Switch } from "@svelte/components/ui/switch";
	import ArrowSquareOutIcon from "phosphor-svelte/lib/ArrowSquareOutIcon";
	import { settingsStore, stockdataStore } from "../../../stores/database-store.svelte";
	import PreferenceSectionCard from "../PreferenceSectionCard.svelte";
	import PreferenceSettingGroup from "../PreferenceSettingGroup.svelte";
	import StorageSwitch from "../StorageSwitch.svelte";

	const hiddenCasinoGames = $derived($settingsStore.hideCasinoGames ?? []);
	const hiddenStocks = $derived($settingsStore.hideStocks ?? []);
	const stockChoices = $derived(($stockdataStore?.stocks ?? []).map(stock => ({ id: stock.id.toString(), name: stock.name })));

	async function updateCasinoGameVisibility(game: string, hidden: boolean) {
		const nextHiddenGames = hidden ? [...hiddenCasinoGames, game] : hiddenCasinoGames.filter((hiddenGame) => hiddenGame !== game);

		await ttStorage.change({ settings: { hideCasinoGames: nextHiddenGames } });
	}

	async function updateStockVisibility(stockId: string, hidden: boolean) {
		const nextHiddenStocks = hidden ? [...hiddenStocks, stockId] : hiddenStocks.filter((hiddenStock) => hiddenStock !== stockId);

		await ttStorage.change({ settings: { hideStocks: nextHiddenStocks } });
	}
</script>

<div class="space-y-2">
	<PreferenceSectionCard>
		<PreferenceSettingGroup>
			<StorageSwitch path="settings.pages.events.worth" label="Show worth of points, bazaar sales and item market sales on event hover" />
			<StorageSwitch path="settings.pages.home.networthDetails" label="Display networth details on the homepage" />
			<StorageSwitch path="settings.pages.trade.itemValues" label="Trade item value" />
			<StorageSwitch path="settings.pages.displayCase.worth" label="Display case worth" />
		</PreferenceSettingGroup>

		<PreferenceSettingGroup title="Items">
			<StorageSwitch path="settings.pages.crimes2.value" label="Total value for your crimes v2 item rewards" />
			<StorageSwitch path="settings.pages.items.values" label="Display item values" />
			<StorageSwitch path="settings.pages.items.marketLinks" label="Link to the item market" />
			<StorageSwitch path="settings.pages.items.openedSupplyPackValue" label="Total value of items for supply pack" />
		</PreferenceSettingGroup>
	</PreferenceSectionCard>

	<PreferenceSectionCard title="Bank Investments">
		<PreferenceSettingGroup>
			<StorageSwitch path="settings.pages.bank.investmentInfo" label="Enable bank investment info" />
			<StorageSwitch path="settings.pages.bank.investmentDueTime" label="Enable bank investment due time" />
		</PreferenceSettingGroup>
	</PreferenceSectionCard>

	<PreferenceSectionCard title="Stock Exchange">
		<div class="grid gap-2">
			<PreferenceSettingGroup>
				<StorageSwitch path="settings.pages.stocks.acronyms" label="Display acronyms beside stock names" />
				<StorageSwitch path="settings.pages.stocks.moneyInput" label="Display money input when buying and selling stock" />
				<StorageSwitch path="settings.pages.stocks.valueAndProfit" label="Display total value of portfolio and profits" />
			</PreferenceSettingGroup>

			<PreferenceSettingGroup title="Hidden Stocks" contentClass="grid gap-1 grid-cols-2 md:grid-cols-3">
				{#if stockChoices.length}
					{#each stockChoices as stock (stock.id)}
						{@const id = `financial-hidden-stock-${stock.id}`}
						<div class="rounded-md border border-border bg-background/60">
							<Field.Field orientation="horizontal" class="p-2">
								<Field.Content>
									<Field.Label for={id} class="w-full">{capitalizeText(stock.name)}</Field.Label>
								</Field.Content>

								<Switch id={id} size="sm" checked={hiddenStocks.includes(stock.id)} onCheckedChange={(hidden) => updateStockVisibility(stock.id, hidden)} />
							</Field.Field>
						</div>
					{/each}
				{:else}
					<p class="text-sm text-amber-600 dark:text-amber-400">Requires API data to be loaded.</p>
				{/if}
			</PreferenceSettingGroup>
		</div>
	</PreferenceSectionCard>

	<PreferenceSectionCard title="Casino">
		<div class="grid gap-2">
			<PreferenceSettingGroup>
				<StorageSwitch path="settings.pages.casino.netTotal" label="Show net total of casino game" />
				<StorageSwitch path="settings.pages.casino.blackjack" label="Show the optimal choice for blackjack">
					<a
						href="https://www.beatingbonuses.com/bjstrategy.php?decks=8&soft17=stand&doubleon=any2cards&peek=off&das=on&dsa=on&charlie=on&surrender=earlyf&opt=1&btn=Generate+Strategy"
						target="_blank"
						rel="noreferrer"
						class="flex items-center gap-1 text-xs text-primary hover:underline"
					>
						Strategy calculator
						<ArrowSquareOutIcon aria-hidden="true" />
					</a>
				</StorageSwitch>
				<StorageSwitch path="settings.pages.casino.highlow" label="Enable the high-low helper">
					<StorageSwitch path="settings.pages.casino.highlowMovement" label="Move the buttons to make it easier to click through it" />
				</StorageSwitch>
			</PreferenceSettingGroup>

			<PreferenceSettingGroup title="Hidden Casino Games" contentClass="grid gap-1 grid-cols-2 md:grid-cols-3">
				{#each CASINO_GAMES as game (game)}
					{@const id = `financial-hidden-casino-game-${game}`}
					<div class="rounded-md border border-border bg-background/60">
						<Field.Field orientation="horizontal" class="p-2">
							<Field.Content>
								<Field.Label for={id} class="w-full">{capitalizeText(game)}</Field.Label>
							</Field.Content>

							<Switch id={id} size="sm" checked={hiddenCasinoGames.includes(game)} onCheckedChange={(hidden) => updateCasinoGameVisibility(game, hidden)} />
						</Field.Field>
					</div>
				{/each}
			</PreferenceSettingGroup>
		</div>
	</PreferenceSectionCard>
</div>
