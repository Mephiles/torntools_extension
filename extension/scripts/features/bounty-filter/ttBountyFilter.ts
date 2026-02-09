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
		}).observe(document.querySelector(".content-wrapper"), { childList: true });
	}

	async function addFilter() {
		const device = await checkDevice();

		if (findContainer("Bounty Filter")) return;
		await requireElement(".bounties-list > li > ul > li .reward");
		const { options } = createContainer("Bounty Filter", {
			previousElement: document.querySelector(".bounties-wrap .bounties-total"),
			onlyHeader: true,
			applyRounding: false,
		});
		const maxLevelInput = elementBuilder({
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
			elementBuilder({
				type: "span",
				text: "Max Level",
			})
		);
		let statistics;
		if (!device.mobile && !device.tablet) {
			statistics = createStatistics("rows", true, true);
			options.parentElement.querySelector(".title .text").appendChild(statistics.element);
		}

		// Setup saved filters
		maxLevelInput.value = filters.bounties.maxLevel.toString();
		cbHideUnavailable.setChecked(filters.bounties.hideUnavailable);

		maxLevelInput.addEventListener("input", filterListing);
		cbHideUnavailable.onChange(filterListing);
		await filterListing();

		async function filterListing() {
			// Get the set filters
			const tempMaxLevel = parseInt(maxLevelInput.value);
			const maxLevel = tempMaxLevel < 100 && tempMaxLevel > 0 ? tempMaxLevel : 100;
			maxLevelInput.value = maxLevelInput.value === "" ? "" : maxLevel.toString();
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

			const list = document.querySelector(".bounties-list");
			for (const bounty of findAllElements(":scope > li[data-id]", list)) {
				if (maxLevel > 0 && parseInt(bounty.querySelector(".level").lastChild.textContent) > maxLevel) {
					hideBounty(bounty);
					continue;
				} else showBounty(bounty);
				if (hideUnavailable && bounty.querySelector(".user-red-status, .user-blue-status")) {
					hideBounty(bounty);
					// noinspection UnnecessaryContinueJS
					continue;
				} else showBounty(bounty);
			}

			list.classList.add("tt-filtered");
			if (!device.mobile && !device.tablet)
				statistics.updateStatistics(
					findAllElements(".bounties-list > li[data-id]:not(.tt-hidden)").length,
					findAllElements(".bounties-list > li[data-id]").length,
					options.parentElement.querySelector(".title .text")
				);
			triggerCustomListener(EVENT_CHANNELS.FILTER_APPLIED, { filter: "Bounty Filter" });

			function hideBounty(bounty: Element) {
				bounty.classList.add("tt-hidden");

				if (bounty.nextElementSibling.classList.contains("tt-stats-estimate")) {
					bounty.nextElementSibling.classList.add("tt-hidden");
				}
			}

			function showBounty(bounty: Element) {
				bounty.classList.remove("tt-hidden");

				if (bounty.nextElementSibling.classList.contains("tt-stats-estimate")) {
					bounty.nextElementSibling.classList.remove("tt-hidden");
				}
			}
		}
	}

	function removeFilter() {
		findAllElements(".bounties-list > .tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
		removeContainer("Bounty Filter");
	}
})();
