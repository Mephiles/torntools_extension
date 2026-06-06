import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { findAllElements } from "@common/utils/functions/dom";
import { formatNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { Feature } from "@features/feature";

async function addWorth() {
	const eventsListWrapper = await requireElement("[class*='eventsList__']");

	const regexes = [
		/(?<=bought ).*(?= of)|(?<=your points that were on the market for \$).*(?=\.)/g,
		/(?<=bought ).*(?= x )|(?<=from your bazaar for \$).*(?=\.)/g,
		/(?<=You sold )\d+(?=x)|(?<= for \$)[\d,]+/g,
	];

	eventsListWrapper.addEventListener(
		"mouseover",
		(event: MouseEvent) => {
			if (!FEATURE_MANAGER.isEnabled(EventWorthFeature)) return;

			const target = event.target as Element;
			if (!target.matches("[class*='message__']") || target.className.includes("tt-modified")) return;

			regexes.forEach((regex) => {
				const matches = target.textContent.match(regex);
				if (matches?.length === 2) {
					const totalPrice = parseInt(matches[1].replaceAll(",", ""));
					const quantity = parseInt(matches[0].replaceAll(",", ""));

					target.setAttribute("title", `(worth ${formatNumber(totalPrice / quantity, { currency: true })} each)`);
					target.classList.add("tt-modified");
				}
			});
		},
		{ capture: true },
	);
}

function removeWorth() {
	findAllElements("[class*='eventsList__'] [class*='eventItem___'] [class*='message__']").forEach((x) => {
		x.removeAttribute("title");
		x.classList.remove("tt-modified");
	});
}

export default class EventWorthFeature extends Feature {
	constructor() {
		super("Event Worth", "events");
	}

	isEnabled() {
		return settings.pages.events.worth;
	}

	async execute() {
		await addWorth();
	}

	cleanup() {
		removeWorth();
	}

	storageKeys() {
		return ["settings.pages.events.worth"];
	}
}
