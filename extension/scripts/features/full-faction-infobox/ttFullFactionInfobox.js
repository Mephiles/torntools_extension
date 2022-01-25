"use strict";

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
		if (isInternal && !document.find(".faction-description, .members-list, .announcement")) return;

		showFull();
	}

	async function showFull() {
		let title, description, key;

		if (isInternal) {
			if (getHashParameters().get("tab") === "info") {
				title = document.find(".faction-title");
				description = document.find(".faction-description");
				key = "faction_description_full";
			} else {
				title = document.find("#faction-main > [data-title='announcement'][role='heading']");
				description = title.nextElementSibling;
				key = "faction_announcement_full";
			}
		} else {
			title = await requireElement(".faction-title");
			description = document.find(".faction-description");
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

		title.appendChild(document.newElement({ type: "div", class: "tt-options tt-full-infobox", children: [checkbox.element] }));

		checkbox.onChange(() => {
			const isChecked = checkbox.isChecked();

			if (isChecked) description.classList.add("prevent-overflow");
			else description.classList.remove("prevent-overflow");

			ttStorage.change({ filters: { containers: { [key]: isChecked } } });
		});
	}

	function removeFull() {
		for (const infobox of document.findAll(".tt-full-infobox")) infobox.remove();
		for (const title of document.findAll(".tt-infobox-title")) title.classList.remove("tt-infobox-title");
		for (const overflow of document.findAll(".prevent-overflow")) overflow.classList.remove("prevent-overflow");
	}
})();
