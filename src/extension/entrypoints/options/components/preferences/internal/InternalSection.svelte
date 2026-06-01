<script lang="ts">
	import { Label } from "@svelte/components/ui/label";
	import * as RadioGroup from "@svelte/components/ui/radio-group";
	import { ttStorage } from "@utils/context";
	import type { InternalPageTheme } from "@utils/functions/pages";
	import { settingsStore } from "../../../stores/database-store.svelte";

	const themeOptions: { value: InternalPageTheme; label: string; description?: string }[] = [
		{
			value: "default",
			label: "OS Default",
			description: "Follows your operating system preference when supported, defaults to light otherwise.",
		},
		{ value: "light", label: "Light" },
		{ value: "dark", label: "Dark" },
	];

	async function updateTheme(theme: InternalPageTheme) {
		if ($settingsStore?.themes?.pages === theme) {
			return;
		}

		await ttStorage.change({ settings: { themes: { pages: theme } } });
	}
</script>

<section class="rounded-lg border border-border bg-card px-3 py-2">
	<div class="space-y-3">
		<h3 class="text-sm font-semibold">Page Theme</h3>

		<RadioGroup.Root
			value={$settingsStore.themes.pages}
			onValueChange={(value) => void updateTheme(value as InternalPageTheme)}
		>
			{#each themeOptions as option (option.value)}
				<div class="flex items-center gap-2 rounded-sm border border-border px-2 py-1.5">
					<RadioGroup.Item value={option.value} id={`internal-page-theme-${option.value}`} />

					<Label class="flex-1 cursor-pointer" for={`internal-page-theme-${option.value}`}>
						<span class="block font-medium">{option.label}</span>
						{#if option.description}
							<p class="text-xs text-muted-foreground">{option.description}</p>
						{/if}
					</Label>
				</div>
			{/each}
		</RadioGroup.Root>
	</div>
</section>
