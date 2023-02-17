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
		options.appendChild(cbHideUnavailable.element);
		options.appendChild(maxLevelInput);
		options.appendChild(
			document.newElement({
				type: "span",
				text: "Max Level",
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
			maxLevelInput.value = maxLevelInput.value === "" ? "" : maxLevel;
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

			const list = document.find(".bounties-list");
			for (const bounty of [...list.findAll(":scope > li[data-id]")]) {
				if (maxLevel > 0 && parseInt(bounty.find(".level").lastChild.textContent) > maxLevel) {
					hideBounty(bounty);
					continue;
				} else showBounty(bounty);
				if (hideUnavailable && bounty.find(".user-red-status, .user-blue-status")) {
					hideBounty(bounty);
					// noinspection UnnecessaryContinueJS
					continue;
				} else showBounty(bounty);
			}

			list.classList.add("tt-filtered");
			triggerCustomListener(EVENT_CHANNELS.FILTER_APPLIED);

			function hideBounty(bounty) {
				bounty.classList.add("tt-hidden");

				if (bounty.nextElementSibling.classList.contains("tt-stats-estimate")) {
					bounty.nextElementSibling.classList.add("tt-hidden");
				}
			}

			function showBounty(bounty) {
				bounty.classList.remove("tt-hidden");

				if (bounty.nextElementSibling.classList.contains("tt-stats-estimate")) {
					bounty.nextElementSibling.classList.remove("tt-hidden");
				}
			}
		}
	}

	function removeFilter() {
		document.findAll(".bounties-list > .tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
		removeContainer("Bounty Filter");
	}
})();
