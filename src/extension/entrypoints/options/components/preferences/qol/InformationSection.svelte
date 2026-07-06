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
			<StorageSwitch path="settings.pages.city.items" label="Highlight items on the city map">
				<StorageSwitch path="settings.pages.city.combineDuplicates" label="Combine duplicate items" />
			</StorageSwitch>
		</PreferenceSettingGroup>
	</PreferenceSectionCard>

	<PreferenceSectionCard title="Last Action">
		<PreferenceSettingGroup>
			<StorageSwitch path="settings.scripts.lastAction.factionMember" label="Faction members" />
			<StorageSwitch path="settings.scripts.lastAction.companyOwn" label="Own company employees" />
			<StorageSwitch
				path="settings.scripts.lastAction.companyOther"
				label="Other company employees"
				description="This uses twice the API requests made when the company id isn't available."
			/>
		</PreferenceSettingGroup>
	</PreferenceSectionCard>

	<PreferenceSectionCard title="Properties">
		<PreferenceSettingGroup>
			<StorageSwitch path="settings.pages.property.value" label="Show value of all properties" />
			<StorageSwitch path="settings.pages.property.happy" label="Show happiness of all properties" />
		</PreferenceSettingGroup>
	</PreferenceSectionCard>

	<PreferenceSectionCard title="Forums">
		<PreferenceSettingGroup>
			<StorageSwitch path="settings.pages.forums.menu" label="Show forum action menu" />
			<StorageSwitch path="settings.pages.forums.debugInfoBtn" label="Display button to add debugging information to TornTools forum thread" />
			<StorageSwitch path="settings.pages.forums.onlyNewFeedButton" label="Show a button to only show new items in a feed" />
		</PreferenceSettingGroup>
	</PreferenceSectionCard>

	<PreferenceSectionCard title="Education">
		<PreferenceSettingGroup>
			<StorageSwitch path="settings.pages.education.greyOut" label="Grey out completed education categories" />
			<StorageSwitch path="settings.pages.education.finishTime" label="Show education course finish time" />
		</PreferenceSettingGroup>
	</PreferenceSectionCard>

	<PreferenceSectionCard title="Missions">
		<PreferenceSettingGroup>
			<StorageSwitch path="settings.pages.missions.hints" label="Mission hints" />
			<StorageSwitch path="settings.pages.missions.rewards" label="Reward information" />
		</PreferenceSettingGroup>
	</PreferenceSectionCard>

	<PreferenceSectionCard title="Museum">
		<PreferenceSettingGroup>
			<StorageSwitch path="settings.pages.museum.autoFill" label="Autofill number of sets in museum" />
		</PreferenceSettingGroup>
	</PreferenceSectionCard>

	<PreferenceSectionCard title="Racing">
		<PreferenceSettingGroup>
			<StorageSwitch path="settings.pages.racing.winPercentage" label="Show win percentage of each car" />
			<StorageSwitch path="settings.pages.racing.upgrades" label="Show racing upgrade values" />
		</PreferenceSettingGroup>
	</PreferenceSectionCard>

	<PreferenceSectionCard title="API">
		<PreferenceSettingGroup>
			<StorageSwitch
				path="settings.pages.api.autoDemo"
				label="Automatically show demo content"
				description="Make sure to first read the different sections of the documentation as they define acceptable usage, guidelines, and more."
			/>
			<StorageSwitch path="settings.pages.api.autoFillKey" label="Automatically fill your API key" />
			<StorageSwitch path="settings.pages.api.autoPretty" label="Automatically select pretty outputs" />
			<StorageSwitch path="settings.pages.api.clickableSelections" label="Make API selections clickable" />
		</PreferenceSettingGroup>
	</PreferenceSectionCard>

	<PreferenceSectionCard title="Filters">
		<PreferenceSettingGroup>
			<StorageSwitch path="settings.pages.stocks.filter" label="Stocks" />
			<StorageSwitch path="settings.pages.auction.filter" label="Auction House" />
			<StorageSwitch path="settings.pages.bounties.filter" label="Bounties" />
			<StorageSwitch path="settings.pages.faction.armoryFilter" label="Faction Armory" />
			<StorageSwitch path="settings.pages.faction.memberFilter" label="Faction Members">
				<StorageSwitch path="settings.pages.faction.memberFilterRevivable" label="Filter on revivable status." description="Will send an API request for every visited faction." />
			</StorageSwitch>
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
					class="flex items-center gap-1 text-xs text-primary hover:underline"
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
