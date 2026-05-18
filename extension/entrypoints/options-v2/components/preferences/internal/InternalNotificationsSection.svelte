<script lang="ts">
	import PreferenceSectionCard from "@/entrypoints/options-v2/components/preferences/PreferenceSectionCard.svelte";
	import PreferenceSettingGroup from "@/entrypoints/options-v2/components/preferences/PreferenceSettingGroup.svelte";
	import StorageSwitch from "@/entrypoints/options-v2/components/preferences/StorageSwitch.svelte";
	import { settingsStore } from "@/entrypoints/options-v2/stores/database-store.svelte";
	import NotificationListInput from "./NotificationListInput.svelte";
	import NotificationNpcAlerts from "./NotificationNpcAlerts.svelte";
	import NotificationSoundCard from "./NotificationSoundCard.svelte";
	import NotificationTimeInput from "./NotificationTimeInput.svelte";

	const notificationsDisabled = $derived(!$settingsStore.notifications.types.global);
</script>

<div class="space-y-2">
	<PreferenceSectionCard title="Delivery">
		<div class="grid gap-1">
			<StorageSwitch path="settings.notifications.types.global" label="Overall Notifications" />
			<StorageSwitch
				path="settings.notifications.link"
				label="Open related page when clicking a notification"
				disabled={notificationsDisabled}
			/>
			<StorageSwitch
				path="settings.notifications.requireInteraction"
				label="Keep notifications visible until clicked"
				disabled={notificationsDisabled}
			/>
		</div>
	</PreferenceSectionCard>

	<NotificationSoundCard />

	<PreferenceSectionCard title="Notification Types">
		<div class="grid gap-1">
			<PreferenceSettingGroup contentClass="grid gap-1 grid-cols-2 md:grid-cols-3">
				<StorageSwitch path="settings.notifications.types.events" label="Events" compact disabled={notificationsDisabled} />
				<StorageSwitch path="settings.notifications.types.messages" label="Messages" compact disabled={notificationsDisabled} />
				<StorageSwitch path="settings.notifications.types.status" label="Status change" compact disabled={notificationsDisabled} />
				<StorageSwitch path="settings.notifications.types.traveling" label="Traveling" compact disabled={notificationsDisabled} />
				<StorageSwitch path="settings.notifications.types.education" label="Education" compact disabled={notificationsDisabled} />
				<StorageSwitch path="settings.notifications.types.newDay" label="New day" compact disabled={notificationsDisabled} />
				<NotificationListInput typeKey="offline" label="Offline for over hours" disabled={notificationsDisabled} />
				<div class="md:col-span-2"></div>
				<StorageSwitch path="settings.notifications.types.leavingHospitalEnabled" label="Leaving hospital" disabled={notificationsDisabled}>
					<NotificationListInput
						typeKey="leavingHospital"
						label="Minutes before leaving"
						disabled={notificationsDisabled || !$settingsStore.notifications.types.leavingHospitalEnabled}
					/>
				</StorageSwitch>
				<StorageSwitch path="settings.notifications.types.landingEnabled" label="Landing" disabled={notificationsDisabled}>
					<NotificationListInput
						typeKey="landing"
						label="Minutes before landing"
						disabled={notificationsDisabled || !$settingsStore.notifications.types.landingEnabled}
					/>
				</StorageSwitch>
			</PreferenceSettingGroup>

			<PreferenceSettingGroup
				title="Bars"
				description="Comma-separated values support percentages and absolute values."
				contentClass="grid gap-1 md:grid-cols-2"
			>
				<NotificationListInput typeKey="energy" label="Energy" disabled={notificationsDisabled} />
				<NotificationListInput typeKey="nerve" label="Nerve" disabled={notificationsDisabled} />
				<NotificationListInput typeKey="happy" label="Happy" disabled={notificationsDisabled} />
				<NotificationListInput typeKey="life" label="Life" disabled={notificationsDisabled} />

				<StorageSwitch path="settings.notifications.types.refillEnergyEnabled" label="Energy refill" disabled={notificationsDisabled}>
					<NotificationTimeInput
						typeKey="refillEnergy"
						label="TCT reminder time"
						disabled={notificationsDisabled || !$settingsStore.notifications.types.refillEnergyEnabled}
					/>
				</StorageSwitch>
				<StorageSwitch path="settings.notifications.types.refillNerveEnabled" label="Nerve refill" disabled={notificationsDisabled}>
					<NotificationTimeInput
						typeKey="refillNerve"
						label="TCT reminder time"
						disabled={notificationsDisabled || !$settingsStore.notifications.types.refillNerveEnabled}
					/>
				</StorageSwitch>
			</PreferenceSettingGroup>

			<PreferenceSettingGroup
				title="Cooldowns"
				contentClass="grid gap-1 md:grid-cols-2"
			>
				<StorageSwitch path="settings.notifications.types.cooldowns" label="Cooldowns" compact disabled={notificationsDisabled} class="md:col-span-2" />
				<StorageSwitch path="settings.notifications.types.cooldownDrugEnabled" label="Drug cooldown" disabled={notificationsDisabled}>
					<NotificationListInput
						typeKey="cooldownDrug"
						label="Minutes before ending"
						disabled={notificationsDisabled || !$settingsStore.notifications.types.cooldownDrugEnabled}
					/>
				</StorageSwitch>
				<StorageSwitch path="settings.notifications.types.cooldownBoosterEnabled" label="Booster cooldown" disabled={notificationsDisabled}>
					<NotificationListInput
						typeKey="cooldownBooster"
						label="Minutes before ending"
						disabled={notificationsDisabled || !$settingsStore.notifications.types.cooldownBoosterEnabled}
					/>
				</StorageSwitch>
				<StorageSwitch path="settings.notifications.types.cooldownMedicalEnabled" label="Medical cooldown" disabled={notificationsDisabled}>
					<NotificationListInput
						typeKey="cooldownMedical"
						label="Minutes before ending"
						disabled={notificationsDisabled || !$settingsStore.notifications.types.cooldownMedicalEnabled}
					/>
				</StorageSwitch>
			</PreferenceSettingGroup>

			<PreferenceSettingGroup title="Missions" contentClass="grid gap-1 md:grid-cols-2">
				<StorageSwitch path="settings.notifications.types.missionsExpireEnabled" label="Mission expiry" disabled={notificationsDisabled}>
					<NotificationListInput
						typeKey="missionsExpire"
						label="Hours before expiry"
						disabled={notificationsDisabled || !$settingsStore.notifications.types.missionsExpireEnabled}
					/>
				</StorageSwitch>
				<StorageSwitch path="settings.notifications.types.missionsLimitEnabled" label="Mission limit" disabled={notificationsDisabled}>
					<NotificationTimeInput
						typeKey="missionsLimit"
						label="TCT reminder time"
						disabled={notificationsDisabled || !$settingsStore.notifications.types.missionsLimitEnabled}
					/>
				</StorageSwitch>
			</PreferenceSettingGroup>

			<PreferenceSettingGroup title="Faction" contentClass="grid gap-1 md:grid-cols-2">
				<StorageSwitch path="settings.notifications.types.chainTimerEnabled" label="Chain timer" disabled={notificationsDisabled}>
					<NotificationListInput
						typeKey="chainTimer"
						label="Seconds before expiry"
						disabled={notificationsDisabled || !$settingsStore.notifications.types.chainTimerEnabled}
					/>
				</StorageSwitch>
				<StorageSwitch path="settings.notifications.types.chainBonusEnabled" label="Chain bonus" disabled={notificationsDisabled}>
					<NotificationListInput
						typeKey="chainBonus"
						label="Hits before threshold"
						disabled={notificationsDisabled || !$settingsStore.notifications.types.chainBonusEnabled}
					/>
				</StorageSwitch>
			</PreferenceSettingGroup>
		</div>
	</PreferenceSectionCard>

	<NotificationNpcAlerts disabled={notificationsDisabled} />
</div>
