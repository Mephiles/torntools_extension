import type { TornInternalCrimeData, TornInternalCrimePlayerSlot, TornInternalOrganizedCrimeList } from "@common/pages/factions-page";
import { isInternalFaction, isOrganizedCrimeList } from "@common/pages/factions-page";
import { ttCache } from "@common/utils/data/cache.ts";
import { settings } from "@common/utils/data/database";
import { hasOC1Data } from "@common/utils/functions/api";
import { fetchData } from "@common/utils/functions/api-fetcher.ts";
import { addFetchListener } from "@common/utils/functions/listeners.ts";
import { ExecutionTiming, Feature } from "@features/feature";

function initialiseListeners() {
	addFetchListener(async ({ detail: { page, json, fetch } }) => {
		if (page !== "page" || !json) return;

		const params = new URL(fetch.url).searchParams;
		const sid = params.get("sid")!;
		const step = params.get("step")!;
		if (!isOrganizedCrimeList(sid, step, json) || fetch.body?.group !== "Completed") return;

		if (!json.success) return;

		await submitScenarios(json);
	});
}

async function submitScenarios({ data }: TornInternalOrganizedCrimeList) {
	data.forEach(processScenario);
}

function processScenario(scenario: TornInternalCrimeData) {
	const scenarioId = String(scenario.ID);
	if (ttCache.hasValue("processed-scenarios", scenarioId)) return;

	const roleMappings = buildRoleMappings(scenario.playerSlots);
	const events = scenario.scenario.scenes.map<ScenarioEvent>((scene) => {
		const dialogue = scene.dialogues[0];
		return {
			key: dialogue.id,
			text: replaceUserIdsWithRoles(dialogue.description, roleMappings),
		};
	});

	const rewards = scenario.rewards!;
	const scenarioData: TornProbabilityScenarioData = {
		name: scenario.scenario.name,
		scenarioId: scenarioId,
		preRequisiteCrimeID: scenario.preRequisiteCrimeID ? String(scenario.preRequisiteCrimeID) : null,
		rewards: {
			respect: rewards.faction.respect || 0,
			scope: rewards.faction.scope || 0,
			money: rewards.faction.cash || 0,
			items: rewards.faction.items.map((item) => ({
				name: item.name,
				quantity: item.quantity || 1,
			})),
		},
		events: enhanceScenarioEvents(events),
	};

	submitScenarioData(scenarioData)
		.then(() => ttCache.setIndefinite({ [scenarioId]: true }, "processed-scenarios"))
		.catch(() => {});
}

function buildRoleMappings(playerSlots: TornInternalCrimePlayerSlot[]) {
	const memberRoles = new Map<string, string>();
	const sortedSlots = playerSlots.slice().sort((a, b) => {
		const posA = parseInt(a.key.match(/\d+/)?.[0] ?? "0", 10);
		const posB = parseInt(b.key.match(/\d+/)?.[0] ?? "0", 10);
		return posA - posB;
	});

	const roleRegistry = new Map<string, number>();
	sortedSlots.forEach((slot) => {
		const role = sanitizeRoleName(slot.name);
		roleRegistry.set(role, (roleRegistry.get(role) || 0) + 1);
	});

	const roleCounts = new Map<string, number>();
	sortedSlots.forEach((slot) => {
		const role = sanitizeRoleName(slot.name);
		const total = roleRegistry.get(role) ?? 0;
		const count = (roleCounts.get(role) || 0) + 1;
		roleCounts.set(role, count);
		const displayName = total > 1 ? `${role} ${count}` : role;
		memberRoles.set(`userId-${slot.player!.ID}`, displayName);
	});

	return memberRoles;
}

function sanitizeRoleName(name: string) {
	if (!name || typeof name !== "string") return "Unknown";
	const sanitized = name.replaceAll(/^[-_]+|[-_]+$/g, "").trim();
	return sanitized.length > 0 ? sanitized : "Unknown";
}

function replaceUserIdsWithRoles(text: string, roleMappings: Map<string, string>) {
	let modifiedText = text;
	roleMappings.forEach((role, userId) => {
		modifiedText = modifiedText.replaceAll(new RegExp(`\\b${userId}\\b`, "gi"), role);
	});
	return modifiedText;
}

interface ScenarioEvent {
	key: string;
	text: string;
}

function enhanceScenarioEvents(events: ScenarioEvent[]) {
	return events.map((event, index, arr) => {
		const enhanced: ScenarioEvent & { previous?: string } = { ...event };
		if (index > 0) {
			enhanced.previous = arr[index - 1].key;
		}
		return enhanced;
	});
}

interface TornProbabilityScenarioData {
	name: string;
	scenarioId: string;
	preRequisiteCrimeID: string | null;
	rewards: {
		respect: number;
		scope: number;
		money: number;
		items: { name: string; quantity: number }[];
	};
	events: (ScenarioEvent & { previous?: string })[];
}

async function submitScenarioData(data: TornProbabilityScenarioData) {
	return fetchData<never>("tornprobability", {
		method: "POST",
		section: "scenarios",
		body: data,
		relay: true,
	});
}

export default class OCSubmitScenariosFeature extends Feature {
	constructor() {
		super("OC Submit Scenarios", "faction", ExecutionTiming.IMMEDIATELY);
	}

	override precondition() {
		return isInternalFaction;
	}

	override isEnabled() {
		return settings.pages.faction.submitScenarios;
	}

	override initialise() {
		initialiseListeners();
	}

	override storageKeys() {
		return ["settings.pages.faction.submitScenarios", "settings.external.tornprobability"];
	}

	override requirements() {
		if (!settings.external.tornprobability) return "Torn Probability not enabled";
		else if (hasOC1Data()) return "Still on OC1.";

		return true;
	}
}
