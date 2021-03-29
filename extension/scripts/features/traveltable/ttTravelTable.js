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

	function startTable() {
		if (page === "home") startFlyingTable();
		else createTable();

		function createTable() {
			const { content } = createContainer("Travel Destinations");
			addLegend();

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
								<div class="row">
									<div>
										<label for="travel-items">Travel items: </label>
										<input id="travel-items" type="number" min="5"/>
									</div>
								</div>
								<div class="heading">Items</div>
								<div class="row">
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
								<div class="heading">Countries</div>
								<div class="row">
									<div class="radio-item">
										<input id="travel-country-all" type="radio" name="travel-country" country="all">
										<label for="travel-country-all">All</label>
									</div>
									<div class="radio-item">
										<input id=travel-country-mexico" type="radio" name="travel-country" country="mexico">
										<label for="travel-country-mexico">Mexico</label>
									</div>
									<div class="radio-item">
										<input id="travel-country-caymans" type="radio" name="travel-country" country="cayman islands">
										<label for="travel-country-caymans">Cayman Islands</label>
									</div>
									<div class="radio-item">
										<input id="travel-country-canada" type="radio" name="travel-country" country="canada">
										<label for="travel-country-canada">Canada</label>
									</div>
									<div class="radio-item">
										<input id="travel-country-hawaii" type="radio" name="travel-country" country="hawaii">
										<label for="travel-country-hawaii">Hawaii</label>
									</div>
									<div class="radio-item">
										<input id="travel-country-uk" type="radio" name="travel-country" country="united kingdom">
										<label for="travel-country-uk">United Kingdom</label>
									</div>
									<div class="radio-item">
										<input id="travel-country-argentina" type="radio" name="travel-country" country="argentina">
										<label for="travel-country-argentina">Argentina</label>
									</div>
									<div class="radio-item">
										<input id="travel-country-switzerland" type="radio" name="travel-country" country="switzerland">
										<label for="travel-country-switzerland">Switzerland</label>
									</div>
									<div class="radio-item">
										<input id="travel-country-japan" type="radio" name="travel-country" country="japan">
										<label for="travel-country-japan">Japan</label>
									</div>
									<div class="radio-item">
										<input id="travel-country-china" type="radio" name="travel-country" country="china">
										<label for="travel-country-china">China</label>
									</div>
									<div class="radio-item">
										<input id="travel-country-uae" type="radio" name="travel-country" country="uae">
										<label for="travel-country-uae">UAE</label>
									</div>
									<div class="radio-item">
										<input id="travel-country-sa" type="radio" name="travel-country" country="south africa">
										<label for="travel-country-sa">South Africa</label>
									</div>
								</div>
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

				content.find("#travel-items").value = 0;

				function getTravelCount() {
					let suitcase = 0;

					// if (hasAPIData() && settings.apiUsage.user.perks) {
					// }

					return suitcase;
				}
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
