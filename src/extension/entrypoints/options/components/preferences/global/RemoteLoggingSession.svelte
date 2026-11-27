<script lang="ts">
	import { updatePreferenceValue } from "@common/utils/data/preference-storage";
	import { formatDate, formatTime } from "@common/utils/functions/formatting.ts";
	import { DEFAULT_REMOTE_LOGGING_STATE, isRemoteLoggingSessionActive } from "@common/utils/functions/remote-logging";
	import { Button } from "@svelte/components/ui/button";
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import { browser } from "wxt/browser";
	import { cantRequestPermissionsToast } from "@/entrypoints/options/utilities/toast-helper.ts";
	import {
		extendRemoteLoggingSession,
		hasRemoteLoggingPermissions,
		requestRemoteLoggingPermissions,
		revokeRemoteLoggingSession,
		startRemoteLoggingSession,
		supportsRemoteLoggingDataCollectionPermissions,
	} from "@/runtime/remote-logging-state";
	import { settingsStore } from "../../../stores/database-store.svelte";
	import StorageSwitch from "../StorageSwitch.svelte";

	let permissionsGranted = $state(false);
	let busy = $state(false);
	let dataCollectionSupported = false;

	const ready = $derived(Boolean($settingsStore));
	const loggingState = $derived($settingsStore?.logging?.remote ?? DEFAULT_REMOTE_LOGGING_STATE);
	const active = $derived(isRemoteLoggingSessionActive(loggingState));
	const status = $derived.by(() => {
		if (!loggingState.enabled) return "Off";
		if (!permissionsGranted) return "Permission missing";

		if (!active || !loggingState.sessionExpiresAt) return "Session expired";

		const formattedDate = formatDate(loggingState.sessionExpiresAt, { showYear: true });
		const formattedTime = formatTime(loggingState.sessionExpiresAt);
		const formatted = `${formattedDate} ${formattedTime}`;

		return `Active until ${formatted}`;
	});

	onMount(() => {
		void refreshPermissions();
	});

	async function refreshPermissions() {
		const [granted, supportsDataCollection] = await Promise.all([hasRemoteLoggingPermissions(), supportsRemoteLoggingDataCollectionPermissions()]);

		permissionsGranted = granted;
		dataCollectionSupported = supportsDataCollection;
	}

	/**
	 * The switch owns `settings.logging.remote.enabled`; this starts or revokes the session and reports whether the
	 * change may proceed.
	 */
	async function changeSession(value: boolean): Promise<boolean> {
		if (busy) return false;

		busy = true;
		try {
			if (!value) {
				await revokeRemoteLoggingSession();
				toast.success("Remote logging disabled.");
				return true;
			}

			if (!(await requestPermissions())) return false;

			await startRemoteLoggingSession();
			toast.success("Remote logging enabled for 72 hours.");
			return true;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Couldn't update remote logging.");
			return false;
		} finally {
			busy = false;
		}
	}

	/** Revoking from the button has to flip the switch too, since the switch owns `enabled`. */
	async function revoke() {
		if (await changeSession(false)) await updatePreferenceValue("settings.logging.remote.enabled", false);
	}

	async function requestPermissions(): Promise<boolean> {
		if (!browser.permissions) {
			cantRequestPermissionsToast();
			return false;
		}

		try {
			const granted = await requestRemoteLoggingPermissions(dataCollectionSupported);
			if (!granted) {
				toast.error("Can't enable remote logging without accepting the permissions.");
				return false;
			}

			permissionsGranted = true;
			return true;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to request permission.");
			return false;
		}
	}

	async function extend() {
		if (busy) return;

		busy = true;
		try {
			await extendRemoteLoggingSession();
			toast.success("Remote logging extended by 72 hours.");
		} finally {
			busy = false;
		}
	}

	async function grantPermissions() {
		if (busy) return;

		busy = true;
		try {
			await requestPermissions();
		} finally {
			busy = false;
		}
	}
</script>

<StorageSwitch
	path="settings.logging.remote.enabled"
	label="Enable remote logging"
	description="Sessions run for 72 hours and can be extended or revoked at any time."
	disabled={busy || !ready}
	beforeValueChange={changeSession}
/>

<div class="flex flex-wrap items-center gap-2 px-1 text-xs">
	<span class="font-medium">{status}</span>

	{#if active}
		<Button size="sm" variant="outline" disabled={busy} onclick={() => void extend()}>Extend 72 hours</Button>
	{:else if loggingState.enabled}
		<Button size="sm" variant="outline" disabled={busy} onclick={() => void changeSession(true)}>Start new session</Button>
	{/if}

	{#if loggingState.enabled}
		<Button size="sm" variant="destructive" disabled={busy} onclick={() => void revoke()}>Revoke</Button>
	{/if}

	{#if loggingState.enabled && !permissionsGranted}
		<Button size="sm" variant="outline" disabled={busy} onclick={() => void grantPermissions()}>Grant permissions</Button>
	{/if}
</div>
