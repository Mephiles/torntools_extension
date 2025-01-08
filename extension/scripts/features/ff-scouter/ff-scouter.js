function scoutFF(target) {
	if (ttCache.hasValue("ff-scouter", target)) {
		return Promise.resolve(ttCache.get("ff-scouter", target));
	}

	return new Promise((resolve, reject) => {
		fetchData("tornpal", { section: "ffscouter", includeKey: true, relay: true, params: { target } })
			.then((data) => {
				ttCache.set({ [target]: data }, data.status ? TO_MILLIS.HOURS : TO_MILLIS.MINUTES * 5, "ff-scouter");

				resolve(data);
			})
			.catch(reject);
	});
}

function scoutFFGroup(targets) {
	const cacheKey = JSON.stringify(targets.toSorted((a, b) => a - b));
	if (ttCache.hasValue("ff-scouter-group", cacheKey)) {
		return Promise.resolve(ttCache.get("ff-scouter-group", cacheKey));
	}

	return new Promise((resolve, reject) => {
		fetchData("tornpal", { section: "ffscoutergroup", includeKey: true, relay: true, params: { targets } })
			.then((data) => {
				ttCache.set({ [cacheKey]: data }, data.status ? TO_MILLIS.HOURS : TO_MILLIS.MINUTES * 5, "ff-scouter-group");

				if (data.status) {
					Object.entries(data.results).forEach(([id, result]) => {
						ttCache.set({ [id]: result }, result.status ? TO_MILLIS.HOURS : TO_MILLIS.MINUTES * 5, "ff-scouter");
					});
				}

				resolve(data);
			})
			.catch(reject);
	});
}

function buildScoutInformation(scout) {
	let message, className, detailMessage;
	if (scout.status) {
		const now = Date.now();
		const age = now - scout.result.last_updated * 1000;

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

		message = `Fair Fight: ${scout.result.value.toFixed(2)} ${suffix}`.trim();
		className = null;
		detailMessage = null;
	} else {
		message = "failed FF scout";
		className = "tt-ff-scouter-error";
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
