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
		const { content } = createContainer("Bounty Filter", {
			previousElement: document.querySelector(".bounties-wrap .bounties-total"),
			showHeader: true,
			onlyHeader: false,
			spacer: true,
			collapsible: true,
			applyRounding: false,
			compact: true,
			flexContainer: true,
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
		content.appendChild(cbHideUnavailable.element);
		const maxLevelConstainer = elementBuilder({
			type: "div",
		})
		maxLevelConstainer.appendChild(maxLevelInput);
		content.appendChild(maxLevelConstainer);
		maxLevelConstainer.appendChild(
			elementBuilder({
				type: "label",
				text: "Max Level",
			})
		);
		let maxFfScoreInput: HTMLInputElement;
		if (settings.scripts.ffScouter.gauge && settings.external.ffScouter) {
			const maxFfScoreContainer = elementBuilder({
				type: "div",
			})
			content.appendChild(maxFfScoreContainer);
			maxFfScoreInput = elementBuilder({
				type: "input",
				attributes: {
					id: "maxFfScoreInput",
					type: "number",
					min: "0",
					color: "#000",
					fontColor: "#000",
				},
			});
			maxFfScoreContainer.appendChild(maxFfScoreInput);
			maxFfScoreContainer.appendChild(
				elementBuilder({
					type: "label",
					text: "Max FF Score",
					attributes: {
						for: "maxFfScoreInput",
					},
				})
			);
		}

		let statistics;
		if (!device.mobile && !device.tablet) {
			statistics = createStatistics("rows", true, true);
			content.parentElement.querySelector(".title .text").appendChild(statistics.element);
		}

		// Setup saved filters
		maxLevelInput.value = filters.bounties.maxLevel.toString();
		maxLevelInput.addEventListener("input", filterListing);
		cbHideUnavailable.setChecked(filters.bounties.hideUnavailable);
		cbHideUnavailable.onChange(filterListing);
		if (settings.scripts.ffScouter.gauge && maxFfScoreInput) {
			maxFfScoreInput.value = filters.bounties.maxFfScore.toString();
			maxFfScoreInput.addEventListener("input", filterListing);
		}

		await filterListing();

		CUSTOM_LISTENERS[EVENT_CHANNELS.FF_SCOUTER_GAUGE].push(() => {
			if (!feature.enabled()) return;
			filterListing();
		});
		

		async function filterListing() {
			console.log("filterListing");

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
						maxFfScore: maxFfScoreInput.value ? parseFloat(maxFfScoreInput.value) : undefined,
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
				if (settings.scripts.ffScouter.gauge && maxFfScoreInput) {
					const ffScore = bounty.querySelector(".tt-ff-scouter-indicator.indicator-lines")?.getAttribute("data-ff-scout");
					if (ffScore && parseFloat(ffScore) > parseFloat(maxFfScoreInput.value)) {
						hideBounty(bounty);
						continue;
					} else showBounty(bounty);
				}
			}

			list.classList.add("tt-filtered");
			if (!device.mobile && !device.tablet)
				statistics.updateStatistics(
					findAllElements(".bounties-list > li[data-id]:not(.tt-hidden)").length,
					findAllElements(".bounties-list > li[data-id]").length,
					content.parentElement.querySelector(".title .text")
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
