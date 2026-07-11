<script lang="ts">
	import * as Field from "@svelte/components/ui/field";
	import { Switch } from "@svelte/components/ui/switch";
	import ArrowSquareOutIcon from "phosphor-svelte/lib/ArrowSquareOutIcon";
	import { toast } from "svelte-sonner";
	import { browser } from "wxt/browser";
	import { apiStore, settingsStore } from "../../../stores/database-store.svelte";
	import PreferenceSectionCard from "../PreferenceSectionCard.svelte";
	import type { BooleanPreferenceStoragePath, StringPreferenceStoragePath } from "../preference-storage";
	import { getPreferenceValue, updatePreferenceValue } from "../preference-storage";
	import StorageText from "../StorageText.svelte";

	interface ExternalServiceLink {
		label: string;
		href: string;
	}

	interface ExternalServiceCardProps {
		title: string;
		description: string;
		path: BooleanPreferenceStoragePath;
		enableLabel: string;
		origin: string;
		links?: readonly ExternalServiceLink[];
		keyPath?: StringPreferenceStoragePath;
		keyDescription?: string;
	}

	let {
		title,
		description,
		path,
		enableLabel,
		origin,
		links = [],
		keyPath,
		keyDescription = "Only required if you use a different key for this service. Will use known key otherwise.",
	}: ExternalServiceCardProps = $props();

	let requestingPermission = $state(false);

	const storageSource = $derived({ settings: $settingsStore, api: $apiStore });
	const enabled = $derived(Boolean(getPreferenceValue(storageSource, path)));

	async function updateEnabled(value: boolean) {
		if (requestingPermission) return;

		if (!value) {
			await updatePreferenceValue(path, false);
			return;
		}

		if (!browser.permissions) {
			toast.error("There was an issue when requesting additional permissions. Please go to the normal settings page.");
			return;
		}

		requestingPermission = true;

		try {
			const granted = await browser.permissions.request({ origins: [origin] });

			if (!granted) {
				toast.error(`Can't enable ${title} without accepting the permission.`);
				return;
			}

			await updatePreferenceValue(path, true);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to request permission.");
		} finally {
			requestingPermission = false;
		}
	}
</script>

<PreferenceSectionCard {title} description={description}>
	<div class="grid gap-1">
		{#if links.length}
			<div class="flex flex-wrap gap-x-2 gap-y-1 px-1">
				{#each links as link (`${link.label}-${link.href}`)}
					<a
						href={link.href}
						target="_blank"
						rel="noreferrer"
						class="flex items-center gap-1 text-xs text-primary hover:underline"
					>
						{link.label}
						<ArrowSquareOutIcon aria-hidden="true" />
					</a>
				{/each}
			</div>
		{/if}

		<div class="rounded-md border border-border bg-background/60">
			<Field.Field orientation="horizontal" class="p-2">
				<Field.Content>
					<Field.Label for={path.replaceAll(".", "-")} class="w-full">{enableLabel}</Field.Label>
				</Field.Content>

				<Switch
					id={path.replaceAll(".", "-")}
					size="sm"
					checked={enabled}
					disabled={requestingPermission}
					onCheckedChange={(value) => void updateEnabled(value)}
				/>
			</Field.Field>
		</div>

		{#if keyPath}
			<StorageText path={keyPath} label="Alternative API key" description={keyDescription} />
		{/if}
	</div>
</PreferenceSectionCard>
