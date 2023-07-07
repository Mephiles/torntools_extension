"use strict";

(async () => {
	if (!isAbroad()) return;
	if (!getPageStatus().access) return;
	if (getSearchParameters().has("page")) return;

	featureManager.registerFeature(
		"Item Filter",
		"travel",
		() => settings.pages.travel.itemFilter,
		null,
		addFilter,
		removeFilter,
		{
			storage: ["settings.pages.travel.itemFilter"],
		},
		null,
	);

	function addFilter() {
		const { content } = createContainer("Item Filters", {
			nextElement: document.find(".travel-agency-market"),
			filter: true,
		});

		const statistics = createStatistics("items");
		content.appendChild(statistics.element);

		const filterContent = document.newElement({
			type: "div",
			class: "content",
		});

		const profitOnlyFilter = createFilterSection({
			title: "Profit",
			checkbox: "Only Profit",
			defaults: filters.abroadItems.profitOnly,
			callback: filtering,
		});
		filterContent.appendChild(profitOnlyFilter.element);

		const categoryFilter = createFilterSection({
			title: "Category",
			checkboxes: [
				{ id: "plushie", description: "Plushies" },
				{ id: "flower", description: "Flowers" },
				{ id: "drug", description: "Drugs" },
				{ id: "weapon", description: "Weapons" },
				{ id: "temporary", description: "Temporary" },
				{ id: "other", description: "Other" },
			],
			defaults: filters.abroadItems.categories,
			callback: filtering,
		});
		filterContent.appendChild(categoryFilter.element);

		content.appendChild(filterContent);

		filtering();

		async function filtering() {
			const profitOnly = settings.pages.travel.travelProfits && profitOnlyFilter.isChecked(content);
			const categories = categoryFilter.getSelections(content);
			if (profitOnly) await requireElement(".tt-travel-market-cell");

			for (const li of document.findAll(".users-list > li")) {
				showRow(li);

				if (profitOnly && parseInt(li.find(".tt-travel-market-cell").getAttribute("value")) < 0) {
					hideRow(li);
					continue;
				}

				if (categories.length) {
					const itemCategory = li.find(".type").lastChild.textContent.trim().toLowerCase();
					switch (itemCategory) {
						case "plushie":
							if (!categories.includes("plushie")) {
								hideRow(li);
								continue;
							}
							break;
						case "flower":
							if (!categories.includes("flower")) {
								hideRow(li);
								continue;
							}
							break;
						case "drug":
							if (!categories.includes("drug")) {
								hideRow(li);
								continue;
							}
							break;
						case "melee":
						case "primary":
						case "secondary":
							if (!categories.includes("weapon")) {
								hideRow(li);
								continue;
							}
							break;
						case "temporary":
							if (!categories.includes("temporary")) {
								hideRow(li);
								continue;
							}
							break;
						case "alcohol":
						case "clothing":
						case "other":
						default:
							if (!categories.includes("other")) {
								hideRow(li);
								continue;
							}
							break;
					}
				}
			}

			await ttStorage.change({
				filters: {
					abroadItems: {
						profitOnly,
						categories,
					},
				},
			});

			statistics.updateStatistics(document.findAll(".users-list > li:not(.tt-hidden)").length, document.findAll(".users-list > li").length, content);
		}

		function showRow(row) {
			row.classList.remove("tt-hidden");
		}

		function hideRow(row) {
			row.classList.add("tt-hidden");
		}
	}

	function removeFilter() {
		removeContainer("Item Filters");
		document.findAll(".users-list > li.tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
	}
})();
