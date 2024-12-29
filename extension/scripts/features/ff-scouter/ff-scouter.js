async function scoutFF(target) {
	return await fetchData("tornpal", { section: "ffscouter", includeKey: true, params: { target } });
}

function buildScoutElement(scout, pageClass) {
	let message, className, hoverMessage;
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

		message = `Fair Fight: ${scout.result.value} ${suffix}`.trim();
		className = null;
		hoverMessage = null;
	} else {
		message = "failed FF scout";
		className = "tt-ff-scouter-error";
		hoverMessage = scout.message;
	}

	const element = document.newElement({ type: "span", class: ["", pageClass, className], text: message });
	if (hoverMessage) {
		element.setAttribute("title", hoverMessage);
	}

	return element;
}
