"use strict";

(async () => {
	if (!isAbroad()) return;
	if (!getPageStatus().access) return;

	featureManager.registerFeature("Energy Warning", "travel", () => settings.pages.travel.energyWarning, undefined, detect, removeWarning, {
		storage: ["settings.pages.travel.energyWarning"],
	});

	let observer;

	async function detect() {
		console.log("DKK detect 1");
		observer?.disconnect();

		const content = await requireElement(".travel-home-content");
		console.log("DKK detect 2");

		if (content.style.display !== "none") showWarning();

		observer = new MutationObserver((mutations) => {
			if (mutations[0].target.style.display === "none") return;

			showWarning();
		});
		// noinspection JSCheckFunctionSignatures
		observer.observe(content, { attributes: true, attributeFilter: ["style"] });
	}

	function showWarning() {
		const content = document.find(".travel-home-content .msg > p");
		if (!content) return;

		const search = content.textContent.match(/take around (.*) to reach/i);
		if (!search) return;

		// noinspection JSUnresolvedVariable
		const fulltime = userdata.energy.fulltime * 1000;
		const flytime = textToTime(search[1]);

		if (fulltime >= flytime) return;

		content.appendChild(document.newElement("br"));
		content.appendChild(document.newElement({ type: "span", class: "tt-energy-warning", text: "Starting this flight will waste some energy!" }));
	}

	function removeWarning() {
		observer?.disconnect();
		observer = undefined;
	}
})();
