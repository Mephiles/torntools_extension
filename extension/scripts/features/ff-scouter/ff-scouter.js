/**
 * @typedef ScouterResult
 * @type {object}
 * @property {number} player_id
 * @property {number|null} fair_fight
 * @property {number|null} bs_estimate
 * @property {string|null} bs_estimate_human
 * @property {EpochTimeStamp|null} last_updated
 * @property {string|null} message
 * @property {string|null} message_short
 * @property {boolean|null} isError
 */

class ScouterService {
	/**
	 * @param cacheKey {string}
	 */
	constructor(cacheKey) {
		this.cacheKey = cacheKey;
	}

	/**
	 * @param target {number}
	 * @returns {boolean}
	 */
	inCache(target) {
		return ttCache.hasValue(this.cacheKey, target);
	}

	/**
	 * @param target {number}
	 * @returns {ScouterResult}
	 */
	fromCache(target) {
		return /** @type {ScouterResult} */ ttCache.get(this.cacheKey, target);
	}

	/**
	 * @param result {ScouterResult}
	 */
	toCache(result) {
		void ttCache.set({ [result.player_id]: result }, result.fair_fight ? TO_MILLIS.HOURS : TO_MILLIS.MINUTES * 5, this.cacheKey);
	}

	/**
	 * @param target {number}
	 * @returns {Promise<ScouterResult>}
	 */
	scoutSingle(target) {
		if (this.inCache(target)) {
			return Promise.resolve(this.fromCache(target));
		}

		return this._fetchSingle(target);
	}

	/**
	 * @param target {number}
	 * @returns {Promise<ScouterResult>}
	 */
	_fetchSingle(target) {
		throw new Error("You have to implement the method _fetchSingle!");
	}

	/**
	 * @param targets {(number|string)[]}
	 * @returns {Promise<{[id: string]: ScouterResult}>}
	 */
	async scoutGroup(targets) {
		const uniqueTargets = Array.from(new Set(targets.map((id) => parseInt(id))));

		const cachedTargets = uniqueTargets.filter((target) => this.inCache(target));
		const missingTargets = uniqueTargets.filter((target) => !this.inCache(target));

		const results = {};

		cachedTargets.map((target) => this.fromCache(target)).forEach((result) => (results[result.player_id] = result));

		const resultList = await this._fetchGroup(missingTargets);
		resultList.forEach((result) => (results[result.player_id] = result));

		return results;
	}

	/**
	 * @param targets {(number)[]}
	 * @returns {Promise<ScouterResult[]>}
	 */
	_fetchGroup(targets) {
		throw new Error("You have to implement the method _fetchGroup!");
	}
}

class FFScouterService extends ScouterService {
	MAX_TARGET_AMOUNT = 104;

	constructor() {
		super("ff-scouter-v3");
	}
	/**
	 * @param target {number}
	 * @returns {Promise<ScouterResult>}
	 */
	_fetchSingle(target) {
		return this._fetchGroup([target]).then((result) => result[0]);
	}

	/**
	 * @param targets {(number)[]}
	 * @returns {Promise<ScouterResult[]>}
	 */
	_fetchGroup(targets) {
		if (targets.length === 0) return Promise.resolve([]);

		if (targets.length > this.MAX_TARGET_AMOUNT) {
			const first = targets.slice(0, this.MAX_TARGET_AMOUNT);
			const second = targets.slice(this.MAX_TARGET_AMOUNT);

			return new Promise((resolve, reject) => {
				Promise.all([this._fetchGroup(first), this._fetchGroup(second)])
					.then((combined) => {
						const combinedResults = combined.flatMap((x) => x);

						resolve(combinedResults);
					})
					.catch(reject);
			});
		}

		return this.__fetch(targets);
	}

	/**
	 * @param targets {(number)[]}
	 * @returns {Promise<ScouterResult[]>}
	 */
	__fetch(targets) {
		return fetchData("ffscouter", { section: "get-stats", includeKey: true, relay: true, params: { targets } }).then((data) => {
			data = data.map((result) => {
				if (result.fair_fight === null) {
					return {
						player_id: result.player_id,
						message: "No known fair fight for this player.",
						message_short: "No FF known.",
						isError: false,
					};
				}

				return result;
			});

			data.forEach((result) => this.toCache(result));

			return data;
		});
	}
}

const FF_SCOUTER_SERVICE = new FFScouterService();

function scouterService() {
	const { ffScouter: useFFScouter } = settings.external;
	if (!useFFScouter) {
		return null;
	}

	const services = [{ name: "ffscouter", service: FF_SCOUTER_SERVICE, check: useFFScouter && hasAPIData() }].filter((s) => s.check);

	const selectedService = services.find((s) => s.name === settings.scripts.ffScouter.ffScouterService) ?? services[0];
	return selectedService.service;
}

/**
 * @param scout {ScouterResult}
 * @returns {{message: string, className: string, detailMessage: string}}
 */
function buildScoutInformation(scout) {
	let message, className, detailMessage;
	if (!scout.message) {
		const now = Date.now();
		const age = now - scout.last_updated * 1000;

		let suffix;
		if (age < TO_MILLIS.DAYS) {
			suffix = "";
		} else if (age < 31 * TO_MILLIS.DAYS) {
			const days = Math.round(age / TO_MILLIS.DAYS);

			suffix = days === 1 ? "(1 day old)" : `(${days} days old)`;
		} else if (age < 365 * TO_MILLIS.DAYS) {
			const months = Math.round(age / (31 * TO_MILLIS.DAYS));

			suffix = months === 1 ? "(1 month old)" : `(${months} months old)`;
		} else {
			const years = Math.round(age / (365 * TO_MILLIS.DAYS));

			suffix = years === 1 ? "(1 year old)" : `(${years} years old)`;
		}

		message = `Fair Fight: ${scout.fair_fight.toFixed(2)} ${suffix}`.trim();
		className = null;
		detailMessage = null;
	} else {
		message = scout.message_short ?? "failed FF scout";
		className = scout.isError ? "tt-ff-scouter-error" : null;
		detailMessage = scout.message;
	}

	return { message, className, detailMessage };
}

/*
 * Credits to rDacted [2670953] (https://www.torn.com/profiles.php?XID=2670953).
 */
function ffColor(value) {
	let r, g, b;

	// Transition from
	// blue - #2828c6
	// to
	// green - #28c628
	// to
	// red - #c62828
	if (value <= 1) {
		// Blue
		r = 0x28;
		g = 0x28;
		b = 0xc6;
	} else if (value <= 3) {
		// Transition from blue to green
		const t = (value - 1) / 2; // Normalize to range [0, 1]
		r = 0x28;
		g = Math.round(0x28 + (0xc6 - 0x28) * t);
		b = Math.round(0xc6 - (0xc6 - 0x28) * t);
	} else if (value <= 5) {
		// Transition from green to red
		const t = (value - 3) / 2; // Normalize to range [0, 1]
		r = Math.round(0x28 + (0xc6 - 0x28) * t);
		g = Math.round(0xc6 - (0xc6 - 0x28) * t);
		b = 0x28;
	} else {
		// Red
		r = 0xc6;
		g = 0x28;
		b = 0x28;
	}

	return rgbToHex(r, g, b); // Return hex value
}

/*
 * Credits to rDacted [2670953] (https://www.torn.com/profiles.php?XID=2670953).
 */
function rgbToHex(r, g, b) {
	return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

/*
 * Credits to rDacted [2670953] (https://www.torn.com/profiles.php?XID=2670953).
 */
function contrastFFColor(hex) {
	// Convert hex to RGB
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);

	// Calculate brightness
	const brightness = r * 0.299 + g * 0.587 + b * 0.114;
	return brightness > 126 ? "black" : "white"; // Return black or white based on brightness
}
