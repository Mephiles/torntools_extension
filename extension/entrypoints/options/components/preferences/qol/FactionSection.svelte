<script lang="ts">
	import { Button } from "@svelte/components/ui/button";
	import { Input } from "@svelte/components/ui/input";
	import PlusIcon from "phosphor-svelte/lib/PlusIcon";
	import TrashIcon from "phosphor-svelte/lib/TrashIcon";
	import { ttStorage } from "@/utils/common/data/storage";
	import { settingsStore } from "../../../stores/database-store.svelte";
	import PreferenceSectionCard from "../PreferenceSectionCard.svelte";
	import PreferenceSettingGroup from "../PreferenceSettingGroup.svelte";
	import StorageSwitch from "../StorageSwitch.svelte";

	type InactivityWarning = { days: number | null; color: string };

	function getWarningDraft(warning: InactivityWarning) {
		return warning.days === null || Number.isNaN(warning.days) ? "" : String(warning.days);
	}

	async function updateFactionInactivityWarning(nextWarnings: InactivityWarning[]) {
		await ttStorage.change({ settings: { factionInactivityWarning: nextWarnings } });
	}

	function addFactionInactivityWarning() {
		void updateFactionInactivityWarning([...$settingsStore.factionInactivityWarning, { days: null, color: "#ff0000" }]);
	}

	function updateFactionInactivityWarningField<K extends keyof InactivityWarning>(
		index: number,
		key: K,
		value: InactivityWarning[K],
	) {
		const nextWarnings = [...$settingsStore.factionInactivityWarning];
		const warning = nextWarnings[index];
		if (!warning) return;

		nextWarnings[index] = { ...warning, [key]: value };
		void updateFactionInactivityWarning(sortFactionInactivityWarnings(nextWarnings));
	}

	function updateFactionInactivityWarningDays(index: number, value: string) {
		const parsedDays = parseInt(value, 10);
		updateFactionInactivityWarningField(index, "days", value === "" || Number.isNaN(parsedDays) ? null : parsedDays);
	}

	function removeFactionInactivityWarning(index: number) {
		void updateFactionInactivityWarning($settingsStore.factionInactivityWarning.filter((_, warningIndex) => warningIndex !== index));
	}

	function sortFactionInactivityWarnings(warnings: InactivityWarning[]) {
		return [...warnings].sort((first, second) => (first.days ?? 0) - (second.days ?? 0));
	}
</script>

<div class="space-y-2">
	<PreferenceSectionCard title="Faction">
		<PreferenceSettingGroup>
			<StorageSwitch path="settings.pages.faction.idBesideFactionName" label='Reformat faction names as "FACTIONNAME [ID]"' />
			<StorageSwitch path="settings.pages.faction.banker" label="Show banker options" />
			<StorageSwitch path="settings.pages.faction.showFullInfobox" label="Show the option to show the description without scroll bar" />
			<StorageSwitch path="settings.pages.faction.foldableInfobox" label="Make infobox foldable" />
			<StorageSwitch path="settings.pages.faction.numberMembers" label="Add numbers to every member of faction" />
			<StorageSwitch path="settings.pages.faction.warFinishTimes" label="Show the finish time of wars" />
			<StorageSwitch path="settings.pages.faction.armoryWorth" label="Show total worth of faction armory" description="Requires faction API access." />
			<StorageSwitch path="settings.pages.faction.upgradeRequiredRespect" label="Show respect required for a faction upgrade" />
			<StorageSwitch path="settings.pages.faction.memberInfo" label="Show money and points balance of members" description="Requires faction API access." />
			<StorageSwitch path="settings.pages.faction.quickItems" label="Quick items in the armory" />
			<StorageSwitch
				path="settings.pages.faction.showFactionSpy"
				label="Show spy details of members of a faction you are viewing"
				description="Only works if Stats Estimate is turned off for factions, wars and ranked wars."
				externalServices={["tornstats", "yata"]}
			/>
			<StorageSwitch path="settings.pages.faction.totalChallengeContributions" label="Show total challenge contributions" />
		</PreferenceSettingGroup>

		<PreferenceSettingGroup title="CSV">
			<StorageSwitch path="settings.pages.faction.csvRankedWarReport" label="Ranked war report" />
			<StorageSwitch path="settings.pages.faction.csvWarReport" label="War report" />
			<StorageSwitch path="settings.pages.faction.csvChainReport" label="Chain report" />
			<StorageSwitch path="settings.pages.faction.csvChallengeContributions" label="Challenge contributions" />
		</PreferenceSettingGroup>
	</PreferenceSectionCard>

	<PreferenceSectionCard title="OCs">
		<div class="grid gap-2">
			<StorageSwitch path="settings.pages.faction.highlightOwn" label="Highlight own OC" />

			<PreferenceSettingGroup title="OCs v1">
				<StorageSwitch path="settings.pages.faction.openOc" label="Open ready OCs" />
				<StorageSwitch path="settings.pages.faction.availablePlayers" label="Show amount of available players" />
				<StorageSwitch
					path="settings.pages.faction.recommendedNnb"
					label="Show recommended NNB per OC"
					description="Based on the known Torn forum formula."
				/>
				<StorageSwitch path="settings.pages.faction.ocNnb" label="Show a user's NNB" externalServices={["yata", "tornstats"]} />
				<StorageSwitch path="settings.pages.faction.ocTimes" label="Show OC times on the faction page" />
				<StorageSwitch path="settings.pages.faction.ocLastAction" label="Show last action on OC details" />
			</PreferenceSettingGroup>

			<PreferenceSettingGroup title="OCs v2">
				<StorageSwitch path="settings.pages.faction.warnCrime" label="Warn when joining a crime without passing the conditions" />
				<StorageSwitch path="settings.pages.faction.rankedWarValue" label="Show the total rewards for ranked wars" />
			</PreferenceSettingGroup>
		</div>
	</PreferenceSectionCard>

	<PreferenceSectionCard title="Faction Member Inactivity Warning" description="Requires last action to be enabled.">
		{#snippet action()}
			<Button type="button" size="icon-xs" variant="outline" onclick={addFactionInactivityWarning}>
				<PlusIcon />
			</Button>
		{/snippet}

		{#if $settingsStore.factionInactivityWarning.length}
			<div class="space-y-1">
				{#each $settingsStore.factionInactivityWarning as warning, index (index)}
					<div class="grid gap-2 rounded-md border border-border bg-background/60 p-2 md:grid-cols-[1fr_3rem_28px]">
						<Input
							type="number"
							min={0}
							value={getWarningDraft(warning)}
							placeholder="Days"
							oninput={(event) => updateFactionInactivityWarningDays(index, event.currentTarget.value)}
						/>
						<Input
							type="color"
							value={warning.color}
							oninput={(event) => updateFactionInactivityWarningField(index, "color", event.currentTarget.value)}
						/>
						<Button type="button" size="icon" variant="destructive" onclick={() => removeFactionInactivityWarning(index)}>
							<TrashIcon />
						</Button>
					</div>
				{/each}
			</div>
		{:else}
			<p class="rounded-md border border-dashed border-border p-2 text-center text-muted-foreground">
				No inactivity warnings configured.
			</p>
		{/if}
	</PreferenceSectionCard>
</div>
