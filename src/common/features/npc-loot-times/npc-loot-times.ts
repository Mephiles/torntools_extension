import { Feature } from "@features/feature";
import { ttStorage } from "@utils/context";
import "./npc-loot-times.css";

import { npcs, settings } from "@utils/data/database";

import { createContainer, removeContainer } from "@utils/functions/containers";
import { checkDevice, elementBuilder, findElementWithText, findParent, isElement } from "@utils/functions/dom";
import { dropDecimals, type FormatTimeOptions, formatTime } from "@utils/functions/formatting";
import { requireSidebar } from "@utils/functions/requires";
import { countdownTimers } from "@utils/functions/timers";
import { isPageWithSidebar } from "@utils/functions/torn";
import { TO_MILLIS } from "@utils/functions/utilities";
import { PHFillBell, PHFillBellSlash } from "@utils/icons/phosphor-icons";

async function showNPCs() {
	await requireSidebar();

	const { content, options } = createContainer("NPCs", {
		id: "npc-loot-times",
		applyRounding: false,
		previousElement: findParent(findElementWithText("h2", "Information"), { partialClass: "sidebar-block_" }),
	});

	if ("error" in npcs) {
		content.appendChild(
			elementBuilder({
				type: "div",
				class: "tt-npc",
				children: [
					elementBuilder({ type: "span", class: "npc-name", text: "Error" }),
					elementBuilder({ type: "div", class: "npc-error", text: npcs.error }),
				],
			}),
		);
		return;
	}

	const now = Date.now();

	const timerSettings: Partial<FormatTimeOptions> = { type: "wordTimer", extraShort: true };
	if ("planned" in npcs) {
		let timer: HTMLElement;
		if (npcs.planned) {
			const left = npcs.planned - now;
			timer = elementBuilder({
				type: "span",
				class: "timer",
				text: formatTime(left, timerSettings),
				dataset: {
					seconds: dropDecimals(left / TO_MILLIS.SECONDS),
					timeSettings: timerSettings,
				},
			});
			countdownTimers.push(timer);
		} else if (npcs.reason) {
			timer = elementBuilder({ type: "span", class: "timer", text: `After ${npcs.reason}` });
		} else {
			timer = elementBuilder({ type: "span", class: "timer", text: "Not Scheduled" });
		}

		content.appendChild(
			elementBuilder({
				type: "div",
				class: "tt-npc",
				children: [
					elementBuilder({ type: "span", class: "npc-name", text: "Planned Attack" }),
					elementBuilder({ type: "div", class: "npc-information", children: [timer] }),
				],
			}),
		);
	}

	if (Object.keys(npcs).length === 0 || !npcs.targets) {
		content.appendChild(
			elementBuilder({
				type: "div",
				class: "tt-npc",
				children: [
					elementBuilder({
						type: "div",
						class: "npc-error",
						text: "Waiting for the first NPC information to come in.",
					}),
				],
			}),
		);
		return;
	}

	let hasNotScheduled = false;
	for (const [id, npc] of Object.entries(npcs.targets).sort(([, a], [, b]) => a.order - b.order)) {
		const status = npc.current === 0 ? "Hospital" : `Level ${npc.current}`;
		const next = npc.current !== 5 ? npc.current + 1 : null;

		let timer: HTMLElement;
		if (next) {
			const left = npc.levels[next] - now;

			timer = elementBuilder({
				type: "span",
				class: "timer",
				text: formatTime(left, timerSettings),
				dataset: {
					seconds: dropDecimals(left / TO_MILLIS.SECONDS),
					timeSettings: timerSettings,
				},
			});

			countdownTimers.push(timer);
		} else timer = elementBuilder({ type: "span", class: "timer", text: "max level" });

		if (!hasNotScheduled && npc.scheduled === false) {
			hasNotScheduled = true;
			content.appendChild(
				elementBuilder({
					type: "div",
					class: "tt-npc-divider",
					text: "-- not scheduled --",
				}),
			);
		}

		content.appendChild(
			elementBuilder({
				type: "div",
				class: "tt-npc",
				children: [
					elementBuilder({ type: "a", class: "npc-name", href: `https://www.torn.com/profiles.php?XID=${id}`, text: `${npc.name} [${id}]` }),
					elementBuilder({
						type: "div",
						class: "npc-information",
						children: [elementBuilder({ type: "span", class: npc.current === 0 ? "status hospital" : "status", text: status }), timer],
					}),
				],
			}),
		);
	}

	options.appendChild(
		elementBuilder({
			type: "div",
			class: "npc-notifications",
			children: [settings.notifications.types.npcsGlobal ? PHFillBell() : PHFillBellSlash()],
			events: {
				click(event) {
					if (!isElement(event.target)) return;

					const newStatus = !settings.notifications.types.npcsGlobal;

					event.stopPropagation();

					ttStorage.change({ settings: { notifications: { types: { npcsGlobal: newStatus } } } });
				},
			},
		}),
	);
}

function removeNPCs() {
	removeContainer("NPCs", { id: "npc-loot-times" });
}

export default class NPCLootTimesFeature extends Feature {
	constructor() {
		super("NPC Loot Times", "sidebar");
	}

	precondition() {
		return isPageWithSidebar();
	}

	async requirements() {
		const { hasSidebar } = await checkDevice();
		if (!hasSidebar) return "Not supported on mobiles or tablets!";

		if (!settings.external.yata && !settings.external.tornstats && !settings.external.lzpt) return "YATA, TornStats or LZPT not enabled";
		else if (npcs === null) return "NPC data is not yet available.";

		return true;
	}

	isEnabled() {
		return settings.pages.sidebar.npcLootTimes;
	}

	async execute() {
		await showNPCs();
	}

	cleanup() {
		removeNPCs();
	}

	storageKeys() {
		return ["settings.pages.sidebar.npcLootTimes", "npcs.targets"];
	}
}
