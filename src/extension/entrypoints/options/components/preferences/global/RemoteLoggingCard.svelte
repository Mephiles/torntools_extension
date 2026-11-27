<script lang="ts">
	import { DEFAULT_REMOTE_LOGGING_STATE } from "@common/utils/functions/remote-logging";
	import { TORNTOOLS_PRIVACY_POLICY } from "@common/utils/functions/torn";
	import ArrowSquareOutIcon from "phosphor-svelte/lib/ArrowSquareOutIcon";
	import { toast } from "svelte-sonner";
	import { settingsStore } from "../../../stores/database-store.svelte";
	import PreferenceNote from "../PreferenceNote.svelte";
	import PreferenceSectionCard from "../PreferenceSectionCard.svelte";
	import RemoteLoggingSession from "./RemoteLoggingSession.svelte";

	const loggingState = $derived($settingsStore?.logging?.remote ?? DEFAULT_REMOTE_LOGGING_STATE);

	async function copy(value: string, label: string) {
		try {
			await navigator.clipboard.writeText(value);
			toast.success(`${label} copied.`);
		} catch {
			toast.error(`Couldn't copy the ${label.toLowerCase()}.`);
		}
	}
</script>

<PreferenceSectionCard title="Remote Logging" description="Opt-in sending of warning and error logs to a self-hosted GlitchTip instance.">
	<div class="grid gap-2">
		<RemoteLoggingSession />

		{#if loggingState.installId || loggingState.sessionId}
			<div class="text-muted-foreground grid gap-1 px-1 text-xs">
				{#if loggingState.installId}
					<button type="button" class="text-left hover:underline" onclick={() => void copy(loggingState.installId!, "Install ID")}>
						Install ID: <code>{loggingState.installId}</code>
					</button>
				{/if}
				{#if loggingState.sessionId}
					<button type="button" class="text-left hover:underline" onclick={() => void copy(loggingState.sessionId!, "Session ID")}>
						Session ID: <code>{loggingState.sessionId}</code>
					</button>
				{/if}
			</div>
		{/if}

		<PreferenceNote
			text="Sends install and session IDs, extension version, browser, OS, device type, the Torn page URL with query/hash navigation (API keys and request tokens redacted), log level and message, stack traces, and any additional data attached to the log call. Doesn't attach your IP address, API key, cookies, local storage ,or request bodies."
		/>
		<PreferenceNote
			text="Remote logging is off by default. Revoking stops future events but does not delete events GlitchTip already received. Events are kept for up to 30 days."
		/>

		<a href={TORNTOOLS_PRIVACY_POLICY} target="_blank" rel="noreferrer" class="text-primary ml-2 flex items-center gap-1 text-xs hover:underline">
			Privacy policy
			<ArrowSquareOutIcon aria-hidden="true" />
		</a>
	</div>
</PreferenceSectionCard>
