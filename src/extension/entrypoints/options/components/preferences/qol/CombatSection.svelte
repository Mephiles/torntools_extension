<script lang="ts">
	import { ttStorage } from "@common/utils/data/storage";
	import * as Field from "@svelte/components/ui/field";
	import { Switch } from "@svelte/components/ui/switch";
	import { settingsStore } from "../../../stores/database-store.svelte";
	import PreferenceSectionCard from "../PreferenceSectionCard.svelte";
	import PreferenceSettingGroup from "../PreferenceSettingGroup.svelte";
	import StorageNumber from "../StorageNumber.svelte";
	import StorageSwitch from "../StorageSwitch.svelte";
	import FriendlyFireCard from "./FriendlyFireCard.svelte";

	const attackOptions = [
		{ value: "leave", label: "Leave" },
		{ value: "mug", label: "Mug" },
		{ value: "hospitalize", label: "Hospitalize" },
	] as const;
	const hiddenAttackButtons = $derived($settingsStore.pages.attack.hideAttackButtons ?? []);

	async function updateHiddenAttackButton(option: string, hidden: boolean) {
		const nextHiddenAttackButtons = hidden
			? [...hiddenAttackButtons, option]
			: hiddenAttackButtons.filter((hiddenAttackButton) => hiddenAttackButton !== option);

		await ttStorage.change({ settings: { pages: { attack: { hideAttackButtons: nextHiddenAttackButtons } } } });
	}
</script>

<div class="space-y-2">
	<PreferenceSectionCard title="FF Scouter">
		<PreferenceSettingGroup>
			<StorageSwitch path="settings.scripts.ffScouter.miniProfile" label="Mini profiles" externalServices={["ffScouter"]} />
			<StorageSwitch path="settings.scripts.ffScouter.profile" label="Profiles" externalServices={["ffScouter"]} />
			<StorageSwitch path="settings.scripts.ffScouter.attack" label="Attack page" externalServices={["ffScouter"]} />
			<StorageSwitch path="settings.scripts.ffScouter.factionList" label="Faction member lists" externalServices={["ffScouter"]} />
			<StorageSwitch path="settings.scripts.ffScouter.gauge" label="Honor bars and name displays" externalServices={["ffScouter"]} />
		</PreferenceSettingGroup>
	</PreferenceSectionCard>

	<PreferenceSectionCard title="Attacks">
		<div class="grid gap-2">
			<PreferenceSettingGroup>
				<StorageSwitch path="settings.pages.attack.timeoutWarning" label="Play a sound when the time on your attack drops below 30 seconds" />
				<StorageSwitch path="settings.pages.attack.fairAttack" label="Show FF modifier" description="Requires attack history to be kept." />
				<StorageSwitch path="settings.pages.attack.bonusInformation" label="Show information about weapon bonuses in the attack log" />
			</PreferenceSettingGroup>

			<PreferenceSettingGroup title="Hide Attack Options" contentClass="grid gap-1 grid-cols-2 sm:grid-cols-3">
				{#each attackOptions as option (option.value)}
					{@const id = `hidden-attack-option-${option.value}`}
					<div class="rounded-md border border-border bg-background/60">
						<Field.Field orientation="horizontal" class="p-2">
							<Field.Content>
								<Field.Label for={id} class="w-full">{option.label}</Field.Label>
							</Field.Content>

							<Switch
								{id}
								size="sm"
								checked={hiddenAttackButtons.includes(option.value)}
								onCheckedChange={(hidden) => updateHiddenAttackButton(option.value, hidden)}
							/>
						</Field.Field>
					</div>
				{/each}
			</PreferenceSettingGroup>
		</div>
	</PreferenceSectionCard>

	<FriendlyFireCard />

	<PreferenceSectionCard title="Stats Estimate">
		<div class="grid gap-1">
			<StorageSwitch path="settings.scripts.statsEstimate.global" label="Stats Estimate" />

			<PreferenceSettingGroup>
				<StorageNumber path="settings.scripts.statsEstimate.maxLevel" label="Show estimates for users up to level" min={1} max={100} />
				<StorageNumber
					path="settings.scripts.statsEstimate.delay"
					label="Delay requests"
					description="Lowering this value might risk using too many API requests and getting blocked."
					min={1}
				/>
				<StorageSwitch path="settings.scripts.statsEstimate.cachedOnly" label="Only show cached results" description="Ignored on profiles." />
				<StorageSwitch path="settings.scripts.statsEstimate.displayNoResult" label="Show a notice when there was no cached result" />
			</PreferenceSettingGroup>

			<PreferenceSettingGroup title="Pages" contentClass="grid gap-1 grid-cols-2 md:grid-cols-3">
				<StorageSwitch path="settings.scripts.statsEstimate.profiles" label="Profiles" compact />
				<StorageSwitch path="settings.scripts.statsEstimate.enemies" label="Enemies list" compact />
				<StorageSwitch path="settings.scripts.statsEstimate.targets" label="Targets list" compact />
				<StorageSwitch path="settings.scripts.statsEstimate.hof" label="Hall of Fame" compact />
				<StorageSwitch path="settings.scripts.statsEstimate.attacks" label="Attacks page" compact />
				<StorageSwitch path="settings.scripts.statsEstimate.userlist" label="Userlist" compact />
				<StorageSwitch path="settings.scripts.statsEstimate.bounties" label="Bounties" compact />
				<StorageSwitch path="settings.scripts.statsEstimate.factions" label="Faction members" compact />
				<StorageSwitch path="settings.scripts.statsEstimate.wars" label="Faction wars" compact />
				<StorageSwitch path="settings.scripts.statsEstimate.rankedWars" label="Faction ranked wars" compact />
				<StorageSwitch path="settings.scripts.statsEstimate.abroad" label="Abroad" compact />
			</PreferenceSettingGroup>
		</div>
	</PreferenceSectionCard>
</div>
