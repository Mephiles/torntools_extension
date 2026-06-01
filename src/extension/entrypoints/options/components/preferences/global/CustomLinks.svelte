<script lang="ts">
	import type { SavedCustomLink } from "@features/custom-links/custom-links";
	import { Button } from "@svelte/components/ui/button";
	import { Input } from "@svelte/components/ui/input";
	import { Label } from "@svelte/components/ui/label";
	import { Switch } from "@svelte/components/ui/switch";
	import { ttStorage } from "@utils/context";
	import { ALL_AREAS, CUSTOM_LINKS_PRESET } from "@utils/functions/torn";
	import ArrowDownIcon from "phosphor-svelte/lib/ArrowDownIcon";
	import ArrowUpIcon from "phosphor-svelte/lib/ArrowUpIcon";
	import PlusIcon from "phosphor-svelte/lib/PlusIcon";
	import TrashIcon from "phosphor-svelte/lib/TrashIcon";
	import { settingsStore } from "../../../stores/database-store.svelte";
	import ItemSelect from "../ItemSelect.svelte";
	import PreferenceSectionCard from "../PreferenceSectionCard.svelte";

	const locationOptions = [
		{ value: "above", label: "Above all areas" },
		{ value: "under", label: "Under all areas" },
		...ALL_AREAS.flatMap((area) => [
			{ value: `above_${area.class}`, label: `Above ${area.text}` },
			{ value: `under_${area.class}`, label: `Under ${area.text}` },
		]),
	];

	const presetOptions = [
		{ value: "custom", label: "Custom" },
		...Object.keys(CUSTOM_LINKS_PRESET).map((preset) => ({ value: preset, label: preset.replaceAll("_", " ") })),
	];

	async function updateCustomLinks(nextLinks: SavedCustomLink[]) {
		await ttStorage.change({ settings: { customLinks: nextLinks } });
	}

	function addCustomLink() {
		void updateCustomLinks([
			...$settingsStore.customLinks,
			{ newTab: false, location: "above", name: "", href: "" } satisfies SavedCustomLink,
		]);
	}

	function updateCustomLink(index: number, nextLink: SavedCustomLink) {
		const nextLinks = [...$settingsStore.customLinks];
		nextLinks[index] = nextLink;
		void updateCustomLinks(nextLinks);
	}

	function updateCustomLinkField<K extends keyof SavedCustomLink>(index: number, key: K, value: SavedCustomLink[K]) {
		const link = $settingsStore.customLinks[index];
		if (!link) return;

		updateCustomLink(index, { ...link, [key]: value });
	}

	function updateCustomLinkHref(index: number, href: string) {
		const link = $settingsStore.customLinks[index];
		if (!link || !("href" in link)) return;

		updateCustomLink(index, { ...link, href });
	}

	function updateCustomLinkPreset(index: number, preset: string) {
		const link = $settingsStore.customLinks[index];
		if (!link) return;

		if (preset === "custom") {
			updateCustomLink(index, {
				newTab: link.newTab,
				location: link.location,
				name: link.name,
				href: "href" in link ? link.href : "",
			});
			return;
		}

		updateCustomLink(index, {
			newTab: link.newTab,
			location: link.location,
			name: preset.replaceAll("_", " "),
			preset,
		});
	}

	function moveCustomLink(index: number, direction: -1 | 1) {
		const nextIndex = index + direction;
		if (nextIndex < 0 || nextIndex >= $settingsStore.customLinks.length) return;

		const nextLinks = [...$settingsStore.customLinks];
		[nextLinks[index], nextLinks[nextIndex]] = [nextLinks[nextIndex], nextLinks[index]];
		void updateCustomLinks(nextLinks);
	}

	function removeCustomLink(index: number) {
		void updateCustomLinks($settingsStore.customLinks.filter((_, linkIndex) => linkIndex !== index));
	}
</script>

<PreferenceSectionCard title="Custom Links">
	{#snippet action()}
		<Button type="button" size="icon-xs" variant="outline" onclick={addCustomLink}>
			<PlusIcon />
		</Button>
	{/snippet}

	{#if $settingsStore.customLinks.length}
		<div class="space-y-1">
			{#each $settingsStore.customLinks as link, index (index)}
				<div class="rounded-md border border-border bg-background/60 p-2">
					<div class="grid gap-2 lg:grid-cols-[12rem_15rem_1fr]">
						<ItemSelect
							items={locationOptions}
							placeholder="Location"
							value={link.location}
							onValueChange={(value) => updateCustomLinkField(index, "location", value)}
						/>

						<ItemSelect
							items={presetOptions}
							placeholder="Preset"
							value={"preset" in link ? link.preset : "custom"}
							onValueChange={(value) => updateCustomLinkPreset(index, value)}
						/>

						<Input
							value={link.name}
							class="h-7"
							placeholder="Label"
							oninput={(event) => updateCustomLinkField(index, "name", event.currentTarget.value)}
						/>
					</div>

					{#if "href" in link}
						<Input
							value={link.href}
							placeholder="https://example.com/"
							oninput={(event) => updateCustomLinkHref(index, event.currentTarget.value)}
							class="mt-2"
						/>
					{/if}

					<div class="mt-2 flex flex-wrap gap-1.5">
						<Button type="button" size="xs" variant="outline" disabled={index === 0} onclick={() => moveCustomLink(index, -1)}>
							<ArrowUpIcon />
						</Button>
						<Button
							type="button"
							size="xs"
							variant="outline"
							disabled={index === $settingsStore.customLinks.length - 1}
							onclick={() => moveCustomLink(index, 1)}
						>
							<ArrowDownIcon />
						</Button>
						<Button type="button" size="icon-xs" variant="destructive" onclick={() => removeCustomLink(index)}>
							<TrashIcon />
						</Button>

						<div class="flex items-center w-full max-w-sm gap-1.5">
							<Label for="new-tab_{index}" class="text-xs">New tab</Label>
							<Switch id="new-tab_{index}"
							        size="sm"
							        checked={link.newTab}
							        onCheckedChange={(checked) => updateCustomLinkField(index, "newTab", checked)}
							/>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p class="rounded-md border border-dashed border-border p-2 text-center text-muted-foreground">
			No custom links configured.
		</p>
	{/if}
</PreferenceSectionCard>