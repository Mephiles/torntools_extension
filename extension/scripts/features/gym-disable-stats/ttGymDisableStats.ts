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
				const target = mutation.target as Element;
				const checkbox = target.find<HTMLInputElement>(".tt-stat-checkbox");
				if (!checkbox) continue;

				const classList = target.classList;
				if (!classList.contains("tt-modified")) classList.add("tt-modified");
				if (classList.contains("tt-gym-locked") !== checkbox.checked) classList.toggle("tt-gym-locked");
			}
		});

		requireElement("#gymroot ul[class*='properties_']").then((properties) => {
			gymTrainObserver.observe(properties, { attributes: true, subtree: true });
		});

		requireElement("#gymroot [class*='gym__']").then((gymRoot) => {
			new MutationObserver(async (mutations) => {
				if (!feature.enabled()) return;

				if (
					mutations.some((mutation) => [...mutation?.addedNodes].some((node) => isElement(node) && node.className?.includes?.("gymContentWrapper__")))
				) {
					void showCheckboxes();

					requireElement("#gymroot ul[class*='properties_']").then((properties) => {
						gymTrainObserver.observe(properties, { attributes: true, subtree: true });
					});
				}
			}).observe(gymRoot, { childList: true, subtree: true });
		});
	}

	async function showCheckboxes() {
		await sleep(10);

		const properties = (await requireElement("#gymroot ul[class*='properties___'] [class*='strength___']")).closest("#gymroot ul[class*='properties___']");

		for (const stat of properties.findAll(":scope > li:not([class*='locked___']):not(.tt-modified)")) {
			stat.classList.add("tt-modified");
			stat.appendChild(
				elementBuilder({
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

		function toggleStat(stat: Element, save = true) {
			const checkbox = stat.find<HTMLInputElement>(".tt-stat-checkbox");
			const button = stat.find<HTMLButtonElement>(".torn-btn");

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
