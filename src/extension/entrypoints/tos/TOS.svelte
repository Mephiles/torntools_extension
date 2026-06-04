<script lang="ts">
	import {exposeDebugObjects} from "@common/utils/functions/pages-debug";
	import {BACKGROUND_SERVICE} from "@common/utils/services/proxy-services";
	import { initializeDatabaseStore, settingsStore } from "@extension/entrypoints/tos/stores/database-store.svelte";
	import * as Table from "@svelte/components/ui/table";
	import { ModeWatcher, setMode } from "mode-watcher";
	import { onMount } from "svelte";

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
		<code class="block rounded bg-muted p-1 whitespace-normal wrap-break-word">{_text}</code>
		{#if _subtext}
			<p class="mt-1 text-muted-foreground">{_subtext}</p>
		{/if}
	</Table.Cell>
{/snippet}

<main class="min-h-screen p-8 max-w-6xl mx-auto w-full">
	<h1 class="text-2xl font-bold text-center">Terms of Service</h1>

	<section class="mt-4 space-y-4">
		<div class="rounded-lg border border-border bg-card p-2">
			<h2 class="text-lg font-bold">Data Collection</h2>

			<p class="text-sm text-muted-foreground">
				TornTools collects and stores data only locally. External services might require your API key and store the data differently. All external
				services are opt in, and we'll list to the terms of service for each service when opting in.
			</p>

			<div class="mt-1 rounded-sm border bg-card">
				<Table.Root class="table-fixed w-full text-xs">
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
		</div>
	</section>
</main>