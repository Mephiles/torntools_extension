<script lang="ts">
	import ArrowSquareOutIcon from "phosphor-svelte/lib/ArrowSquareOutIcon";
	import PreferenceSectionCard from "@/entrypoints/options-v2/components/preferences/PreferenceSectionCard.svelte";
	import type {
		BooleanPreferenceStoragePath,
		StringPreferenceStoragePath,
	} from "@/entrypoints/options-v2/components/preferences/preference-storage";
	import StorageSwitch from "@/entrypoints/options-v2/components/preferences/StorageSwitch.svelte";
	import StorageText from "@/entrypoints/options-v2/components/preferences/StorageText.svelte";

	interface ExternalServiceLink {
		label: string;
		href: string;
	}

	interface ExternalServiceCardProps {
		title: string;
		description: string;
		path: BooleanPreferenceStoragePath;
		enableLabel: string;
		links?: readonly ExternalServiceLink[];
		keyPath?: StringPreferenceStoragePath;
		keyDescription?: string;
	}

	let {
		title,
		description,
		path,
		enableLabel,
		links = [],
		keyPath,
		keyDescription = "Only required if you use a different key for this service. Will use known key otherwise.",
	}: ExternalServiceCardProps = $props();
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

		<StorageSwitch {path} label={enableLabel} />
		{#if keyPath}
			<StorageText path={keyPath} label="Alternative API key" description={keyDescription} />
		{/if}
	</div>
</PreferenceSectionCard>
