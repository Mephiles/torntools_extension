<script lang="ts">
	import { toast } from "svelte-sonner";
	import { browser } from "wxt/browser";
	import UserAliases from "@/entrypoints/options-v2/components/preferences/global/UserAliases.svelte";
	import PreferenceNote from "@/entrypoints/options-v2/components/preferences/PreferenceNote.svelte";
	import StorageSelect from "@/entrypoints/options-v2/components/preferences/StorageSelect.svelte";
	import StorageText from "@/entrypoints/options-v2/components/preferences/StorageText.svelte";
	import { calculateRevivePrice, REVIVE_PROVIDERS } from "@/utils/common/functions/api-external-revives";
	import PreferenceSectionCard from "../PreferenceSectionCard.svelte";
	import PreferenceSettingGroup from "../PreferenceSettingGroup.svelte";
	import StorageSwitch from "../StorageSwitch.svelte";

	const reviveOptions: { value: string; label: string; description?: string }[] = REVIVE_PROVIDERS.map(provider => {
		return {value: provider.provider, label: `${provider.name} (${calculateRevivePrice(provider)})`}
	});

	async function requestReviveProviderPermission(provider: string) {
		if (!provider) return true;

		const origin = REVIVE_PROVIDERS.find((p) => p.provider === provider)?.origin;
		if (!origin) return false;

		if (!browser.permissions) {
			toast.error("There was an issue when requesting additional permissions. Please go to the normal settings page.");
			return false;
		}

		const granted = await browser.permissions.request({ origins: [origin] });
		if (!granted) {
			toast.error("Can't select this provider without accepting the permission.");
			return false;
		}

		return true;
	}
</script>

<div class="space-y-2">
	<PreferenceSectionCard title="Global">
		<StorageSelect
			items={[
				{value: "default", label: "Default (green and black)" },
				{value: "alternative", label: "Alternative (black and green)" },
			]}
			path="settings.themes.containers"
			label="Container Theme"
		/>

		<PreferenceSettingGroup title="Formatting">
			<StorageText path="settings.csvDelimiter" label="CSV Delimiter" />
			<StorageSelect
				items={[
					{value: "eu", label: "DD.MM.YYYY" },
					{value: "us", label: "MM/DD/YYYY" },
					{value: "iso", label: "YYYY-MM-DD" },
				]}
				path="settings.formatting.date"
				label="Date Format"
			/>

			<StorageSelect
				items={[
					{value: "eu", label: "24 hours" },
					{value: "us", label: "12 hours" },
				]}
				path="settings.formatting.time"
				label="Time Format"
			/>
			<StorageSwitch path="settings.formatting.tct" label="Show times in TCT" />
		</PreferenceSettingGroup>

		<PreferenceSettingGroup>
			<StorageSwitch path="settings.pages.global.alignLeft" label="Align left" />
			<StorageSwitch path="settings.pages.global.keepAttackHistory" label="Keep attack history" />
			<StorageSwitch path="settings.pages.global.hideLevelUpgrade" label="Hide level upgrade" />
			<StorageSwitch path="settings.pages.global.hideTutorials" label="Hide tutorials" />
			<StorageSwitch path="settings.pages.global.hideQuitButtons" label="Hide leave and quit buttons" />
			<StorageSwitch path="settings.pages.global.miniProfileLastAction" label="Last action in mini profile" />
			<StorageSwitch path="settings.pages.global.stackingMode" label="Stacking mode" description="This disables gym, attacks, revives, dump searching and hunting." />
			<StorageSwitch path="settings.pages.global.noOutsideLinkAlert" label="No outside link alert" description="This disables the outside link protection by Torn, be careful about clicking links." />
			<StorageSwitch path="settings.pages.global.pageTitles" label="Clearer page titles" />
			<StorageSwitch path="settings.pages.global.urlFill" label="URL Fill" description="Allow URLs to be prefilled for you with values."/>
			<StorageSwitch path="settings.pages.competitions.easterEggs" label="Highlight Easter Eggs" description="During the Easter event, highlight eggs that appear on your screen.">
				<StorageSwitch path="settings.pages.competitions.easterEggsAlert" label="with alert" />
			</StorageSwitch>
		</PreferenceSettingGroup>

		<PreferenceSettingGroup title="Revives" contentClass="grid">
			<PreferenceNote text="Revive prices vary per revive provider. They can be changed at their will. We have no connection to any revive provider ourselves."/>
			<PreferenceNote text="Your API key is NOT shared with any of these services."/>
			<StorageSelect
				items={reviveOptions}
				path="settings.pages.global.reviveProvider"
				label="Revive Provider"
				beforeValueChange={requestReviveProviderPermission}
			/>
		</PreferenceSettingGroup>
	</PreferenceSectionCard>

	<UserAliases />
</div>
