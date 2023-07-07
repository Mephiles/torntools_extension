const RANKS = {
	"Absolute beginner": 1,
	Beginner: 2,
	Inexperienced: 3,
	Rookie: 4,
	Novice: 5,
	"Below average": 6,
	Average: 7,
	Reasonable: 8,
	"Above average": 9,
	Competent: 10,
	"Highly competent": 11,
	Veteran: 12,
	Distinguished: 13,
	"Highly distinguished": 14,
	Professional: 15,
	Star: 16,
	Master: 17,
	Outstanding: 18,
	Celebrity: 19,
	Supreme: 20,
	Idolized: 21,
	Champion: 22,
	Heroic: 23,
	Legendary: 24,
	Elite: 25,
	Invincible: 26,
};

class StatsEstimate {
	constructor(isList) {
		this.queue = [];
		this.running = false;

		this.isList = isList;
	}

	showEstimates(selector, handler, hasFilter, placement) {
		for (const row of document.findAll(selector)) {
			if ((row.classList.contains("tt-hidden") && row.dataset.hideReason !== "stats-estimate") || row.classList.contains("tt-estimated")) continue;

			const { id, level } = handler(row);
			if (!id) continue;

			if (level && settings.scripts.statsEstimate.maxLevel && settings.scripts.statsEstimate.maxLevel < level) continue;

			row.classList.add("tt-estimated");

			const section = document.newElement({ type: "div", class: "tt-stats-estimate" });
			const parent = placement ? placement(row) ?? row : row;
			new Promise((resolve) => {
				parent.insertAdjacentElement("afterend", section);
				resolve();
			}).then(() => {});

			showLoadingPlaceholder(section, true);

			let estimate;
			if (ttCache.hasValue("stats-estimate", id)) {
				estimate = ttCache.get("stats-estimate", id);
			} else if (ttCache.hasValue("profile-stats", id)) {
				const {
					rank,
					level,
					criminalrecord: { total: crimes },
					personalstats: { networth },
					last_action: { timestamp: lastAction },
				} = ttCache.get("profile-stats", id);

				estimate = this.getAndCacheResult(id, rank, level, crimes, networth, lastAction * 1000);
			}

			if (estimate) {
				section.textContent = `↑ Stats Estimate: ${estimate} ↑`;
				if (hasFilter) row.dataset.estimate = estimate;

				showLoadingPlaceholder(section, false);
				if (hasFilter) triggerCustomListener(EVENT_CHANNELS.STATS_ESTIMATED, { row });
			} else if (settings.scripts.statsEstimate.cachedOnly) {
				if (settings.scripts.statsEstimate.displayNoResult) section.textContent = "No cached result found!";
				else {
					row.classList.remove("tt-estimated");
					section.remove();
				}
				if (hasFilter) {
					row.dataset.estimate = "none";
					triggerCustomListener(EVENT_CHANNELS.STATS_ESTIMATED, { row });
				}

				showLoadingPlaceholder(section, false);
			} else this.queue.push({ row, section, id, hasFilter });
		}

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

	getEstimate(rank, level, crimes, networth) {
		rank = rank.match(/[A-Z][a-z ]+/g)[0].trim();

		const triggersLevel = RANK_TRIGGERS.level.filter((x) => x <= level).length;
		const triggersCrimes = RANK_TRIGGERS.crimes.filter((x) => x <= crimes).length;
		const triggersNetworth = RANK_TRIGGERS.networth.filter((x) => x <= networth).length;

		const triggersStats = RANKS[rank] - triggersLevel - triggersCrimes - triggersNetworth - 1;

		return RANK_TRIGGERS.stats[triggersStats] ?? "N/A";
	}

	async fetchEstimate(id) {
		let estimate, data;
		if (ttCache.hasValue("stats-estimate", id)) {
			estimate = ttCache.get("stats-estimate", id);
		} else if (ttCache.hasValue("profile-stats", id)) {
			data = ttCache.get("profile-stats", id);
		} else {
			if (this.isList && settings.scripts.statsEstimate.cachedOnly)
				throw { message: "No cached result found!", show: settings.scripts.statsEstimate.displayNoResult };

			try {
				data = await fetchData("torn", { section: "user", id, selections: ["profile", "personalstats", "crimes"], silent: true });
			} catch (error) {
				let message;
				if (error.error) message = error.error;
				else if (error.code) message = `Unknown (code ${error.code})`;
				else message = error;

				throw { message, show: true };
			}
		}

		if (!estimate) {
			if (data) {
				const {
					rank,
					level,
					criminalrecord: { total: crimes },
					personalstats: { networth },
					last_action: { timestamp: lastAction },
				} = data;

				estimate = this.getAndCacheResult(id, rank, level, crimes, networth, lastAction * 1000);
			} else {
				throw { message: "Failed to load estimate.", show: true };
			}
		}

		return estimate;
	}

	cacheResult(id, estimate, lastAction) {
		let days = 7;

		if (estimate === RANK_TRIGGERS.stats.last()) days = 31;
		else if (lastAction && lastAction <= Date.now() - TO_MILLIS.DAYS * 180) days = 31;
		else if (estimate === "N/A") days = 1;

		return ttCache.set({ [id]: estimate }, TO_MILLIS.DAYS * days, "stats-estimate");
	}

	getAndCacheResult(id, rank, level, crimes, networth, lastAction) {
		const isOldSystem = new Date(lastAction * 1000).getUTCFullYear() <= 2015;
		if (isOldSystem) return "N/A";

		const estimate = this.getEstimate(rank, level, crimes, networth);
		this.cacheResult(id, estimate, lastAction * 1000).catch((error) => console.error("Failed to cache stat estimate.", error));

		return estimate;
	}
}
