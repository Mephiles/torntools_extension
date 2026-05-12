<script lang="ts">
	import { onDestroy, onMount } from "svelte";
	import { fromStore } from "svelte/store";
	import Router, { push, replace } from "svelte-spa-router";
	import { browser } from "wxt/browser";
	import type { SavedCustomLink } from "@/features/custom-links/custom-links";
	import { Switch } from "@/svelte/components/ui/switch";
	import { ttStorage } from "@/utils/common/data/storage";
	import { changeAPIKey, checkAPIPermission } from "@/utils/common/functions/api";
	import { calculateRevivePrice, REVIVE_PROVIDERS } from "@/utils/common/functions/api-external-revives";
	import { ALL_AREAS, ALL_ICONS, CASINO_GAMES, CHAT_TITLE_COLORS, CUSTOM_LINKS_PRESET, HIGHLIGHT_PLACEHOLDERS } from "@/utils/common/functions/torn";
	import { BACKGROUND_SERVICE } from "@/utils/services/proxy-services";
	import {
		buildPreferenceSearchIndex,
		EXTERNAL_SERVICES,
		getPreferenceGroupDefinition,
		getPreferenceGroupForSection,
		getPreferenceGroupSubgroups,
		getPreferenceSectionDefinition,
		getPreferenceSectionsForGroup,
		getPreferenceSubgroupForSection,
		getPreferenceSubgroupRoute,
		getSectionFields,
		getValue,
		normalizePreferenceGroupId,
		PREFERENCE_GROUP_DEFINITIONS,
		setValue,
	} from "../preferences";
	import { preferenceRouteState } from "../preferences-route-state";
	import NotificationSoundPicker from "../Shared/NotificationSoundPicker.svelte";
	import PreferenceField from "../Shared/PreferenceField.svelte";
	import PreferencesNav from "../Shared/PreferencesNav.svelte";
	import PreferencesRouteState from "../Shared/PreferencesRouteState.svelte";
	import PreferencesSubnav from "../Shared/PreferencesSubnav.svelte";
	import StatusAlert from "../Shared/StatusAlert.svelte";
	import { initializeOptionsDatabase, npcsStore, reloadOptionsStores, stockdataStore } from "../stores";
	import type {
		ApiKeyFormState,
		PreferenceDraftSnapshot,
		PreferenceFieldDefinition,
		PreferenceGroupId,
		PreferenceSectionId,
		PreferenceSubgroupDefinition,
	} from "../types";

	type Status = { type: "success" | "error"; text: string } | null;
	type AliasRow = { userID: string; name: string; alias: string };
	type SearchEntry = { id: string; section: PreferenceSectionId; label: string; description: string };

	let loading = $state(true);
	let draft = $state<PreferenceDraftSnapshot | null>(null);
	let status = $state<Status>(null);
	let searchOpen = $state(false);
	let searchQuery = $state("");
	let apiKeyState = $state<ApiKeyFormState>({ value: "", busy: false });
	let voices = $state<Array<{ id: string; name: string }>>([{ id: "default", name: "System Default" }]);
	let customSoundNotice = $state<string | null>(null);
	let autoSaveState = $state<"idle" | "saving" | "saved" | "error">("idle");
	let permissionRequestCount = $state(0);
	let lastPersistedState = $state<string | null>(null);
	let isPersisting = false;
	let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
	const nestedRoutes = {
		"/": PreferencesRouteState,
		"/:section": PreferencesRouteState,
		"/:section/:subgroup": PreferencesRouteState,
	}
	const routeState = fromStore(preferenceRouteState);

	const routeParts = $derived(routeState.current);
	const activeGroup = $derived(normalizePreferenceGroupId(routeParts.section));
	const activeSubgroupId = $derived(routeParts.subgroup ?? "");
	const activeGroupMeta = $derived(getPreferenceGroupDefinition(activeGroup));
	const activeSubgroups = $derived(getPreferenceGroupSubgroups(activeGroup));
	const activeSections = $derived.by<PreferenceSectionId[]>(() => {
		if (activeSubgroups.length && activeSubgroupId) {
			return activeSubgroups.find((subgroup) => subgroup.id === activeSubgroupId)?.sections ?? [];
		}

		return getPreferenceSectionsForGroup(activeGroup);
	});
	const searchIndex = $derived(
		draft
			? buildPreferenceSearchIndex(
					PREFERENCE_GROUP_DEFINITIONS.flatMap((group) =>
						getPreferenceSectionsForGroup(group.id).map((section) => ({
							section,
							fields: getSectionFields(section, draft.settings as Record<string, any>),
						})),
					)
				)
			: [],
	);
	const filteredSearchIndex = $derived.by<SearchEntry[]>(() => {
		if (!searchQuery.trim()) return searchIndex;

		const query = searchQuery.toLowerCase();
		return searchIndex.filter((entry) => `${entry.label} ${entry.description}`.toLowerCase().includes(query));
	});
	const stockChoices = $derived.by(() => {
		const source = $stockdataStore as Record<string, any>;
		return Object.entries(source)
			.filter(([, value]) => value && typeof value === "object" && "name" in value)
			.map(([id, value]) => ({ id, name: String((value as { name: string }).name) }));
	});
	const npcChoices = $derived.by(() => {
		const targets = ($npcsStore as { targets?: Record<string, { name: string }> }).targets ?? {};
		return Object.entries(targets).map(([id, target]) => ({ id: Number(id), name: target.name }));
	});
	const chatTitleColorOptions = $derived(
		Object.keys(CHAT_TITLE_COLORS).map((value) => ({
			value,
			label: value.replace(/^./, (letter) => letter.toUpperCase()),
		})),
	);

	onMount(() => {
		void loadPage();

		const previousVoicesChanged = window.speechSynthesis.onvoiceschanged;
		window.speechSynthesis.onvoiceschanged = () => {
			loadVoices();
			previousVoicesChanged?.call(window.speechSynthesis, new Event("voiceschanged"));
		};
		loadVoices();

		return () => {
			window.speechSynthesis.onvoiceschanged = previousVoicesChanged;
		};
	});

	onDestroy(() => {
		if (autosaveTimer) clearTimeout(autosaveTimer);
		void BACKGROUND_SERVICE.stopNotificationSound();
	});

	$effect(() => {
		if (!draft || loading || permissionRequestCount > 0) return;

		const serialized = JSON.stringify($state.snapshot(draft));
		if (serialized === lastPersistedState) return;

		if (autosaveTimer) clearTimeout(autosaveTimer);
		autoSaveState = "saving";
		autosaveTimer = setTimeout(() => {
			void persistCurrentDraft();
		}, 250);

		return () => {
			if (autosaveTimer) clearTimeout(autosaveTimer);
		};
	});

	async function loadPage() {
		try {
			await initializeOptionsDatabase();
			const [settings, api] = await Promise.all([ttStorage.get("settings"), ttStorage.get("api")]);
			const snapshot: PreferenceDraftSnapshot = {
				settings: structuredClone(settings),
				externalServiceKeys: {
					tornstats: api.tornstats?.key ?? "",
					yata: api.yata?.key ?? "",
					ffScouter: api.ffScouter?.key ?? "",
				},
			};

			draft = structuredClone(snapshot);
			lastPersistedState = JSON.stringify(snapshot);
			apiKeyState = { value: api.torn?.key ?? "", busy: false };
			customSoundNotice = snapshot.settings.notifications.soundCustom ? "A custom notification sound is currently stored." : null;
			autoSaveState = "idle";
			loading = false;
		} catch (error) {
			loading = false;
			status = {
				type: "error",
				text: error instanceof Error ? error.message : "Failed to load preferences.",
			};
		}
	}

	function clearStatus() {
		status = null;
	}

	function goToSection(target: PreferenceGroupId | PreferenceSectionId) {
		const nextGroup = isGroupId(target) ? target : getPreferenceGroupForSection(target);
		const nextSubgroup = isGroupId(target) ? getStoredSubgroup(nextGroup, getPreferenceGroupSubgroups(nextGroup)) : getPreferenceSubgroupForSection(target)?.id ?? "";

		if (nextSubgroup) {
			storeSubgroup(nextGroup, nextSubgroup);
		}

		void push(getPreferenceSubgroupRoute(nextGroup, nextSubgroup));
		searchOpen = false;
		searchQuery = "";
		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	function selectSubgroup(subgroupId: string) {
		storeSubgroup(activeGroup, subgroupId);
		void replace(getPreferenceSubgroupRoute(activeGroup, subgroupId));
		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	function updateField(field: PreferenceFieldDefinition, value: unknown) {
		if (!draft) return;
		setValue(draft.settings as Record<string, any>, field.path, value);
	}

	function getFieldsForSection(section: PreferenceSectionId) {
		if (!draft) return [];
		return getSectionFields(section, draft.settings as Record<string, any>);
	}

	function getStoredSubgroup(group: PreferenceGroupId, subgroups: PreferenceSubgroupDefinition[]) {
		if (!subgroups.length || typeof localStorage === "undefined") return subgroups[0]?.id ?? "";
		const stored = localStorage.getItem(`tt-options2-subgroup:${group}`);
		return subgroups.some((subgroup) => subgroup.id === stored) ? stored ?? "" : subgroups[0]?.id ?? "";
	}

	function storeSubgroup(group: PreferenceGroupId, subgroupId: string) {
		if (!subgroupId || typeof localStorage === "undefined") return;
		localStorage.setItem(`tt-options2-subgroup:${group}`, subgroupId);
	}

	function isGroupId(value: string): value is PreferenceGroupId {
		return (["general", "interface", "notifications", "data-api", "integrations", "automation", "pages"] as const).includes(
			value as PreferenceGroupId,
		);
	}

	function getFieldValue(field: PreferenceFieldDefinition) {
		if (!draft) return "";
		return getValue(draft.settings as Record<string, any>, field.path);
	}

	async function persistCurrentDraft() {
		if (!draft || isPersisting || permissionRequestCount > 0) return;

		const snapshot = $state.snapshot(draft);
		const serialized = JSON.stringify(snapshot);
		if (serialized === lastPersistedState) {
			autoSaveState = "saved";
			return;
		}

		isPersisting = true;
		try {
			await ttStorage.set({ settings: structuredClone(snapshot.settings) });
			await ttStorage.change({
				api: {
					tornstats: { key: snapshot.externalServiceKeys.tornstats },
					yata: { key: snapshot.externalServiceKeys.yata },
					ffScouter: { key: snapshot.externalServiceKeys.ffScouter },
				},
			});
			await reloadOptionsStores();
			lastPersistedState = serialized;
			autoSaveState = "saved";
		} catch (error) {
			autoSaveState = "error";
			status = {
				type: "error",
				text: error instanceof Error ? error.message : "Failed to save preferences.",
			};
		} finally {
			isPersisting = false;
			const latestSerialized = draft ? JSON.stringify($state.snapshot(draft)) : null;
			if (latestSerialized && latestSerialized !== lastPersistedState && permissionRequestCount === 0) {
				void persistCurrentDraft();
			}
		}
	}

	async function resetPreferences() {
		if (!confirm("Reset all settings except the main Torn API key?")) return;

		try {
			await ttStorage.reset();
			await BACKGROUND_SERVICE.initialize();
			await reloadOptionsStores();
			await loadPage();
			status = { type: "success", text: "Settings reset." };
		} catch (error) {
			status = {
				type: "error",
				text: error instanceof Error ? error.message : "Failed to reset preferences.",
			};
		}
	}

	async function updateApiKey() {
		const previousKey = apiKeyState.value;
		apiKeyState.busy = true;

		try {
			const { access } = await checkAPIPermission(apiKeyState.value);
			await changeAPIKey(apiKeyState.value);
			apiKeyState.busy = false;
			status = access
				? { type: "success", text: "API key updated." }
				: { type: "error", text: "API key saved, but it does not have the expected access level." };
		} catch (error) {
			apiKeyState.busy = false;
			const api = await ttStorage.get("api");
			apiKeyState.value = api.torn?.key ?? previousKey;
			status = {
				type: "error",
				text: error instanceof Error ? error.message : String(error),
			};
		}
	}

	async function requestExternalPermission(serviceId: string, enabled: boolean) {
		if (!draft || !enabled) return;
		permissionRequestCount += 1;

		if (!browser.permissions) {
			setValue(draft.settings as Record<string, any>, ["external", serviceId], false);
			status = { type: "error", text: "This browser cannot request the extra permission here." };
			permissionRequestCount -= 1;
			return;
		}

		const service = EXTERNAL_SERVICES.find(({ id }) => id === serviceId);
		if (!service) return;

		const granted = await browser.permissions.request({ origins: [service.origin] });
		if (!granted) {
			setValue(draft.settings as Record<string, any>, ["external", serviceId], false);
			status = { type: "error", text: `Can't enable ${service.name} without accepting its permission.` };
		}
		permissionRequestCount -= 1;
	}

	async function updateReviveProvider(value: string) {
		if (!draft) return;
		const previous = draft.settings.pages.global.reviveProvider;
		draft.settings.pages.global.reviveProvider = value;

		if (!value) return;
		permissionRequestCount += 1;

		if (!browser.permissions) {
			draft.settings.pages.global.reviveProvider = previous;
			status = { type: "error", text: "This browser cannot request the provider permission here." };
			permissionRequestCount -= 1;
			return;
		}

		const origin = REVIVE_PROVIDERS.find((provider) => provider.provider === value)?.origin;
		if (!origin) return;

		const granted = await browser.permissions.request({ origins: [origin] });
		if (!granted) {
			draft.settings.pages.global.reviveProvider = previous;
			status = { type: "error", text: "Can't select this revive provider without accepting the permission." };
		}
		permissionRequestCount -= 1;
	}

	function loadVoices() {
		const loadedVoices = window.speechSynthesis.getVoices().map((voice) => ({
			id: `${voice.name} (${voice.lang})`,
			name: `${voice.name} (${voice.lang})`,
		}));
		voices = [{ id: "default", name: "System Default" }, ...loadedVoices];
	}

	async function playNotificationSound() {
		if (!draft) return;
		await BACKGROUND_SERVICE.stopNotificationSound();
		await BACKGROUND_SERVICE.playNotificationSound(draft.settings.notifications.sound, draft.settings.notifications.volume, false);
	}

	async function handleCustomSoundUpload(event: Event) {
		if (!draft) return;
		const input = event.currentTarget as HTMLInputElement;
		if (!input.files?.length) return;

		const reader = new FileReader();
		reader.addEventListener("load", (loadEvent) => {
			const result = loadEvent.target?.result;
			if (typeof result !== "string") return;

			if (result.length > 5_242_880) {
				status = { type: "error", text: "Maximum file size exceeded. (5MB)" };
				return;
			}

			draft.settings.notifications.soundCustom = result;
			customSoundNotice = "Custom sound uploaded to the current draft.";
		});
		reader.readAsDataURL(input.files[0]);
	}

	function addChatHighlight() {
		if (!draft) return;
		draft.settings.pages.chat.highlights = [...draft.settings.pages.chat.highlights, { name: "", color: "#7ca900" }];
	}

	function addChatTitleHighlight() {
		if (!draft) return;
		draft.settings.pages.chat.titleHighlights = [...draft.settings.pages.chat.titleHighlights, { title: "", color: "red" }];
	}

	function removeAt<T>(values: T[], index: number) {
		return values.filter((_, valueIndex) => valueIndex !== index);
	}

	function moveItem<T>(values: T[], index: number, direction: -1 | 1) {
		const nextIndex = index + direction;
		if (nextIndex < 0 || nextIndex >= values.length) return values;
		const nextValues = [...values];
		[nextValues[index], nextValues[nextIndex]] = [nextValues[nextIndex], nextValues[index]];
		return nextValues;
	}

	function addCustomLink() {
		if (!draft) return;
		draft.settings.customLinks = [
			...draft.settings.customLinks,
			{ newTab: false, location: "above", name: "", href: "" } satisfies SavedCustomLink,
		];
	}

	function addAllyFaction() {
		if (!draft) return;
		draft.settings.alliedFactions = [...draft.settings.alliedFactions, ""];
	}

	function addAlias() {
		if (!draft) return;
		const nextId = `new-${Date.now()}`;
		draft.settings.userAlias = {
			...draft.settings.userAlias,
			[nextId]: { name: "", alias: "" },
		};
	}

	function addNpcAlert() {
		if (!draft || npcChoices.length === 0) return;
		const unusedNpc = npcChoices.find(({ id }) => !draft.settings.notifications.types.npcs.some((alert) => alert.id === id));
		if (!unusedNpc) return;
		draft.settings.notifications.types.npcs = [
			...draft.settings.notifications.types.npcs,
			{ id: unusedNpc.id, level: "", minutes: "" },
		];
	}

	function addInactivityRow(key: "employeeInactivityWarning" | "factionInactivityWarning") {
		if (!draft) return;
		draft.settings[key] = [...draft.settings[key], { color: "#7ca900", days: null }];
	}

	function toggleStringSelection(path: string[], value: string) {
		if (!draft) return;
		const current = [...(getValue(draft.settings as Record<string, any>, path) as string[])];
		setValue(
			draft.settings as Record<string, any>,
			path,
			current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value],
		);
	}

	function updateCommaSeparatedNotification(path: string[], input: string) {
		if (!draft) return;
		const values = input
			.split(",")
			.map((value) => value.trim())
			.filter(Boolean)
			.map((value) => (Number(value).toString() === value ? Number(value) : value));
		setValue(draft.settings as Record<string, any>, path, values);
	}

	function getCommaSeparatedNotification(path: string[]) {
		if (!draft) return "";
		const values = getValue(draft.settings as Record<string, any>, path);
		return Array.isArray(values) ? values.join(",") : "";
	}

	function aliasRows() {
		if (!draft) return [] as AliasRow[];
		return Object.entries(draft.settings.userAlias).map(([userID, value]) => ({ userID, name: value.name, alias: value.alias }));
	}

	function updateAliasRow(previousId: string, nextRow: AliasRow) {
		if (!draft) return;
		const nextAliases = { ...draft.settings.userAlias };
		delete nextAliases[previousId];
		nextAliases[nextRow.userID || previousId] = { name: nextRow.name, alias: nextRow.alias };
		draft.settings.userAlias = nextAliases;
	}
</script>

<svelte:head>
	<title>TornTools - Preferences</title>
</svelte:head>

{#if loading}
	<section class="rounded-3xl border border-border bg-card p-6 shadow-sm">
		<h1 class="text-2xl font-bold">Preferences</h1>
		<p class="mt-2 text-sm text-muted-foreground">Loading the redesigned preferences page…</p>
	</section>
{:else if draft}
	<div class="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
		<div class="hidden" aria-hidden="true">
			<Router routes={nestedRoutes} prefix="/preferences" />
		</div>

		<PreferencesNav groups={PREFERENCE_GROUP_DEFINITIONS} activeSection={activeGroup} onSelect={goToSection} onSearch={() => (searchOpen = true)} />

		<div class="space-y-6">
			<section class="rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm backdrop-blur">
				<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
					<div>
						<p class="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Preferences Group</p>
						<h1 class="mt-2 text-3xl font-bold tracking-tight">{activeGroupMeta.title}</h1>
<!--						<p class="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{activeGroupMeta.description}</p>-->
						<p class="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
							{#if autoSaveState === "saving"}
								Saving changes…
							{:else if autoSaveState === "saved"}
								Changes saved automatically
							{:else if autoSaveState === "error"}
								Autosave failed
							{:else}
								Changes save automatically
							{/if}
						</p>
					</div>
					<div class="flex flex-wrap gap-2">
						<button type="button" class="rounded-full border border-destructive/40 bg-background px-4 py-2 text-sm font-medium text-destructive" onclick={resetPreferences}>
							Reset
						</button>
					</div>
				</div>
			</section>

			{#if activeSubgroups.length}
				<PreferencesSubnav items={activeSubgroups} activeItem={activeSubgroupId} onSelect={selectSubgroup} />
			{/if}

			<section class="grid gap-4">
				{#if activeGroup === "notifications"}
					<NotificationSoundPicker
						sound={draft.settings.notifications.sound}
						volume={draft.settings.notifications.volume}
						ttsVoice={draft.settings.notifications.ttsVoice}
						{voices}
						{customSoundNotice}
						onSoundChange={(value) => (draft.settings.notifications.sound = value)}
						onVolumeChange={(value) => (draft.settings.notifications.volume = value)}
						onVoiceChange={(value) => (draft.settings.notifications.ttsVoice = value)}
						onUpload={handleCustomSoundUpload}
						onPlay={playNotificationSound}
						onStop={() => void BACKGROUND_SERVICE.stopNotificationSound()}
					/>
				{/if}

				{#if activeSections.includes("api-key")}
					<section class="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-sm">
						<h2 class="text-lg font-semibold">Torn API Key</h2>
						<p class="mt-1 text-sm text-muted-foreground">TornTools uses a Limited Access key.</p>
						<div class="mt-5 flex flex-col gap-3 lg:flex-row">
							<input
								type="text"
								class="min-w-0 flex-1 rounded-2xl border border-border bg-background px-3 py-2.5 text-sm"
								placeholder="API key"
								bind:value={apiKeyState.value}
								disabled={apiKeyState.busy}
							/>
							<button
								type="button"
								class="rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
								onclick={updateApiKey}
								disabled={apiKeyState.busy || !apiKeyState.value.trim()}
							>
								{apiKeyState.busy ? "Updating…" : "Update"}
							</button>
						</div>
					</section>
				{/if}

				{#if activeSections.includes("external")}
					<section class="rounded-3xl border border-border/70 bg-card/85 p-5 shadow-sm">
						<p class="text-sm text-muted-foreground">By enabling these services, you agree to use the external services as they are provided.</p>
						<div class="mt-5 grid gap-4 xl:grid-cols-2">
							{#each EXTERNAL_SERVICES as service (service.id)}
								<article class="rounded-2xl border border-border bg-background/70 p-4">
									<div class="flex items-start justify-between gap-3">
										<div>
											<h2 class="text-lg font-semibold">{service.name}</h2>
											<p class="mt-1 text-sm text-muted-foreground">{service.description}</p>
										</div>
										<label class="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium">
											<Switch
												checked={draft.settings.external[service.id]}
												onCheckedChange={(enabled) => {
													draft.settings.external[service.id] = enabled;
													void requestExternalPermission(service.id, enabled);
												}}
											/>
											<span>{draft.settings.external[service.id] ? "Enabled" : "Disabled"}</span>
										</label>
									</div>
									{#if service.links.length}
										<div class="mt-3 flex flex-wrap gap-2">
											{#each service.links as link (link.href)}
												<a href={link.href} target="_blank" rel="noreferrer" class="rounded-full border border-border bg-card px-3 py-2 text-sm text-primary">
													{link.label}
												</a>
											{/each}
										</div>
									{/if}
									{#if service.id === "tornstats" || service.id === "yata" || service.id === "ffScouter"}
										<div class="mt-4">
											<label class="mb-2 block text-sm font-medium" for={`external-key-${service.id}`}>Alternative key</label>
											<input
												id={`external-key-${service.id}`}
												type="text"
												class="w-full rounded-2xl border border-border bg-card px-3 py-2.5 text-sm"
												placeholder="API key"
												bind:value={draft.externalServiceKeys[service.id]}
											/>
										</div>
									{/if}
								</article>
							{/each}
						</div>
					</section>
				{/if}

				{#each activeSections as sectionId (sectionId)}
					{@const sectionMeta = getPreferenceSectionDefinition(sectionId)}
					{@const fields = getFieldsForSection(sectionId)}

					{#if sectionId !== "api-key" && sectionId !== "external" && sectionId !== "user-alias" && fields.length}
						<section class="rounded-3xl border border-border/70 bg-card/85 p-5 shadow-sm">
							<div class="mb-4">
								<h2 class="text-lg font-semibold">{sectionMeta.title}</h2>
								<p class="mt-1 text-sm text-muted-foreground">{sectionMeta.description}</p>
							</div>

							{#if sectionId === "global"}
								<div class="mb-4 rounded-2xl border border-border bg-background/70 p-4">
									<h3 class="text-sm font-semibold">Revive Provider</h3>
									<p class="mt-1 text-sm text-muted-foreground">Revive prices vary per provider. Your API key is not shared with these services by TornTools itself.</p>
									<select
										class="mt-4 w-full rounded-2xl border border-border bg-background px-3 py-2.5 text-sm"
										value={draft.settings.pages.global.reviveProvider}
										onchange={(event) => updateReviveProvider((event.currentTarget as HTMLSelectElement).value)}
									>
										<option value="">None</option>
										{#each REVIVE_PROVIDERS as provider (provider.provider)}
											<option value={provider.provider}>{provider.name} ({calculateRevivePrice(provider)})</option>
										{/each}
									</select>
								</div>
							{/if}

							<div class="grid gap-4">
								{#each fields as field (field.id)}
									<PreferenceField field={field} value={getFieldValue(field)} onChange={(value) => updateField(field, value)} />
								{/each}
							</div>
						</section>
					{/if}

					{#if sectionId === "chat"}
						<section class="rounded-3xl border border-border/70 bg-card/85 p-5 shadow-sm">
							<div class="flex items-center justify-between gap-3">
								<div>
									<h2 class="text-lg font-semibold">Chat Highlights</h2>
								<p class="mt-1 text-sm text-muted-foreground">Highlight names and titles with dedicated colors.</p>
							</div>
							<button type="button" class="rounded-full border border-border bg-background px-3 py-2 text-sm font-medium" onclick={addChatHighlight}>
								Add name
							</button>
						</div>
						<div class="mt-4 space-y-3">
							{#each draft.settings.pages.chat.highlights as highlight, index (index)}
								<div class="grid gap-3 rounded-2xl border border-border bg-background/70 p-4 md:grid-cols-[minmax(0,1fr)_9rem_auto]">
									<input class="rounded-2xl border border-border bg-card px-3 py-2.5 text-sm" bind:value={highlight.name} placeholder="Name or placeholder" />
									<input type="color" class="h-11 w-full rounded-2xl border border-border bg-card px-2" bind:value={highlight.color} />
									<button type="button" class="rounded-2xl border border-border bg-card px-3 py-2 text-sm" onclick={() => (draft.settings.pages.chat.highlights = removeAt(draft.settings.pages.chat.highlights, index))}>
										Remove
									</button>
								</div>
							{/each}
						</div>
						<div class="mt-4 space-y-1 text-xs text-muted-foreground">
							{#each HIGHLIGHT_PLACEHOLDERS as placeholder (placeholder.name)}
								<p>{placeholder.name} - {placeholder.description}</p>
							{/each}
						</div>
					</section>
					{/if}

					{#if sectionId === "chat"}
						<section class="rounded-3xl border border-border/70 bg-card/85 p-5 shadow-sm">
							<div class="flex items-center justify-between gap-3">
								<div>
									<h2 class="text-lg font-semibold">Title Highlights</h2>
									<p class="mt-1 text-sm text-muted-foreground">Map chat titles to a persistent color accent.</p>
								</div>
								<button type="button" class="rounded-full border border-border bg-background px-3 py-2 text-sm font-medium" onclick={addChatTitleHighlight}>
									Add title
								</button>
							</div>
							<div class="mt-4 space-y-3">
								{#each draft.settings.pages.chat.titleHighlights as highlight, index (index)}
									<div class="grid gap-3 rounded-2xl border border-border bg-background/70 p-4 md:grid-cols-[minmax(0,1fr)_12rem_auto]">
										<input class="rounded-2xl border border-border bg-card px-3 py-2.5 text-sm" bind:value={highlight.title} placeholder="Title" />
										<select class="rounded-2xl border border-border bg-card px-3 py-2.5 text-sm" bind:value={highlight.color}>
											{#each chatTitleColorOptions as option (option.value)}
												<option value={option.value}>{option.label}</option>
											{/each}
										</select>
										<button type="button" class="rounded-2xl border border-border bg-card px-3 py-2 text-sm" onclick={() => (draft.settings.pages.chat.titleHighlights = removeAt(draft.settings.pages.chat.titleHighlights, index))}>
											Remove
										</button>
									</div>
								{/each}
							</div>
						</section>
					{/if}

					{#if sectionId === "sidebar"}
						<section class="rounded-3xl border border-border/70 bg-card/85 p-5 shadow-sm">
							<h2 class="text-lg font-semibold">Hide Sidebar Icons</h2>
							<p class="mt-1 text-sm text-muted-foreground">Click any icon to hide or restore it in the sidebar.</p>
							<div class="mt-4 flex flex-wrap gap-2">
								{#each ALL_ICONS as icon (icon.id)}
									<button
										type="button"
										title={icon.description}
										class={`rounded-full border px-3 py-2 text-xs font-medium transition ${
											draft.settings.hideIcons.includes(icon.icon)
												? "border-primary bg-primary text-primary-foreground"
												: "border-border bg-background"
										}`}
										onclick={() => toggleStringSelection(["hideIcons"], icon.icon)}
									>
										{icon.description}
									</button>
								{/each}
							</div>
						</section>

						<section class="rounded-3xl border border-border/70 bg-card/85 p-5 shadow-sm">
							<div class="flex items-center justify-between gap-3">
								<div>
									<h2 class="text-lg font-semibold">Custom Links</h2>
									<p class="mt-1 text-sm text-muted-foreground">Build your own sidebar shortcuts and reorder them directly.</p>
								</div>
								<button type="button" class="rounded-full border border-border bg-background px-3 py-2 text-sm font-medium" onclick={addCustomLink}>
									Add link
								</button>
							</div>
							<div class="mt-4 space-y-3">
								{#each draft.settings.customLinks as link, index (index)}
									<div class="space-y-3 rounded-2xl border border-border bg-background/70 p-4">
										<div class="grid gap-3 lg:grid-cols-[10rem_12rem_12rem_minmax(0,1fr)]">
											<label class="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-3 py-2 text-sm">
												<span>New tab</span>
												<Switch bind:checked={link.newTab} />
											</label>
											<select class="rounded-2xl border border-border bg-card px-3 py-2.5 text-sm" bind:value={link.location}>
												<option value="above">Above all areas</option>
												<option value="under">Under all areas</option>
												{#each ALL_AREAS as area (area.class)}
													<option value={`above_${area.class}`}>Above {area.text}</option>
													<option value={`under_${area.class}`}>Under {area.text}</option>
												{/each}
											</select>
											<select
												class="rounded-2xl border border-border bg-card px-3 py-2.5 text-sm"
												value={"preset" in link ? link.preset : "custom"}
												onchange={(event) => {
													const preset = (event.currentTarget as HTMLSelectElement).value;
													if (preset === "custom") {
														draft.settings.customLinks[index] = { newTab: link.newTab, location: link.location, name: link.name, href: "href" in link ? link.href : "" };
													} else {
														draft.settings.customLinks[index] = { newTab: link.newTab, location: link.location, name: preset.replaceAll("_", " "), preset };
													}
												}}
											>
												<option value="custom">Custom</option>
												{#each Object.keys(CUSTOM_LINKS_PRESET) as preset (preset)}
													<option value={preset}>{preset}</option>
												{/each}
											</select>
											<input class="rounded-2xl border border-border bg-card px-3 py-2.5 text-sm" bind:value={link.name} placeholder="Label" />
										</div>
										{#if !("preset" in link)}
											<input class="w-full rounded-2xl border border-border bg-card px-3 py-2.5 text-sm" bind:value={link.href} placeholder="https://example.com/" />
										{/if}
										<div class="flex flex-wrap gap-2">
											<button type="button" class="rounded-full border border-border bg-card px-3 py-2 text-sm" onclick={() => (draft.settings.customLinks = moveItem(draft.settings.customLinks, index, -1))} disabled={index === 0}>Move up</button>
											<button type="button" class="rounded-full border border-border bg-card px-3 py-2 text-sm" onclick={() => (draft.settings.customLinks = moveItem(draft.settings.customLinks, index, 1))} disabled={index === draft.settings.customLinks.length - 1}>Move down</button>
											<button type="button" class="rounded-full border border-border bg-card px-3 py-2 text-sm" onclick={() => (draft.settings.customLinks = removeAt(draft.settings.customLinks, index))}>Remove</button>
										</div>
									</div>
								{/each}
							</div>
						</section>
					{/if}

					{#if sectionId === "notifications"}
						<section class="rounded-3xl border border-border/70 bg-card/85 p-5 shadow-sm">
						<h2 class="text-lg font-semibold">Threshold-Based Notifications</h2>
						<p class="mt-1 text-sm text-muted-foreground">Use comma-separated values for checkpoints and lead times.</p>
						<div class="mt-4 grid gap-4 lg:grid-cols-2">
							{#each [
								{ label: "Energy", path: ["notifications", "types", "energy"] },
								{ label: "Nerve", path: ["notifications", "types", "nerve"] },
								{ label: "Happy", path: ["notifications", "types", "happy"] },
								{ label: "Life", path: ["notifications", "types", "life"] },
								{ label: "Offline for over hours", path: ["notifications", "types", "offline"] },
								{ label: "Chain timer seconds before expiry", path: ["notifications", "types", "chainTimer"] },
								{ label: "Chain bonus hits before threshold", path: ["notifications", "types", "chainBonus"] },
								{ label: "Leaving hospital minutes before", path: ["notifications", "types", "leavingHospital"] },
								{ label: "Landing minutes before", path: ["notifications", "types", "landing"] },
								{ label: "Drug cooldown minutes before", path: ["notifications", "types", "cooldownDrug"] },
								{ label: "Booster cooldown minutes before", path: ["notifications", "types", "cooldownBooster"] },
								{ label: "Medical cooldown minutes before", path: ["notifications", "types", "cooldownMedical"] },
								{ label: "Mission expiry hours before", path: ["notifications", "types", "missionsExpire"] },
								{ label: "NPC planned attack minutes before", path: ["notifications", "types", "npcPlanned"] },
							] as config (config.label)}
								<div class="rounded-2xl border border-border bg-background/70 p-4">
									<p class="mb-2 block text-sm font-medium">{config.label}</p>
									<input
										class="w-full rounded-2xl border border-border bg-card px-3 py-2.5 text-sm"
										value={getCommaSeparatedNotification(config.path)}
										oninput={(event) => updateCommaSeparatedNotification(config.path, (event.currentTarget as HTMLInputElement).value)}
									/>
								</div>
							{/each}
						</div>
					</section>
						<section class="rounded-3xl border border-border/70 bg-card/85 p-5 shadow-sm">
							<h2 class="text-lg font-semibold">Timed Notifications</h2>
							<div class="mt-4 grid gap-4 lg:grid-cols-2">
								<div class="rounded-2xl border border-border bg-background/70 p-4">
									<p class="mb-2 block text-sm font-medium">Mission limit time (TCT)</p>
									<input type="time" class="w-full rounded-2xl border border-border bg-card px-3 py-2.5 text-sm" bind:value={draft.settings.notifications.types.missionsLimit} />
								</div>
								<div class="rounded-2xl border border-border bg-background/70 p-4">
									<p class="mb-2 block text-sm font-medium">Energy refill reminder time (TCT)</p>
									<input type="time" class="w-full rounded-2xl border border-border bg-card px-3 py-2.5 text-sm" bind:value={draft.settings.notifications.types.refillEnergy} />
								</div>
								<div class="rounded-2xl border border-border bg-background/70 p-4">
									<p class="mb-2 block text-sm font-medium">Nerve refill reminder time (TCT)</p>
									<input type="time" class="w-full rounded-2xl border border-border bg-card px-3 py-2.5 text-sm" bind:value={draft.settings.notifications.types.refillNerve} />
								</div>
							</div>
						</section>

						<section class="rounded-3xl border border-border/70 bg-card/85 p-5 shadow-sm">
							<div class="flex items-center justify-between gap-3">
								<div>
									<h2 class="text-lg font-semibold">NPC Alerts</h2>
									<p class="mt-1 text-sm text-muted-foreground">Requires YATA, TornStats, or LZPT to be enabled as an external service.</p>
								</div>
								<button type="button" class="rounded-full border border-border bg-background px-3 py-2 text-sm font-medium" onclick={addNpcAlert}>
									Add NPC
								</button>
							</div>
							<div class="mt-4 space-y-3">
								{#each draft.settings.notifications.types.npcs as alert, index (alert.id)}
									<div class="grid gap-3 rounded-2xl border border-border bg-background/70 p-4 md:grid-cols-[minmax(0,1fr)_8rem_8rem_auto]">
										<select class="rounded-2xl border border-border bg-card px-3 py-2.5 text-sm" bind:value={alert.id}>
											{#each npcChoices as choice (choice.id)}
												<option value={choice.id}>{choice.name}</option>
											{/each}
										</select>
										<input type="number" min="1" max="5" class="rounded-2xl border border-border bg-card px-3 py-2.5 text-sm" bind:value={alert.level} placeholder="Level" />
										<input type="number" min="0" max="450" class="rounded-2xl border border-border bg-card px-3 py-2.5 text-sm" bind:value={alert.minutes} placeholder="Minutes" />
										<button type="button" class="rounded-2xl border border-border bg-card px-3 py-2 text-sm" onclick={() => (draft.settings.notifications.types.npcs = removeAt(draft.settings.notifications.types.npcs, index))}>
											Remove
										</button>
									</div>
								{/each}
							</div>
						</section>
					{/if}

					{#if sectionId === "profile"}
						<section class="rounded-3xl border border-border/70 bg-card/85 p-5 shadow-sm">
						<div class="flex items-center justify-between gap-3">
							<div>
								<h2 class="text-lg font-semibold">Allied Factions</h2>
								<p class="mt-1 text-sm text-muted-foreground">Add faction IDs or names that should be treated as allies.</p>
							</div>
							<button type="button" class="rounded-full border border-border bg-background px-3 py-2 text-sm font-medium" onclick={addAllyFaction}>
								Add ally
							</button>
						</div>
						<div class="mt-4 space-y-3">
							{#each draft.settings.alliedFactions as ally, index (index)}
								<div class="grid gap-3 rounded-2xl border border-border bg-background/70 p-4 md:grid-cols-[minmax(0,1fr)_auto]">
									<input
										class="rounded-2xl border border-border bg-card px-3 py-2.5 text-sm"
										value={String(ally)}
										oninput={(event) => {
											const value = (event.currentTarget as HTMLInputElement).value;
											draft.settings.alliedFactions[index] = Number.isNaN(Number(value)) || value.trim() === "" ? value : Number(value);
										}}
									/>
									<button type="button" class="rounded-2xl border border-border bg-card px-3 py-2 text-sm" onclick={() => (draft.settings.alliedFactions = removeAt(draft.settings.alliedFactions, index))}>
										Remove
									</button>
								</div>
							{/each}
						</div>
					</section>
					{/if}

					{#if sectionId === "companies" || sectionId === "faction"}
						{@const inactivityKey = sectionId === "companies" ? "employeeInactivityWarning" : "factionInactivityWarning"}
						<section class="rounded-3xl border border-border/70 bg-card/85 p-5 shadow-sm">
						<div class="flex items-center justify-between gap-3">
							<div>
								<h2 class="text-lg font-semibold">Inactivity Warnings</h2>
								<p class="mt-1 text-sm text-muted-foreground">Highlight inactive members using custom day thresholds and colors.</p>
							</div>
							<button type="button" class="rounded-full border border-border bg-background px-3 py-2 text-sm font-medium" onclick={() => addInactivityRow(inactivityKey)}>
								Add row
							</button>
						</div>
						<div class="mt-4 space-y-3">
							{#each draft.settings[inactivityKey] as warning, index (index)}
								<div class="grid gap-3 rounded-2xl border border-border bg-background/70 p-4 md:grid-cols-[10rem_10rem_auto]">
									<input type="number" class="rounded-2xl border border-border bg-card px-3 py-2.5 text-sm" value={warning.days ?? ""} placeholder="Days" oninput={(event) => {
										const value = (event.currentTarget as HTMLInputElement).value;
										draft.settings[inactivityKey][index].days = value === "" ? null : Number(value);
									}} />
									<input type="color" class="h-11 rounded-2xl border border-border bg-card px-2" bind:value={warning.color} />
									<button type="button" class="rounded-2xl border border-border bg-card px-3 py-2 text-sm" onclick={() => (draft.settings[inactivityKey] = removeAt(draft.settings[inactivityKey], index))}>
										Remove
									</button>
								</div>
							{/each}
						</div>
					</section>
					{/if}

					{#if sectionId === "user-alias"}
						<section class="rounded-3xl border border-border/70 bg-card/85 p-5 shadow-sm">
						<div class="flex items-center justify-between gap-3">
							<div>
								<h2 class="text-lg font-semibold">User Aliases</h2>
								<p class="mt-1 text-sm text-muted-foreground">Replace player names with custom aliases across the extension.</p>
							</div>
							<button type="button" class="rounded-full border border-border bg-background px-3 py-2 text-sm font-medium" onclick={addAlias}>
								Add alias
							</button>
						</div>
						<div class="mt-4 space-y-3">
							{#each aliasRows() as aliasRow (aliasRow.userID)}
								<div class="grid gap-3 rounded-2xl border border-border bg-background/70 p-4 lg:grid-cols-[12rem_minmax(0,1fr)_minmax(0,1fr)_auto]">
									<input class="rounded-2xl border border-border bg-card px-3 py-2.5 text-sm" value={aliasRow.userID} placeholder="User ID" oninput={(event) => updateAliasRow(aliasRow.userID, { ...aliasRow, userID: (event.currentTarget as HTMLInputElement).value })} />
									<input class="rounded-2xl border border-border bg-card px-3 py-2.5 text-sm" value={aliasRow.name} placeholder="Original name" oninput={(event) => updateAliasRow(aliasRow.userID, { ...aliasRow, name: (event.currentTarget as HTMLInputElement).value })} />
									<input class="rounded-2xl border border-border bg-card px-3 py-2.5 text-sm" value={aliasRow.alias} placeholder="Alias" oninput={(event) => updateAliasRow(aliasRow.userID, { ...aliasRow, alias: (event.currentTarget as HTMLInputElement).value })} />
									<button type="button" class="rounded-2xl border border-border bg-card px-3 py-2 text-sm" onclick={() => {
										const nextAliases = { ...draft.settings.userAlias };
										delete nextAliases[aliasRow.userID];
										draft.settings.userAlias = nextAliases;
									}}>Remove</button>
								</div>
							{/each}
						</div>
					</section>
					{/if}

					{#if sectionId === "casino"}
						<section class="rounded-3xl border border-border/70 bg-card/85 p-5 shadow-sm">
						<h2 class="text-lg font-semibold">Hidden Casino Games</h2>
						<div class="mt-4 flex flex-wrap gap-2">
							{#each CASINO_GAMES as game (game)}
								<button
									type="button"
									class={`rounded-full border px-3 py-2 text-xs font-medium transition ${
										draft.settings.hideCasinoGames.includes(game)
											? "border-primary bg-primary text-primary-foreground"
											: "border-border bg-background"
									}`}
									onclick={() => toggleStringSelection(["hideCasinoGames"], game)}
								>
									{game}
								</button>
							{/each}
						</div>
					</section>
					{/if}

					{#if sectionId === "stock-exchange"}
						<section class="rounded-3xl border border-border/70 bg-card/85 p-5 shadow-sm">
						<h2 class="text-lg font-semibold">Hidden Stocks</h2>
						{#if stockChoices.length}
							<div class="mt-4 flex flex-wrap gap-2">
								{#each stockChoices as stock (stock.id)}
									<button
										type="button"
										class={`rounded-full border px-3 py-2 text-xs font-medium transition ${
											draft.settings.hideStocks.includes(stock.id)
												? "border-primary bg-primary text-primary-foreground"
												: "border-border bg-background"
										}`}
										onclick={() => toggleStringSelection(["hideStocks"], stock.id)}
									>
										{stock.name}
									</button>
								{/each}
							</div>
						{:else}
							<p class="mt-3 text-sm text-amber-600 dark:text-amber-400">Requires API data to be loaded.</p>
						{/if}
					</section>
					{/if}

					{#if sectionId === "attack"}
						<section class="rounded-3xl border border-border/70 bg-card/85 p-5 shadow-sm">
						<h2 class="text-lg font-semibold">Hidden Attack Buttons</h2>
						<div class="mt-4 flex flex-wrap gap-2">
							{#each ["leave", "mug", "hospitalize"] as buttonId (buttonId)}
								<button
									type="button"
									class={`rounded-full border px-3 py-2 text-xs font-medium transition ${
										draft.settings.pages.attack.hideAttackButtons.includes(buttonId)
											? "border-primary bg-primary text-primary-foreground"
											: "border-border bg-background"
									}`}
									onclick={() => toggleStringSelection(["pages", "attack", "hideAttackButtons"], buttonId)}
								>
									{buttonId}
								</button>
							{/each}
						</div>
					</section>
					{/if}
				{/each}
			</section>
		</div>
	</div>

	{#if searchOpen}
		<div
			class="fixed inset-0 z-50 bg-background/70 p-4 backdrop-blur"
			role="button"
			tabindex="0"
			aria-label="Close search"
			onclick={() => (searchOpen = false)}
			onkeydown={(event) => {
				if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
					searchOpen = false;
				}
			}}
		>
			<div
				class="mx-auto max-w-3xl rounded-[2rem] border border-border bg-card p-5 shadow-2xl"
				role="dialog"
				aria-modal="true"
				tabindex="-1"
				onclick={(event) => event.stopPropagation()}
				onkeydown={(event) => event.stopPropagation()}
			>
				<div class="flex items-center gap-3">
					<input
						class="min-w-0 flex-1 rounded-2xl border border-border bg-background px-3 py-3 text-sm"
						placeholder="Search preferences"
						bind:value={searchQuery}
					/>
					<button type="button" class="rounded-full border border-border bg-background px-3 py-2 text-sm font-medium" onclick={() => (searchOpen = false)}>
						Close
					</button>
				</div>
				<div class="mt-4 max-h-[60vh] space-y-2 overflow-auto">
					{#if filteredSearchIndex.length}
						{#each filteredSearchIndex as entry (entry.id)}
							<button
								type="button"
								class="w-full rounded-2xl border border-border bg-background/70 p-4 text-left transition hover:border-primary/40"
								onclick={() => goToSection(entry.section)}
							>
								<div class="text-sm font-medium">{entry.label}</div>
								<div class="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">{getPreferenceSectionDefinition(entry.section).title}</div>
								{#if entry.description}
									<div class="mt-1 text-sm text-muted-foreground">{entry.description}</div>
								{/if}
							</button>
						{/each}
					{:else}
						<div class="rounded-2xl border border-border bg-background/70 p-4 text-sm text-muted-foreground">No results.</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<StatusAlert {status} onClear={clearStatus} />
{/if}
