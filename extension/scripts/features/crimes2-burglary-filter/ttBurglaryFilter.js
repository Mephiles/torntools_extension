"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Burglary Filter",
		"crimes2",
		() => settings.pages.crimes2.burglaryFilter,
		initialise,
		addFilter,
		removeFilter,
		{
			storage: ["settings.pages.crimes2.burglaryFilter"],
		},
		null
	);

	let CRIMES2_ROWS_START_Y = 64;

	function initialise() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.CRIMES2_CRIME_LOADED].push(async ({ crime, crimeRoot, url }) => {
			if (crime === CRIMES2.BURGLARY) {
				if (!feature.enabled()) return;

				const searchParams = new URL(url).searchParams;
				if (searchParams.get("step") === "attempt") {
					await requireElement(".virtual-item.outcome-expanded button.commit-button");

					CRIMES2_ROWS_START_Y = document.find(".virtual-item:first-child")?.style?.height?.getNumber() ?? 64;
				}

				await addFilter(crimeRoot);
			} else {
				removeFilter();
			}
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.CRIMES2_HOME_LOADED].push(() => removeFilter());
	}

	const localFilters = {};
	async function createFilter(crimeRoot) {
		document.body.classList.add("torntools-burglary-filter");

		const { content } = createContainer("Burglary Filter", {
			class: "mb10",
			nextElement: crimeRoot,
			filter: true,
			resetStyles: true,
		});

		const statistics = createStatistics("targets");
		content.appendChild(statistics.element);
		localFilters["Statistics"] = { updateStatistics: statistics.updateStatistics };

		const filterContent = document.newElement({
			type: "div",
			class: "content",
		});

		const targetNameFilter = createFilterSection({
			title: "Target Name",
			text: "text",
			default: filters.burglary.targetName,
			callback: filtering,
		});
		filterContent.appendChild(targetNameFilter.element);
		localFilters["Target Name"] = { getValue: targetNameFilter.getValue };

		const targetTypeFilter = createFilterSection({
			title: "Target Type",
			type: "Target Type",
			checkboxes: [
				{ description: "Residential Targets", id: "residential-targets" },
				{ description: "Commercial Targets", id: "commercial-targets" },
				{ description: "Industrial Targets", id: "industrial-targets" },
			],
			defaults: filters.burglary.targetType,
			callback: filtering,
		});
		filterContent.appendChild(targetTypeFilter.element);
		localFilters["Target Type"] = { getSelections: targetTypeFilter.getSelections };

		content.appendChild(filterContent);

		return content;
	}

	async function addFilter(crimeRoot) {
		if (!window.location.hash.includes("burglary")) return;
		if (!crimeRoot) {
			try {
				crimeRoot = await requireElement(".crime-root.burglary-root");
			} catch (error) {
				return;
			}
		}

		if (!findContainer("Burglary Filter")) await createFilter(crimeRoot);

		await filtering();
	}

	async function filtering() {
		await requireElement(".crime-root.burglary-root [class*='virtualList__'] > [class*='virtualItem__']");

		CRIMES2_ROWS_START_Y = document.find(".virtual-item:first-child")?.style?.height?.getNumber() ?? 64;

		const content = findContainer("Burglary Filter").find("main");
		const targetName = localFilters["Target Name"].getValue(content).trim();
		const targetType = localFilters["Target Type"].getSelections(content);

		// Save filters
		await ttStorage.change({
			filters: { burglary: { targetName, targetType } },
		});

		// Actual Filtering
		// Burglary targets are absolutely positioned on the page, using translateY style.
		// Changing translateY ourselves to remove holes in targets list. This also preserves Torn's animation.
		let targetRowHeightsSum = CRIMES2_ROWS_START_Y;
		for (const targetEl of document.findAll(".crime-root.burglary-root [class*='virtualList__'] > [class*='virtualItem__']:not(:first-child)")) {
			const rowTargetName = targetEl.find("[class*='crimeOptionSection__']").textContent,
				rowTargetType = targetEl.find("[class*='crime-image'] img").currentSrc.match(/residential|commercial|industrial/)[0] + "-targets";
			if (targetName && !rowTargetName.includes(targetName)) {
				hideRow(targetEl);
				continue;
			}
			if (targetType.length && !targetType.includes(rowTargetType)) {
				hideRow(targetEl);
				continue;
			}
			showRow(targetEl, targetRowHeightsSum);
			targetRowHeightsSum += targetEl.style.height.getNumber();
		}

		localFilters["Statistics"].updateStatistics(
			document.findAll(".crime-root.burglary-root [class*='virtualList__'] > [class*='virtualItem__']:not(:first-child):not(.tt-filter-hidden)").length,
			document.findAll(".crime-root.burglary-root [class*='virtualList__'] > [class*='virtualItem__']:not(:first-child)").length,
			content
		);

		function showRow(li, translateHeight) {
			li.classList.remove("tt-filter-hidden");
			li.style.transform = `translateY(${translateHeight}px)`;
		}

		function hideRow(li) {
			li.style.transform = `translateY(0)`;
			li.classList.add("tt-filter-hidden");
		}
	}

	function removeFilter() {
		document.body.classList.remove("torntools-burglary-filter");
		removeContainer("Burglary Filter");

		CRIMES2_ROWS_START_Y = document.find(".virtual-item:first-child")?.style?.height?.getNumber() ?? 64;
		let targetRowHeightsSum = CRIMES2_ROWS_START_Y;
		document.findAll(".crime-root.burglary-root [class*='virtualList__'] > [class*='virtualItem__']:not(:first-child)").forEach((li) => {
			li.classList.remove("tt-filter-hidden");
			li.style.transform = `translateY(${targetRowHeightsSum}px)`;
			targetRowHeightsSum += li.style.height.getNumber();
		});
	}
})();
