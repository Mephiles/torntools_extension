<script lang="ts">
	import { getPermissionOrigin } from "@common/utils/functions/api-fetcher.ts";
	import type { FetchLocation } from "@common/utils/functions/api-fetcher.ts";
	import * as AlertDialog from "@svelte/components/ui/alert-dialog";
	import { Button } from "@svelte/components/ui/button";
	import * as Field from "@svelte/components/ui/field";
	import { Switch } from "@svelte/components/ui/switch";
	import ArrowSquareOutIcon from "phosphor-svelte/lib/ArrowSquareOutIcon";
	import type { Snippet } from "svelte";
	import { toast } from "svelte-sonner";
	import { browser } from "wxt/browser";
	import { cantRequestPermissionsToast } from "@/entrypoints/options/utilities/toast-helper.ts";
	import { apiStore, settingsStore } from "../../../stores/database-store.svelte";
	import type { BooleanPreferenceStoragePath, StringPreferenceStoragePath } from "../preference-storage";
	import { getPreferenceValue, updatePreferenceValue } from "../preference-storage";
	import PreferenceSectionCard from "../PreferenceSectionCard.svelte";
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
		origin: FetchLocation;
		links?: readonly ExternalServiceLink[];
		keyPath?: StringPreferenceStoragePath;
		keyDescription?: string;
		/** Optional title for the confirmation popup shown when enabling. */
		popupTitle?: string;
		/** Optional description text shown in the confirmation popup. */
		popupDescription?: string;
		/** Arbitrary content (e.g. recommended settings or an API key field) rendered in the confirmation popup. */
		popupContent?: Snippet;
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
		popupTitle,
		popupDescription,
		popupContent,
	}: ExternalServiceCardProps = $props();

	let requestingPermission = $state(false);
	let dialogOpen = $state(false);

	const storageSource = $derived({ settings: $settingsStore, api: $apiStore });
	const enabled = $derived(Boolean(getPreferenceValue(storageSource, path)));
	const hasPopup = $derived(Boolean(popupDescription) || Boolean(popupContent));

	async function updateEnabled(value: boolean) {
		if (requestingPermission) return;

		if (!value) {
			await updatePreferenceValue(path, false);
			return;
		}

		if (hasPopup) {
			dialogOpen = true;
			return;
		}

		await requestPermissionAndEnable();
	}

	async function requestPermissionAndEnable(): Promise<boolean> {
		if (!browser.permissions) {
			cantRequestPermissionsToast();
			return false;
		}

		requestingPermission = true;

		try {
			const granted = await browser.permissions.request({ origins: [getPermissionOrigin(origin)] });

			if (!granted) {
				toast.error(`Can't enable ${title} without accepting the permission.`);
				return false;
			}

			await updatePreferenceValue(path, true);
			return true;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to request permission.");
			return false;
		} finally {
			requestingPermission = false;
		}
	}

	async function confirmPopup() {
		await requestPermissionAndEnable();
		dialogOpen = false;
	}
</script>

<PreferenceSectionCard {title} {description}>
	<div class="grid gap-1">
		{#if links?.length}
			<div class="flex flex-wrap gap-x-2 gap-y-1 px-1">
				{#each links as link (`${link.label}-${link.href}`)}
					<a href={link.href} target="_blank" rel="noreferrer" class="text-primary flex items-center gap-1 text-xs hover:underline">
						{link.label}
						<ArrowSquareOutIcon aria-hidden="true" />
					</a>
				{/each}
			</div>
		{/if}

		<div class="border-border bg-background/60 rounded-md border">
			<Field.Field orientation="horizontal" class="p-2">
				<Field.Content>
					<Field.Label for={path.replaceAll(".", "-")} class="w-full">{enableLabel}</Field.Label>
				</Field.Content>

				<Switch
					id={path.replaceAll(".", "-")}
					size="sm"
					checked={enabled}
					disabled={requestingPermission || dialogOpen}
					onCheckedChange={(value) => void updateEnabled(value)}
				/>
			</Field.Field>
		</div>

		{#if keyPath}
			<StorageText path={keyPath} label="Alternative API key" description={keyDescription} />
		{/if}
	</div>

	<AlertDialog.Root bind:open={dialogOpen}>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>{popupTitle ?? `Enable ${title}?`}</AlertDialog.Title>
				{#if popupDescription}
					<AlertDialog.Description>{popupDescription}</AlertDialog.Description>
				{/if}
			</AlertDialog.Header>

			{#if popupContent}
				<div class="grid gap-2">
					{@render popupContent()}
				</div>
			{/if}

			<AlertDialog.Footer>
				<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
				<Button disabled={requestingPermission} onclick={() => void confirmPopup()}>Enable</Button>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
</PreferenceSectionCard>
