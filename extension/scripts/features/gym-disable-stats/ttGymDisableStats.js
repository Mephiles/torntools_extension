"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Disable Stats",
		"gym",
		() => settings.pages.gym.disableStats,
		initialiseListeners,
		showCheckboxes,
		dispose,
		{
			storage: ["settings.pages.gym.disableStats"],
		},
		null
	);

	function initialiseListeners() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.GYM_LOAD].push(() => {
			if (!feature.enabled()) return;

			showCheckboxes();
		});

		const gymTrainObserver = new MutationObserver((mutations) => {
			if (!feature.enabled()) return;

			for (const mutation of mutations) {
				const checkbox = mutation.target.find(".tt-stat-checkbox");
				if (!checkbox) continue;

				const classList = mutation.target.classList;
				if (!classList.contains("tt-modified")) classList.add("tt-modified");
				if (classList.contains("tt-gym-locked") !== checkbox.checked) classList.toggle("tt-gym-locked");
			}
		});

		requireElement("#gymroot ul[class*='properties_']").then((properties) => {
			gymTrainObserver.observe(properties, { classList: true, attributes: true, subtree: true });
		});

		requireElement("#gymroot [class*='gym__']").then((gymRoot) => {
			new MutationObserver(async (mutations) => {
				if (!feature.enabled()) return;

				if (mutations.some((mutation) => [...mutation?.addedNodes].some((node) => node.className?.includes?.("gymContentWrapper__")))) {
					showCheckboxes();

					requireElement("#gymroot ul[class*='properties_']").then((properties) => {
						gymTrainObserver.observe(properties, { classList: true, attributes: true, subtree: true });
					});
				}
			}).observe(gymRoot, { childList: true, subtree: true });
		});
	}

	async function showCheckboxes() {
		await sleep();

		const properties = (await requireElement("#gymroot ul[class*='properties___'] [class*='strength___']")).closest("#gymroot ul[class*='properties___']");

		for (const stat of properties.findAll(":scope > li:not([class*='locked___']):not(.tt-modified)")) {
			stat.classList.add("tt-modified");
			stat.appendChild(
				document.newElement({
					type: "input",
					class: "tt-stat-checkbox",
					attributes: { type: "checkbox" },
					events: {
						click() {
							toggleStat(stat);
						},
					},
				})
			);

			const name = stat.find("[class*='propertyValue___']").previousElementSibling.textContent.trim().toLowerCase();

			if (filters.gym[name]) toggleStat(stat, false);
		}

		function toggleStat(stat, save = true) {
			const checkbox = stat.find(".tt-stat-checkbox");
			const button = stat.querySelector(".torn-btn");

			const isLocked = stat.classList.toggle("tt-gym-locked");

			if (isLocked) button.disabled = true;
			else button.removeAttribute("disabled");
			checkbox.checked = isLocked;

			if (save) {
				const name = stat.find("[class*='propertyValue___']").previousElementSibling.textContent.trim().toLowerCase();

				ttStorage.change({ filters: { gym: { [name]: isLocked } } });
			}
		}
	}

	function dispose() {
		for (const checkbox of document.findAll(".tt-stat-checkbox")) checkbox.remove();
		for (const stat of document.findAll(".tt-gym-locked, #gymroot ul[class*='properties___'] > li.tt-modified"))
			stat.classList.remove(".tt-gym-locked", "tt-modified");
	}
})();
