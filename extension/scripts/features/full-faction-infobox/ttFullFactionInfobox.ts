(async () => {
	if (!getPageStatus().access) return;

	const params = getSearchParameters();
	const isInternal = params.get("step") === "your";
	if (!isInternal && params.get("step") !== "profile") return;

	const feature = featureManager.registerFeature(
		"Full Infobox",
		"faction",
		() => settings.pages.faction.showFullInfobox,
		isInternal ? initialiseListeners : null,
		startFeature,
		removeFull,
		{
			storage: ["settings.pages.faction.showFullDescription"],
		},
		null
	);

	function initialiseListeners() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_INFO].push(() => {
			if (!feature.enabled()) return;

			showFull();
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_MAIN].push(() => {
			if (!feature.enabled()) return;

			showFull();
		});
	}

	function startFeature() {
		if (isInternal && !document.querySelector(".faction-description, .members-list, .announcement")) return;

		showFull();
	}

	async function showFull() {
		let title: Element, description: Element, key: string;

		if (isInternal) {
			if (getFactionSubpage() === "info") {
				title = document.querySelector(".faction-title");
				description = document.querySelector(".faction-description");
				key = "faction_description_full";
			} else {
				title = document.querySelector("#faction-main [data-title='announcement'][role='heading']");
				description = title?.nextElementSibling;
				key = "faction_announcement_full";
			}
		} else {
			title = await requireElement(".faction-title");
			description = document.querySelector(".faction-description");
			key = "faction_description_full";
		}
		if (!title || !description || !key) return;
		if (title.classList.contains("tt-infobox-title")) return;

		title.classList.add("tt-infobox-title");

		const checkbox = createCheckbox({ description: "Show full page" });

		if (filters.containers[key]) {
			checkbox.setChecked(true);
			description.classList.add("prevent-overflow");
		}

		title.appendChild(elementBuilder({ type: "div", class: "tt-options tt-full-infobox", children: [checkbox.element] }));

		checkbox.onChange(() => {
			const isChecked = checkbox.isChecked();

			if (isChecked) description.classList.add("prevent-overflow");
			else description.classList.remove("prevent-overflow");

			ttStorage.change({ filters: { containers: { [key]: isChecked } } });
		});
	}

	function removeFull() {
		for (const infobox of findAllElements(".tt-full-infobox")) infobox.remove();
		for (const title of findAllElements(".tt-infobox-title")) title.classList.remove("tt-infobox-title");
		for (const overflow of findAllElements(".prevent-overflow")) overflow.classList.remove("prevent-overflow");
	}
})();
