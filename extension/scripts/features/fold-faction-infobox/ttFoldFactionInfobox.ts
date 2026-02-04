(async () => {
	if (!getPageStatus().access) return;

	const params = getSearchParameters();
	const isInternal = params.get("step") === "your";
	if (!isInternal && params.get("step") !== "profile") return;

	const feature = featureManager.registerFeature(
		"Fold Infobox",
		"faction",
		() => settings.pages.faction.foldableInfobox,
		isInternal ? initialiseListeners : null,
		startFeature,
		removeFull,
		{
			storage: ["settings.pages.faction.foldableInfobox"],
		},
		null
	);

	function initialiseListeners() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_INFO].push(() => {
			if (!feature.enabled()) return;

			foldInfobox();
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_MAIN].push(() => {
			if (!feature.enabled()) return;

			foldInfobox();
		});
	}

	function startFeature() {
		if (isInternal && !document.querySelector(".faction-description, .members-list, .announcement")) return;

		foldInfobox();
	}

	async function foldInfobox() {
		let title: Element, description: Element, key: string;

		if (isInternal) {
			if (getFactionSubpage() === "info") {
				title = await requireElement(".faction-title");
				description = document.querySelector(".faction-description");
				key = "faction_description_fold";
			} else {
				title = await requireElement("#faction-main [data-title='announcement'][role='heading']");
				description = title.nextElementSibling;
				key = "faction_announcement_fold";
			}
		} else {
			title = await requireElement(".faction-title");
			description = document.querySelector(".faction-description");
			key = "faction_description_fold";
		}
		if (!title || !description || !key) return;
		if (title.classList.contains("tt-foldable-infobox")) return;

		title.classList.add("tt-foldable-infobox");
		description.classList.add("tt-foldable");

		const arrow = elementBuilder({ type: "i", class: "tt-collapse-infobox fa-solid" });

		title.appendChild(arrow);

		fold(!!filters.containers[key]);

		if (!title.classList.contains(`tt-${key}`)) {
			title.classList.add(`tt-${key}`);
			title.addEventListener("click", () => fold(null));
		}

		function fold(state: boolean | null) {
			if (!feature.enabled()) return;

			if (state === null) {
				state = description.classList.toggle("folded");
			} else {
				if (state) description.classList.add("folded");
				else description.classList.remove("folded");
			}

			if (state) {
				arrow.classList.remove("fa-caret-down");
				arrow.classList.add("fa-caret-right");
				title.classList.add("folded");
			} else {
				arrow.classList.add("fa-caret-down");
				arrow.classList.remove("fa-caret-right");
				title.classList.remove("folded");
			}

			ttStorage.change({ filters: { containers: { [key]: state } } });
		}
	}

	function removeFull() {
		for (const arrow of findAllElements(".tt-collapse-infobox")) arrow.remove();
		for (const title of findAllElements(".tt-foldable-infobox")) title.classList.remove("tt-foldable-infobox");
		for (const foldable of findAllElements(".tt-foldable, .folded")) foldable.classList.remove("tt-foldable", "folded");
	}
})();
