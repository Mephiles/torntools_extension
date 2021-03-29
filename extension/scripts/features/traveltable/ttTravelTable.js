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
								<div class="filter-icon">
									<i class="fas fa-chevron-${isOpen ? "down" : "right"}"></i>
									<span>Filters</span>
								</div>
								<div class="table-type-wrap">
									<span class="table-type" type="basic">Basic</span>
									<span> / </span>
									<span class="table-type" type="advanced">Advanced</span>
								</div>
							</div>
							<div class="filter-content ${isOpen ? "" : "hidden"}">
							 	<span>Content</span>
							</div>
						`,
					})
				);

				content.find(".filter-icon").addEventListener("click", (event) => {
					if (event.target.classList.contains("filter-icon")) return;

					const isOpen = !content.find(".filter-content").classList.toggle("hidden");

					const iconClasses = content.find(".filter-icon i").classList;
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
