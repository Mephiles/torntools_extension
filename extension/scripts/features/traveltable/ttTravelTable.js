"use strict";

(async () => {
	if (!isFlying()) return;

	featureManager.registerFeature(
		"Travel Table",
		"flying",
		() => true,
		null,
		startTable,
		removeTable,
		{
			// storage: ["settings.pages.sidebar.ocTimer", "factiondata.userCrime"],
		},
		null
	);

	function startTable() {
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

		function createTable() {
			const { content } = createContainer("Travel Destinations");
		}
	}

	function removeTable() {
		// TODO - removeIcon();
		removeContainer("Travel Destinations");
	}
})();
