<script lang="ts">
	import { exposeDebugObjects } from "@common/utils/functions/pages-debug";
	import { TORNTOOLS_PRIVACY_POLICY } from "@common/utils/functions/torn";
	import { initializeDatabaseStore, settingsStore } from "@extension/entrypoints/tos/stores/database-store.svelte";
	import * as Table from "@svelte/components/ui/table";
	import { ModeWatcher, setMode } from "mode-watcher";
	import { onMount } from "svelte";
	import { BACKGROUND_SERVICE } from "@/services/proxy-services";

	onMount(() => {
		exposeDebugObjects(BACKGROUND_SERVICE);
		initializeDatabaseStore();

		const unsubscribeTheme = settingsStore.subscribe((settings) => {
			const pageTheme = settings?.themes?.pages;
			if (!pageTheme) return;

			setMode(pageTheme === "default" ? "system" : pageTheme);
		});

		return () => {
			unsubscribeTheme();
		};
	});
</script>

<ModeWatcher track={false} />

{#snippet head(_text: string)}
	<Table.Head class="p-2 text-center">{_text}</Table.Head>
{/snippet}

{#snippet question(_text: string)}
	<Table.Cell class="p-2 align-top whitespace-normal">{_text}</Table.Cell>
{/snippet}

{#snippet answer(_text: string, _subtext?: string)}
	<Table.Cell class="p-2 align-top whitespace-normal">
		<code class="bg-muted block rounded p-1 wrap-break-word whitespace-normal">{_text}</code>
		{#if _subtext}
			<p class="text-muted-foreground mt-1">{_subtext}</p>
		{/if}
	</Table.Cell>
{/snippet}

<main class="mx-auto min-h-screen w-full max-w-6xl p-8">
	<h1 class="text-center text-2xl font-bold">Terms of Service</h1>

	<section class="mt-4 space-y-4">
		<div class="border-border bg-card rounded-lg border p-2">
			<h2 class="text-lg font-bold">Data Collection</h2>

			<p class="text-muted-foreground text-sm">
				TornTools stores data locally by default. External services might require your API key and store the data differently. All external services are
				opt in, and we'll list the terms of service for each service when opting in.
			</p>

			<div class="bg-card mt-1 rounded-sm border">
				<Table.Root class="w-full table-fixed text-xs">
					<Table.Header class="bg-muted">
						<Table.Row>
							{@render head("Data Storage")}
							{@render head("Data Sharing")}
							{@render head("Purpose of Use")}
							{@render head("Key Storage & Sharing")}
							{@render head("Key Access Level")}
						</Table.Row>
					</Table.Header>
					<Table.Body>
						<Table.Row class="text-muted-foreground">
							{@render question("Will the data be stored for any purpose?")}
							{@render question("Who can access the data besides the end user?")}
							{@render question("What is the stored data being used for?")}
							{@render question("Will the API key be stored securely and who can access it?")}
							{@render question("What key access level or specific selections are required?")}
						</Table.Row>
						<Table.Row>
							{@render answer("Only locally")}
							{@render answer("Nobody")}
							{@render answer("Not eligible - only end user has access")}
							{@render answer("Stored locally / Not shared", "except for opt-in services, as listed on the respective places")}
							{@render answer("Limited Access")}
						</Table.Row>
					</Table.Body>
				</Table.Root>
			</div>

			<h3 class="mt-3 text-base font-bold">Remote Logging (opt-in)</h3>

			<p class="text-muted-foreground text-sm">
				Remote logging is off by default and only runs while you have an active session. When enabled, TornTools sends warning and error logs to our
				self-hosted GlitchTip instance at <code class="bg-muted rounded px-1">logs.torntools.tornplayground.eu</code>. Sessions run for 72 hours and can
				be extended or revoked at any time.
			</p>
			<br />

			<p class="text-muted-foreground text-sm">
				Each installation gets a random install ID, and each session gets a random session ID. Events include the install and session ID, extension
				version, browser and operating system, the Torn page URL with its query and hash navigation parameters (sensitive values such as API keys and
				request tokens are redacted, while page identifiers such as player, faction or forum IDs remain), the log level and message, stack traces, and
				any additional data attached to the log call. We do not attach your IP address, API key, cookies, local storage, or request bodies.
			</p>
			<br />

			<p class="text-muted-foreground text-sm">
				Revoking remote logging stops future events, but does not delete events GlitchTip already received. Received events are kept for up to 30 days.
			</p>
			<br />

			<p class="text-muted-foreground text-sm">
				Our privacy policy can be found
				<a class="text-primary hover:underline" href={TORNTOOLS_PRIVACY_POLICY} target="_blank" rel="noreferrer">here</a>.
			</p>
		</div>
	</section>
</main>
