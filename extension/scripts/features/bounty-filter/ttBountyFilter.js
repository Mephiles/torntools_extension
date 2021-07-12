"use strict";

(async () => {
	const feature = featureManager.registerFeature(
		"Bounty Filter",
		"bounties",
		() => settings.pages.bounties.filter,
		initialiseListener,
		addFilter,
		removeFilter,
		{
			storage: ["settings.pages.bounties.filter"],
		},
		null
	);

	function initialiseListener() {
		new MutationObserver(() => {
			if (feature.enabled()) addFilter();
		}).observe(document.find(".content-wrapper"), { childList: true });
	}

	async function addFilter() {
		if (findContainer("Bounty Filter")) return;
		await requireElement(".bounties-list > li > ul > li .reward");
		const { options } = createContainer("Bounty Filter", {
			previousElement: document.find(".bounties-wrap .bounties-total"),
			onlyHeader: true,
			applyRounding: false,
		});
		const maxLevelInput = document.newElement({
			type: "input",
			attributes: {
				type: "number",
				min: "0",
				max: "100",
			},
		});
		const cbHideUnavailable = createCheckbox({ description: "Hide Unavailable" });
		options.appendChild(
			document.newElement({
				type: "span",
				children: ["Max Level", maxLevelInput, cbHideUnavailable.element],
			})
		);

		// Setup saved filters
		maxLevelInput.value = filters.bounties.maxLevel;
		cbHideUnavailable.setChecked(filters.bounties.hideUnavailable);

		maxLevelInput.addEventListener("input", filterListing);
		cbHideUnavailable.onChange(filterListing);
		await filterListing();

		async function filterListing() {
			// Get the set filters
			const tempMaxLevel = parseInt(maxLevelInput.value);
			const maxLevel = tempMaxLevel < 100 && tempMaxLevel > 0 ? tempMaxLevel : 100;
			maxLevelInput.value = maxLevel;
			const hideUnavailable = cbHideUnavailable.isChecked();

			// Save the filters
			await ttStorage.change({
				filters: {
					bounties: {
						maxLevel,
						hideUnavailable,
					},
				},
			});

			for (const bounty of [...document.findAll(".bounties-list > *:not(.clear)")]) {
				if (maxLevel > 0 && parseInt(bounty.find(".level").lastChild.textContent) > maxLevel) {
					hideBounty(bounty);
					continue;
				} else showBounty(bounty);
				if (hideUnavailable && bounty.find(".t-red")) {
					hideBounty(bounty);
					// noinspection UnnecessaryContinueJS
					continue;
				} else showBounty(bounty);
			}

			function hideBounty(bounty) {
				bounty.classList.add("hidden");
			}

			function showBounty(bounty) {
				bounty.classList.remove("hidden");
			}
		}
	}

	function removeFilter() {
		document.findAll(".bounties-list > .hidden:not(.clear)").forEach((x) => x.classList.remove("hidden"));
		removeContainer("Bounty Filter");
	}
})();
