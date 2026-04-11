import "./stats-estimate.css";
import type { UserPersonalStatsPopular, UserProfileResponse } from "tornapi-typescript";
import { ttCache } from "@/utils/common/data/cache";
import { settings } from "@/utils/common/data/database";
import { fetchData } from "@/utils/common/functions/api";
import { elementBuilder, findAllElements, showLoadingPlaceholder } from "@/utils/common/functions/dom";
import { EVENT_CHANNELS, triggerCustomListener } from "@/utils/common/functions/listeners";
import { RANK_TRIGGERS, RANKS } from "@/utils/common/functions/torn";
import { sleep, TO_MILLIS } from "@/utils/common/functions/utilities";

const ESTIMATE_INSTANCES: { [name: string]: StatsEstimate } = {};

interface EstimateQueue {
	row: HTMLElement;
	section: HTMLElement;
	id: number;
	hasFilter: boolean;
}

interface EstimationRequest {
	id: number;
	level: number;
}

interface ElementPlaceholder {
	section: HTMLElement;
	field: HTMLElement;
}

interface ShowEstimatesOptions {
	generator: () => ElementPlaceholder;
	hasFilter: boolean;
	placement: (row: HTMLElement) => HTMLElement;
}

export class StatsEstimate {
	private queue: EstimateQueue[];
	running: boolean;
	private readonly isList: boolean;

	constructor(name: string, isList: boolean) {
		this.queue = [];
		this.running = false;

		this.isList = isList;

		ESTIMATE_INSTANCES[name] = this;
	}

	showEstimates(selector: string, handler: (row: HTMLElement) => EstimationRequest | null, partialOptions: Partial<ShowEstimatesOptions> = {}) {
		const options: ShowEstimatesOptions = {
			generator: (): ElementPlaceholder => {
				const element = elementBuilder({ type: "div", class: "tt-stats-estimate" });

				return { section: element, field: element };
			},
			hasFilter: false,
			placement: (row) => row,
			...partialOptions,
		};

		findAllElements(selector)
			.filter((row) => !((row.dataset.hideReason !== "stats-estimate" && row.classList.contains("tt-hidden")) || row.classList.contains("tt-estimated")))
			.forEach((row) => {
				const request = handler(row);
				if (!request) return;

				const { id, level } = request;
				if (level && settings.scripts.statsEstimate.maxLevel && settings.scripts.statsEstimate.maxLevel < level) return;

				const { section, field } = options.generator();

				row.classList.add("tt-estimated");
				options.placement(row).insertAdjacentElement("afterend", section);

				showLoadingPlaceholder(field, true);

				let estimate: string;
				if (ttCache.hasValue("stats-estimate", id)) {
					estimate = ttCache.get<string>("stats-estimate", id);
				}

				if (estimate) {
					field.textContent = `Stats Estimate: ${estimate}`;
					if (options.hasFilter) row.dataset.estimate = estimate;

					showLoadingPlaceholder(field, false);
					if (options.hasFilter) triggerCustomListener(EVENT_CHANNELS.STATS_ESTIMATED, { row });
				} else if (settings.scripts.statsEstimate.cachedOnly) {
					if (settings.scripts.statsEstimate.displayNoResult) field.textContent = "No cached result found!";
					else {
						row.classList.remove("tt-estimated");
						section.remove();
					}
					if (options.hasFilter) {
						row.dataset.estimate = "none";
						triggerCustomListener(EVENT_CHANNELS.STATS_ESTIMATED, { row });
					}

					showLoadingPlaceholder(field, false);
				} else this.queue.push({ row, section: field, id, hasFilter: options.hasFilter });
			});

		this.runQueue().then(() => {});
	}

	async runQueue() {
		if (this.running || !this.queue.length) return;

		this.running = true;

		while (this.queue.length) {
			const { row, section, id, hasFilter } = this.queue.shift();

			if (row.classList.contains("tt-hidden") && row.dataset.hideReason !== "stats-estimate") {
				row.classList.remove("tt-estimated");
				section.remove();
				continue;
			}

			try {
				const estimate = await this.fetchEstimate(id);

				section.textContent = `Stats Estimate: ${estimate}`;
				if (hasFilter) {
					row.dataset.estimate = estimate;
					triggerCustomListener(EVENT_CHANNELS.STATS_ESTIMATED, { row, estimate });
				}
			} catch (error) {
				if (error.show) {
					section.textContent = error.message;
				} else {
					section.remove();
				}
				// if (hasFilter) triggerCustomListener(EVENT_CHANNELS.STATS_ESTIMATED, { row });
			}
			showLoadingPlaceholder(section, false);

			await sleep(settings.scripts.statsEstimate.delay);
		}

		this.running = false;
	}

	clearQueue() {
		for (const { row, section } of this.queue) {
			row.classList.remove("tt-estimated");
			section.remove();
		}

		this.queue = [];
	}

	getEstimate(rank: string, level: number, crimes: number, networth: number) {
		rank = rank.match(/[A-Z][a-z ]+/g)[0].trim();

		const triggersLevel = RANK_TRIGGERS.level.filter((x) => x <= level).length;
		const triggersCrimes = RANK_TRIGGERS.crimes.filter((x) => x <= crimes).length;
		const triggersNetworth = RANK_TRIGGERS.networth.filter((x) => x <= networth).length;

		const triggersStats = RANKS[rank] - triggersLevel - triggersCrimes - triggersNetworth - 1;

		return RANK_TRIGGERS.stats[triggersStats] ?? "N/A";
	}

	async fetchEstimate(id: number) {
		let estimate: string, data: UserProfileResponse & UserPersonalStatsPopular;
		if (ttCache.hasValue("stats-estimate", id)) {
			estimate = ttCache.get<string>("stats-estimate", id);
		} else {
			if (this.isList && settings.scripts.statsEstimate.cachedOnly)
				throw { message: "No cached result found!", show: settings.scripts.statsEstimate.displayNoResult };

			try {
				data = await fetchData<UserProfileResponse & UserPersonalStatsPopular>("tornv2", {
					section: "user",
					id,
					selections: ["profile", "personalstats"],
					params: { cat: "popular" },
					silent: true,
				});
			} catch (error) {
				let message: string;
				if (error.error) message = error.error;
				else if (error.code) message = `Unknown (code ${error.code})`;
				else message = error;

				throw { message, show: true };
			}
		}

		if (!estimate) {
			if (data) {
				const {
					profile: {
						rank,
						level,
						last_action: { timestamp: lastAction },
					},
					personalstats: {
						networth: { total: networth },
						crimes: { total: crimes },
					},
				} = data;

				estimate = this.getAndCacheResult(id, rank, level, crimes, networth, lastAction * 1000);
			} else {
				throw { message: "Failed to load estimate.", show: true };
			}
		}

		return estimate;
	}

	cacheResult(id: number, estimate: string, lastAction: number) {
		let days = 7;

		if (estimate === (RANK_TRIGGERS.stats as unknown as string[]).at(-1)) days = 31;
		else if (lastAction && lastAction <= Date.now() - TO_MILLIS.DAYS * 180) days = 31;
		else if (estimate === "N/A") days = 1;

		return ttCache.set({ [id]: estimate }, TO_MILLIS.DAYS * days, "stats-estimate");
	}

	getAndCacheResult(id: number, rank: string, level: number, crimes: number, networth: number, lastAction: number) {
		const isOldSystem = new Date(lastAction * 1000).getUTCFullYear() <= 2015;
		if (isOldSystem) return "N/A";

		const estimate = this.getEstimate(rank, level, crimes, networth);
		this.cacheResult(id, estimate, lastAction * 1000).catch((error) => console.error("Failed to cache stat estimate.", error));

		return estimate;
	}
}

export function hasStatsEstimatesLoaded(name: string) {
	return name in ESTIMATE_INSTANCES && !ESTIMATE_INSTANCES[name].running;
}
