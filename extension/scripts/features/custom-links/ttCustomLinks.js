"use strict";

(async () => {
	featureManager.registerFeature(
		"Custom Links",
		"sidebar",
		() => settings.customLinks.length,
		null,
		showLinks,
		removeLinks,
		{
			storage: ["settings.customLinks"],
		},
		null // FIXME - Switch to new mobile check.
	);

	async function showLinks() {
		await requireSidebar();

		if (!(await checkMobile())) {
			showOutside("above", "customLinksAbove");
			showOutside("under", "customLinksUnder");
			showInside();
		} else {
			// FIXME - Mobile custom links.
		}

		function showOutside(filter, id) {
			if (!settings.customLinks.filter((link) => link.location === filter).length) {
				removeContainer("Custom Links", { id });
				return;
			}

			const { content } = createContainer("Custom Links", {
				id,
				class: "tt-custom-link-container",
				applyRounding: false,
				contentBackground: false,
				[filter === "above" ? "nextElement" : "previousElement"]: findParent(document.find("h2=Areas"), { class: "^=sidebar-block_" }),
			});

			for (const link of settings.customLinks.filter((link) => link.location === filter)) {
				content.appendChild(
					document.newElement({
						type: "div",
						class: "pill",
						children: [
							document.newElement({
								type: "a",
								href: link.href,
								text: link.name,
								attributes: {
									target: link.newTab ? "_blank" : "_self",
								},
							}),
						],
					})
				);
			}
		}

		function showInside() {
			for (const link of document.findAll(".custom-link")) link.remove();

			const areas = findParent(document.find("h2=Areas"), { class: "^=sidebar-block_" });
			for (const link of settings.customLinks.filter((link) => link.location !== "above" && link.location !== "under")) {
				const locationSplit = link.location.split("_");

				const location = locationSplit.splice(1).join("_");
				const area = ALL_AREAS.filter((area) => area.class === location);
				if (!area) continue;
				let target = areas.find(`#nav-${area[0].class}`);
				if (!target) continue;

				if (locationSplit[0] === "under") target = target.nextSibling;

				const pill = document.newElement({
					type: "div",
					class: "pill custom-link",
					children: [
						document.newElement({
							type: "a",
							href: link.href,
							text: link.name,
							attributes: {
								target: link.newTab ? "_blank" : "",
							},
						}),
					],
				});
				const parent = areas.find("div[class*='toggle-content_']");
				if (target) parent.insertBefore(pill, target);
				else parent.appendChild(pill);
			}
		}
	}

	function removeLinks() {
		removeContainer("Custom Links", { id: "customLinksAbove" });
		removeContainer("Custom Links", { id: "customLinksUnder" });

		for (const link of document.findAll(".custom-link")) link.remove();
	}
})();
