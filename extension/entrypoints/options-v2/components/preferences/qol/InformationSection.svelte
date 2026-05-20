<script lang="ts">
	import ArrowSquareOutIcon from "phosphor-svelte/lib/ArrowSquareOutIcon";
	import PreferenceSectionCard from "../PreferenceSectionCard.svelte";
	import PreferenceSettingGroup from "../PreferenceSettingGroup.svelte";
	import StorageSwitch from "../StorageSwitch.svelte";
</script>

<div class="space-y-2">
	<PreferenceSectionCard>
		<PreferenceSettingGroup>
			<StorageSwitch path="settings.pages.home.effectiveStats" label="Show effective battle stats on the homepage" />
		</PreferenceSettingGroup>
	</PreferenceSectionCard>

	<PreferenceSectionCard title="Filters">
		<PreferenceSettingGroup>
			<StorageSwitch path="settings.pages.stocks.filter" label="Stocks" />
			<StorageSwitch path="settings.pages.auction.filter" label="Auction House" />
			<StorageSwitch path="settings.pages.bounties.filter" label="Bounties" />
			<StorageSwitch path="settings.pages.faction.armoryFilter" label="Faction Armory" />
			<StorageSwitch path="settings.pages.faction.memberFilter" label="Faction Members" />
			<StorageSwitch path="settings.pages.faction.rankedWarFilter" label="Ranked War" />
			<StorageSwitch path="settings.pages.faction.oc2Filter" label="OC2 2" disabled description="Disabled until further notice." />
			<StorageSwitch path="settings.pages.competition.filter" label="Competition" disabled description="Disabled until further notice." />
			<StorageSwitch path="settings.pages.crimes2.burglaryFilter" label="Burglary" disabled description="Disabled until further notice." />
			<StorageSwitch path="settings.pages.friends.filter" label="Friends"  disabled description="Disabled until further notice."/>
			<StorageSwitch path="settings.pages.enemies.filter" label="Enemies" disabled description="Disabled until further notice." />
			<StorageSwitch path="settings.pages.targets.filter" label="Targets" disabled description="Disabled until further notice." />
			<StorageSwitch path="settings.pages.hospital.filter" label="Hospital" />
			<StorageSwitch path="settings.pages.jail.filter" label="Jail">
				<a
					href="https://www.torn.com/forums.php#/p=threads&amp;f=61&amp;t=16192039"
					target="_blank"
					rel="noreferrer"
					class="inline-flex items-center gap-1 text-xs text-primary hover:underline"
				>
					Score formula
					<ArrowSquareOutIcon aria-hidden="true" />
				</a>
			</StorageSwitch>
			<StorageSwitch path="settings.pages.racing.filter" label="Custom Races" />
			<StorageSwitch path="settings.pages.shops.filters" label="City Shops" />
			<StorageSwitch path="settings.pages.travel.itemFilter" label="Travel Items" />
			<StorageSwitch path="settings.pages.travel.peopleFilter" label="Travel People" />
			<StorageSwitch path="settings.pages.userlist.filter" label="Userlist" />
		</PreferenceSettingGroup>
	</PreferenceSectionCard>
</div>
