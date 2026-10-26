<script lang="ts">
	import Container from "@common/utils/components/container/container.svelte";
	import type { DatabaseApi, DatabaseSettings } from "@common/utils/data/database";
	import { getPreferenceValue } from "@common/utils/data/preference-storage";
	import type { PreferenceStoragePath } from "@common/utils/data/preference-storage";
	import type { RegisteredScript, SettingControlType, SettingsManifestEntry } from "@userscripts/settings/settings-manifest";
	import { buildSettingsLayout } from "@userscripts/settings/settings-sections";
	import { forgetScript, getEffectiveApi, getEffectiveSettings, getRegisteredScripts, updateSharedPreference } from "@userscripts/settings/shared-settings";
	import { isPDA } from "@userscripts/utils/script-utils";
	import styles from "./settings-page.module.css";

	let scripts = $state<RegisteredScript[]>(getRegisteredScripts());
	let settings = $state<DatabaseSettings>(getEffectiveSettings());
	let api = $state<DatabaseApi>(getEffectiveApi());
	let error = $state<string | null>(null);

	const layout = $derived(buildSettingsLayout(scripts));
	const pda = isPDA();

	function valueFor(path: PreferenceStoragePath) {
		return getPreferenceValue({ settings, api }, path);
	}

	function controlType(entry: SettingsManifestEntry, value: unknown): SettingControlType {
		if (entry.type) return entry.type;
		if (entry.options?.length) return "select";
		if (typeof value === "boolean") return "switch";
		if (typeof value === "number") return "number";
		return "text";
	}

	async function setValue(path: PreferenceStoragePath, value: unknown) {
		error = null;

		try {
			await updateSharedPreference(path, value);
			settings = getEffectiveSettings();
			api = getEffectiveApi();
		} catch (reason) {
			error = reason instanceof Error ? reason.message : "Could not save the setting.";
		}
	}

	function forget(script: RegisteredScript) {
		forgetScript(script.id);
		scripts = getRegisteredScripts();
	}
</script>

{#snippet control(entry: SettingsManifestEntry, note: string | undefined)}
	{@const value = valueFor(entry.path)}
	{@const type = controlType(entry, value)}
	{@const id = entry.path.replaceAll(".", "-")}

	<div class={styles.row}>
		<div class={styles.copy}>
			<label class={styles.label} for={id}>{entry.label}</label>
			{#if entry.description}
				<div class={styles.description}>{entry.description}</div>
			{/if}
			{#if note}
				<div class={styles.description}>{note}</div>
			{/if}
		</div>

		{#if type === "switch"}
			<input
				{id}
				class={styles.switch}
				type="checkbox"
				checked={Boolean(value)}
				onchange={(event) => void setValue(entry.path, event.currentTarget.checked)}
			/>
		{:else if type === "number"}
			<input
				{id}
				class={styles.input}
				type="number"
				step="any"
				value={value ?? ""}
				onchange={(event) => {
					const raw = event.currentTarget.value.trim();
					const parsed = raw === "" ? 0 : Number(raw);
					if (!Number.isNaN(parsed)) void setValue(entry.path, parsed);
				}}
			/>
		{:else if type === "select"}
			<select {id} class={styles.input} onchange={(event) => void setValue(entry.path, event.currentTarget.value)}>
				{#each entry.options ?? [] as option (option.value)}
					<option value={option.value} selected={option.value === String(value ?? "")} disabled={option.disabled}>{option.label}</option>
				{/each}
			</select>
		{:else}
			<input
				{id}
				class={styles.input}
				type="text"
				autocomplete="off"
				value={String(value ?? "")}
				onchange={(event) => void setValue(entry.path, event.currentTarget.value)}
			/>
		{/if}
	</div>
{/snippet}

<Container title="TornTools - Userscript Settings">
	<div class={styles.settings}>
		<p class={styles.subtitle}>Settings for the TornTools userscripts you have installed. A script appears here after it has run in the last 14 days.</p>

		{#if error}
			<p class={styles.error}>{error}</p>
		{/if}

		<details class={styles.section} open>
			<summary class={styles.summary}>
				<span>Connections</span>
			</summary>

			<div class={styles.rows}>
				<div class={styles.row}>
					<div class={styles.copy}>
						{#if pda}
							<div class={styles.label}>Torn API key</div>
						{:else}
							<label class={styles.label} for="tt-userscript-api-key">Torn API key</label>
						{/if}
						{#if pda}
							<div class={styles.description}>Provided by Torn PDA.</div>
						{:else}
							<div class={styles.description}>Shared by all TornTools userscripts. Use a Limited Access key.</div>
						{/if}
					</div>

					{#if !pda}
						<input
							id="tt-userscript-api-key"
							class={styles.input}
							type="text"
							autocomplete="off"
							value={api.torn.key ?? ""}
							onchange={(event) => void setValue("api.torn.key", event.currentTarget.value)}
						/>
					{/if}
				</div>
			</div>
		</details>

		{#if layout.shared.length > 0}
			<details class={styles.section} open>
				<summary class={styles.summary}><span>Shared</span></summary>

				<div class={styles.rows}>
					{#each layout.shared as item (item.entry.path)}
						{@render control(item.entry, `Used by ${item.scripts.join(", ")}`)}
					{/each}
				</div>
			</details>
		{/if}

		{#each layout.scripts as section (section.script.id)}
			<details class={styles.section}>
				<summary class={styles.summary}>
					<span>{section.script.name}</span>
					<button
						class={styles.forget}
						type="button"
						title="Remove this script from the list. It reappears the next time it runs."
						onclick={(event) => {
							event.preventDefault();
							event.stopPropagation();
							forget(section.script);
						}}
					>
						Forget
					</button>
				</summary>

				<div class={styles.rows}>
					{#each section.entries as entry (entry.path)}
						{@render control(entry, undefined)}
					{/each}
				</div>
			</details>
		{/each}

		{#if layout.shared.length === 0 && layout.scripts.length === 0}
			<p class={styles.empty}>No configurable userscript settings found yet. A script appears here after it runs and exposes at least one setting.</p>
		{/if}
	</div>
</Container>
