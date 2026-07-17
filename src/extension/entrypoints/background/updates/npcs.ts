import { ttStorage } from "@common/utils/context";
import { notifications, npcs, settings } from "@common/utils/data/database";
import type { StoredNpc, StoredNpcs } from "@common/utils/data/default-database";
import { hasAPIData } from "@common/utils/functions/api";
import type { LootRangersLoot, TornstatsLoot, YATALoot } from "@common/utils/functions/api.types";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { formatNumber, formatTime } from "@common/utils/functions/formatting";
import { TO_MILLIS } from "@common/utils/functions/utilities";
import { dispatchNotification, newNotification } from "../notifications";

let npcUpdater: number | undefined;

export async function updateNPCs() {
	const { yata: useYata, tornstats: useTornstats, lzpt: useLzpt } = settings.external;
	if (!useYata && !useTornstats && !useLzpt) {
		await ttStorage.set({ npcs: {} });
		return { updated: false };
	}

	const NPCS = {
		4: "DUKE",
		7: "Amanda",
		9: "Anonymous",
		10: "Scrooge",
		15: "Leslie",
		17: "Easter Bunny",
		19: "Jimmy",
		20: "Fernando",
		21: "Tiny",
	};

	const now = Date.now();
	let updated: boolean;

	if (npcs && "next_update" in npcs && npcs.next_update > now) {
		updated = await updateLevels();
	} else {
		const services = [
			{ service: "loot-rangers", method: fetchLootRangers, check: useLzpt },
			{ service: "yata", method: fetchYata, check: useYata },
			{ service: "tornstats", method: fetchTornStats, check: useTornstats && hasAPIData() },
		].filter((s) => s.check);
		const service = services.find((s) => s.service === settings.pages.sidebar.npcLootTimesService) || services[0];

		updated = await service.method();
	}

	if (updated || !npcUpdater) triggerUpdate();

	const alerts = await checkNPCAlerts();

	return { updated, alerts };

	async function fetchYata() {
		const data = await fetchData<YATALoot>("yata", { section: "loot" });

		if (npcs && "timestamp" in npcs && npcs.timestamp === data.timestamp) return await updateLevels();

		const newNpcs: StoredNpcs = {
			next_update: data.next_update * 1000,
			service: "YATA",
			targets: {},
		};

		for (let [id, hospital] of Object.entries(data.hosp_out)) {
			hospital = hospital * 1000;

			newNpcs.targets[id] = {
				levels: {
					1: hospital,
					2: hospital + TO_MILLIS.MINUTES * 30,
					3: hospital + TO_MILLIS.MINUTES * 90,
					4: hospital + TO_MILLIS.MINUTES * 210,
					5: hospital + TO_MILLIS.MINUTES * 450,
				},
				name: NPCS[id] ?? "Unknown",
				order: parseInt(id),
			};

			newNpcs.targets[id].current = getCurrentLevel(newNpcs.targets[id]);
		}

		await ttStorage.set({ npcs: newNpcs });
		return true;
	}

	async function fetchTornStats() {
		const data = await fetchData<TornstatsLoot>("tornstats", { section: "loot" });

		if (data && !data.status) return await updateLevels();

		const newNpcs: StoredNpcs = {
			next_update: now + TO_MILLIS.MINUTES * 15,
			service: "TornStats",
			targets: {},
		};

		for (const npc of Object.values(data)
			.filter((x) => typeof x === "object")
			.filter((npc) => npc.torn_id)) {
			newNpcs.targets[npc.torn_id] = {
				levels: {
					1: npc.hosp_out * 1000,
					2: npc.loot_2 * 1000,
					3: npc.loot_3 * 1000,
					4: npc.loot_4 * 1000,
					5: npc.loot_5 * 1000,
				},
				name: npc.name,
				order: npc.torn_id,
			};

			newNpcs.targets[npc.torn_id].current = getCurrentLevel(newNpcs.targets[npc.torn_id]);
		}

		await ttStorage.set({ npcs: newNpcs });
		return true;
	}

	async function fetchLootRangers() {
		const result = await fetchData<LootRangersLoot>("lzpt", { section: "loot" });
		if (!("npcs" in result)) {
			await ttStorage.set({
				npcs: {
					error: "No NPC results from Loot Rangers.",
					next_update: now + TO_MILLIS.MINUTES * 5,
					service: "Loot Rangers",
				},
			});
			return;
		}

		const {
			time: { clear: planned, reason, attack: ongoing },
			...data
		} = result;

		const newNpcs: StoredNpcs = {
			next_update: now + TO_MILLIS.MINUTES * (ongoing || (planned === 0 && !reason) ? 1 : 15),
			service: "Loot Rangers",
			targets: {},
		};

		for (const [_id, npc] of Object.entries(data.npcs)) {
			const id = parseInt(_id);
			const hospital = npc.hosp_out * 1000;

			newNpcs.targets[id] = {
				levels: {
					1: hospital,
					2: hospital + TO_MILLIS.MINUTES * 30,
					3: hospital + TO_MILLIS.MINUTES * 90,
					4: hospital + TO_MILLIS.MINUTES * 210,
					5: hospital + TO_MILLIS.MINUTES * 450,
				},
				name: npc.name || (NPCS[id] ?? "Unknown"),
				scheduled: npc.next ?? true,
				order: data.order.indexOf(id) + (npc.next ? 0 : 10),
			};

			newNpcs.targets[id].current = getCurrentLevel(newNpcs.targets[id]);
		}

		newNpcs.planned = planned === 0 ? false : planned * 1000;
		newNpcs.reason = reason;

		await ttStorage.set({ npcs: newNpcs });
		return true;
	}

	async function updateLevels() {
		if (!("targets" in npcs)) return false;

		const targets: { [id: string]: Partial<StoredNpc> } = {};

		for (const [id, npc] of Object.entries(npcs.targets)) {
			const current = getCurrentLevel(npc);

			if (npc.current !== current) targets[id] = { current };
		}

		if (Object.keys(targets).length) {
			await ttStorage.change({ npcs: { targets } });
			return true;
		}
		return false;
	}

	function getCurrentLevel(npc: StoredNpc) {
		return (
			Object.entries(npc.levels)
				.filter(([, time]) => time <= now)
				.map(([level, time]) => ({ level: parseInt(level), time }))
				?.at(-1)?.level ?? 0
		);
	}

	async function checkNPCAlerts() {
		if (!settings.notifications.types.global || !settings.notifications.types.npcsGlobal) return 0;
		if (!("targets" in npcs)) return 0;

		let alerts = 0;

		for (const { id, level, minutes } of settings.notifications.types.npcs.filter(
			(npc): npc is { id: number; level: number; minutes: number } => npc.level !== "" && npc.minutes !== "",
		)) {
			const npc = npcs.targets[id];
			if (!npc) {
				await ttStorage.update("notifications", (notifications) => delete notifications.npcs[id]);
				continue;
			}

			const time = npc.levels[level];
			if (!time) {
				await ttStorage.update("notifications", (notifications) => delete notifications.npcs[id]);
				continue;
			}

			const left = time - now;
			const _minutes = Math.ceil(left / TO_MILLIS.MINUTES);
			if (_minutes > minutes || _minutes < 0) {
				await ttStorage.update("notifications", (notifications) => delete notifications.npcs[id]);
				continue;
			}

			if (notifications.npcs[id]) continue;

			const notification = newNotification(
				"NPC Loot",
				`${npc.name} is reaching loot level ${formatNumber(level, { roman: true })} in ${formatTime(left, { type: "wordTimer" })}.`,
				`https://www.torn.com/profiles.php?XID=${id}`,
			);
			await dispatchNotification(notification);
			await ttStorage.change({ notifications: { npcs: { [id]: notification } } });
			alerts++;
		}
		if (settings.notifications.types.npcPlannedEnabled && npcs.planned) {
			for (const minutes of settings.notifications.types.npcPlanned.sort()) {
				const key = `npc_planned_${minutes}`;

				const time = npcs.planned;
				if (!time) {
					await ttStorage.update("notifications", (notifications) => delete notifications.npcs[key]);
					continue;
				}

				const left = time - now;
				const minutesPlanned = Math.ceil(left / TO_MILLIS.MINUTES);
				if (minutesPlanned > minutes || minutesPlanned < 0) {
					await ttStorage.update("notifications", (notifications) => delete notifications.npcs[key]);
					continue;
				}

				if (notifications.npcs[key]) continue;

				const notification = newNotification("NPC Loot", `There is a planned attack in ${formatTime(left, { type: "wordTimer" })}.`);
				await dispatchNotification(notification);
				await ttStorage.change({ notifications: { npcs: { [key]: notification } } });
				alerts++;
			}
		}

		return alerts;
	}

	function triggerUpdate() {
		const shortest =
			"targets" in npcs
				? Object.values(npcs.targets)
						.flatMap((npc) => Object.values(npc.levels))
						.filter((time) => time > now)
						.sort()[0]
				: null;
		if (!shortest) return;

		if (npcUpdater) clearTimeout(npcUpdater);
		npcUpdater = setTimeout(() => {
			updateLevels();

			npcUpdater = undefined;
		}, shortest - Date.now());
	}
}
