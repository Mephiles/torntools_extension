<script lang="ts">
	import { onMount } from "svelte";
	import { ttStorage } from "@/utils/common/data/storage";
	import { formatBytes } from "@/utils/common/functions/formatting";
	import { TORNTOOLS_FORUM_POST } from "@/utils/common/functions/torn";
	import { TEAM } from "@/utils/common/team";
	import { BACKGROUND_SERVICE } from "@/utils/services/proxy-services";
	import CorruptionIndicator from "../Shared/CorruptionIndicator.svelte";
	import MaintenanceButtons from "../Shared/MaintenanceButtons.svelte";
	import StatusAlert from "../Shared/StatusAlert.svelte";
	import TeamList from "../Shared/TeamList.svelte";
	import VersionDisplay from "../Shared/VersionDisplay.svelte";
	import { factiondataStore, reloadOptionsStores, stockdataStore, torndataStore, userdataStore } from "../stores";

	type Status = { type: "success" | "error"; text: string } | null;
	type ForceTarget = "userdata" | "torndata" | "stocks" | "factiondata";
	type MaintenanceAction = ForceTarget | "reinitialize-timers" | "clear-cache";

	let storageSize = $state<string | null>(null);
	let storageSizeError = $state<string | null>(null);
	let status = $state<Status>(null);
	let busyAction = $state<MaintenanceAction | null>(null);

	const coreMembers = TEAM.filter((member) => member.core);

	let corruptionChecks = $derived([
		{
			label: "Userdata",
			healthy: typeof $userdataStore === "object" && $userdataStore !== null && Object.keys($userdataStore).length > 5,
		},
		{
			label: "Torndata",
			healthy:
				typeof $torndataStore === "object" &&
				$torndataStore !== null &&
				"items" in $torndataStore &&
				Array.isArray($torndataStore.items) &&
				$torndataStore.items.length > 5,
		},
		{
			label: "Stockdata",
			healthy: typeof $stockdataStore === "object" && $stockdataStore !== null && Object.keys($stockdataStore).length > 5,
		},
		{
			label: "Factiondata",
			healthy:
				typeof $factiondataStore === "object" &&
				$factiondataStore !== null &&
				"access" in $factiondataStore &&
				typeof $factiondataStore.access === "string",
		},
	]);

	onMount(async () => {
		await refreshStorageSize();
	});

	function setStatus(type: "success" | "error", text: string) {
		status = { type, text };
	}

	function clearStatus() {
		status = null;
	}

	async function refreshStorageSize() {
		storageSizeError = null;

		try {
			storageSize = formatBytes(await ttStorage.getSize());
		} catch (error) {
			storageSize = null;
			storageSizeError = error instanceof Error ? error.message : "Failed to load disk usage.";
		}
	}

	async function handleMaintenanceAction(action: MaintenanceAction) {
		busyAction = action;
		status = null;

		try {
			if (action === "reinitialize-timers") {
				await BACKGROUND_SERVICE.reinitializeTimers();
				setStatus("success", "Reset background timers.");
			} else if (action === "clear-cache") {
				await BACKGROUND_SERVICE.clearCache();
				setStatus("success", "Cleared cache.");
			} else {
				const result = await BACKGROUND_SERVICE.forceUpdate(action);
				if (result.success === false) {
					if ("message" in result) {
						setStatus("error", result.message);
					} else {
						getActionError(result.error, undefined, `Failed to fetch ${action}.`)
					}
				} else {
					await reloadOptionsStores();
					await refreshStorageSize();
					setStatus("success", `Fetched ${action}.`);
				}
			}
		} catch (error) {
			setStatus("error", error instanceof Error ? error.message : "Action failed.");
		} finally {
			busyAction = null;
		}
	}

	function getActionError(error: unknown, message: string | undefined, fallback: string) {
		if (error instanceof Error && error.message) return error.message;
		if (typeof message === "string" && message.length) return message;
		return fallback;
	}
</script>

<svelte:head>
	<title>TornTools - About</title>
</svelte:head>

<section class="space-y-8">
	<VersionDisplay version={browser.runtime.getManifest().version} {storageSize} {storageSizeError} />

	<section class="rounded-2xl border border-border bg-card p-6 shadow-sm">
		<h2 class="text-xl font-bold">Data health</h2>
		<p class="mt-2 text-sm text-muted-foreground">
			These checks mirror the legacy options page heuristics and can help spot obviously broken stored data.
		</p>

		<div class="mt-4 grid gap-3 md:grid-cols-2">
			{#each corruptionChecks as check (check.label)}
				<CorruptionIndicator label={check.label} healthy={check.healthy} />
			{/each}
		</div>
	</section>

	<MaintenanceButtons {busyAction} onAction={handleMaintenanceAction} />

	<section class="rounded-2xl border border-border bg-card p-6 shadow-sm">
		<h2 class="text-xl font-bold">Support and contact</h2>
		<div class="mt-4 space-y-4 text-sm leading-6">
			<p>
				Our source code is available on
				<a class="font-medium text-primary underline-offset-4 hover:underline" href="https://github.com/Mephiles/torntools_extension" target="_blank" rel="noreferrer">
					GitHub
				</a>
				and licensed under the GNU General Public Licence. Our terms of service can be found
				<a class="font-medium text-primary underline-offset-4 hover:underline" href={browser.runtime.getURL("/tos.html")} target="_blank" rel="noreferrer">
					here
				</a>.
			</p>
			<p>
				We can be contacted through our
				<a class="font-medium text-primary underline-offset-4 hover:underline" href="https://discord.gg/ukyK6f6" target="_blank" rel="noreferrer">
					Discord
				</a>
				or
				<a class="font-medium text-primary underline-offset-4 hover:underline" href={TORNTOOLS_FORUM_POST} target="_blank" rel="noreferrer">
					our forum post
				</a>.
			</p>
			<div>
				<p>
					Suggestions and bug reports are important to keep improving TornTools. When reporting a bug, include:
				</p>
				<ul class="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">
					<li>Screenshots of the bug in action.</li>
					<li>Screenshots of the console output.</li>
					<li>Console access via `Ctrl` + `Shift` + `J`, `F12`, or right click -> inspect -> console.</li>
				</ul>
			</div>
		</div>
	</section>

	<section class="rounded-2xl border border-border bg-card p-6 shadow-sm">
		<h2 class="text-xl font-bold">Team</h2>
		<p class="mt-2 text-sm text-muted-foreground">
			TornTools is free to use, but if you feel like giving back to the developers you can donate in-game or via one of the donation links below.
		</p>

		<div class="mt-4">
			<TeamList members={coreMembers} />
		</div>

		<p class="mt-4 text-sm text-muted-foreground">
			And everyone else who contributed to our codebase, helped us beta-test, provided feedback, suggestions and bug reports, or just generally helped out in the Discord.
		</p>
	</section>
</section>

<StatusAlert {status} onClear={clearStatus} />
