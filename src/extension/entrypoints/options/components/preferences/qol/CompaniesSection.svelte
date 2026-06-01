<script lang="ts">
	import { Button } from "@svelte/components/ui/button";
	import { Input } from "@svelte/components/ui/input";
	import { ttStorage } from "@utils/context";
	import PlusIcon from "phosphor-svelte/lib/PlusIcon";
	import TrashIcon from "phosphor-svelte/lib/TrashIcon";
	import { settingsStore } from "../../../stores/database-store.svelte";
	import PreferenceSectionCard from "../PreferenceSectionCard.svelte";
	import PreferenceSettingGroup from "../PreferenceSettingGroup.svelte";
	import StorageNumber from "../StorageNumber.svelte";
	import StorageSwitch from "../StorageSwitch.svelte";

	type InactivityWarning = { days: number | null; color: string };

	function getWarningDraft(warning: InactivityWarning) {
		return warning.days === null || Number.isNaN(warning.days) ? "" : String(warning.days);
	}

	async function updateEmployeeInactivityWarning(nextWarnings: InactivityWarning[]) {
		await ttStorage.change({ settings: { employeeInactivityWarning: nextWarnings } });
	}

	function addEmployeeInactivityWarning() {
		void updateEmployeeInactivityWarning([...$settingsStore.employeeInactivityWarning, { days: null, color: "#ff0000" }]);
	}

	function updateEmployeeInactivityWarningField<K extends keyof InactivityWarning>(
		index: number,
		key: K,
		value: InactivityWarning[K],
	) {
		const nextWarnings = [...$settingsStore.employeeInactivityWarning];
		const warning = nextWarnings[index];
		if (!warning) return;

		nextWarnings[index] = { ...warning, [key]: value };
		void updateEmployeeInactivityWarning(sortInactivityWarnings(nextWarnings));
	}

	function updateEmployeeInactivityWarningDays(index: number, value: string) {
		const parsedDays = parseInt(value, 10);
		updateEmployeeInactivityWarningField(index, "days", value === "" || Number.isNaN(parsedDays) ? null : parsedDays);
	}

	function removeEmployeeInactivityWarning(index: number) {
		void updateEmployeeInactivityWarning($settingsStore.employeeInactivityWarning.filter((_, warningIndex) => warningIndex !== index));
	}

	function sortInactivityWarnings(warnings: InactivityWarning[]) {
		return [...warnings].sort((first, second) => (first.days ?? 0) - (second.days ?? 0));
	}
</script>

<div class="space-y-2">
	<PreferenceSectionCard title="Companies">
		<PreferenceSettingGroup>
			<StorageSwitch path="settings.pages.companies.idBesideCompanyName" label='Reformat company names as "COMPANYNAME [ID]"' />
			<StorageSwitch
				path="settings.pages.companies.specials"
				label="Help with several different company specials"
				description="Includes muggable cash, stat spy calculations, and TornStats stat spy sending where supported."
			/>
			<StorageSwitch path="settings.pages.joblist.specials" label="Show company specials on the job list" />
			<StorageSwitch path="settings.pages.companies.autoStockFill" label="Automatically fill company stock based on previous day sales" />
			<StorageNumber
				path="settings.pages.companies.employeeEffectiveness"
				label="Employee effectiveness warning"
				description="Color employees red when they reach this effectiveness reduction."
				min={0}
			/>
		</PreferenceSettingGroup>
	</PreferenceSectionCard>

	<PreferenceSectionCard title="Employee Inactivity Warning" description="Requires last action to be enabled.">
		{#snippet action()}
			<Button type="button" size="icon-xs" variant="outline" onclick={addEmployeeInactivityWarning}>
				<PlusIcon />
			</Button>
		{/snippet}

		{#if $settingsStore.employeeInactivityWarning.length}
			<div class="space-y-1">
				{#each $settingsStore.employeeInactivityWarning as warning, index (index)}
					<div class="grid gap-2 rounded-md border border-border bg-background/60 p-2 md:grid-cols-[1fr_3rem_28px]">
						<Input
							type="number"
							min={0}
							value={getWarningDraft(warning)}
							placeholder="Days"
							oninput={(event) => updateEmployeeInactivityWarningDays(index, event.currentTarget.value)}
						/>
						<Input
							type="color"
							value={warning.color}
							oninput={(event) => updateEmployeeInactivityWarningField(index, "color", event.currentTarget.value)}
						/>
						<Button type="button" size="icon" variant="destructive" onclick={() => removeEmployeeInactivityWarning(index)}>
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
