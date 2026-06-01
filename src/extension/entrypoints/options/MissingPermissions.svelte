<script lang="ts">
	import { Button } from "@svelte/components/ui/button";
	import * as Dialog from "@svelte/components/ui/dialog";
	import { loadDatabase } from "@utils/data/database";
	import { FETCH_PLATFORMS } from "@utils/functions/api";
	import { REVIVE_PROVIDERS } from "@utils/functions/api-external-revives";
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import { browser } from "wxt/browser";

	type PermissionOrigin = {
		label: string;
		origin: string;
	};

	let openDialog = $state(false);
	let missingOrigins = $state<PermissionOrigin[]>([]);
	let requesting = $state(false);

	onMount(() => {
		void checkMissingPermissions();
	});

	async function checkMissingPermissions() {
		if (!browser.permissions) return;

		const { settings } = await loadDatabase();

		const origins: { label: string; origin: string }[] = [
			{ enabled: settings.external.tornstats, label: "TornStats", origin: FETCH_PLATFORMS.tornstats },
			{ enabled: settings.external.yata, label: "YATA", origin: FETCH_PLATFORMS.yata },
			{ enabled: settings.external.prometheus, label: "Prometheus", origin: FETCH_PLATFORMS.prometheus },
			{ enabled: settings.external.lzpt, label: "LZPT", origin: FETCH_PLATFORMS.lzpt },
			{ enabled: settings.external.tornw3b, label: "Torn W3B", origin: FETCH_PLATFORMS.tornw3b },
			{ enabled: settings.external.ffScouter, label: "FF Scouter", origin: FETCH_PLATFORMS.ffscouter },
			{ enabled: settings.external.tornintel, label: "Torn Intel", origin: FETCH_PLATFORMS.tornintel },
		]
			.filter(({ enabled }) => enabled)
			.map(({ label, origin }) => ({ label, origin }));

		const reviveProvider = settings.pages.global.reviveProvider;
		if (reviveProvider) {
			const provider = REVIVE_PROVIDERS.find((p) => p.provider === reviveProvider);

			if (provider) origins.push({ label: provider.name, origin: provider.origin });
		}

		missingOrigins = await getMissingOrigins(origins);
		openDialog = missingOrigins.length > 0;
	}

	async function getMissingOrigins(origins: PermissionOrigin[]) {
		const results = await Promise.all(
			[...origins.values()].map(async (origin) => ({
				...origin,
				granted: await browser.permissions.contains({ origins: [origin.origin] }),
			})),
		);

		return results.filter(({ granted }) => !granted).map(({ label, origin }) => ({ label, origin }));
	}

	function denyRequest() {
		toast.error("These permissions are required for the enabled settings.");
		openDialog = false;
	}

	async function requestMissingPermissions() {
		if (!browser.permissions || missingOrigins.length === 0) return;

		requesting = true;

		try {
			const granted = await browser.permissions.request({ origins: missingOrigins.map(({ origin }) => origin) });

			if (granted) {
				missingOrigins = [];
				openDialog = false;
				toast.success("Permissions granted.");
				return;
			}

			toast.error("These permissions are required for the enabled settings.");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to request permissions.");
		} finally {
			requesting = false;
		}
	}
</script>

<Dialog.Dialog bind:open={openDialog}>
	<Dialog.Content class="max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Permission Issue</Dialog.Title>
			<Dialog.Description>
				There are settings enabled that require permissions to be given, but those permissions are missing.
			</Dialog.Description>
		</Dialog.Header>

		{#if missingOrigins.length > 0}
			<div class="rounded-lg border border-border bg-muted/30 p-2 text-sm">
				<h3 class="font-medium">Missing permissions:</h3>
				<ul class="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
					{#each missingOrigins as { label, origin } (origin)}
						<li>
							<span class="font-medium text-foreground">{label}</span>
							<span class="block break-all">{origin}</span>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<Dialog.Footer>
			<Button size="sm" variant="destructive" disabled={requesting} onclick={denyRequest}>Later</Button>
			<Button size="sm" disabled={requesting} onclick={requestMissingPermissions}>
				{requesting ? "Requesting..." : "Grant permissions"}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Dialog>
