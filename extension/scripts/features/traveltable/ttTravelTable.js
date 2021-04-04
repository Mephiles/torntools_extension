"use strict";

(async () => {
	const page = getPage();
	if (page === "home" && !isFlying()) return;

	featureManager.registerFeature(
		"Travel Table",
		"travel",
		() => settings.pages.travel.table,
		null,
		startTable,
		removeTable,
		{
			storage: ["settings.pages.travel.table", "settings.external.yata"],
		},
		() => {
			if (!settings.external.yata) return "YATA not enabled";
		}
	);

	async function startTable() {
		if (page === "home") startFlyingTable();
		else await createTable();

		async function createTable() {
			const { content } = createContainer("Travel Destinations");
			addLegend();

			const data = await pullInformation();
			console.log("DKK travel data", data);

			const table = document.newElement({
				type: "table",
				id: "tt-travel-table",
				html: `
					<tr class="table-header">
						<th>Country</th>
						<th>Item</th>
						<th>Stock</th>
					</tr>
				`,
			});

			content.appendChild(table);

			function addLegend() {
				let isOpen = filters.travel.open;

				content.appendChild(
					document.newElement({
						type: "div",
						class: "legend",
						html: `
							<div class="top-row">
								<div class="legend-icon">
									<i class="fas fa-chevron-${isOpen ? "down" : "right"}"></i>
									<span>Filters</span>
								</div>
								<div class="table-type-wrap">
									<span class="table-type" type="basic">Basic</span>
									<span> / </span>
									<span class="table-type" type="advanced">Advanced</span>
								</div>
							</div>
							<div class="legend-content ${isOpen ? "" : "hidden"}">
								<div class="row flex">
									<div>
										<label for="travel-items">Travel items: </label>
										<input id="travel-items" type="number" min="5"/>
									</div>
								</div>
								<div class="heading">Items</div>
								<div class="row flex categories">
									<div class="checkbox-item">
										<input id="travel-item-plushies" type="checkbox" name="item" category="plushie">
										<label for="travel-item-plushies">Plushies</label>
									</div>
									<div class="checkbox-item">
										<input id="travel-item-flowers" type="checkbox" name="item" category="flower">
										<label for="travel-item-flowers">Flowers</label>
									</div>
									<div class="checkbox-item">
										<input id="travel-item-drugs" type="checkbox" name="item" category="drug">
										<label for="travel-item-drugs">Drugs</label>
									</div>
			                     	<div class="checkbox-item">
										<input id="travel-item-other" type="checkbox" name="item" category="other">
										<label for="travel-item-other">Other</label>
									</div>
								</div>
								<div class="heading-wrap">
									<span class="heading-text">Countries</span> (<span class="countries-select-all">all</span> / <span class="countries-select-none">none</span>)
								</div>
								<div class="row countries">
									<div class="flex">
										<span>Short flights</span>
										<img class="flag" src="/images/v2/travel_agency/flags/fl_mexico.svg" country="mexico" alt="Mexico" title="Mexico"/>
										<img class="flag" src="/images/v2/travel_agency/flags/fl_cayman.svg" country="cayman_islands" alt="Cayman Islands" title="Cayman Islands"/>
										<img class="flag" src="/images/v2/travel_agency/flags/fl_canada.svg" country="canada" alt="Canada" title="Canada"/>
									</div>
									<div class="flex">
										<span>Medium flights</span>
										<img class="flag" src="/images/v2/travel_agency/flags/fl_hawaii.svg" country="hawaii" alt="Hawaii" title="Hawaii"/>
										<img class="flag" src="/images/v2/travel_agency/flags/fl_uk.svg" country="united_kingdom" alt="United Kingdom" title="United Kingdom"/>
										<img class="flag" src="/images/v2/travel_agency/flags/fl_argentina.svg" country="argentina" alt="Argentina" title="Argentina"/>
										<img class="flag" src="/images/v2/travel_agency/flags/fl_switzerland.svg" country="switzerland" alt="Switzerland" title="Switzerland"/>
									</div>
									<div class="flex">
										<span>Long flights</span>
										<img class="flag" src="/images/v2/travel_agency/flags/fl_japan.svg" country="japan"  alt="Japan" title="Japan"/>
										<img class="flag" src="/images/v2/travel_agency/flags/fl_china.svg" country="china" alt="China" title="China"/>
										<img class="flag" src="/images/v2/travel_agency/flags/fl_uae.svg" country="uae" alt="UAE" title="UAE"/>
										<img class="flag" src="/images/v2/travel_agency/flags/fl_south_africa.svg" country="south_africa" alt="South Africa" title="South Africa"/>
									</div>
								<div/>
							</div>
						`,
					})
				);

				content.find(".legend-icon").addEventListener("click", (event) => {
					if (event.target.classList.contains("legend-icon")) return;

					const isOpen = !content.find(".legend-content").classList.toggle("hidden");

					const iconClasses = content.find(".legend-icon i").classList;
					if (isOpen) {
						iconClasses.remove("fa-chevron-right");
						iconClasses.add("fa-chevron-down");
					} else {
						iconClasses.remove("fa-chevron-down");
						iconClasses.add("fa-chevron-right");
					}
					ttStorage.change({ filters: { travel: { open: isOpen } } });
				});

				content.find(`.table-type[type=${filters.travel.type}]`).classList.add("active");
				const typeBasic = content.find(".table-type[type='basic']");
				const typeAdvanced = content.find(".table-type[type='advanced']");

				typeBasic.addEventListener("click", () => {
					typeBasic.classList.add("active");
					typeAdvanced.classList.remove("active");

					// TODO - Change the actual type.

					ttStorage.change({ filters: { travel: { type: "basic" } } });
				});
				typeAdvanced.addEventListener("click", () => {
					typeAdvanced.classList.add("active");
					typeBasic.classList.remove("active");

					// TODO - Change the actual type.

					ttStorage.change({ filters: { travel: { type: "advanced" } } });
				});

				content.find(".countries-select-all").addEventListener("click", () => {
					for (const country of content.findAll(".countries .flag")) country.classList.add("selected");

					ttStorage.change({ filters: { travel: { countries: getSelectedCountries() } } });

					updateTable();
				});
				content.find(".countries-select-none").addEventListener("click", () => {
					for (const country of content.findAll(".countries .flag")) country.classList.remove("selected");

					ttStorage.change({ filters: { travel: { countries: getSelectedCountries() } } });

					updateTable();
				});

				content.find("#travel-items").value = getTravelCount();

				for (const category of filters.travel.categories) {
					const element = content.find(`.categories input[name="item"][category="${category}"]`);
					if (element) element.checked = true;
				}
				for (const country of filters.travel.countries) {
					const element = content.find(`.countries .flag[country="${country}"]`);
					if (element) element.classList.add("selected");
				}

				// Check for legend changes
				content.find("#travel-items").addEventListener("change", () => updateTable());
				for (const item of content.findAll(".categories input[name='item']")) {
					item.addEventListener("change", () => {
						ttStorage.change({ filters: { travel: { categories: getSelectedCategories() } } });

						updateTable();
					});
				}
				for (const item of content.findAll(".countries .flag")) {
					item.addEventListener("click", (event) => {
						event.target.classList.toggle("selected");

						ttStorage.change({ filters: { travel: { countries: getSelectedCountries() } } });

						updateTable();
					});
				}

				function getSelectedCategories() {
					return [...content.findAll(".categories input[name='item']:checked")].map((el) => el.getAttribute("category"));
				}

				function getSelectedCountries() {
					return [...content.findAll(".countries .flag.selected")].map((el) => el.getAttribute("country"));
				}

				function updateTable() {
					const amount = parseInt(content.find("#travel-items").value);
					const categories = getSelectedCategories();
					const countries = getSelectedCountries();

					console.log("DKK updateTable", { amount, categories, countries });
				}

				function getTravelCount() {
					let count = 5;

					if (hasAPIData() && settings.apiUsage.user.perks) {
						count += userdata.enhancer_perks
							.map((perk) => perk.match(/\+ ([0-9]+) Travel items \(.* Suitcase\)/i))
							.filter((result) => !!result)
							.map((result) => parseInt(result[1]))
							.totalSum();
						// CHECK - Improve job perk checking.
						count += userdata.job_perks
							.filter((perk) => perk.includes("travel capacity"))
							.map((perk) => parseInt(perk.replace("+ ", "").split(" ")[0]))
							.totalSum();
						count += userdata.faction_perks
							.map((perk) => perk.match(/\+ Increases maximum traveling capacity by ([0-9]+)/i))
							.filter((result) => !!result)
							.map((result) => parseInt(result[1]))
							.totalSum();
						// CHECK - Improve book perk checking.
						count += userdata.book_perks
							.filter((perk) => perk.includes("travel capacity"))
							.map((perk) => parseInt(perk.replace("+ ", "").split(" ")[0]))
							.totalSum();
					}

					if (page === "travelagency") {
						if (document.find("#tab-menu4 > ul > li[aria-selected='true'] .travel-name").innerText.toLowerCase() !== "standard") {
							count += 10;
						}
					} else if (page === "home") {
						// FIXME - Add travel type count.
					}

					return count;
				}
			}

			async function pullInformation() {
				// FIXME - Add some kind of local cache.
				return fetchRelay("yata", { section: "travel/export/" });
			}
		}

		function startFlyingTable() {
			let isOpened = new URLSearchParams(window.location.search).get("travel") === "true";

			showIcon();
			createTable();

			if (isOpened) showTable();
			else hideTable();

			function showIcon() {
				document.find("#top-page-links-list > .last").classList.remove("last");

				document.find("#top-page-links-list").insertBefore(
					document.newElement({
						type: "span",
						class: "tt-travel last",
						attributes: {
							"aria-labelledby": "travel-table",
						},
						children: [
							document.newElement({ type: "i", class: "fas fa-plane" }),
							document.newElement({ type: "span", text: isOpened ? "Home" : "Travel Table" }),
						],
						events: {
							click: changeState,
						},
					}),
					document.find("#top-page-links-list .links-footer")
				);

				function changeState() {
					isOpened = !isOpened;

					const searchParams = new URLSearchParams(window.location.search);
					searchParams.set("travel", `${isOpened}`);
					history.pushState(null, "", `${window.location.pathname}?${searchParams.toString()}`);

					document.find(".tt-travel span").innerText = isOpened ? "Home" : "Travel Table";

					if (isOpened) showTable();
					else hideTable();
				}
			}

			function showTable() {
				document.find(".travel-agency-travelling").classList.add("hidden");
				findContainer("Travel Destinations").classList.remove("hidden");
			}

			function hideTable() {
				document.find(".travel-agency-travelling").classList.remove("hidden");
				findContainer("Travel Destinations").classList.add("hidden");
			}
		}
	}

	function removeTable() {
		// TODO - removeIcon();
		removeContainer("Travel Destinations");
	}
})();
