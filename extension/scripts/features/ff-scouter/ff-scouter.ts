type ScouterResult =
	| {
			player_id: number;
			fair_fight: number | null;
			bs_estimate: number | null;
			bs_estimate_human: string | null;
			last_updated: EpochTimeStamp | null;
	  }
	| {
			player_id: number;
			message: string;
			message_short: string;
			isError: boolean;
	  };

class ScouterService {
	private readonly cacheKey: string;

	constructor(cacheKey: string) {
		this.cacheKey = cacheKey;
	}

	inCache(target: number) {
		return ttCache.hasValue(this.cacheKey, target);
	}

	fromCache(target: number): ScouterResult {
		return ttCache.get(this.cacheKey, target);
	}

	toCache(result: ScouterResult) {
		void ttCache.set({ [result.player_id]: result }, "fair_fight" in result && result.fair_fight ? TO_MILLIS.HOURS : TO_MILLIS.MINUTES * 5, this.cacheKey);
	}

	scoutSingle(target: number): Promise<ScouterResult> {
		if (NON_ATTACKABLE_ACCOUNT_IDS.includes(target)) {
			return Promise.resolve({ player_id: target, message: "", message_short: "", isError: true });
		}

		if (this.inCache(target)) {
			return Promise.resolve(this.fromCache(target));
		}

		return this._fetchSingle(target);
	}

	_fetchSingle(_target: number): Promise<ScouterResult> {
		throw new Error("You have to implement the method _fetchSingle!");
	}

	async scoutGroup(targets: (number | string)[]): Promise<{ [id: string]: ScouterResult }> {
		const uniqueTargets = Array.from(new Set(targets.map((id) => parseInt(id.toString()))));

		const cachedTargets = uniqueTargets.filter((target) => this.inCache(target));
		const missingTargets = uniqueTargets.filter((target) => !this.inCache(target)).filter((target) => !NON_ATTACKABLE_ACCOUNT_IDS.includes(target));

		const results = {};

		cachedTargets.map((target) => this.fromCache(target)).forEach((result) => (results[result.player_id] = result));

		const resultList = await this._fetchGroup(missingTargets);
		resultList.forEach((result) => (results[result.player_id] = result));

		return results;
	}

	_fetchGroup(_targets: number[]): Promise<ScouterResult[]> {
		throw new Error("You have to implement the method _fetchGroup!");
	}
}

class FFScouterService extends ScouterService {
	MAX_TARGET_AMOUNT = 104 as const;

	constructor() {
		super("ff-scouter-v3");
	}

	override async _fetchSingle(target: number): Promise<ScouterResult> {
		const result = await this._fetchGroup([target]);

		return result[0];
	}

	override _fetchGroup(targets: number[]): Promise<ScouterResult[]> {
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

	async __fetch(targets: number[]): Promise<ScouterResult[]> {
		const data = await fetchData<FFScouterResult>("ffscouter", { section: "get-stats", includeKey: true, relay: true, params: { targets } });
		if ("error" in data) {
			console.error("TT - Failed to scout FF for the following players:", targets, data.error);
			return targets.map<ScouterResult>((target) => ({
				player_id: target,
				message: `Failed to scout: ${data.error}`,
				message_short: data.error,
				isError: true,
			}));
		}

		const mappedData = data.map<ScouterResult>((result) => {
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
		mappedData.forEach((r) => this.toCache(r));
		return mappedData;
	}
}

const FF_SCOUTER_SERVICE = new FFScouterService();

function scouterService() {
	const { ffScouter: useFFScouter } = settings.external;
	if (!useFFScouter) {
		return null;
	}

	const services = [{ name: "ffscouter", service: FF_SCOUTER_SERVICE, check: useFFScouter && hasAPIData() }].filter((s) => s.check);

	const selectedService = services[0];
	return selectedService.service;
}

function buildScoutInformation(scout: ScouterResult): { message: string; className: string; detailMessage: string } {
	let message: string, className: string, detailMessage: string;
	if (!("message" in scout)) {
		const now = Date.now();
		const age = now - scout.last_updated * 1000;

		let suffix: string;
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
function ffColor(value: number) {
	let r: number, g: number, b: number;

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
function rgbToHex(r: number, g: number, b: number) {
	return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

/*
 * Credits to rDacted [2670953] (https://www.torn.com/profiles.php?XID=2670953).
 */
function contrastFFColor(hex: string) {
	// Convert hex to RGB
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);

	// Calculate brightness
	const brightness = r * 0.299 + g * 0.587 + b * 0.114;
	return brightness > 126 ? "black" : "white"; // Return black or white based on brightness
}
